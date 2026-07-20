<template>
  <div v-if="show" class="modal-overlay draft-prompt-overlay" @click.self="$emit('discard')">
    <div class="modal-content draft-prompt-card card">
      <div class="draft-icon">🏋️‍♂️</div>
      <h2>Resume Workout?</h2>
      <p class="draft-description">You have an unfinished workout session in progress.</p>
      
      <div v-if="isLoading" class="loading-state">
        <p>Loading draft session...</p>
      </div>
      
      <div v-else class="draft-prompt-actions">
        <button @click="$emit('resume')" class="button-primary full-width">
          ▶️ Resume Workout
        </button>
        <button @click="$emit('discard')" class="button-secondary full-width">
          🗑️ Discard & Start Fresh
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean;
  isLoading?: boolean;
}>();

defineEmits<{
  (e: 'resume'): void;
  (e: 'discard'): void;
}>();
</script>

<style scoped>
.draft-prompt-overlay {
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(6px);
}

.draft-prompt-card {
  max-width: 420px;
  width: 90%;
  padding: 28px 24px;
  text-align: center;
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
}

.draft-icon {
  font-size: 2.6em;
  margin-bottom: 12px;
}

.draft-prompt-card h2 {
  font-size: 1.45em;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: var(--color-card-heading);
}

.draft-description {
  font-size: 0.92em;
  color: var(--color-card-text);
  opacity: 0.85;
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.loading-state {
  padding: 16px;
  color: var(--color-card-text);
  opacity: 0.8;
}

.draft-prompt-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.full-width {
  width: 100%;
  padding: 12px;
  font-size: 0.95em;
  font-weight: 600;
}
</style>
