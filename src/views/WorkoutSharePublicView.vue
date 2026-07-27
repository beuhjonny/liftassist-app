<template>
  <div class="public-share-view">
    <div class="public-share-card card">
      <!-- The crown is what a stranger sees first, and what gets screenshotted
           and re-shared, so it carries the plate and the identity. -->
      <div class="share-crown">
        <Vista band="push" plate="palisade" />
        <div class="brand-header">
          <span class="brand-lift">LIFT</span> <span class="brand-logic">LOGIC</span>
        </div>
        <div v-if="shareData" class="workout-meta-header">
          <span class="shared-badge">Shared session</span>
          <h2>{{ shareData.workoutDayName }}</h2>
          <p class="workout-date">{{ shareData.dateStr }}</p>
          <p v-if="shareData.programName" class="program-tag">{{ shareData.programName }}</p>
        </div>
      </div>

      <div v-if="isLoading" class="loading-state">
        <p>Loading shared workout&hellip;</p>
      </div>

      <div v-else-if="error" class="error-state">
        <p class="error-text">{{ error }}</p>
        <router-link to="/" class="button-primary style-cta-btn">Go to LiftLogic Home</router-link>
      </div>

      <div v-else-if="shareData" class="share-content">
        <!-- Summary Stats Grid -->
        <div class="stats-grid card-inset">
          <div class="stat-box">
            <span class="stat-label">Duration</span>
            <span class="stat-value">{{ shareData.durationMinutes ? shareData.durationMinutes + 'm' : 'N/A' }}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Volume</span>
            <span class="stat-value">{{ shareData.totalVolume.toLocaleString() }}</span>
            <span class="stat-unit">lbs</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Sets</span>
            <span class="stat-value">{{ shareData.totalSets }}</span>
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
              <span v-if="ex.isPR" class="pr-badge">PR</span>
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
          <h4>Every session, decided for you</h4>
          <p>LiftLogic reads your last set and sets the next one. Free to start.</p>
          <router-link to="/" class="button-primary style-cta-btn full-width">
            Open LiftLogic
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
import Vista from '@/components/Vista.vue';

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
  overflow: hidden;
}

/* Bleeds to the card edge, so it cancels the card's own padding. The wordmark
   starts at a measured 39% of the crown, so the scrim bites just above it. */
.share-crown {
  --vista-scrim-start: 32%;
  position: relative;
  margin: -28px -24px 24px;
  padding: 9rem 24px 20px;
  overflow: hidden;
}
.share-crown > *:not(.vista) { position: relative; z-index: 1; }

.brand-header {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.6em;
  text-align: center;
  margin-bottom: 20px;
}

.brand-lift { font-weight: 900; }
/* Matches the wordmark everywhere else in the app; it was blue only here. */
.brand-logic { font-weight: 400; }

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

/* Three columns in a 297px card leaves ~66px each, so labels and values must
   both fit on one line or the grid reads as broken. */
.stat-label {
  display: block;
  font-size: 0.75em;
  font-weight: 700;
  opacity: 0.7;
  text-transform: uppercase;
  white-space: nowrap;
  margin-bottom: 4px;
}
.stat-value {
  display: block;
  font-size: 1.05em;
  font-weight: 800;
  white-space: nowrap;
  color: var(--color-card-heading);
}
.stat-unit {
  display: block;
  font-size: 0.7em;
  font-weight: 600;
  opacity: 0.6;
  text-transform: uppercase;
  letter-spacing: 0.4px;
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
