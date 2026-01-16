<template>
  <div class="home-view">
    <div v-if="!user" class="unauthenticated-view card">
      <div class="cta-container top-cta">
        <h1 class="welcome-title">Welcome to LiftAssist!</h1>
        <p class="welcome-subtitle">Your journey to consistent strength starts here.</p>
        <router-link to="/login" class="button-primary button-large">Sign In to Continue</router-link>
      </div>
      <ManifestoComponent />
      <div class="cta-container bottom-cta">
        <router-link to="/login" class="button-primary button-large">Sign In to Continue</router-link>
      </div>
    </div>

    <div v-if="user && activeProgram.id" class="authenticated-view">
      <h1>Home Dashboard</h1>
      
      <!-- Confirmation Modal for Draft Discard -->
      <div v-if="showDiscardDraftModal" class="manifesto-modal-overlay" @click.self="cancelDiscardDraft">
        <div class="manifesto-modal-content card" style="max-width: 400px; text-align: center; padding-top: 25px;">
           <button class="modal-close-button" @click="cancelDiscardDraft">×</button>
           <h3 style="margin-top: 0; color: var(--color-card-heading);">Discard Draft?</h3>
           <p style="margin: 15px 0; color: var(--color-card-text);">
             Are you sure you want to delete this unfinished workout? This action cannot be undone.
           </p>
           <div class="modal-actions" style="display: flex; gap: 10px; margin-top: 20px;">
             <button @click="cancelDiscardDraft" class="button-secondary" style="flex: 1;">Cancel</button>
             <button @click="handleDiscardDraft" class="button-primary" style="flex: 1; background-color: #dc3545;">Delete Forever</button>
           </div>
        </div>
      </div>

      <div v-if="isProgramLoading" class="loading-message">
        <p>Loading your program...</p>
      </div>
      <div v-if="programLoadingError && !isProgramLoading" class="error-message">
        <p>Error loading program: {{ programLoadingError }}</p>
      </div>

      <div v-if="activeProgram.id && !isProgramLoading && !programLoadingError">
        <div class="active-program-display card">
          <h2>{{ activeProgram.programName }}</h2>
          <p class="routine-description"><em>{{ activeProgram.description || 'Time to train!' }}</em></p>

          <div v-if="isLoadingHistory" class="loading-message small-loading">
            <p>Loading workout insights...</p>
          </div>
          <div v-else-if="historyError" class="error-message">
             <p>Could not load workout insights: {{ historyError }}</p>
          </div>
          <div v-else class="program-insights">
            <div v-if="activeDraft" class="draft-workout-alert card-inset" style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin-bottom: 15px; border-radius: 6px;">
              <p style="margin: 0 0 10px 0; font-weight: 600; color: #856404;">
                ⚠️ Unfinished Workout
              </p>
              <p style="margin: 0 0 10px 0; color: #856404;">
                You have {{ activeDraft.setsCount }} set(s) logged for {{ activeDraft.dayName }}
              </p>
              <div class="draft-actions" style="display: flex; gap: 10px;">
                <button 
                  @click="resumeDraftWorkout" 
                  class="button-primary"
                  style="flex: 4;"
                >
                  Resume Workout
                </button>
                <button 
                  @click="confirmDiscardDraft" 
                  class="button-danger-icon"
                  style="flex: 1; display: flex; align-items: center; justify-content: center; background-color: #dc3545; border: none; border-radius: 4px; cursor: pointer; color: white; font-size: 1.2em;"
                  title="Discard Draft"
                >
                  🗑️
                </button>
              </div>
            </div>
            <p v-if="lastDoneDayOverallDisplay" class="insight-item">
              <span class="insight-label">Last Workout:</span>
              <span class="insight-value">{{ lastDoneDayOverallDisplay.name }}
                <span class="insight-date"> (on {{ formatDate(lastDoneDayOverallDisplay.date) }})</span>
              </span>
            </p>
            <p v-if="nextRecommendedDayObject" class="insight-item">
              <span class="insight-label">Next Up:</span>
              <button
                v-if="nextRecommendedDayObject.dayName"
                @click="startWorkout(nextRecommendedDayObject)"
                class="clickable-next-up-text insight-value next-up-highlight"
                :title="`Start ${nextRecommendedDayObject.dayName} workout`"
              >
                {{ nextRecommendedDayObject.dayName }}
              </button>
            </p>
            <p v-else-if="nextRecommendedDayNameDisplay && !nextRecommendedDayObject" class="insight-item">
                <span class="insight-label">Next Up:</span>
                <span class="insight-value next-up-highlight">{{ nextRecommendedDayNameDisplay }}</span>
            </p>
            <p v-if="!lastDoneDayOverallDisplay && !isLoadingHistory && sortedWorkoutDays.length > 0 && !nextRecommendedDayObject" class="insight-item">
              <span class="insight-label">Let's get started with your first session for this routine!</span>
            </p>
          </div>

          <h3>Choose a Workout to Start:</h3>
          <div v-if="enhancedWorkoutDays.length > 0" class="workout-day-selection">
            <button
              v-for="day in enhancedWorkoutDays"
              :key="day.id"
              @click="startWorkout(day)"
              :class="[
                'button-workout-day',
                { 'is-recommended': day.isNextRecommended && !day.isLastDoneOverall },
                { 'is-last-done': day.isLastDoneOverall },
                { 'has-skips': day.skipIndicatorCount > 0 }
              ]"
            >
              Start {{ day.dayName }}
              <span v-if="day.isNextRecommended && !day.isLastDoneOverall" class="status-badge recommended-badge" title="Next Recommended Workout">🚀 Next</span>
              <span v-if="day.isLastDoneOverall" class="status-badge last-done-badge" title="Last Workout Completed">✓ Done</span>
              <span v-if="day.skipIndicatorCount > 0" class="status-badge skipped-badge" :title="`${day.skipIndicatorCount} time(s) this day was due and another workout was done instead`">
                ⚠️ {{ day.skipIndicatorCount }}
              </span>
            </button>
          </div>
          <p v-else-if="!isLoadingHistory && sortedWorkoutDays.length === 0 && activeProgram.id" class="no-items-message">
            This routine has no workout days defined yet.
            <router-link :to="{ name: 'Routines' }">Go to Routines to add them.</router-link>
          </p>
        </div>
      </div>
    </div>

    <div v-if="!activeProgram.id && !isProgramLoading && !programLoadingError && user" class="no-program-message card setup-nudge">
      <h2 style="text-align: center;">Welcome, {{ user.displayName || 'Fitness Enthusiast' }}! 🏋️</h2>
      <div class="cta-container top-cta" style="margin-top: 20px;">
        <router-link to="/routines" class="button-primary button-large">✨ GET STARTED WITH A ROUTINE</router-link>
      </div>
      
      <ManifestoComponent />

      <div class="cta-container bottom-cta">
        <router-link to="/routines" class="button-primary button-large">CREATE A ROUTINE</router-link>
      </div>
    </div>

      <div class="about-section-logged-in">
        <button @click="toggleManifestoModal" class="button-about">
          <span class="info-icon" aria-hidden="true">ⓘ</span> About LiftAssist
        </button>
      </div>
    <div v-if="user && !activeProgram.id && isProgramLoading" class="loading-message">
        <p>Loading your program details...</p>
    </div>

    <div v-if="user && showManifestoModal" class="manifesto-modal-overlay" @click.self="closeManifestoModal">
      <div class="manifesto-modal-content card">
        <button @click="closeManifestoModal" class="modal-close-button" aria-label="Close manifesto">&times;</button>
        <ManifestoComponent />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import useAuth from '../composables/useAuth';
import useTrainingProgram from '../composables/useTrainingProgram';
import { useRouter } from 'vue-router';
import ManifestoComponent from '@/components/ManifestoComponent.vue';
import type { WorkoutDay, EnhancedWorkoutDay } from '@/types';

const { user } = useAuth();
const router = useRouter();

const {
  isProgramLoading,
  programLoadingError,
  activeProgram,
  programWorkoutsHistory,
  isLoadingHistory,
  historyError,
  activeDraft,
  enhancedWorkoutDays,
  lastDoneDayOverallDisplay,
  nextRecommendedDayObject,
  nextRecommendedDayNameDisplay,
  sortedWorkoutDays,
  formatDate,
  deleteDraftWorkout
} = useTrainingProgram();

const showManifestoModal = ref(false);
const showDiscardDraftModal = ref(false);

const confirmDiscardDraft = () => {
    showDiscardDraftModal.value = true;
};

const cancelDiscardDraft = () => {
    showDiscardDraftModal.value = false;
};

const handleDiscardDraft = async () => {
    try {
      await deleteDraftWorkout();
      showDiscardDraftModal.value = false;
    } catch (e) {
      alert("Failed to delete draft: " + e);
    }
};

const resumeDraftWorkout = () => {
  if (!activeDraft.value) return;
  router.push({ 
    name: 'WorkoutActive', 
    params: { 
      programId: activeDraft.value.programId, 
      dayId: activeDraft.value.dayId 
    } 
  });
};

const startWorkout = (day: WorkoutDay | EnhancedWorkoutDay) => {
  if (!activeProgram.id || !day.id) {
    // We can't set programLoadingError from here directly as it's readonly from composable usually, 
    // but ref is mutable. 
    // Ideally we'd use a setter or just log it/alert.
    console.error("Cannot start workout: Program or Day ID is missing.");
    return;
  }
  router.push({ name: 'WorkoutActive', params: { programId: activeProgram.id, dayId: day.id } });
};

const toggleManifestoModal = () => { showManifestoModal.value = !showManifestoModal.value; };
const closeManifestoModal = () => { showManifestoModal.value = false; };

</script>

<style scoped>
/* Main layout and structure */
.home-view {
  padding: 10px;
  max-width: 700px;
  margin: 20px auto;
}
.card {
  background-color: var(--color-card-bg); padding: 20px 25px;
  border-radius: 8px;
  margin-bottom: 25px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  text-align: left;
  border: 1px solid var(--color-card-border);
  color: var(--color-card-text);
}

/* Unauthenticated View */
.unauthenticated-view.card {
  text-align: center; padding: 30px 25px;
}

@media (max-width: 600px) {
  .home-view {
    padding: 5px; /* Reduced from 10px */
    margin: 10px auto; /* Reduced margin */
  }
  .card {
    padding: 15px 15px; /* Reduced from 20px 25px */
    margin-bottom: 15px;
  }
  .unauthenticated-view.card {
    padding: 20px 15px;
  }
}
.welcome-title { font-size: 2.2em; color: var(--color-card-heading); margin-bottom: 10px; }
.welcome-subtitle { font-size: 1.1em; color: var(--color-card-text); margin-bottom: 25px; }
.cta-container { margin: 25px 0; text-align: center; }
.cta-container.top-cta { margin-bottom: 30px; }
.cta-container.bottom-cta { margin-top: 30px; }
.button-large { padding: 15px 30px; font-size: 1.1em; font-weight: bold; }

/* Authenticated View */
.authenticated-view h1 { text-align: center; margin-bottom: 20px; color: var(--color-heading); /* Main heading is outside card */ }
.active-program-display h2 {
  margin-top: 0; color: var(--color-card-heading); font-size: 1.8em; margin-bottom: 8px;
}
.routine-description {
  margin-top: 0; margin-bottom: 20px; color: var(--color-card-text); font-style: italic;
}

/* Program Insights Section - REFINED STYLES */
.program-insights {
  background-color: var(--color-card-mute);
  padding: 10px 15px; /* Reduced padding */
  border-radius: 6px;
  margin-bottom: 15px; /* Reduced space before H3 */
  border: 1px solid var(--color-card-border);
  text-align: left;
}
.insight-item {
  margin: 4px 0; /* Reduced vertical margin */
  font-size: 0.95em; /* Slightly smaller font */
  line-height: 1.5; /* Adjusted line height */
  color: var(--color-card-text);
}
.insight-label {
  font-weight: 600; /* Can be 'bold' if preferred */
  color: var(--color-card-text);
  margin-right: 5px;
}
.insight-value {
  color: inherit; /* Solves empty ruleset, inherits color unless overridden */
}
.insight-value.next-up-highlight {
  font-weight: bold;
  color: #007bff;
}
.insight-date {
  font-size: 0.9em; /* Relative to .insight-item */
  color: var(--color-card-text);
  opacity: 0.8;
  margin-left: 3px;
}
.clickable-next-up-text {
  background: none; border: none; padding: 0; margin: 0;
  display: inline; cursor: pointer; font-family: inherit;
  font-size: inherit; line-height: inherit;
  text-decoration: none; vertical-align: baseline;
  /* color and font-weight inherited from .insight-value.next-up-highlight */
}
.clickable-next-up-text:hover,
.clickable-next-up-text:focus {
  text-decoration: underline;
  color: #0056b3;
  outline: none;
}

/* Workout Day Selection */
.active-program-display h3 { /* "Choose a Workout to Start:" */
  margin-top: 15px; /* Reduced from 25px */
  margin-bottom: 15px;
  color: var(--color-card-text);
  font-size: 1.4em;
}
.workout-day-selection { display: flex; flex-direction: column; gap: 15px; }
.button-workout-day {
  padding: 15px 20px; background-color: #007bff; color: white;
  border: none; border-radius: 6px; cursor: pointer; font-size: 1.1em;
  text-align: center; transition: background-color 0.2s ease-in-out, transform 0.1s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1); position: relative;
  display: flex; justify-content: center; align-items: center; gap: 10px;
}
.button-workout-day:hover { background-color: #0056b3; transform: translateY(-2px); }
.button-workout-day:active { transform: translateY(0px); }

.button-workout-day.is-recommended {
  border: 2px solid #28a745; background-color: #e9f5ec; color: #155724;
}
.button-workout-day.is-recommended:hover { background-color: #d4edda; }
.button-workout-day.is-last-done {
  background-color: #6c757d; color: white; opacity: 0.85;
}
.button-workout-day.is-last-done:hover { background-color: #5a6268; }

.status-badge {
  font-size: 0.75em; padding: 3px 7px; border-radius: 10px;
  font-weight: bold; line-height: 1; vertical-align: middle; white-space: nowrap;
}
.recommended-badge { background-color: #28a745; color: white;}
.last-done-badge { background-color: #adb5bd; color: #212529; }
.skipped-badge { background-color: #ffc107; color: #333; }

/* General Messages & Buttons */
.no-program-message { padding: 40px 30px; text-align: center; }
.no-program-message h2 { margin-top:0; margin-bottom: 20px; color: var(--color-card-heading); }
.no-program-message p { margin-bottom: 30px; font-size: 1.1em; opacity: 0.9; }
.setup-actions { margin-top: 20px; }
.button-primary {
  padding: 12px 20px; background-color: #007bff; color: white;
  border: none; border-radius: 4px; cursor: pointer; font-size: 1rem;
  text-decoration: none; display: inline-block; transition: background-color 0.2s, transform 0.1s;
}
.button-primary:hover:not(:disabled) { background-color: #0056b3; transform: translateY(-1px); }
.button-primary:active { transform: translateY(0px); }
.loading-message { color: var(--color-card-text); padding: 20px; text-align: center; }
.loading-message.small-loading p { font-size: 0.9em; padding: 10px 0 0 0; }
.no-items-message { color: var(--color-card-text); padding: 20px; text-align: center; }
.error-message {
  color: #dc3545; background-color: #f8d7da; border: 1px solid #f5c6cb;
  padding: 10px 15px; border-radius: 4px; margin-top: 15px; margin-bottom: 15px;
  text-align: left;
}

/* About/Manifesto */
.about-section-logged-in { text-align: center; margin-top: 30px; padding-bottom: 10px; }
.button-about {
  background-color: transparent; color: #007bff; border: 1px solid transparent;
  padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 0.95em;
  text-decoration: none; display: inline-flex; align-items: center; gap: 6px;
  transition: color 0.2s, background-color 0.2s;
}
.button-about:hover { color: #0056b3; text-decoration: underline; }
.info-icon { font-size: 1.2em; font-weight: bold; }
.manifesto-modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.6); display: flex; justify-content: center;
  align-items: center; z-index: 1000; padding: 20px; box-sizing: border-box;
}
.manifesto-modal-content.card {
  max-width: 700px; width: 100%; max-height: 85vh; overflow-y: auto;
  position: relative; padding: 25px; padding-top: 45px; text-align: left;
  background-color: var(--color-card-bg);
  color: var(--color-card-text);
}
.modal-close-button {
  position: absolute; top: 10px; right: 15px; background: none; border: none;
  font-size: 2em; color: var(--color-card-text); opacity: 0.6; cursor: pointer; line-height: 1; padding: 5px;
}
.modal-close-button:hover { color: var(--color-card-text); opacity: 1; }

</style>