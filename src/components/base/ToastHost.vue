<template>
  <Teleport to="body">
    <div class="toast-host" aria-live="polite">
      <TransitionGroup name="toast">
        <div v-for="t in toasts" :key="t.id" class="toast" :class="`tone-${t.tone}`" :role="t.tone === 'danger' ? 'alert' : 'status'">
          <component :is="iconFor(t.tone)" :size="20" class="toast-icon" aria-hidden="true" />
          <span class="toast-msg">{{ t.message }}</span>
          <button type="button" class="toast-close" aria-label="Dismiss" @click="dismiss(t.id)"><X :size="16" /></button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-vue-next';
import { useToast, type ToastTone } from '../../composables/useToast';

const { toasts, dismiss } = useToast();
const iconFor = (tone: ToastTone) =>
  ({ success: CheckCircle2, danger: AlertCircle, warning: AlertTriangle, neutral: Info })[tone];
</script>

<style scoped>
.toast-host {
  position: fixed; left: 50%; transform: translateX(-50%);
  bottom: calc(var(--space-6) + var(--safe-bottom)); z-index: var(--z-toast);
  display: flex; flex-direction: column-reverse; gap: var(--space-2);
  width: min(92vw, 420px); pointer-events: none;
}
.toast {
  pointer-events: auto; display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3) var(--space-4); border-radius: var(--radius-md);
  background: var(--surface-raised); border: 1px solid var(--color-hairline);
  box-shadow: var(--shadow-2); border-left: 3px solid var(--color-card-border);
  font-size: var(--text-sm); color: var(--color-card-text);
}
.toast-msg { flex: 1; }
.toast-icon { flex-shrink: 0; }
.toast-close { display: inline-flex; align-items: center; justify-content: center; min-width: var(--tap-min); min-height: var(--tap-min); margin: calc(-1 * var(--space-2)) calc(-1 * var(--space-2)) calc(-1 * var(--space-2)) 0; background: none; border: none; color: inherit; opacity: 0.6; cursor: pointer; }
.tone-success { border-left-color: var(--color-success-fg); }
.tone-success .toast-icon { color: var(--color-success-fg); }
.tone-danger { border-left-color: var(--color-danger-fg); }
.tone-danger .toast-icon { color: var(--color-danger-fg); }
.tone-warning { border-left-color: var(--color-warning-fg); }
.tone-warning .toast-icon { color: var(--color-warning-fg); }
.tone-neutral .toast-icon { color: var(--color-accent-line); }
.toast-enter-active { transition: opacity var(--duration-base) var(--ease-out), transform var(--duration-base) var(--ease-out); }
.toast-leave-active { transition: opacity var(--duration-fast) var(--ease-in), transform var(--duration-fast) var(--ease-in); position: absolute; }
.toast-enter-from { opacity: 0; transform: translateY(12px); }
.toast-leave-to { opacity: 0; transform: translateY(8px); }
</style>
