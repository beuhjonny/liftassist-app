<template>
  <div v-if="show" class="draft-prompt-overlay">
    <div class="draft-prompt-card card">
      <h2>Resume Workout?</h2>
      <p>You have an unfinished workout in progress.</p>
      <p v-if="isLoading">Loading draft...</p>
      <div v-else class="draft-prompt-actions">
        <button @click="$emit('resume')" class="button-primary">Resume Workout</button>
        <button @click="$emit('discard')" class="button-secondary">Start Fresh</button>
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
