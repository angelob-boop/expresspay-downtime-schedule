// Server clock from the HTTP Date header, so a wrong device clock can't skew the countdown.
// Uses a static asset under /maintenance/ (excluded from the WAF block) rather than the page URL.
export async function fetchServerClock() {
  const p0 = performance.now()
  const res = await fetch(`${import.meta.env.BASE_URL}banig-pattern.svg`, { method: 'HEAD', cache: 'no-store' })
  const p1 = performance.now()

  const date = Date.parse(res.headers.get('date'))
  if (Number.isNaN(date)) throw new Error('No Date header')
  // Age: seconds a CDN-cached response has been held, so Date alone would be stale.
  const age = Number(res.headers.get('age')) || 0
  const base = date + age * 1000 + (p1 - p0) / 2

  // performance.now() is monotonic, so later device clock changes don't matter either.
  return () => base + (performance.now() - p1)
}
