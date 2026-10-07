const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

const pad = (n) => String(n).padStart(2, '0')

// Pure so it can be checked without a browser. phase: 'down' inside the window, 'up' outside.
export function getState(nowMs, { start, end, utcOffsetHours }) {
  const local = new Date(nowMs + utcOffsetHours * 3600000)
  const sod = local.getUTCHours() * 3600 + local.getUTCMinutes() * 60 + local.getUTCSeconds()
  const s0 = toMin(start) * 60
  const e0 = toMin(end) * 60
  const down = s0 <= e0 ? sod >= s0 && sod < e0 : sod >= s0 || sod < e0
  if (!down) return { phase: 'up' }

  const remaining = (e0 - sod + 86400) % 86400
  return {
    phase: 'down',
    h: pad(Math.floor(remaining / 3600)),
    m: pad(Math.floor((remaining % 3600) / 60)),
    s: pad(remaining % 60),
  }
}

// "06:45" -> "6:45 AM"
export function formatTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return `${h % 12 || 12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`
}
