<template>
  <!-- No aria-live here: it would re-read the whole ring every tick and flood
       the screen reader. The numeral is decorative to AT; milestones (start /
       10s / complete) are announced once by the parent. -->
  <div class="timer-ring" role="timer" :aria-label="`Rest timer, ${timeText} remaining`">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" class="ring-svg" aria-hidden="true">
      <!-- Graduated tick ring: the same instrument language as the readiness gauge -->
      <g class="ticks">
        <line
          v-for="t in ticks"
          :key="t.i"
          :x1="t.x1" :y1="t.y1" :x2="t.x2" :y2="t.y2"
          :class="['tick', { major: t.major }]"
        />
      </g>
      <circle
        class="ring-track"
        :cx="size / 2" :cy="size / 2" :r="radius"
        fill="none" :stroke-width="stroke"
      />
      <circle
        class="ring-progress"
        :class="urgency"
        :cx="size / 2" :cy="size / 2" :r="radius"
        fill="none" :stroke-width="stroke" stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        :transform="`rotate(-90 ${size / 2} ${size / 2})`"
      />
      <!-- Luminous endpoint at the current position -->
      <circle v-if="progress > 1" :cx="endPoint.x" :cy="endPoint.y" :r="stroke / 2 + 1" class="ring-dot" :class="urgency" />
    </svg>
    <div class="ring-center">
      <span class="ring-time num-display" :class="urgency">{{ timeText }}</span>
      <span class="ring-label">REST</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{ timeText: string; progress: number; secondsLeft?: number; size?: number }>(),
  { size: 220, secondsLeft: 99 },
);

const stroke = 8;
const radius = computed(() => (props.size - stroke) / 2 - 12); // room for ticks
const circumference = computed(() => 2 * Math.PI * radius.value);
// progress is 0-100 remaining; the ring empties as it counts down.
const clampedPct = computed(() => Math.max(0, Math.min(100, props.progress)));
const dashOffset = computed(() => circumference.value * (1 - clampedPct.value / 100));
const urgency = computed(() => (props.secondsLeft <= 3 ? 'danger' : props.secondsLeft <= 10 ? 'warn' : ''));

// Full-circle graduated ticks (24 minor, majors at the quarter marks).
const ticks = computed(() => {
  const cx = props.size / 2;
  const cy = props.size / 2;
  const out: Array<{ i: number; x1: number; y1: number; x2: number; y2: number; major: boolean }> = [];
  for (let i = 0; i < 24; i++) {
    const deg = (360 / 24) * i - 90;
    const rad = (deg * Math.PI) / 180;
    const major = i % 6 === 0;
    const outer = radius.value + stroke / 2 + (major ? 10 : 7);
    const inner = radius.value + stroke / 2 + 4;
    out.push({
      i,
      x1: cx + outer * Math.cos(rad), y1: cy + outer * Math.sin(rad),
      x2: cx + inner * Math.cos(rad), y2: cy + inner * Math.sin(rad),
      major,
    });
  }
  return out;
});

// Endpoint of the remaining arc (clockwise from 12 o'clock).
const endPoint = computed(() => {
  const cx = props.size / 2;
  const cy = props.size / 2;
  const deg = (clampedPct.value / 100) * 360 - 90;
  const rad = (deg * Math.PI) / 180;
  return { x: cx + radius.value * Math.cos(rad), y: cy + radius.value * Math.sin(rad) };
});
</script>

<style scoped>
.timer-ring { position: relative; width: fit-content; margin: var(--space-4) auto; }
.ring-svg { display: block; }

.tick { stroke: color-mix(in srgb, var(--color-card-text) 22%, transparent); stroke-width: 1; }
.tick.major { stroke-width: 2; stroke: color-mix(in srgb, var(--color-card-text) 34%, transparent); }

.ring-track { stroke: color-mix(in srgb, var(--color-card-text) 14%, transparent); }
.ring-progress {
  stroke: var(--color-accent);
  transition: stroke-dashoffset var(--duration-slow) var(--ease-standard), stroke var(--duration-base) var(--ease-standard);
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--color-accent) 45%, transparent));
}
.ring-progress.warn { stroke: var(--color-warning-fg); filter: drop-shadow(0 0 6px color-mix(in srgb, var(--color-warning-fg) 45%, transparent)); }
.ring-progress.danger { stroke: var(--color-danger-fg); filter: drop-shadow(0 0 6px color-mix(in srgb, var(--color-danger-fg) 45%, transparent)); }

.ring-dot { fill: var(--color-accent); filter: drop-shadow(0 0 8px var(--color-accent)); }
.ring-dot.warn { fill: var(--color-warning-fg); filter: drop-shadow(0 0 8px var(--color-warning-fg)); }
.ring-dot.danger { fill: var(--color-danger-fg); filter: drop-shadow(0 0 8px var(--color-danger-fg)); }

.ring-center {
  position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-1);
}
.ring-time {
  font-family: var(--font-display);
  font-size: var(--text-display); font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-tight);
  line-height: var(--leading-none);
  color: var(--color-card-heading);
}
.ring-time.warn { color: var(--color-warning-fg); }
.ring-time.danger { color: var(--color-danger-fg); }
.ring-label {
  font-size: var(--text-xs); font-weight: var(--weight-bold); letter-spacing: var(--tracking-wider);
  text-transform: uppercase; color: var(--text-tertiary);
}
@media (max-width: 480px) { .timer-ring { transform: scale(0.85); } }
</style>
