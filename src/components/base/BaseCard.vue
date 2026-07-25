<template>
  <component
    :is="interactive ? 'button' : 'div'"
    class="base-card"
    :class="[`variant-${variant}`, { 'is-flush': flush }]"
    :type="interactive ? 'button' : undefined"
  >
    <div v-if="$slots.header" class="card-header"><slot name="header" /></div>
    <slot />
  </component>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'default' | 'elevated' | 'interactive';
    flush?: boolean;
    interactive?: boolean;
  }>(),
  { variant: 'default', flush: false, interactive: false },
);
</script>

<style scoped>
.base-card {
  display: block;
  width: 100%;
  text-align: left;
  background: var(--surface-raised);
  color: var(--color-card-text);
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-1), var(--edge-highlight);
  transition: border-color var(--duration-fast) var(--ease-standard),
    box-shadow var(--duration-fast) var(--ease-standard),
    transform var(--duration-fast) var(--ease-standard);
}
.is-flush { padding: 0; }
.variant-elevated { box-shadow: var(--shadow-2), var(--edge-highlight); }
.variant-interactive { cursor: pointer; }
.variant-interactive:active { transform: scale(0.995); }
@media (hover: hover) {
  .variant-interactive:hover { border-color: var(--color-accent-line); box-shadow: var(--shadow-2), var(--edge-highlight); }
}
.card-header {
  font-family: var(--font-display);
  font-weight: var(--weight-semibold);
  font-size: var(--text-lg);
  color: var(--color-card-heading);
  margin-bottom: var(--space-3);
}
@media (max-width: 600px) {
  .base-card:not(.is-flush) { padding: var(--space-4); }
}
</style>
