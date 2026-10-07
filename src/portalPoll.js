// Resolves once `url` stops answering 503. The WAF lifts ~06:45:50, a bit after the countdown's
// 06:45:00, so the page waits for the real lift instead of reloading straight into the block.
export function waitForPortal(url, { intervalMs = 10000, fetchFn = fetch } = {}) {
  return new Promise((resolve) => {
    const check = () =>
      fetchFn(url, { method: 'HEAD', cache: 'no-store' })
        .then((r) => (r.status === 503 ? setTimeout(check, intervalMs) : resolve()))
        .catch(() => setTimeout(check, intervalMs))
    setTimeout(check, intervalMs)
  })
}
