<template>
  <section class="readiness card" :class="`level-${readiness.level}`" role="status" :aria-label="`Readiness ${readiness.headline}, ${readiness.score} out of 100. ${readiness.guidance}`">
    <div class="gauge" aria-hidden="true">
      <svg :width="size" :height="size / 2 + 8" :viewBox="`0 0 ${size} ${size / 2 + 8}`">
        <path :d="arcPath" fill="none" stroke="var(--color-hairline)" :stroke-width="stroke" stroke-linecap="round" />
        <path :d="arcPath" fill="none" class="gauge-fill" :stroke-width="stroke" stroke-linecap="round"
          :stroke-dasharray="arcLen" :stroke-dashoffset="dashOffset"
          :style="{ '--arc-len': arcLen + 'px' }" />
      </svg>
      <div class="gauge-center">
        <span class="score">{{ readiness.score }}</span>
        <span class="score-max">/100</span>
      </div>
    </div>
    <div class="verdict">
      <span class="eyebrow">READINESS</span>
      <h2 class="headline">{{ readiness.headline }}</h2>
      <p class="guidance">{{ readiness.guidance }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Readiness } from '@/utils/readiness';

const props = defineProps<{ readiness: Readiness }>();

const size = 168;
const stroke = 12;
const r = (size - stroke) / 2;
const cy = size / 2;
// 180deg arc, left to right along the top.
const arcPath = `M ${stroke / 2} ${cy} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${cy}`;
const arcLen = Math.PI * r;

const clamp = (n: number) => Math.min(100, Math.max(0, n));
// Final offset for the score. A CSS keyframe reveals it from empty (--arc-len)
// on mount, so it does not depend on requestAnimationFrame.
const dashOffset = computed(() => arcLen * (1 - clamp(props.readiness.score) / 100));
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
.gauge-fill {
  stroke: var(--gauge-color);
  animation: gauge-fill var(--duration-slow) var(--ease-out) both;
}
@keyframes gauge-fill {
  from { stroke-dashoffset: var(--arc-len); }
}
@media (prefers-reduced-motion: reduce) {
  .gauge-fill { animation: none; }
}
.level-push { --gauge-color: var(--color-success-fg); }
.level-steady { --gauge-color: var(--color-accent-line); }
.level-recover { --gauge-color: var(--color-warning-fg); }
.gauge-center {
  position: absolute; left: 0; right: 0; bottom: 0;
  display: flex; align-items: baseline; justify-content: center; gap: 2px;
}
.score {
  font-size: var(--text-2xl); font-weight: var(--weight-bold);
  font-variant-numeric: tabular-nums; color: var(--color-card-heading); line-height: 1;
}
.score-max { font-size: var(--text-sm); color: var(--text-tertiary); }
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
@media (max-width: 380px) {
  .readiness { flex-direction: column; text-align: center; }
  .verdict { align-items: center; }
}
</style>
