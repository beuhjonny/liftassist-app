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
        <!-- 1. Primary High-Res GIF (If Available & Loading Successfully) -->
        <div v-if="demoInfo.primaryGifUrl && !primaryGifError" class="motion-player">
          <div v-if="!primaryGifLoaded" class="media-loading">
            <span class="media-spinner" aria-hidden="true"></span>
            <span class="media-loading-label">Loading demonstration...</span>
          </div>
          <img
            :src="demoInfo.primaryGifUrl"
            :alt="demoInfo.name + ' animation'"
            class="demo-gif"
            :class="{ 'is-loading': !primaryGifLoaded }"
            @load="primaryGifLoaded = true"
            @error="primaryGifError = true"
          />
        </div>

        <!-- 2. Bundled Keyframe Motion Loop Player (Fallback) -->
        <div v-else-if="demoInfo.frames && demoInfo.frames.length > 0 && !imageError" class="motion-player">
          <img 
            :src="currentFrameUrl" 
            :alt="demoInfo.name + ' motion frame'" 
            class="demo-gif"
            @error="handleImageError"
          />
          <div class="motion-indicator">
            <span class="pulse-dot"></span>
            <span class="motion-label">Form Motion Loop</span>
          </div>
        </div>

        <!-- 3. Clean Unknown Exercise Fallback -->
        <div v-else class="unknown-exercise-card card-inset">
          <p class="unknown-title">No matching exercise demo found</p>
          <p class="unknown-subtitle">
            Form cues and demonstrations are available for standard strength training lifts.
          </p>
        </div>
      </div>

      <!-- Target Muscles -->
      <div v-if="demoInfo.targetMuscles.length > 0" class="target-muscles-section">
        <h4>Target Muscles</h4>
        <div class="muscle-tags">
          <span v-for="muscle in demoInfo.targetMuscles" :key="muscle" class="muscle-tag">
            {{ muscle }}
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
        Got it
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import { getExerciseDemo, type ExerciseDemoInfo } from '@/utils/exerciseDemos';

const props = defineProps<{
  show: boolean;
  exerciseName: string;
}>();

defineEmits<{
  (e: 'close'): void;
}>();

const primaryGifError = ref(false);
const primaryGifLoaded = ref(false);
const imageError = ref(false);
const activeFrameIdx = ref(0);
let animationTimer: ReturnType<typeof setInterval> | null = null;

const demoInfo = computed<ExerciseDemoInfo>(() => {
  return getExerciseDemo(props.exerciseName);
});

const currentFrameUrl = computed(() => {
  if (!demoInfo.value.frames || demoInfo.value.frames.length === 0) return '';
  return demoInfo.value.frames[activeFrameIdx.value % demoInfo.value.frames.length];
});

function startAnimationLoop() {
  stopAnimationLoop();
  primaryGifError.value = false;
  primaryGifLoaded.value = false;
  imageError.value = false;
  activeFrameIdx.value = 0;

  if (demoInfo.value.frames && demoInfo.value.frames.length > 1) {
    animationTimer = setInterval(() => {
      activeFrameIdx.value = (activeFrameIdx.value + 1) % demoInfo.value.frames!.length;
    }, 1000);
  }
}

function stopAnimationLoop() {
  if (animationTimer) {
    clearInterval(animationTimer);
    animationTimer = null;
  }
}

function handleImageError() {
  if (activeFrameIdx.value > 0) {
    stopAnimationLoop();
    activeFrameIdx.value = 0;
  } else {
    imageError.value = true;
  }
}

watch(() => props.show, (newShow) => {
  if (newShow) {
    startAnimationLoop();
  } else {
    stopAnimationLoop();
  }
}, { immediate: true });

watch(() => props.exerciseName, () => {
  if (props.show) {
    startAnimationLoop();
  }
});

onUnmounted(() => {
  stopAnimationLoop();
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
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
  text-transform: uppercase;
  background-color: var(--color-accent-quiet);
  color: var(--color-accent-line);
  letter-spacing: var(--tracking-wide);
}

.demo-media-container {
  display: flex;
  justify-content: center;
  align-items: center;
  /* Deliberately white in every theme: the demo GIFs are drawn on white and
     recoloring them is not possible. The hairline + radius frame it as a
     deliberate media panel rather than a theme leak. */
  background-color: #ffffff;
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: 16px;
  min-height: 240px;
  border: 1px solid var(--color-hairline);
  box-shadow: var(--shadow-1);
  position: relative;
}

.motion-player {
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.demo-gif {
  width: 100%;
  max-height: 280px;
  object-fit: contain;
  border-radius: 8px;
  background-color: #ffffff;
  transition: opacity var(--duration-base) var(--ease-out);
}
.demo-gif.is-loading { opacity: 0; height: 240px; }
.media-loading {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-3);
  color: #6b7280;
}
.media-spinner {
  width: 28px; height: 28px; border-radius: 50%;
  border: 3px solid rgba(0,0,0,0.1); border-top-color: var(--color-accent);
  animation: media-spin 0.8s linear infinite;
}
.media-loading-label { font-size: var(--text-sm); font-weight: var(--weight-medium); }
@keyframes media-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .media-spinner { animation-duration: 2s; } }

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
  background-color: var(--color-accent-line);
  box-shadow: 0 0 8px var(--color-accent-line);
  animation: pulseDot 1.2s infinite ease-in-out;
}
@media (prefers-reduced-motion: reduce) {
  .pulse-dot { animation: none; }
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
</style>
