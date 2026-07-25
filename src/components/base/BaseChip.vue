<template>
  <button type="button" class="base-chip" :class="{ 'is-selected': selected }" :aria-pressed="selected">
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{ selected?: boolean }>();
</script>

<style scoped>
.base-chip {
  display: inline-flex; align-items: center; gap: var(--space-2);
  height: 36px; min-height: var(--tap-min); padding-inline: var(--space-3);
  border-radius: var(--radius-full); border: 1px solid var(--color-hairline);
  background: transparent; color: var(--color-card-text);
  font-size: var(--text-sm); font-weight: var(--weight-medium); cursor: pointer; white-space: nowrap;
  transition: background-color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard);
}
.base-chip:active { transform: scale(0.97); }
.is-selected { background: var(--color-accent); color: var(--color-accent-contrast); border-color: transparent; }
@media (hover: hover) { .base-chip:not(.is-selected):hover { background: var(--color-accent-quiet); } }
</style>
