<template>
  <button
    :type="type"
    class="base-btn"
    :class="[`variant-${variant}`, `size-${size}`, { 'is-block': block, 'is-loading': loading }]"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    :aria-disabled="disabled || undefined"
  >
    <span v-if="loading" class="btn-spinner" aria-hidden="true"></span>
    <span class="btn-content" :class="{ 'is-hidden': loading }">
      <slot name="leading" />
      <slot />
      <slot name="trailing" />
    </span>
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    type?: 'button' | 'submit';
    block?: boolean;
    disabled?: boolean;
    loading?: boolean;
  }>(),
  { variant: 'primary', size: 'md', type: 'button', block: false, disabled: false, loading: false },
);
</script>

<style scoped>
.base-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-weight: var(--weight-semibold);
  font-size: var(--text-base);
  line-height: 1;
  cursor: pointer;
  white-space: nowrap;
  padding-inline: var(--space-4);
  transition: background-color var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard),
    transform var(--duration-fast) var(--ease-standard);
}
.base-btn:active { transform: scale(0.98); }
.base-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.size-sm { min-height: var(--control-h-sm); font-size: var(--text-sm); }
.size-md { min-height: var(--control-h-md); }
.size-lg { min-height: var(--control-h-lg); font-size: var(--text-lg); }
.size-xl { min-height: var(--control-h-xl); font-size: var(--text-xl); }
.is-block { width: 100%; }

.variant-primary { background: var(--color-accent-strong); color: var(--color-accent-contrast); }
.variant-secondary { background: transparent; color: var(--color-card-text); border-color: var(--color-hairline); }
.variant-ghost { background: transparent; color: var(--color-card-text); }
.variant-danger { background: var(--color-danger-bg); color: var(--color-danger-fg); border-color: var(--color-danger-line); }
.variant-success { background: var(--color-success-fg); color: var(--color-accent-contrast); }

@media (hover: hover) {
  .variant-primary:not(:disabled):hover { background: var(--color-accent); }
  .variant-secondary:not(:disabled):hover { background: var(--color-accent-quiet); }
  .variant-ghost:not(:disabled):hover { background: var(--color-accent-quiet); }
}

.btn-content { display: inline-flex; align-items: center; gap: var(--space-2); }
.btn-content.is-hidden { visibility: hidden; }

.btn-spinner {
  position: absolute;
  width: 1.1em;
  height: 1.1em;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: var(--radius-full);
  animation: btn-spin 0.7s linear infinite;
}
@keyframes btn-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .btn-spinner { animation-duration: 1.4s; }
}
</style>
