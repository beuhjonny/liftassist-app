<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="open" class="sheet-scrim" @click.self="$emit('close')">
        <div class="sheet-panel" role="dialog" aria-modal="true" :aria-label="title">
          <div class="sheet-grabber" aria-hidden="true"></div>
          <h2 v-if="title" class="sheet-title">{{ title }}</h2>
          <div class="sheet-body"><slot /></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{ open: boolean; title?: string }>();
defineEmits<{ (e: 'close'): void }>();
</script>

<style scoped>
.sheet-scrim { position: fixed; inset: 0; z-index: var(--z-sheet); background: var(--color-scrim); display: flex; align-items: flex-end; justify-content: center; }
.sheet-panel {
  background: var(--surface-overlay); color: var(--color-card-text);
  border-top-left-radius: var(--radius-lg); border-top-right-radius: var(--radius-lg);
  padding: var(--space-5); padding-bottom: var(--space-safe-bottom);
  width: 100%; max-width: 640px; max-height: 90dvh; overflow-y: auto; box-shadow: var(--shadow-3);
}
.sheet-grabber { width: 36px; height: 4px; border-radius: var(--radius-full); background: var(--color-hairline); margin: 0 auto var(--space-4); }
.sheet-title { font-family: var(--font-display); font-size: var(--text-lg); font-weight: var(--weight-bold); color: var(--color-card-heading); margin: 0 0 var(--space-4); }
.sheet-enter-active, .sheet-leave-active { transition: opacity var(--duration-base) var(--ease-out); }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-active .sheet-panel, .sheet-leave-active .sheet-panel { transition: transform var(--duration-slow) var(--ease-out); }
.sheet-enter-from .sheet-panel, .sheet-leave-to .sheet-panel { transform: translateY(100%); }
</style>
