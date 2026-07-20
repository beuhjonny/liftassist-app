<template>
  <div v-if="show" class="modal-overlay exercise-demo-modal-overlay" @click.self="$emit('close')">
    <div class="modal-content exercise-demo-modal card">
      <button @click="$emit('close')" class="modal-close-button" title="Close">&times;</button>
      
      <div class="demo-header">
        <span class="category-badge">{{ demoInfo.category }}</span>
        <h2>{{ exerciseName || demoInfo.name }}</h2>
      </div>

      <!-- Movement Loop Media -->
      <div class="demo-media-container card-inset">
        <img 
          v-if="!showFallbackGraphic"
          :src="currentImageSrc" 
          :alt="demoInfo.name + ' demonstration'" 
          class="demo-gif"
          @error="handleImageError"
        />
        <div v-else class="demo-fallback-graphic">
          <span class="workout-icon">🏋️‍♂️</span>
          <p class="fallback-title">{{ exerciseName }}</p>
          <span class="fallback-subtitle">Proper Form Demonstration</span>
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { getExerciseDemo, type ExerciseDemoInfo } from '@/utils/exerciseDemos';

const props = defineProps<{
  show: boolean;
  exerciseName: string;
}>();

defineEmits<{
  (e: 'close'): void;
}>();

const currentFrame = ref(0);
const useFallbackCdn = ref(false);
const showFallbackGraphic = ref(false);
let frameTimer: any = null;

const demoInfo = computed<ExerciseDemoInfo>(() => {
  return getExerciseDemo(props.exerciseName);
});

const currentImageSrc = computed(() => {
  const base = useFallbackCdn.value ? demoInfo.value.fallbackUrl : demoInfo.value.gifUrl;
  const baseUrl = base.replace(/\/0\.jpg$/, '');
  return `${baseUrl}/${currentFrame.value}.jpg`;
});

const handleImageError = () => {
  if (!useFallbackCdn.value) {
    // Retry with GitHub raw CDN
    useFallbackCdn.value = true;
    currentFrame.value = 0;
  } else {
    // Primary and secondary CDNs both failed
    showFallbackGraphic.value = true;
  }
};

const startAnimation = () => {
  stopAnimation();
  frameTimer = setInterval(() => {
    currentFrame.value = currentFrame.value === 0 ? 1 : 0;
  }, 1000);
};

const stopAnimation = () => {
  if (frameTimer) {
    clearInterval(frameTimer);
    frameTimer = null;
  }
};

watch(() => props.show, (newShow) => {
  if (newShow) {
    useFallbackCdn.value = false;
    showFallbackGraphic.value = false;
    currentFrame.value = 0;
    startAnimation();
  } else {
    stopAnimation();
  }
}, { immediate: true });

onMounted(() => {
  if (props.show) startAnimation();
});

onUnmounted(() => {
  stopAnimation();
});
</script>

<style scoped>
.exercise-demo-modal-overlay {
  z-index: 1100;
}

.exercise-demo-modal {
  max-width: 500px;
  width: 90%;
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
  background-color: #1a1a1a;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
  min-height: 240px;
  padding: 10px;
}

.demo-gif {
  width: 100%;
  max-height: 260px;
  object-fit: contain;
  border-radius: 8px;
  transition: opacity 0.2s ease;
}

.demo-fallback-graphic {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
  text-align: center;
}

.workout-icon {
  font-size: 3em;
  margin-bottom: 8px;
  animation: pulse 2s infinite ease-in-out;
}

.fallback-title {
  font-size: 1.1em;
  font-weight: 700;
  color: white;
  margin: 4px 0;
}

.fallback-subtitle {
  font-size: 0.82em;
  color: #aaa;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
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
