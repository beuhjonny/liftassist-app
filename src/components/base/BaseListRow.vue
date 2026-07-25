<template>
  <component :is="interactive ? 'button' : 'div'" class="list-row" :class="{ 'is-selected': selected, 'is-interactive': interactive }" :type="interactive ? 'button' : undefined">
    <span v-if="$slots.leading" class="row-leading"><slot name="leading" /></span>
    <span class="row-content"><slot /></span>
    <span v-if="$slots.trailing" class="row-trailing"><slot name="trailing" /></span>
  </component>
</template>

<script setup lang="ts">
defineProps<{ interactive?: boolean; selected?: boolean }>();
</script>

<style scoped>
.list-row {
  display: flex; align-items: center; gap: var(--space-3); width: 100%; text-align: left;
  min-height: 56px; padding: var(--space-3) var(--space-4);
  background: var(--surface-raised); color: var(--color-card-text);
  border: none; border-bottom: 1px solid var(--color-hairline); font: inherit;
}
.is-interactive { cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) { .is-interactive:hover { background: var(--color-accent-quiet); } }
.is-selected { box-shadow: inset 3px 0 0 var(--color-accent); background: var(--color-accent-quiet); }
.row-content { flex: 1; min-width: 0; }
.row-trailing, .row-leading { display: inline-flex; align-items: center; flex-shrink: 0; }
</style>
