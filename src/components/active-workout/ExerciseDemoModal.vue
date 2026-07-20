<template>
  <div v-if="show" class="modal-overlay exercise-demo-modal-overlay" @click.self="$emit('close')">
    <div class="modal-content exercise-demo-modal card">
      <button @click="$emit('close')" class="modal-close-button" title="Close">&times;</button>
      
      <div class="demo-header">
        <span class="category-badge">{{ demoInfo.category }}</span>
        <h2>{{ exerciseName || demoInfo.name }}</h2>
      </div>

      <!-- Real Bundled Exercise Image Media Player -->
      <div v-if="demoInfo.localImgUrl && !imageError" class="demo-media-container card-inset">
        <img 
          :src="demoInfo.localImgUrl" 
          :alt="demoInfo.name + ' demonstration'" 
          class="demo-gif"
          @error="imageError = true"
        />
      </div>

      <!-- Clean Unknown Exercise Notice -->
      <div v-else class="unknown-exercise-card card-inset">
        <p class="unknown-title">No matching exercise demo video found</p>
        <p class="unknown-subtitle">
          Form cues and demonstrations are available for standard strength training lifts.
        </p>
      </div>

      <!-- Target Muscles -->
      <div v-if="demoInfo.targetMuscles.length > 0" class="target-muscles-section">
        <h4>Target Muscles</h4>
        <div class="muscle-tags">
          <span v-for="muscle in demoInfo.targetMuscles" :key="muscle" class="muscle-tag">
            💪 {{ muscle }}
          </span>
        </div>
      </div>

      <!-- Key Form Cues -->
      <div v-if="demoInfo.formCues.length > 0" class="form-cues-section card-inset">
        <h4>Key Form Cues</h4>
        <ul class="form-cues-list">
          <li v-for="(cue, idx) in demoInfo.formCues" :key="idx">
            {{ cue }}
          </li>
        </ul>
      </div>

      <button @click="$emit('close')" class="button-primary full-width" style="margin-top: 15px;">
        Got it! Return to Workout
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { getExerciseDemo, type ExerciseDemoInfo } from '@/utils/exerciseDemos';

const props = defineProps<{
  show: boolean;
  exerciseName: string;
}>();

defineEmits<{
  (e: 'close'): void;
}>();

const imageError = ref(false);

const demoInfo = computed<ExerciseDemoInfo>(() => {
  return getExerciseDemo(props.exerciseName);
});

watch(() => props.show, (newShow) => {
  if (newShow) {
    imageError.value = false;
  }
}, { immediate: true });
</script>

<style scoped>
.exercise-demo-modal-overlay {
  z-index: 1100;
}

.exercise-demo-modal {
  max-width: 500px;
  width: 92%;
  padding: 24px;
  max-height: 90vh;
  overflow-y: auto;
  text-align: left;
  position: relative;
  border-radius: 16px;
}

.demo-header {
  margin-bottom: 16px;
}

.demo-header h2 {
  font-size: 1.5em;
  font-weight: 700;
  margin: 6px 0 0 0;
  color: var(--color-card-heading);
}

.category-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.75em;
  font-weight: 700;
  text-transform: uppercase;
  background-color: var(--color-primary-mute, #007bff22);
  color: #007bff;
  letter-spacing: 0.5px;
}

.demo-media-container {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
  min-height: 240px;
  border: 1px solid var(--color-card-border);
}

.demo-gif {
  width: 100%;
  max-height: 280px;
  object-fit: contain;
  border-radius: 8px;
  background-color: #ffffff;
}

/* Unknown exercise card */
.unknown-exercise-card {
  padding: 20px;
  text-align: center;
  border-radius: 12px;
  margin-bottom: 16px;
}

.unknown-title {
  font-size: 1em;
  font-weight: 700;
  margin: 0 0 6px 0;
  color: var(--color-card-heading);
}

.unknown-subtitle {
  font-size: 0.85em;
  color: var(--color-card-text);
  opacity: 0.8;
  margin: 0;
  line-height: 1.5;
}

.target-muscles-section {
  margin-bottom: 16px;
}

.target-muscles-section h4,
.form-cues-section h4 {
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-card-text);
  opacity: 0.7;
  margin: 0 0 8px 0;
}

.muscle-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.muscle-tag {
  background-color: var(--color-card-mute);
  border: 1px solid var(--color-card-border);
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 0.82em;
  font-weight: 500;
}

.form-cues-section {
  padding: 14px 16px;
  border-radius: 10px;
  margin-bottom: 15px;
}

.form-cues-list {
  padding-left: 18px;
  margin: 0;
  font-size: 0.9em;
  line-height: 1.6;
}

.form-cues-list li {
  margin-bottom: 6px;
}
</style>
