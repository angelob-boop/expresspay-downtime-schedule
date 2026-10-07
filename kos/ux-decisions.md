# ExpressPay Downtime Countdown — UX decisions

Last updated: 2026-10-08

## Context (verified)

- `portal.expresspayinc.ph` → CNAME to CloudFront `E3DAFSJMLX539B` (`d136dejazw47h6.cloudfront.net`).
  DNS is GoDaddy (`domaincontrol.com`). **No Cloudflare in the path.**
- CloudFront has a single origin (the ALB), no extra cache behaviors, no custom error responses.
- AWS WAF `EPIProduction-WAF` (us-east-1, CLOUDFRONT scope) is attached to the distribution.
  Outside the downtime window it has no downtime/block-all rule, so the nightly 403 is most likely
  a rule the Lambda adds/flips — **not verified** (IAM user can't read Lambda / EventBridge / Scheduler).
- Today users get the plain AWS WAF/CloudFront 403 page during the window.

## Decisions

| # | Topic | Decision |
|---|-------|----------|
| 1 | Stack | Vue 3 + Vite + Tailwind CSS v4 (same Tailwind major as the portal). Node for build only. |
| 2 | Output | Static build in `dist/` with separate JS/CSS/font/image files, hosted on S3. |
| 3 | Downtime window | Daily **10:30 PM – 6:45 AM, Asia/Manila (UTC+8)**, kept as an editable constant in source (`src/config.js`). Change + rebuild when the schedule shifts. |
| 4 | Countdown | Counts down to the next 6:45 AM Manila time using **server time** (HTTP `Date` + `Age` headers from a `HEAD` on `/maintenance/banig-pattern.svg`), advanced with the monotonic `performance.now()`. Never uses the device clock; if server time can't be read, no countdown is shown. |
| 5 | Fonts | Montserrat (headings) + DM Sans (body), bundled into `dist/`. No Google Fonts calls. |
| 6 | Branding | Portal 2024 brand tokens (`apps/web/src/app/globals.css`): Serbisyo red `#ee2434`, Panatag navy `#1c4199`, Pag-asa sky `#4fbff7`, Tapat bg `#fbfbfb`, Sistema border `#e5e5e5`. ExpressPay wordmark/lockup and "banig" pattern ported from the portal. |
| 7 | Copy | English. |
| 8 | Layout | **Option A — card** (`kos/mockups/option-a-card.html`): white card on banig background, logo lockup, H/M/S tiles in navy. |
| 9 | At 0:00 | If the page was open during the window: "Almost back — the portal will open automatically", no footer. Every 10 s it `HEAD`s the current URL and reloads once it stops returning 503 (the WAF lifts ~06:45:50, not 06:45:00), so there's no reload loop and deep links are kept. Changed 2026-10-08. |
| 10 | Outside the window | Page opened for another reason: "Temporarily unavailable — this page will refresh when the portal is back", no countdown; same 10 s check + reload. |

## Open questions

1. **Hosting path via CloudFront** — S3 as a second origin on `E3DAFSJMLX539B` vs. separate bucket URL. Affects Vite `base` (e.g. `/maintenance/`).
   On hold until Lambda read access is granted to the IAM user; decide wiring after reviewing the Lambda.
2. **HTTP status** returned with the page (keep 403 vs. 503 + `Retry-After`).
3. Lambda name/role so the wiring can be checked.

## Mockups

See `kos/mockups/` — three directions (A, B, C). Open the `.html` files in a browser.
Outside the real window the mockups simulate 1:23 AM so the countdown is visible.
