<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal-scrim" @click.self="$emit('close')">
        <div ref="panel" class="modal-panel" role="dialog" aria-modal="true" :aria-label="title" @keydown.esc="$emit('close')">
          <div v-if="title || $slots.header" class="modal-head">
            <h2 class="modal-title">{{ title }}<slot name="header" /></h2>
            <button type="button" class="modal-close" aria-label="Close" @click="$emit('close')"><X :size="20" /></button>
          </div>
          <div class="modal-body"><slot /></div>
          <div v-if="$slots.footer" class="modal-foot"><slot name="footer" /></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { X } from 'lucide-vue-next';

const props = defineProps<{ open: boolean; title?: string }>();
defineEmits<{ (e: 'close'): void }>();
const panel = ref<HTMLElement | null>(null);

watch(() => props.open, async (o) => {
  if (o) {
    await nextTick();
    panel.value?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]')?.focus();
  }
});
</script>

<style scoped>
.modal-scrim {
  position: fixed; inset: 0; z-index: var(--z-modal);
  background: var(--color-scrim); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: var(--space-4);
}
.modal-panel {
  background: var(--surface-overlay); color: var(--color-card-text);
  border: 1px solid var(--color-hairline); border-radius: var(--radius-lg);
  padding: var(--space-5); width: 100%; max-width: 480px; max-height: 90dvh; overflow-y: auto;
  box-shadow: var(--shadow-3);
}
.modal-head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-4); }
.modal-title { font-family: var(--font-display); font-size: var(--text-lg); font-weight: var(--weight-bold); color: var(--color-card-heading); margin: 0; }
.modal-close { min-width: var(--tap-min); min-height: var(--tap-min); display: inline-flex; align-items: center; justify-content: center; background: none; border: none; color: var(--color-card-text); opacity: 0.7; cursor: pointer; border-radius: var(--radius-full); }
.modal-foot { display: flex; justify-content: flex-end; gap: var(--space-2); margin-top: var(--space-5); }
.modal-enter-active, .modal-leave-active { transition: opacity var(--duration-base) var(--ease-out); }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .modal-panel { transition: transform var(--duration-base) var(--ease-out); }
.modal-enter-from .modal-panel { transform: scale(0.96); }
</style>
