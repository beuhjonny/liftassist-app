<template>
  <div class="base-banner" :class="`tone-${tone}`" :role="tone === 'danger' ? 'alert' : 'status'">
    <span v-if="$slots.icon" class="banner-icon"><slot name="icon" /></span>
    <span class="banner-body"><slot /></span>
    <button v-if="dismissible" type="button" class="banner-close" aria-label="Dismiss" @click="$emit('dismiss')">
      <X :size="18" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next';
withDefaults(
  defineProps<{ tone?: 'info' | 'warning' | 'danger' | 'success'; dismissible?: boolean }>(),
  { tone: 'info', dismissible: false },
);
defineEmits<{ (e: 'dismiss'): void }>();
</script>

<style scoped>
.base-banner {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3) var(--space-4); border-radius: var(--radius-md);
  border: 1px solid transparent; font-size: var(--text-sm);
}
.banner-body { flex: 1; }
.banner-icon { display: inline-flex; }
.banner-close { display: inline-flex; align-items: center; justify-content: center; min-width: var(--tap-min); min-height: var(--tap-min); background: none; border: none; color: inherit; cursor: pointer; opacity: 0.8; }
.tone-info { background: var(--color-accent-quiet); color: var(--color-accent-line); border-color: transparent; }
.tone-warning { background: var(--color-warning-bg); color: var(--color-warning-fg); border-color: var(--color-warning-line); }
.tone-danger { background: var(--color-danger-bg); color: var(--color-danger-fg); border-color: var(--color-danger-line); }
.tone-success { background: var(--color-success-bg); color: var(--color-success-fg); border-color: var(--color-success-line); }
</style>
