<template>
  <div class="base-empty" role="status">
    <div v-if="$slots.icon" class="empty-icon"><slot name="icon" /></div>
    <h3 class="empty-title">{{ title }}</h3>
    <p v-if="body" class="empty-body">{{ body }}</p>
    <div v-if="$slots.action" class="empty-action"><slot name="action" /></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; body?: string }>();
</script>

<style scoped>
.base-empty {
  display: flex; flex-direction: column; align-items: center; text-align: center;
  gap: var(--space-3); max-width: 320px; margin-inline: auto; padding: var(--space-6) var(--space-4);
}
.empty-icon { color: var(--color-text); opacity: 0.4; }
.empty-title { font-size: var(--text-lg); font-weight: var(--weight-bold); color: var(--color-heading); margin: 0; }
.empty-body { font-size: var(--text-sm); color: var(--color-text); opacity: 0.8; line-height: var(--leading-normal); margin: 0; }
.empty-action { margin-top: var(--space-2); }
</style>
