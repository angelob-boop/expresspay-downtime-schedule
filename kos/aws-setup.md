# One-time AWS setup for deploys

Run once by someone with IAM + S3 admin in account `405894842471`. Creates the bucket the page
deploys to and the role GitHub Actions assumes (`.github/workflows/deploy.yml`).

The GitHub OIDC provider already exists (the portal's `expresspay-github-deploy` role uses it),
so it isn't created here.

## 0. Variables

```sh
ACCOUNT=405894842471
REGION=ap-southeast-1
REPO=angelob-boop/expresspay-downtime-schedule   # change here if the repo moves
BUCKET=expresspay-maintenance-$ACCOUNT-$REGION
ROLE=expresspay-downtime-github-deploy
DIST_ID=E3DAFSJMLX539B                           # portal.expresspayinc.ph
```

## 1. Bucket (private, versioned)

```sh
aws s3api create-bucket --bucket "$BUCKET" --region "$REGION" \
  --create-bucket-configuration LocationConstraint="$REGION"

aws s3api put-public-access-block --bucket "$BUCKET" --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

aws s3api put-bucket-ownership-controls --bucket "$BUCKET" \
  --ownership-controls 'Rules=[{ObjectOwnership=BucketOwnerEnforced}]'

# Versioning lets a bad deploy be rolled back; old versions expire after 30 days.
aws s3api put-bucket-versioning --bucket "$BUCKET" --versioning-configuration Status=Enabled
aws s3api put-bucket-lifecycle-configuration --bucket "$BUCKET" --lifecycle-configuration '{
  "Rules": [{ "ID": "expire-old-versions", "Status": "Enabled", "Filter": {},
              "NoncurrentVersionExpiration": { "NoncurrentDays": 30 } }]
}'
```

No static website hosting: CloudFront will read the bucket through OAC (section 4).

## 2. Deploy role (GitHub OIDC, master branch only)

```sh
cat > trust.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::$ACCOUNT:oidc-provider/token.actions.githubusercontent.com" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        "token.actions.githubusercontent.com:sub": "repo:$REPO:ref:refs/heads/master"
      }
    }
  }]
}
EOF

cat > deploy-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ListMaintenancePrefix",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::$BUCKET",
      "Condition": { "StringLike": { "s3:prefix": ["maintenance/*"] } }
    },
    {
      "Sid": "WriteMaintenancePrefix",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::$BUCKET/maintenance/*"
    },
    {
      "Sid": "InvalidatePortalDistribution",
      "Effect": "Allow",
      "Action": "cloudfront:CreateInvalidation",
      "Resource": "arn:aws:cloudfront::$ACCOUNT:distribution/$DIST_ID"
    }
  ]
}
EOF

aws iam create-role --role-name "$ROLE" --assume-role-policy-document file://trust.json \
  --description "GitHub Actions deploy for $REPO (maintenance page)"
aws iam put-role-policy --role-name "$ROLE" --policy-name deploy-maintenance-page \
  --policy-document file://deploy-policy.json
rm trust.json deploy-policy.json
```

## 3. GitHub repo variables

Settings → Secrets and variables → Actions → **Variables** (not secrets; none are sensitive). Or:

```sh
gh variable set AWS_DEPLOY_ROLE_ARN -R "$REPO" --body "arn:aws:iam::$ACCOUNT:role/$ROLE"
gh variable set S3_BUCKET           -R "$REPO" --body "$BUCKET"
# Leave unset until CloudFront serves /maintenance/* (section 4); the deploy skips invalidation without it.
# gh variable set CLOUDFRONT_DISTRIBUTION_ID -R "$REPO" --body "$DIST_ID"
```

Then deploy: Actions → **Deploy to S3** → Run workflow (branch `master`), or `gh workflow run deploy.yml -R "$REPO"`.

## 4. Later, during CloudFront wiring (not now)

Pending the Lambda/WAF review (`kos/ux-decisions.md`, open question 1). When CloudFront gets the
bucket as an origin with an Origin Access Control, the bucket needs this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "AllowCloudFrontOAC",
    "Effect": "Allow",
    "Principal": { "Service": "cloudfront.amazonaws.com" },
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::<BUCKET>/maintenance/*",
    "Condition": { "StringEquals": { "AWS:SourceArn": "arn:aws:cloudfront::405894842471:distribution/E3DAFSJMLX539B" } }
  }]
}
```

Then set `CLOUDFRONT_DISTRIBUTION_ID` (section 3).
