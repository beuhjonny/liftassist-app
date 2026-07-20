<template>
  <div v-if="show" class="modal-overlay exercise-demo-modal-overlay" @click.self="$emit('close')">
    <div class="modal-content exercise-demo-modal card">
      <button @click="$emit('close')" class="modal-close-button" title="Close">&times;</button>
      
      <div class="demo-header">
        <span class="category-badge">{{ demoInfo.category }}</span>
        <h2>{{ exerciseName || demoInfo.name }}</h2>
      </div>

      <!-- Source Switcher Tabs -->
      <div class="provider-tabs">
        <button 
          :class="{ active: activeProvider === 'exercisedb' }" 
          @click="activeProvider = 'exercisedb'"
          class="provider-tab-btn"
        >
          🏋️‍♂️ ExerciseDB (3D GIF)
        </button>
        <button 
          :class="{ active: activeProvider === 'fitgif' }" 
          @click="activeProvider = 'fitgif'"
          class="provider-tab-btn"
        >
          ⚡ FitGif API
        </button>
        <button 
          :class="{ active: activeProvider === 'youtube' }" 
          @click="activeProvider = 'youtube'"
          class="provider-tab-btn"
        >
          📺 YouTube Short
        </button>
      </div>

      <!-- Movement Loop Media Container -->
      <div class="demo-media-container card-inset">
        <!-- 1. ExerciseDB CloudFront 3D Animated GIF -->
        <img 
          v-if="activeProvider === 'exercisedb' && demoInfo.exerciseDbGifUrl"
          :src="demoInfo.exerciseDbGifUrl" 
          :alt="demoInfo.name + ' demonstration'" 
          class="demo-gif"
        />

        <!-- 2. FitGif API Looping GIF -->
        <img 
          v-else-if="activeProvider === 'fitgif' && demoInfo.fitGifUrl"
          :src="demoInfo.fitGifUrl" 
          :alt="demoInfo.name + ' demonstration'" 
          class="demo-gif"
        />

        <!-- 3. Clean Embedded YouTube Short -->
        <iframe 
          v-else-if="activeProvider === 'youtube' && demoInfo.youtubeEmbedUrl"
          :src="demoInfo.youtubeEmbedUrl" 
          title="Exercise Form Video"
          class="demo-youtube-iframe"
          frameborder="0" 
          allow="autoplay; encrypted-media; picture-in-picture" 
          allowfullscreen
        ></iframe>

        <!-- Fallback if no media -->
        <div v-else class="no-media-fallback">
          <p>No video clip available for {{ exerciseName }}</p>
        </div>
      </div>

      <!-- Target Muscles -->
      <div class="target-muscles-section">
        <h4>Target Muscles</h4>
        <div class="muscle-tags">
          <span v-for="muscle in demoInfo.targetMuscles" :key="muscle" class="muscle-tag">
            💪 {{ muscle }}
          </span>
        </div>
      </div>

      <!-- Key Form Cues -->
      <div class="form-cues-section card-inset">
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
import { ref, computed } from 'vue';
import { getExerciseDemo, type ExerciseDemoInfo } from '@/utils/exerciseDemos';

const props = defineProps<{
  show: boolean;
  exerciseName: string;
}>();

defineEmits<{
  (e: 'close'): void;
}>();

const activeProvider = ref<'exercisedb' | 'fitgif' | 'youtube'>('exercisedb');

const demoInfo = computed<ExerciseDemoInfo>(() => {
  return getExerciseDemo(props.exerciseName);
});
</script>

<style scoped>
.exercise-demo-modal-overlay {
  z-index: 1100;
}

.exercise-demo-modal {
  max-width: 540px;
  width: 94%;
  padding: 24px;
  max-height: 90vh;
  overflow-y: auto;
  text-align: left;
  position: relative;
  border-radius: 16px;
}

.demo-header {
  margin-bottom: 12px;
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

.provider-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}

.provider-tab-btn {
  flex: 1;
  padding: 6px 8px;
  font-size: 0.78em;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid var(--color-card-border);
  background: var(--color-card-mute);
  color: var(--color-card-text);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.provider-tab-btn.active {
  background-color: #007bff;
  color: #ffffff;
  border-color: #007bff;
}

.demo-media-container {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #000000;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
  min-height: 250px;
  width: 100%;
}

.demo-gif {
  width: 100%;
  max-height: 280px;
  object-fit: contain;
  border-radius: 8px;
  background-color: #ffffff;
}

.demo-youtube-iframe {
  width: 100%;
  height: 260px;
  border-radius: 8px;
  border: none;
}

.no-media-fallback {
  padding: 40px;
  text-align: center;
  color: #aaa;
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
