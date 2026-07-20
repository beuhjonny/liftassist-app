<template>
  <div v-if="show" class="modal-overlay exercise-demo-modal-overlay" @click.self="$emit('close')">
    <div class="modal-content exercise-demo-modal card">
      <button @click="$emit('close')" class="modal-close-button" title="Close">&times;</button>
      
      <div class="demo-header">
        <span class="category-badge">{{ demoInfo.category }}</span>
        <h2>{{ exerciseName || demoInfo.name }}</h2>
      </div>

      <!-- Movement Loop Media Container -->
      <div class="demo-media-container card-inset">
        <!-- 1. Wikimedia / High-Res GIF (If loaded successfully) -->
        <img 
          v-if="hasExternalGif && !imageError"
          :src="demoInfo.gifUrl" 
          :alt="demoInfo.name + ' demonstration'" 
          class="demo-gif"
          @error="imageError = true"
        />

        <!-- 2. Bulletproof Interactive SVG Biomechanical Lifter (Zero Network Failure) -->
        <div v-else class="vector-demo-viewer">
          <div class="vector-stage">
            <svg viewBox="0 0 300 180" class="biomechanic-svg">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.05)" stroke-width="1"/>
                </pattern>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <rect width="100%" height="100%" fill="url(#grid)" />

              <!-- Bench / Ground Line -->
              <line x1="40" y1="140" x2="260" y2="140" stroke="#444" stroke-width="4" stroke-linecap="round"/>

              <!-- Bar Path Motion Guide -->
              <path d="M 150 45 L 150 115" stroke="rgba(0, 123, 255, 0.3)" stroke-width="2" stroke-dasharray="4 4" />

              <!-- Animated Moving Weight / Lifter -->
              <g class="animated-weight-group">
                <!-- Barbell Bar -->
                <line x1="80" y1="60" x2="220" y2="60" stroke="#e0e0e0" stroke-width="6" stroke-linecap="round" />
                <!-- Weight Plates -->
                <rect x="70" y="42" width="12" height="36" rx="3" fill="#007bff" filter="url(#glow)" />
                <rect x="218" y="42" width="12" height="36" rx="3" fill="#007bff" filter="url(#glow)" />
              </g>

              <!-- Target Muscle Pulse Ring -->
              <circle cx="150" cy="95" r="18" fill="rgba(0, 123, 255, 0.15)" stroke="#007bff" stroke-width="2" class="pulse-ring" />
              <text x="150" y="99" text-anchor="middle" fill="#fff" font-size="10" font-weight="bold">TARGET</text>
            </svg>
          </div>
          <div class="vector-caption">
            <span class="motion-indicator">⚡ Biomechanical Motion Guide</span>
            <span class="tempo-tag">Tempo: 2s Down | 1s Hold | Explosive Up</span>
          </div>
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

const hasExternalGif = computed(() => {
  return Boolean(demoInfo.value.gifUrl && demoInfo.value.gifUrl.endsWith('.gif'));
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
  background-color: #121316;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
  min-height: 220px;
  position: relative;
  border: 1px solid var(--color-card-border);
}

.demo-gif {
  width: 100%;
  max-height: 260px;
  object-fit: contain;
  border-radius: 8px;
}

/* Vector Motion Viewer */
.vector-demo-viewer {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
}

.vector-stage {
  width: 100%;
  max-width: 340px;
}

.biomechanic-svg {
  width: 100%;
  height: 150px;
}

.animated-weight-group {
  animation: barMotion 2.4s infinite ease-in-out;
  transform-origin: center;
}

@keyframes barMotion {
  0% { transform: translateY(0px); }
  50% { transform: translateY(50px); }
  100% { transform: translateY(0px); }
}

.pulse-ring {
  animation: pulseGlow 1.8s infinite ease-in-out;
}

@keyframes pulseGlow {
  0% { r: 16px; opacity: 0.4; }
  50% { r: 24px; opacity: 0.9; }
  100% { r: 16px; opacity: 0.4; }
}

.vector-caption {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
}

.motion-indicator {
  font-size: 0.85em;
  font-weight: 700;
  color: #007bff;
}

.tempo-tag {
  font-size: 0.78em;
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
