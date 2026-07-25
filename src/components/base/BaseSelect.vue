<template>
  <label class="base-select-field">
    <span v-if="label" class="field-label">{{ label }}</span>
    <div class="select-wrap">
      <select
        class="field-select"
        :value="modelValue"
        :disabled="disabled"
        @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      >
        <slot />
      </select>
      <ChevronDown :size="20" class="select-chevron" aria-hidden="true" />
    </div>
  </label>
</template>

<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next';
defineProps<{ modelValue?: string; label?: string; disabled?: boolean }>();
defineEmits<{ (e: 'update:modelValue', v: string): void }>();
</script>

<style scoped>
.base-select-field { display: flex; flex-direction: column; gap: var(--space-1); }
.field-label { font-size: var(--text-sm); font-weight: var(--weight-medium); color: var(--color-card-text); }
.select-wrap { position: relative; }
.field-select {
  width: 100%; min-height: var(--control-h-md); padding-inline: var(--space-3);
  padding-right: var(--space-6); border-radius: var(--radius-md);
  border: 1px solid var(--color-hairline); background: var(--surface-sunken);
  color: var(--color-card-text); font: inherit; font-size: max(16px, 1em);
  appearance: none; cursor: pointer;
}
.field-select:focus { outline: none; border-color: var(--color-accent); box-shadow: 0 0 0 2px var(--color-accent-quiet); }
.select-chevron { position: absolute; right: var(--space-3); top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--color-card-text); opacity: 0.7; }
</style>
