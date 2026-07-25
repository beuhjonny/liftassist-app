<template>
  <div class="base-stepper" role="group" :aria-label="ariaLabel">
    <button type="button" class="step-btn" :disabled="atMin" aria-label="Decrease" @click="bump(-1)">
      <Minus :size="20" />
    </button>
    <span class="step-value" aria-live="polite">{{ display }}</span>
    <button type="button" class="step-btn" :disabled="atMax" aria-label="Increase" @click="bump(1)">
      <Plus :size="20" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Plus, Minus } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    modelValue: number;
    step?: number;
    min?: number;
    max?: number;
    ariaLabel?: string;
    suffix?: string;
  }>(),
  { step: 1, min: 0, max: Number.MAX_SAFE_INTEGER, ariaLabel: 'value' },
);
const emit = defineEmits<{ (e: 'update:modelValue', v: number): void }>();

const atMin = computed(() => props.modelValue <= props.min);
const atMax = computed(() => props.modelValue >= props.max);
const display = computed(() => `${props.modelValue}${props.suffix ? ' ' + props.suffix : ''}`);

const bump = (dir: number) => {
  const next = Math.min(props.max, Math.max(props.min, props.modelValue + dir * props.step));
  if (next !== props.modelValue) {
    emit('update:modelValue', next);
    try { navigator.vibrate?.(15); } catch { /* ignore */ }
  }
};
</script>

<style scoped>
.base-stepper { display: inline-flex; align-items: center; gap: var(--space-2); }
.step-btn {
  width: var(--control-h-md); height: var(--control-h-md);
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: var(--radius-md); border: 1px solid var(--color-hairline);
  background: var(--surface-sunken); color: var(--color-card-text); cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-standard);
}
.step-btn:active { transform: scale(0.95); }
.step-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.step-value {
  min-width: 64px; text-align: center;
  font-variant-numeric: tabular-nums; font-weight: var(--weight-bold);
  font-size: var(--text-lg); color: var(--color-card-heading);
}
</style>
