<template>
  <span class="base-badge" :class="`tone-${tone}`">
    <span v-if="dot" class="badge-dot" aria-hidden="true"></span>
    <slot />
  </span>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{ tone?: 'success' | 'warning' | 'danger' | 'accent' | 'neutral'; dot?: boolean }>(),
  { tone: 'neutral', dot: false },
);
</script>

<style scoped>
.base-badge {
  display: inline-flex; align-items: center; gap: var(--space-1);
  height: 20px; padding-inline: var(--space-2); border-radius: var(--radius-full);
  font-size: var(--text-xs); font-weight: var(--weight-semibold); line-height: 1;
  border: 1px solid transparent;
}
.badge-dot { width: 8px; height: 8px; border-radius: var(--radius-full); background: currentColor; }
.tone-success { background: var(--color-success-bg); color: var(--color-success-fg); border-color: var(--color-success-line); }
.tone-warning { background: var(--color-warning-bg); color: var(--color-warning-fg); border-color: var(--color-warning-line); }
.tone-danger { background: var(--color-danger-bg); color: var(--color-danger-fg); border-color: var(--color-danger-line); }
.tone-accent { background: var(--color-accent-quiet); color: var(--color-accent-line); }
.tone-neutral { background: var(--surface-sunken); color: var(--color-card-text); border-color: var(--color-hairline); }
</style>
