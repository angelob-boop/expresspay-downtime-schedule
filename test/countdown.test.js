import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatTime, getState } from '../src/countdown.js'

// Fixed window so editing src/config.js doesn't break the tests.
const DOWNTIME = { start: '22:30', end: '06:45', utcOffsetHours: 8 }

// Manila wall time -> epoch ms (date is irrelevant; only time of day matters).
const manila = (hhmmss) => {
  const [h, m, s] = hhmmss.split(':').map(Number)
  return Date.UTC(2026, 9, 7, h - DOWNTIME.utcOffsetHours, m, s)
}

test('outside the window is up', () => {
  for (const t of ['22:29:59', '06:45:00', '12:00:00']) {
    assert.deepEqual(getState(manila(t), DOWNTIME), { phase: 'up' }, t)
  }
})

test('inside the window counts down to the end', () => {
  const cases = {
    '22:30:00': ['08', '15', '00'],
    '01:23:00': ['05', '22', '00'],
    '06:44:59': ['00', '00', '01'],
  }
  for (const [t, [h, m, s]] of Object.entries(cases)) {
    assert.deepEqual(getState(manila(t), DOWNTIME), { phase: 'down', h, m, s }, t)
  }
})

test('formatTime renders 12-hour clock', () => {
  assert.equal(formatTime('22:30'), '10:30 PM')
  assert.equal(formatTime('06:45'), '6:45 AM')
  assert.equal(formatTime('00:05'), '12:05 AM')
  assert.equal(formatTime('12:00'), '12:00 PM')
})
