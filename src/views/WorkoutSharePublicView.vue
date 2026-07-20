<template>
  <div class="public-share-view">
    <div class="public-share-card card">
      <div class="brand-header">
        <span class="brand-lift">LIFT</span> <span class="brand-logic">LOGIC</span>
      </div>

      <div v-if="isLoading" class="loading-state">
        <p>Loading shared workout...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <p class="error-text">⚠️ {{ error }}</p>
        <router-link to="/" class="button-primary style-cta-btn">Go to LiftLogic Home</router-link>
      </div>

      <div v-else-if="shareData" class="share-content">
        <div class="workout-meta-header">
          <span class="shared-badge">Shared Workout Session</span>
          <h2>{{ shareData.workoutDayName }}</h2>
          <p class="workout-date">{{ shareData.dateStr }}</p>
          <p v-if="shareData.programName" class="program-tag">Routine: {{ shareData.programName }}</p>
        </div>

        <!-- Summary Stats Grid -->
        <div class="stats-grid card-inset">
          <div class="stat-box">
            <span class="stat-label">⏱️ Duration</span>
            <span class="stat-value">{{ shareData.durationMinutes ? shareData.durationMinutes + 'm' : 'N/A' }}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">🏋️ Total Volume</span>
            <span class="stat-value">{{ shareData.totalVolume.toLocaleString() }} lbs</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">📊 Total Sets</span>
            <span class="stat-value">{{ shareData.totalSets }} sets</span>
          </div>
        </div>

        <!-- Exercise List -->
        <div class="exercise-section">
          <h3>Exercises Performed</h3>

          <div 
            v-for="(ex, idx) in shareData.performedExercises" 
            :key="idx" 
            class="exercise-item card-inset"
          >
            <div class="ex-header">
              <strong>{{ idx + 1 }}. {{ ex.exerciseName }}</strong>
              <span v-if="ex.isPR" class="pr-badge">🏅 PR!</span>
            </div>

            <ul v-if="ex.sets && ex.sets.length > 0" class="set-list">
              <li v-for="(set, sIdx) in ex.sets" :key="sIdx">
                Set {{ set.setNumber }}: <strong>{{ set.actualWeight }} lbs</strong> × {{ set.actualReps }} reps
              </li>
            </ul>
          </div>
        </div>

        <!-- CTA Banner -->
        <div class="cta-banner card-inset">
          <h4>Crush your fitness goals with LiftLogic</h4>
          <p>Track progressive overload, log sets, and visualize strength gains.</p>
          <router-link to="/" class="button-primary style-cta-btn full-width">
            🚀 Try LiftLogic Free
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import usePublicShare, { type PublicWorkoutShareData } from '@/composables/usePublicShare';

const route = useRoute();
const { fetchPublicWorkoutShare, isLoading, error } = usePublicShare();
const shareData = ref<PublicWorkoutShareData | null>(null);

onMounted(async () => {
  const shareId = route.params.shareId as string;
  if (shareId) {
    shareData.value = await fetchPublicWorkoutShare(shareId);
  } else {
    error.value = 'Invalid share link.';
  }
});
</script>

<style scoped>
.public-share-view {
  max-width: 600px;
  margin: 20px auto;
  padding: 0 16px;
  text-align: left;
}

.public-share-card {
  padding: 28px 24px;
  border-radius: 16px;
}

.brand-header {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.6em;
  text-align: center;
  margin-bottom: 24px;
}

.brand-lift { font-weight: 900; }
.brand-logic { font-weight: 400; color: #007bff; }

.shared-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75em;
  font-weight: 700;
  text-transform: uppercase;
  background-color: var(--color-primary-mute, #007bff22);
  color: #007bff;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.workout-meta-header h2 {
  font-size: 1.7em;
  font-weight: 800;
  margin: 0 0 6px 0;
  color: var(--color-card-heading);
}

.workout-date {
  font-size: 0.95em;
  color: var(--color-card-text);
  opacity: 0.75;
  margin: 0 0 4px 0;
}

.program-tag {
  font-size: 0.85em;
  font-weight: 600;
  color: #10b981;
  margin: 0 0 16px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 24px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.75em;
  font-weight: 700;
  opacity: 0.7;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 1.15em;
  font-weight: 800;
  color: var(--color-card-heading);
}

.exercise-section h3 {
  font-size: 1.1em;
  font-weight: 700;
  margin: 0 0 12px 0;
  color: var(--color-card-heading);
}

.exercise-item {
  padding: 14px;
  border-radius: 10px;
  margin-bottom: 10px;
}

.ex-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 1em;
}

.pr-badge {
  font-size: 0.8em;
  font-weight: 700;
  color: #f59e0b;
}

.set-list {
  padding-left: 18px;
  margin: 0;
  font-size: 0.88em;
  line-height: 1.6;
  opacity: 0.85;
}

.cta-banner {
  margin-top: 28px;
  padding: 20px;
  border-radius: 14px;
  text-align: center;
  background-color: var(--color-card-mute);
  border: 1px solid var(--color-card-border);
}

.cta-banner h4 {
  font-size: 1.1em;
  font-weight: 700;
  margin: 0 0 6px 0;
}

.cta-banner p {
  font-size: 0.85em;
  opacity: 0.8;
  margin: 0 0 16px 0;
}

.style-cta-btn {
  display: inline-block;
  text-align: center;
  text-decoration: none;
  font-weight: 700;
  padding: 12px;
}

.full-width {
  width: 100%;
  box-sizing: border-box;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 40px 20px;
}

.error-text {
  color: #ff4d4d;
  font-weight: 600;
  margin-bottom: 16px;
}
</style>
