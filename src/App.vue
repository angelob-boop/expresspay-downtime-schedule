<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { DOWNTIME } from './config.js'
import { formatTime, getState } from './countdown.js'
import { fetchServerClock } from './serverTime.js'

const startText = formatTime(DOWNTIME.start)
const endText = formatTime(DOWNTIME.end)

// 'loading' until server time arrives; 'unknown' if it can't be fetched (never fall back to the device clock).
const state = ref({ phase: 'loading' })
// Loaded inside the window -> show "We're back" when it ends; loaded outside -> generic notice.
const loadedDuringDowntime = ref(false)
let timer

fetchServerClock()
  .then((now) => {
    state.value = getState(now(), DOWNTIME)
    loadedDuringDowntime.value = state.value.phase === 'down'
    timer = setInterval(() => {
      state.value = getState(now(), DOWNTIME)
    }, 1000)
  })
  .catch(() => {
    state.value = { phase: 'unknown' }
  })
onBeforeUnmount(() => clearInterval(timer))

const units = [
  ['h', 'Hours'],
  ['m', 'Minutes'],
  ['s', 'Seconds'],
]
</script>

<template>
  <div class="bg-banig flex min-h-screen items-center justify-center p-4 font-body text-slate-600">
    <main class="w-full max-w-md rounded-2xl border border-sistema bg-white p-8 text-center shadow-xl shadow-panatag/10">
      <svg class="mx-auto h-14" viewBox="0 0 280 96" role="img" aria-label="ExpressPay — Load, Bayad, Padala, Atbp.">
        <text x="0" y="46" font-family="Montserrat" font-weight="800" font-size="44" letter-spacing="-1">
          <tspan fill="#ee2434">Express</tspan><tspan fill="#1c4199">Pay</tspan>
        </text>
        <text x="252" y="18" font-family="Montserrat" font-weight="700" font-size="13" fill="#1c4199">™</text>
        <circle cx="9" cy="80" r="9" fill="#ee2434" />
        <path d="M4.5 80.5 L8 84 L13.5 76.5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        <text x="24" y="86" font-family="DM Sans" font-weight="700" font-size="17" fill="#1c4199">Load, Bayad, Padala, Atbp.</text>
      </svg>

      <template v-if="state.phase === 'down'">
        <h1 class="mt-8 font-heading text-2xl font-bold text-panatag">Scheduled maintenance</h1>
        <p class="mt-2 text-sm">
          The ExpressPay portal is offline for nightly maintenance ({{ startText }} – {{ endText }}).
          Your account and transactions are safe.
        </p>

        <div class="mt-8 grid grid-cols-3 gap-3" aria-hidden="true">
          <div v-for="[key, label] in units" :key="key" class="rounded-xl bg-panatag py-4">
            <div class="font-heading text-4xl font-extrabold text-white tabular-nums">{{ state[key] }}</div>
            <div class="mt-1 text-[11px] tracking-widest text-pag-asa uppercase">{{ label }}</div>
          </div>
        </div>

        <p class="mt-6 text-sm">
          Back online at <strong class="text-panatag">{{ endText }}</strong> (Philippine time)
        </p>
      </template>

      <template v-else-if="loadedDuringDowntime">
        <h1 class="mt-8 font-heading text-2xl font-bold text-panatag">We're back</h1>
        <p class="mt-2 text-sm">Maintenance is finished. Thanks for waiting.</p>
        <a href="/" class="mt-8 flex min-h-12 items-center justify-center rounded-xl bg-serbisyo font-heading font-bold text-white hover:bg-[#c91d2c]">
          Go to portal
        </a>
      </template>

      <template v-else-if="state.phase !== 'loading'">
        <h1 class="mt-8 font-heading text-2xl font-bold text-panatag">Temporarily unavailable</h1>
        <p class="mt-2 text-sm">Please try again shortly.</p>
        <p v-if="state.phase === 'unknown'" class="mt-2 text-sm">
          Nightly maintenance runs {{ startText }} – {{ endText }} (Philippine time).
        </p>
      </template>

      <div v-if="state.phase !== 'loading' && (state.phase === 'down' || !loadedDuringDowntime)" class="mt-8 border-t border-sistema pt-4 text-[11px] text-slate-400">Error 403 · Service temporarily unavailable</div>
    </main>
  </div>
</template>
