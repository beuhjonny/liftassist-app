<template>
  <div v-if="show" class="modal-overlay exercise-demo-modal-overlay" @click.self="$emit('close')">
    <div class="modal-content exercise-demo-modal card">
      <button @click="$emit('close')" class="modal-close-button" title="Close">&times;</button>
      
      <div class="demo-header">
        <span class="category-badge">{{ demoInfo.category }}</span>
        <h2>{{ exerciseName || demoInfo.name }}</h2>
      </div>

      <!-- Unrecognized / Nonsense Exercise State -->
      <div v-if="demoInfo.isUnknown" class="unknown-exercise-card card-inset">
        <div class="unknown-icon">🔍</div>
        <h3 class="unknown-title">No matching exercise demo found</h3>
        <p class="unknown-subtitle">
          Demonstration videos and form cues are available for standard compound and isolation lifts (e.g. Bench Press, Incline Press, Squat, Deadlift, Overhead Press, Rows, Curls, Triceps, etc.).
        </p>
      </div>

      <!-- Standard Recognized Exercise Demo -->
      <template v-else>
        <div class="demo-media-container card-inset">
          <!-- Animated Biomechanical Vector Stage -->
          <div class="vector-stage-container">
            <svg viewBox="0 0 320 180" class="biomechanics-svg">
              <defs>
                <pattern id="grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.06)" stroke-width="1"/>
                </pattern>
                <filter id="glow-effect" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <rect width="100%" height="100%" fill="url(#grid-pattern)" />
              <line x1="30" y1="145" x2="290" y2="145" stroke="#444" stroke-width="4" stroke-linecap="round"/>
              <path d="M 160 40 L 160 120" stroke="rgba(0, 123, 255, 0.35)" stroke-width="2" stroke-dasharray="4 4" />

              <g class="animated-bar-group">
                <line x1="70" y1="60" x2="250" y2="60" stroke="#f0f0f0" stroke-width="6" stroke-linecap="round" />
                <rect x="58" y="40" width="14" height="40" rx="3" fill="#007bff" filter="url(#glow-effect)" />
                <rect x="248" y="40" width="14" height="40" rx="3" fill="#007bff" filter="url(#glow-effect)" />
              </g>

              <circle cx="160" cy="95" r="18" fill="rgba(0, 123, 255, 0.18)" stroke="#007bff" stroke-width="2" class="pulse-circle" />
              <text x="160" y="99" text-anchor="middle" fill="#ffffff" font-size="10" font-weight="bold">TARGET</text>
            </svg>
            <div class="motion-caption">
              <span class="motion-badge">⚡ Biomechanical Motion Guide</span>
              <span class="tempo-info">Tempo: 2s Controlled Down | 1s Hold | Explosive Press</span>
            </div>
          </div>
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
      </template>

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

/* Unknown exercise card */
.unknown-exercise-card {
  padding: 30px 20px;
  text-align: center;
  border-radius: 12px;
  margin-bottom: 16px;
}

.unknown-icon {
  font-size: 2.8em;
  margin-bottom: 10px;
}

.unknown-title {
  font-size: 1.15em;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: var(--color-card-heading);
}

.unknown-subtitle {
  font-size: 0.88em;
  color: var(--color-card-text);
  opacity: 0.8;
  margin: 0;
  line-height: 1.5;
}

.demo-media-container {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #121316;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
  padding: 12px 10px;
  border: 1px solid var(--color-card-border);
}

.vector-stage-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.biomechanics-svg {
  width: 100%;
  height: 150px;
}

.animated-bar-group {
  animation: strokeLift 2.2s infinite ease-in-out;
  transform-origin: center;
}

@keyframes strokeLift {
  0% { transform: translateY(0px); }
  50% { transform: translateY(50px); }
  100% { transform: translateY(0px); }
}

.pulse-circle {
  animation: pulseTarget 1.8s infinite ease-in-out;
}

@keyframes pulseTarget {
  0% { r: 16px; opacity: 0.4; }
  50% { r: 24px; opacity: 0.9; }
  100% { r: 16px; opacity: 0.4; }
}

.motion-caption {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
}

.motion-badge {
  font-size: 0.85em;
  font-weight: 700;
  color: #007bff;
}

.tempo-info {
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
