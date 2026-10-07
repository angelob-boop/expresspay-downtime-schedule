import { test } from 'node:test'
import assert from 'node:assert/strict'
import { waitForPortal } from '../src/portalPoll.js'

test('keeps checking through 503s and network errors, resolves on the first other status', async () => {
  const replies = [503, 'fail', 503, 200]
  const calls = []
  const fetchFn = (url, opts) => {
    calls.push([url, opts.method])
    const r = replies.shift()
    return r === 'fail' ? Promise.reject(new Error('offline')) : Promise.resolve({ status: r })
  }
  await waitForPortal('/dashboard?x=1', { intervalMs: 1, fetchFn })
  assert.equal(calls.length, 4)
  assert.deepEqual(calls[0], ['/dashboard?x=1', 'HEAD'])
})
