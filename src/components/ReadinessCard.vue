<template>
  <section
    class="readiness card"
    :class="`level-${readiness.level}`"
    role="status"
    :aria-label="`Readiness ${readiness.headline}, ${readiness.score} out of 100. ${readiness.guidance}`"
  >
    <div class="gauge" aria-hidden="true">
      <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
        <!-- Graduated tick ring: the instrument, not a progress bar -->
        <g class="ticks">
          <line
            v-for="t in ticks"
            :key="t.i"
            :x1="t.x1" :y1="t.y1" :x2="t.x2" :y2="t.y2"
            :class="['tick', { major: t.major, lit: t.pct <= shownPct }]"
          />
        </g>
        <!-- Track + luminous fill sweep (270deg tachometer arc) -->
        <path :d="arcPath" fill="none" class="gauge-track" :stroke-width="stroke" stroke-linecap="round" />
        <path
          :d="arcPath" fill="none" class="gauge-fill" :stroke-width="stroke" stroke-linecap="round"
          :stroke-dasharray="arcLen" :stroke-dashoffset="arcLen * (1 - shownPct / 100)"
        />
        <!-- Glowing endpoint at the current value -->
        <circle v-if="shownPct > 1" :cx="endPoint.x" :cy="endPoint.y" :r="stroke / 2 + 1" class="gauge-dot" />
      </svg>
      <!-- Recessed readout window -->
      <div class="readout">
        <div class="readout-score">
          <span class="score num-display">{{ shownScore }}</span>
          <span class="score-max">/100</span>
        </div>
        <span class="band-word">{{ bandWord }}</span>
      </div>
    </div>

    <div class="verdict">
      <span class="eyebrow">READINESS</span>
      <h2 class="headline">{{ readiness.headline }}</h2>
      <p class="guidance">{{ readiness.guidance }}</p>
      <button
        v-if="readiness.factors.length"
        type="button"
        class="show-work"
        :aria-expanded="showWork"
        @click="showWork = !showWork"
      >
        {{ showWork ? 'Hide the work' : 'Show the work' }}
      </button>
      <Transition name="work">
        <ul v-if="showWork" class="work-list">
          <li v-for="f in readiness.factors" :key="f">{{ f }}</li>
        </ul>
      </Transition>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { Readiness } from '@/utils/readiness';

const props = defineProps<{ readiness: Readiness }>();

const size = 180;
const stroke = 10;
const r = size / 2 - stroke - 10; // leave room for the tick ring
const cx = size / 2;
const cy = size / 2;

// 270deg tachometer arc, opening at the bottom: 135deg -> 405deg.
const START = 135;
const SWEEP = 270;
const rad = (deg: number) => ((deg - 90) * Math.PI) / 180;
const pointAt = (deg: number, radius: number) => ({
  x: cx + radius * Math.cos(rad(deg)),
  y: cy + radius * Math.sin(rad(deg)),
});
const p0 = pointAt(START, r);
const p1 = pointAt(START + SWEEP, r);
const arcPath = `M ${p0.x} ${p0.y} A ${r} ${r} 0 1 1 ${p1.x} ${p1.y}`;
const arcLen = (SWEEP / 360) * 2 * Math.PI * r;

// Graduated ticks: minor every 4%, major every 20%.
const ticks = computed(() => {
  const out: Array<{ i: number; x1: number; y1: number; x2: number; y2: number; major: boolean; pct: number }> = [];
  for (let i = 0; i <= 25; i++) {
    const pct = (i / 25) * 100;
    const deg = START + (SWEEP * i) / 25;
    const major = i % 5 === 0;
    const outer = r + stroke / 2 + (major ? 9 : 6);
    const inner = r + stroke / 2 + 3;
    const a = pointAt(deg, outer);
    const b = pointAt(deg, inner);
    out.push({ i, x1: a.x, y1: a.y, x2: b.x, y2: b.y, major, pct });
  }
  return out;
});

const clampPct = (n: number) => Math.min(100, Math.max(0, n));
const shownScore = ref(0);
const shownPct = computed(() => clampPct(shownScore.value));
const endPoint = computed(() => pointAt(START + (SWEEP * shownPct.value) / 100, r));

const bandWord = computed(
  () => ({ push: 'PUSH', steady: 'READY', recover: 'RECOVER' })[props.readiness.level],
);

const showWork = ref(false);

// Ignition: the once-per-CALENDAR-DAY reveal (settled decision). A same-day
// re-open renders the final state instantly.
let raf = 0;
const IGNITION_KEY = 'liftlogic.readinessIgnitionOn';
onMounted(() => {
  const today = new Date().toDateString();
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let already = false;
  try { already = localStorage.getItem(IGNITION_KEY) === today; } catch { /* private mode */ }

  if (reduced || already) {
    shownScore.value = props.readiness.score;
    return;
  }
  try { localStorage.setItem(IGNITION_KEY, today); } catch { /* private mode */ }

  const t0 = performance.now();
  const DUR = 800;
  const tick = (now: number) => {
    const p = Math.min(1, (now - t0) / DUR);
    const eased = 1 - Math.pow(1 - p, 3);
    shownScore.value = Math.round(props.readiness.score * eased);
    if (p < 1) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  // Hidden-tab guarantee: never leave the dial at 0.
  setTimeout(() => {
    if (shownScore.value !== props.readiness.score) {
      cancelAnimationFrame(raf);
      shownScore.value = props.readiness.score;
    }
  }, DUR + 150);
});
onUnmounted(() => cancelAnimationFrame(raf));
</script>

<style scoped>
.readiness {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-1), var(--edge-highlight);
  padding: var(--space-4) var(--space-5);
}
.gauge { position: relative; flex-shrink: 0; }
.gauge svg { display: block; }

.tick { stroke: color-mix(in srgb, var(--color-card-text) 22%, transparent); stroke-width: 1; }
.tick.major { stroke-width: 2; stroke: color-mix(in srgb, var(--color-card-text) 34%, transparent); }
.tick.lit { stroke: var(--gauge-color); opacity: 0.85; }

.gauge-track { stroke: color-mix(in srgb, var(--color-card-text) 14%, transparent); }
.gauge-fill {
  stroke: var(--gauge-color);
  transition: stroke-dashoffset var(--duration-fast) linear;
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--gauge-color) 55%, transparent));
}
.gauge-dot {
  fill: var(--gauge-color);
  filter: drop-shadow(0 0 8px var(--gauge-color));
}

.readout {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
}
.readout-score { display: flex; align-items: baseline; gap: 2px; }
.score {
  font-family: var(--font-display);
  font-size: var(--text-3xl); font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-tight);
  color: var(--color-card-heading); line-height: 1;
}
.score-max { font-size: var(--text-xs); color: var(--text-tertiary); }
.band-word {
  font-size: var(--text-xs); font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-wider); color: var(--gauge-color);
}

.level-push { --gauge-color: var(--color-success-fg); }
.level-steady { --gauge-color: var(--color-accent-line); }
.level-recover { --gauge-color: var(--color-warning-fg); }

.verdict { display: flex; flex-direction: column; gap: var(--space-1); min-width: 0; }
.eyebrow {
  font-size: var(--text-xs); font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-wider); text-transform: uppercase; color: var(--text-tertiary);
}
.headline {
  margin: 0; font-family: var(--font-display); font-size: var(--text-xl);
  font-weight: var(--weight-bold); color: var(--gauge-color); line-height: var(--leading-tight);
}
.guidance { margin: 0; font-size: var(--text-sm); color: var(--color-card-text); line-height: var(--leading-normal); }

.show-work {
  align-self: flex-start;
  margin-top: var(--space-1);
  min-height: var(--tap-min);
  background: none; border: none; padding: 0;
  color: var(--color-accent-line); font-size: var(--text-sm); font-weight: var(--weight-semibold);
  cursor: pointer;
}
.work-list {
  margin: 0; padding: 0 0 0 var(--space-4);
  font-size: var(--text-sm); color: var(--color-card-text); line-height: var(--leading-normal);
}
.work-list li { margin-bottom: 2px; }

@media (prefers-reduced-motion: no-preference) {
  .work-enter-active { transition: opacity var(--duration-base) var(--ease-out), transform var(--duration-base) var(--ease-out); }
  .work-leave-active { transition: opacity var(--duration-fast) var(--ease-in); }
  .work-enter-from { opacity: 0; transform: translateY(-4px); }
  .work-leave-to { opacity: 0; }
}

@media (max-width: 480px) {
  .readiness { flex-direction: column; text-align: center; gap: var(--space-3); }
  .verdict { align-items: center; }
  .show-work { align-self: center; }
  .work-list { text-align: left; }
}
</style>
