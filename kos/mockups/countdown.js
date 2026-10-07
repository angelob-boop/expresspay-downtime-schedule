// Mockup-only countdown. Window mirrors the planned src/config.ts constant.
const WINDOW = { start: "22:30", end: "06:45", tzOffsetMin: 8 * 60 }; // Asia/Manila

const toMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
const START = toMin(WINDOW.start);
const END = toMin(WINDOW.end);
const TOTAL = ((END - START + 1440) % 1440) * 60; // seconds in window

function manilaSecondsOfDay(ms) {
  const d = new Date(ms + WINDOW.tzOffsetMin * 60000);
  return d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds();
}

// Outside the real window, pretend it's 01:23 AM so the design shows a live countdown.
const realSod = manilaSecondsOfDay(Date.now());
const inWindow = (sod) => sod >= START * 60 || sod < END * 60;
const simulated = !inWindow(realSod);
const shiftMs = simulated ? ((83 * 60 - realSod + 86400) % 86400) * 1000 : 0;

function state() {
  const sod = manilaSecondsOfDay(Date.now() + shiftMs);
  const remaining = (END * 60 - sod + 86400) % 86400;
  const elapsed = TOTAL - remaining;
  const pad = (n) => String(n).padStart(2, "0");
  return {
    h: pad(Math.floor(remaining / 3600)),
    m: pad(Math.floor((remaining % 3600) / 60)),
    s: pad(remaining % 60),
    progress: Math.min(1, Math.max(0, elapsed / TOTAL)),
    simulated,
  };
}

window.startCountdown = (render) => {
  const tick = () => render(state());
  tick();
  setInterval(tick, 1000);
};
