<template>
  <div v-if="show" class="modal-overlay exercise-demo-modal-overlay" @click.self="$emit('close')">
    <div class="modal-content exercise-demo-modal card">
      <button @click="$emit('close')" class="modal-close-button" title="Close">&times;</button>
      
      <div class="demo-header">
        <span class="category-badge">{{ demoInfo.category }}</span>
        <h2>{{ exerciseName || demoInfo.name }}</h2>
      </div>

      <!-- Demo Media Container -->
      <div class="demo-media-container card-inset">
        <!-- 1. Dedicated YouTube HD Form Motion Player (When YouTube ID available) -->
        <div v-if="demoInfo.youtubeId" class="motion-player video-aspect">
          <iframe 
            :src="`https://www.youtube-nocookie.com/embed/${demoInfo.youtubeId}?autoplay=1&mute=1&loop=1&playlist=${demoInfo.youtubeId}&controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&playsinline=1`"
            title="Form Demonstration Video"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            class="demo-iframe"
          ></iframe>
        </div>

        <!-- 2. Clean Custom Exercise Form Cues Card + YouTube Search Fallback -->
        <div v-else class="unknown-exercise-card card-inset">
          <p class="unknown-title">Custom Exercise Form Guide</p>
          <p class="unknown-subtitle">
            Follow the key form cues below or search Unbroken Fitness Solutions for video demonstrations.
          </p>
          <a 
            :href="`https://www.youtube.com/results?search_query=${encodeURIComponent((exerciseName || demoInfo.name) + ' Unbroken Fitness Solutions')}`" 
            target="_blank" 
            rel="noopener noreferrer"
            class="button-secondary small-yt-btn"
            style="margin-top: 12px; display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; font-size: 0.85em; font-weight: 600; text-decoration: none;"
          >
            <span>▶️</span> Search Unbroken Fitness Solutions for "{{ exerciseName || demoInfo.name }}"
          </a>
        </div>
      </div>

      <!-- Direct Search Fallback Button -->
      <div style="text-align: right; margin-top: 6px; padding-right: 4px;">
        <a 
          :href="`https://www.youtube.com/results?search_query=${encodeURIComponent((exerciseName || demoInfo.name) + ' Unbroken Fitness Solutions form')}`" 
          target="_blank" 
          rel="noopener noreferrer" 
          style="font-size: 0.78em; color: var(--color-card-text); opacity: 0.75; text-decoration: underline;"
        >
          Wrong video? Search YouTube for yourself ▶️
        </a>
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
import { computed } from 'vue';
import { getExerciseDemo, type ExerciseDemoInfo } from '@/utils/exerciseDemos';

const props = defineProps<{
  show: boolean;
  exerciseName: string;
}>();

defineEmits<{
  (e: 'close'): void;
}>();

const demoInfo = computed<ExerciseDemoInfo>(() => {
  return getExerciseDemo(props.exerciseName);
});
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
  position: relative;
}

.motion-player {
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.video-aspect {
  width: 100%;
  aspect-ratio: 16 / 9;
  position: relative;
}

.demo-iframe {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  border: none;
  pointer-events: none; /* Strips YouTube popovers, watermark links, and title card overlays */
}

.demo-gif {
  width: 100%;
  max-height: 280px;
  object-fit: contain;
  border-radius: 8px;
  background-color: #ffffff;
  transition: opacity 0.2s ease-in-out;
}

.motion-indicator {
  position: absolute;
  bottom: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: #ffffff;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75em;
  display: flex;
  align-items: center;
  gap: 6px;
  backdrop-filter: blur(4px);
}

.pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #007bff;
  box-shadow: 0 0 8px #007bff;
  animation: pulseDot 1.2s infinite ease-in-out;
}

@keyframes pulseDot {
  0% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
  100% { opacity: 0.3; transform: scale(0.8); }
}

.motion-label {
  font-weight: 600;
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

.button-primary {
  background: var(--color-primary, #007bff);
  color: #ffffff;
  border: none;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.button-primary:hover {
  background: var(--color-primary-hover, #0056b3);
  transform: translateY(-1px);
}

.full-width {
  width: 100%;
  display: block;
}
</style>
