<template>
  <div class="timer-ring" role="timer" aria-live="polite">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" class="ring-svg" aria-hidden="true">
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
    </svg>
    <div class="ring-center">
      <span class="ring-time" :class="urgency">{{ timeText }}</span>
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
const radius = computed(() => (props.size - stroke) / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);
// progress is 0-100 remaining; the ring empties as it counts down.
const dashOffset = computed(() => circumference.value * (1 - Math.max(0, Math.min(100, props.progress)) / 100));
const urgency = computed(() => (props.secondsLeft <= 3 ? 'danger' : props.secondsLeft <= 10 ? 'warn' : ''));
</script>

<style scoped>
.timer-ring { position: relative; width: fit-content; margin: var(--space-4) auto; }
.ring-svg { display: block; }
.ring-track { stroke: var(--color-card-border); }
.ring-progress {
  stroke: var(--color-accent);
  transition: stroke-dashoffset var(--duration-slow) var(--ease-standard), stroke var(--duration-base) var(--ease-standard);
}
.ring-progress.warn { stroke: var(--color-warning-fg); }
.ring-progress.danger { stroke: var(--color-danger-fg); }
.ring-center {
  position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-1);
}
.ring-time {
  font-size: var(--text-display); font-weight: var(--weight-bold);
  font-variant-numeric: tabular-nums; line-height: var(--leading-none);
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
