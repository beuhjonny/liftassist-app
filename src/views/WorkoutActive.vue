<template>
  <div class="workout-active-view">
    <!-- Draft Workout Prompt -->
    <div v-if="showDraftPrompt" class="draft-prompt-overlay">
      <div class="draft-prompt-card card">
        <h2>Resume Workout?</h2>
        <p>You have an unfinished workout in progress.</p>
        <p v-if="isLoadingDraft">Loading draft...</p>
        <div v-else class="draft-prompt-actions">
          <button @click="resumeDraft" class="button-primary">Resume Workout</button>
          <button @click="discardDraft" class="button-secondary">Start Fresh</button>
        </div>
      </div>
    </div>
    
    <div v-if="isLoading && !showDraftPrompt" class="loading-message card">
      <p>Loading your workout...</p>
    </div>
    <div v-if="error && !isLoading && !showDraftPrompt" class="error-message card">
      <p>Error: {{ error }}</p>
      <router-link to="/" class="button-secondary">Back to Home</router-link>
    </div>

    <div v-if="workoutPhase === 'overview' && !isLoading && !error && currentWorkoutDayDetails" class="workout-overview-content card">
      <h1>{{ currentWorkoutDayDetails.dayName }} - Get Ready!</h1>
      <p v-if="activeProgramName" class="routine-name">Routine: {{ activeProgramName }}</p>
      <p class="overview-subtitle">Here's the plan for today:</p>
      <ul v-if="sessionExercises.length > 0" class="exercise-overview-list">
        <li v-for="(exercise, index) in sessionExercises" :key="exercise.id" class="exercise-overview-item">
          <strong>{{ index + 1 }}. {{ exercise.exerciseName }}</strong>
          <span class="overview-details">
            : {{ exercise.targetSets }} sets of {{ exercise.prescribedReps }} reps @ {{ toDisplay(exercise.prescribedWeight, settings.weightUnit) }} {{ displayUnit(settings.weightUnit) }}
            <em v-if="exercise.customRestSeconds"> ({{ exercise.customRestSeconds }}s rest)</em>
            <em v-else> ({{ DEFAULT_REST_SECONDS }}s default rest)</em>
          </span>
        </li>
      </ul>
      <p v-else class="no-items-message">No exercises found for this workout day in your routine.</p>
      <div class="overview-actions">
        <button @click="beginActiveWorkout" class="button-primary button-begin-workout" :disabled="sessionExercises.length === 0">
          Begin Workout
        </button>
        <router-link to="/" class="button-secondary">Back to Home</router-link>
      </div>
    </div>

    <div v-if="workoutPhase === 'activeSet' && !isLoading && !error && currentExercise && !allExercisesComplete" class="workout-content card">
      <h1 class="workout-day-title">{{ currentWorkoutDayDetails?.dayName }}</h1>
      <div v-if="totalSessionSets > 0" class="workout-progress-indicator">
        <div class="workout-progress-timeline">
          <template v-for="(set, index) in allSetsInSessionForTimeline" :key="`progress-${index}`">
            <span
              class="progress-dot"
              :class="{
                'completed-done': index < workoutLog.length && workoutLog[index]?.status === 'done',
                'completed-failed': index < workoutLog.length && workoutLog[index]?.status === 'failed',
                'active': index === workoutLog.length,
                'tooltip-active': showMobileTooltipForIndex === index
              }"
              :title="`${set.exerciseName} - Set ${set.setNumberWithinExercise}`"
              @click="toggleProgressDotTooltip(index, `${set.exerciseName} - Set ${set.setNumberWithinExercise}`)"
            ></span>
            <span
              v-if="index < allSetsInSessionForTimeline.length - 1 && set.exerciseName !== allSetsInSessionForTimeline[index + 1].exerciseName"
              class="progress-separator"
            ></span>
          </template>
        </div>
         <div v-if="showMobileTooltipForIndex !== null && workoutPhase === 'activeSet'" class="mobile-progress-tooltip">
          {{ mobileTooltipText }}
        </div>
      </div>

      <div class="current-exercise-block">
        <div class="active-set-timer-display">Set Timer: {{ formattedActiveSetTime }}</div>
        <h2>{{ currentExercise.exerciseName }}</h2>
        <p v-if="currentExercise.notesForExercise" class="exercise-notes">
          <em>Notes: {{ currentExercise.notesForExercise }}</em>
        </p>
        <div class="current-set-info card-inset">
          <div class="current-set-info-header">
            <h3>Set {{ currentSetNumber }} of {{ currentExercise.targetSets }}</h3>
            <button @click="openEditPrescriptionModal" class="button-icon extra-small" title="Edit Weight/Reps">✏️</button>
          </div>
          <div class="prescription-details">
            <span 
              class="prescription-reps" 
              :class="{ 'failed-last-attempt-text': didFailLastAttemptAtCurrentPrescription }">
              {{ getEffectivePrescribedReps }} {{ currentExercise.isTimed ? 'sec hold' : 'reps' }}
            </span>
            <span class="prescription-separator">@</span>
            <span 
              class="prescription-weight" 
              :class="{ 'failed-last-attempt-text': didFailLastAttemptAtCurrentPrescription }">
              {{ toDisplay(getEffectivePrescribedWeight, settings.weightUnit) }} {{ displayUnit(settings.weightUnit) }}
            </span>
          </div>
        </div>

        <div v-if="currentExercise.isTimed" class="timed-exercise-controls card-inset" style="margin-top: 20px; text-align: center;">
          <div v-if="!isHoldTimerRunning" class="hold-timer-prep">
            <button @click="startHoldTimer" class="button-primary full-width-button">START HOLD TIMER</button>
          </div>
          <div v-else class="hold-timer-active">
            <div class="hold-timer-display" style="font-size: 3rem; font-weight: bold; margin-bottom: 10px; color: var(--color-primary);">{{ formattedHoldTime }}</div>
            <button @click="stopHoldTimer(false)" class="button-secondary full-width-button">Cancel Timer</button>
          </div>
        </div>
        
        <p v-if="didFailLastAttemptAtCurrentPrescription && currentExerciseProgress?.consecutiveFailedWorkoutsAtCurrentWeightAndReps" 
           class="failure-streak-note">
          Failed last {{ currentExerciseProgress.consecutiveFailedWorkoutsAtCurrentWeightAndReps }} 
          attempt{{ currentExerciseProgress.consecutiveFailedWorkoutsAtCurrentWeightAndReps > 1 ? 's' : '' }} 
          at this prescription. Time to break the cycle!
        </p>

        <div class="set-actions" v-if="!currentExercise.isTimed || (!isHoldTimerRunning && !currentExercise.isTimed)">
          <button @click="logSet('done')" class="button-done">DONE</button>
          <button @click="logSet('failed')" class="button-fail">FAIL</button>
        </div>
        <div class="set-actions" v-else-if="currentExercise.isTimed && !isHoldTimerRunning">
           <!-- Allow manual logging if hold timer not running -->
           <button @click="logSet('done')" class="button-done">DONE MANUALLY</button>
           <button @click="logSet('failed')" class="button-fail">FAIL</button>
        </div>
      </div>
    </div>

    <div v-if="workoutPhase === 'resting' && !allExercisesComplete" class="rest-screen-content card">
      <div class="actions-top-bar" v-if="workoutLog.length > 0">
        <span @click="correctLastSet" class="correct-last-set-action">
          &larr; Correct Last Set
        </span>
      </div>
      <h1 class="workout-day-title">{{ currentWorkoutDayDetails?.dayName }}</h1>
      <div v-if="totalSessionSets > 0" class="workout-progress-indicator">
        <div class="workout-progress-timeline">
            <template v-for="(set, index) in allSetsInSessionForTimeline" :key="`progress-rest-${index}`">
            <span
              class="progress-dot"
              :class="{
                'completed-done': index < workoutLog.length && workoutLog[index]?.status === 'done',
                'completed-failed': index < workoutLog.length && workoutLog[index]?.status === 'failed',
                'active': index === workoutLog.length, 
                'tooltip-active': showMobileTooltipForIndex === index
              }"
              :title="`${set.exerciseName} - Set ${set.setNumberWithinExercise}`"
              @click="toggleProgressDotTooltip(index, `${set.exerciseName} - Set ${set.setNumberWithinExercise}`)"
            ></span>
            <span
              v-if="index < allSetsInSessionForTimeline.length - 1 && set.exerciseName !== allSetsInSessionForTimeline[index + 1].exerciseName"
              class="progress-separator"
            ></span>
            </template>
        </div>
        <div v-if="showMobileTooltipForIndex !== null && workoutPhase === 'resting'" class="mobile-progress-tooltip">
          {{ mobileTooltipText }}
        </div>
      </div>
      <h2>RESTING...</h2>
      <div class="timer-display">{{ formattedRestTime }}</div>
      <div class="timer-bar-container">
        <div class="timer-bar" :style="{ width: timerProgressPercentage + '%' }"></div>
      </div>
      <div v-if="showActualRepsInputForFail" class="actual-reps-input-section card-inset">
        <label for="actualRepsFailed">How many reps did you complete for the failed set?</label>
        <input type="number" id="actualRepsFailed" v-model.number="actualRepsForFailedSet" min="0" />
      </div>
      <div v-if="nextSetDetails" class="next-up-info card-inset">
        <h4>NEXT UP: {{ nextSetDetails.exerciseName }}</h4>
        <p>Set {{ nextSetDetails.setNumber }} of {{ nextSetDetails.targetSets }}: {{ nextSetDetails.prescribedReps }} {{ (nextSetDetails as any).isTimed ? 'sec hold' : 'reps' }} @ {{ nextSetDetails.prescribedWeight }} {{ displayUnit(settings.weightUnit) }}</p>
      </div>
      <button @click="proceedToNextSet" class="button-primary start-next-set-button">
        {{ restCountdown > 0 ? 'Skip Rest & Start Next Set' : 'Start Next Set' }}
      </button>
    </div>

    <div v-if="workoutPhase === 'complete'" class="workout-content card">
        <div class="workout-complete-header">
          <h2>Workout Complete!</h2>
          <button 
            @click="toggleEditMode" 
            class="button-icon edit-mode-toggle" 
            :class="{ 'edit-mode-active': isEditModeActive }"
            title="Toggle Edit Mode">
            ✏️
          </button>
        </div>
        <p>Great job finishing your {{ currentWorkoutDayDetails?.dayName }} workout!</p>

        <div class="workout-summary card-inset">
          <h4>Session Summary:</h4>
          <p><strong>Workout Time:</strong> {{ displayDurationForCompletedWorkout }}</p>
          <p><strong>Total Volume:</strong> {{ totalWorkoutVolume.toLocaleString() }} {{ displayUnit(settings.weightUnit) }}</p>
          <p><strong>Total Sets:</strong> {{ displayConsolidatedSetsInfo }}</p>

          <div class="exercise-breakdown-header" v-if="completedPerformedExercisesSummary.length > 0">
            <h5>Exercise Breakdown:</h5>
            <button @click="toggleSetDetailsInSummary" class="button-link">
              {{ showSetDetailsInSummary ? 'Hide Set Details' : 'Show Set Details' }}
            </button>
          </div>

          <ul class="exercise-summary-list" v-if="completedPerformedExercisesSummary.length > 0">
            <li v-for="ex in completedPerformedExercisesSummary" :key="ex.exerciseId || ex.exerciseName" class="exercise-summary-item">
              <div class="exercise-summary-header">
                <div class="exercise-summary-info">
                  <strong>{{ ex.exerciseName }}</strong>
                  <span v-if="ex.isPR" title="Personal Record!"> 🏅</span>
                  <span>: {{ getExerciseStatusForDisplay(ex) }}{{ getExerciseLineSuffixForDisplay(ex) }}</span>
                </div>
                <button 
                  v-if="isEditModeActive" 
                  @click="openEditWorkoutModal(ex)" 
                  class="button-icon extra-small" 
                  title="Edit Sets">
                  ✏️
                </button>
              </div>
              
              <ul v-if="showSetDetailsInSummary && ex.sets && ex.sets.length > 0" class="set-details-list">
                <li v-for="(set, setIndex) in ex.sets" :key="setIndex">
                  Set {{ set.setNumber }}: {{ toDisplay(set.actualWeight, settings.weightUnit) }} {{ displayUnit(settings.weightUnit) }} x {{ set.actualReps }} {{ set.isTimed ? 'sec' : 'reps' }} ({{set.status}})
                </li>
              </ul>
            </li>
          </ul>

          <div v-if="sessionOverallNotes" class="session-notes-history"> 
            <strong>Overall Session Notes:</strong>
            <p>{{ sessionOverallNotes }}</p>
          </div>
        </div>

        <div v-if="showActualRepsInputForFail && lastLoggedSetIndex !== null && workoutLog[lastLoggedSetIndex]?.status === 'failed'" class="actual-reps-input-section card-inset">
          <label :for="'finalActualRepsFailed'">Reps completed for last failed set of {{ workoutLog[lastLoggedSetIndex]?.exerciseName }}:</label>
          <input type="number" :id="'finalActualRepsFailed'" v-model.number="actualRepsForFailedSet" min="0" />
        </div>

        <div class="overall-notes-section card-inset">
          <label for="overallSessionNotesInput">Overall Session Notes (optional - will be saved):</label>
          <textarea id="overallSessionNotesInput" v-model="sessionOverallNotes" rows="3" style="width: 100%; margin-top: 5px; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;"></textarea>
        </div>
        
        <button @click="finishWorkoutAndSave" :disabled="isSaving" class="button-primary finish-workout-button">
            {{ isSaving ? 'Saving...' : 'Finish & Save Workout' }}
        </button>
    </div>


    <div v-if="!isLoading && !error && !currentWorkoutDayDetails && user && workoutPhase ==='overview' && !showDraftPrompt" class="card">
        <p>Could not load workout day details. Please try again or check your routine setup.</p>
        <router-link to="/" class="button-secondary">Back to Home</router-link>
    </div>
      <div v-if="!user && !isLoading && !error">
        <p>Please <router-link to="/login">log in</router-link> to view workouts.</p>
    </div>

    <!-- Edit Prescription Modal -->
    <div v-if="showEditPrescriptionModal" class="modal-overlay" @click.self="closeEditPrescriptionModal">
      <div class="modal-content edit-prescription-modal">
        <button @click="closeEditPrescriptionModal" class="modal-close-button" title="Close">&times;</button>
        <h3>Edit Weight & Reps</h3>
        <div class="form-group">
          <label for="editReps">{{ currentExercise?.isTimed ? 'Hold Time (sec):' : 'Reps:' }}</label>
          <input type="number" id="editReps" v-model.number="editedReps" min="1" step="1" />
        </div>
        <div class="form-group">
          <label for="editWeight">Weight (lbs):</label>
          <input type="number" id="editWeight" v-model.number="editedWeight" min="0" step="0.1" />
        </div>
        <div class="form-actions">
          <button @click="saveEditedPrescription" class="button-primary">Save</button>
          <button @click="closeEditPrescriptionModal" class="button-secondary">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Edit Choice Modal (This Set Only vs All Future Sets) -->
    <div v-if="showEditChoiceModal" class="modal-overlay" @click.self="closeEditChoiceModal">
      <div class="modal-content edit-choice-modal">
        <h3>Apply Edit</h3>
        <p>How would you like to apply this change?</p>
        <div class="edit-choice-actions">
          <button @click="updateOnlyThisSetPrescription" class="button-primary">Edit for This Set Only</button>
          <button @click="applyEditAllFutureSets" class="button-primary">Edit for All Future Sets</button>
          <button @click="closeEditChoiceModal" class="button-secondary">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Edit Workout Modal (for completion screen) -->
    <div v-if="showEditWorkoutModal" class="modal-overlay" @click.self="closeEditWorkoutModal">
      <div class="modal-content edit-workout-modal">
        <button @click="closeEditWorkoutModal" class="modal-close-button" title="Close">&times;</button>
        <h3>Edit Sets: {{ editingExercise?.exerciseName }}</h3>
        <div v-if="editingExercise" class="edit-sets-list">
          <div v-for="(set, index) in editingExercise.sets" :key="index" class="edit-set-item">
            <div class="edit-set-header">
              <strong>Set {{ set.setNumber }}</strong>
            </div>
            <div class="edit-set-fields">
              <div class="form-group">
                <label>Weight (lbs):</label>
                <input type="number" v-model.number="set.actualWeight" min="0" step="0.1" />
              </div>
              <div class="form-group">
                <label>{{ (set as any).isTimed ? 'Time (sec):' : 'Reps:' }}</label>
                <input type="number" v-model.number="set.actualReps" min="0" step="1" />
              </div>
              <div class="form-group">
                <label>Status:</label>
                <select v-model="set.status" class="status-select">
                  <option value="done">Done</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div class="form-actions">
          <button @click="saveEditedWorkout" class="button-primary">Save Changes</button>
          <button @click="closeEditWorkoutModal" class="button-secondary">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Audio element for final fallback -->
    <audio ref="timerAudioPlayer" style="display: none;">
      <source src="/sounds/bell.mp3" type="audio/mpeg">
    </audio>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, onUnmounted, computed } from 'vue';
import { doc, getDoc, setDoc, updateDoc, collection, writeBatch, serverTimestamp, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase.js'; 
import useAuth from '../composables/useAuth'; 
import { useRouter, useRoute } from 'vue-router';
import useSettings from '../composables/useSettings'; 
import useLoggedWorkouts from '../composables/useLoggedWorkouts';
import { toDisplay, fromInput, displayUnit } from '../utils/weight';
import { playTone } from '../utils/audio';
import type { LoggedSetData, PerformedExerciseInLog, ExerciseProgress, SessionExercise } from '@/types';

type WorkoutPhase = 'overview' | 'activeSet' | 'resting' | 'complete';

interface ExerciseConfigInRoutine {
  id: string;
  exerciseName: string;
  targetSets: number;
  minReps: number;
  maxReps: number;
  repOverloadStep: number;
  weightIncrement: number;
  customRestSeconds?: number | null;
  notesForExercise?: string | null;
  enableProgression?: boolean;
  startingWeight?: number;
}
interface WorkoutDayInRoutine {
  id: string;
  dayName: string;
  order: number;
  exercises: ExerciseConfigInRoutine[];
}
// SessionExercise is now imported from types.ts, removed local definition.

// Draft workout interface for auto-save
interface DraftWorkout {
  id: string;
  userId: string;
  programId: string;
  dayId: string;
  programName: string;
  dayName: string;
  workoutLog: LoggedSetData[];
  sessionExercises: SessionExercise[];
  currentExerciseIndex: number;
  currentSetNumber: number;
  workoutPhase: WorkoutPhase;
  workoutStartTime: Date | null;
  sessionOverallNotes: string;
  lastUpdated: any; // Firestore Timestamp
  createdAt: any; // Firestore Timestamp
}


const props = defineProps<{ programId: string; dayId: string; }>();
const { user } = useAuth();
const router = useRouter();
const route = useRoute();
const isLoading = ref(true);
const { settings } = useSettings();
const { invalidateCache } = useLoggedWorkouts();
const isSaving = ref(false);
const error = ref<string | null>(null);

// Draft workout state
const draftWorkoutId = ref<string | null>(null);
const hasDraft = ref(false);
const showDraftPrompt = ref(false);
const isLoadingDraft = ref(false);

// Declare global window type for pending draft
declare global {
  interface Window {
    _pendingDraft?: DraftWorkout;
  }
}

const activeProgramName = ref<string | null>(null);
const currentWorkoutDayDetails = ref<WorkoutDayInRoutine | null>(null);
const sessionExercises = reactive<SessionExercise[]>([]); 
const workoutLog = reactive<LoggedSetData[]>([]);

const currentExerciseIndex = ref(0);
const currentSetNumber = ref(1);

const DEFAULT_REST_SECONDS = computed(() => settings.value.defaultRestTimer || 90);
const restDurationToUse = ref(DEFAULT_REST_SECONDS.value);
const restCountdown = ref(DEFAULT_REST_SECONDS.value);
const showActualRepsInputForFail = ref(false);
const actualRepsForFailedSet = ref<number | null>(null);
const lastLoggedSetIndex = ref<number | null>(null);
let timerInterval: number | undefined = undefined;
const timerAudioPlayer = ref<HTMLAudioElement | null>(null);
let audioContext: AudioContext | null = null;
let audioBuffer: AudioBuffer | null = null; // For loaded MP3 file

// Sound type options - can be extended later
type SoundType = 'bell' | 'beep' | 'chime' | 'ding'; // simplified
// const selectedSoundType = ref<SoundType>('file'); // REMOVED - using settings
// const useLocalFile = ref(true); // REMOVED - using settings

const workoutPhase = ref<WorkoutPhase>('overview');
const workoutStartTime = ref<Date | null>(null);
const workoutEndTime = ref<Date | null>(null);

const activeSetTimeElapsed = ref(0);
let activeSetTimerInterval: number | undefined = undefined;

const showMobileTooltipForIndex = ref<number | null>(null);
const mobileTooltipText = ref<string>('');

const initialExerciseProgressData = reactive<Map<string, ExerciseProgress>>(new Map());
const sessionOverallNotes = ref("");

// Hold Timer for Timed Exercises
const isHoldTimerRunning = ref(false);
const holdCountdown = ref(0);
let holdTimerInterval: number | undefined = undefined;

const formattedHoldTime = computed(() => {
  const m = Math.floor(holdCountdown.value / 60);
  const s = holdCountdown.value % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
});

const startHoldTimer = () => {
  if (!currentExercise.value) return;
  holdCountdown.value = getEffectivePrescribedReps.value; 
  isHoldTimerRunning.value = true;
  if (holdTimerInterval) clearInterval(holdTimerInterval);
  holdTimerInterval = setInterval(() => {
    if (holdCountdown.value > 0) {
      holdCountdown.value--;
    } else {
      stopHoldTimer(true);
    }
  }, 1000);
};

const stopHoldTimer = (autoAdvance = false) => {
  isHoldTimerRunning.value = false;
  if (holdTimerInterval) clearInterval(holdTimerInterval);
  holdTimerInterval = undefined;
  
  if (autoAdvance) {
    playTimerSound();
    logSet('done');
  }
};

const wakeLockSentinel = ref<WakeLockSentinel | null>(null);

const showSetDetailsInSummary = ref(false);

// Edit prescription state
const showEditPrescriptionModal = ref(false);
const showEditChoiceModal = ref(false);
const editedReps = ref<number | null>(null);
const editedWeight = ref<number | null>(null);
const overriddenRepsForCurrentSet = ref<number | null>(null);
const overriddenWeightForCurrentSet = ref<number | null>(null);

// Edit workout state (for completion screen)
const isEditModeActive = ref(false);
const showEditWorkoutModal = ref(false);
const editingExercise = ref<PerformedExerciseInLog | null>(null);

// --- Computed Properties ---
const totalSessionSets = computed(() => {
  return sessionExercises.reduce((total, exercise) => total + (exercise.targetSets || 0), 0);
});
const completedSetsCount = computed(() => workoutLog.filter(s => s.status === 'done').length);
const failedSetsCount = computed(() => workoutLog.filter(s => s.status === 'failed').length);

const workoutDurationFormatted = computed(() => {
  if (!workoutStartTime.value || !workoutEndTime.value) return 'N/A';
  const durationMs = workoutEndTime.value.getTime() - workoutStartTime.value.getTime();
  if (durationMs < 0) return 'N/A';
  const totalSeconds = Math.floor(durationMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  let formatted = '';
  if (hours > 0) formatted += `${hours}h `;
  formatted += `${minutes}m ${seconds}s`;
  return formatted.trim() || '0s';
});

const totalWorkoutVolume = computed(() => {
  const volLbs = workoutLog.reduce((volume, set) => {
    if (typeof set.actualWeight === 'number' && typeof set.actualReps === 'number' && set.actualReps > 0) {
      return volume + (set.actualWeight * set.actualReps);
    }
    return volume;
  }, 0);
  return toDisplay(volLbs, settings.value.weightUnit);
});

const allExercisesComplete = computed(() => sessionExercises.length > 0 && currentExerciseIndex.value >= sessionExercises.length);
const currentExercise = computed<SessionExercise | null>(() => (sessionExercises.length > 0 && currentExerciseIndex.value < sessionExercises.length) ? sessionExercises[currentExerciseIndex.value] : null);

// NEW: Computed property for current exercise's progress data
const currentExerciseProgress = computed<ExerciseProgress | undefined>(() => {
  if (currentExercise.value) {
    const progressKey = currentExercise.value.exerciseName.toLowerCase().replace(/\s+/g, '_');
    return initialExerciseProgressData.get(progressKey);
  }
  return undefined;
});

// NEW: Computed property to check for last attempt failure
const didFailLastAttemptAtCurrentPrescription = computed(() => {
  if (currentExerciseProgress.value) {
    return (currentExerciseProgress.value.consecutiveFailedWorkoutsAtCurrentWeightAndReps ?? 0) > 0;
  }
  return false;
});

// Computed properties for effective prescribed values (accounting for overrides)
const getEffectivePrescribedReps = computed((): number => {
  if (overriddenRepsForCurrentSet.value !== null) {
    return overriddenRepsForCurrentSet.value;
  }
  return currentExercise.value?.prescribedReps || 0;
});

const getEffectivePrescribedWeight = computed((): number => {
  if (overriddenWeightForCurrentSet.value !== null) {
    return overriddenWeightForCurrentSet.value;
  }
  return currentExercise.value?.prescribedWeight || 0;
});


const formattedRestTime = computed(() => { const m = Math.floor(restCountdown.value / 60); const s = restCountdown.value % 60; return `${m}:${s < 10 ? '0' : ''}${s}`; });
const timerProgressPercentage = computed(() => (workoutPhase.value === 'resting' && restDurationToUse.value > 0) ? (restCountdown.value / restDurationToUse.value) * 100 : 100);

interface TimelineSetInfo { exerciseName: string; setNumberWithinExercise: number; }
const allSetsInSessionForTimeline = computed<TimelineSetInfo[]>(() => {
  const flatList: TimelineSetInfo[] = [];
  sessionExercises.forEach(exercise => {
    for (let i = 1; i <= (exercise.targetSets || 0); i++) {
      flatList.push({ exerciseName: exercise.exerciseName, setNumberWithinExercise: i });
    }
  });
  return flatList;
});

const nextSetDetails = computed(() => {
  if (!currentExercise.value && workoutPhase.value !== 'overview') return null;
  let tempCurrentSetNumber = currentSetNumber.value;
  let tempCurrentExerciseIndex = currentExerciseIndex.value;
  if (workoutPhase.value === 'overview' && sessionExercises.length > 0) {
      const firstExercise = sessionExercises[0];
      return { 
        ...firstExercise, 
        exerciseName: firstExercise.exerciseName, 
        setNumber: 1, 
        targetSets: firstExercise.targetSets, 
        prescribedReps: firstExercise.prescribedReps, 
        prescribedWeight: firstExercise.prescribedWeight,
        isTimed: firstExercise.isTimed
      };
  }
  if (!currentExercise.value) return null;
  let nextExerciseDetails = currentExercise.value;
  if (tempCurrentSetNumber < nextExerciseDetails.targetSets) {
    tempCurrentSetNumber++;
  } else {
    tempCurrentExerciseIndex++;
    if (tempCurrentExerciseIndex < sessionExercises.length) {
      nextExerciseDetails = sessionExercises[tempCurrentExerciseIndex];
      tempCurrentSetNumber = 1;
    } else {
      return null;
    }
  }
  return {
    ...nextExerciseDetails,
    exerciseName: nextExerciseDetails.exerciseName,
    setNumber: tempCurrentSetNumber,
    targetSets: nextExerciseDetails.targetSets,
    prescribedReps: nextExerciseDetails.prescribedReps,
    prescribedWeight: toDisplay(nextExerciseDetails.prescribedWeight, settings.value.weightUnit),
    isTimed: nextExerciseDetails.isTimed
  };
});

const formattedActiveSetTime = computed(() => {
  const minutes = Math.floor(activeSetTimeElapsed.value / 60);
  const seconds = activeSetTimeElapsed.value % 60;
  return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
});

const displayDurationForCompletedWorkout = computed(() => {
  if (workoutPhase.value !== 'complete' || !workoutStartTime.value || !workoutEndTime.value) return 'N/A';
  const durationMs = workoutEndTime.value.getTime() - workoutStartTime.value.getTime();
  if (durationMs < 0) return 'N/A';
  const minutes = Math.floor(durationMs / 60000);
  
  if (minutes === undefined || minutes === null || isNaN(minutes) || minutes < 0) return 'N/A';
  if (minutes === 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  let formatted = '';
  if (h > 0) formatted += `${h}h `;
  if (m > 0 || h === 0) formatted += `${m}m`;
  return formatted.trim();
});

const completedPerformedExercisesSummary = computed<PerformedExerciseInLog[]>(() => {
  if (workoutPhase.value !== 'complete' || !currentWorkoutDayDetails.value?.exercises) {
    return [];
  }

  const groupedExercises: { [key: string]: LoggedSetData[] } = {};
  workoutLog.forEach(set => {
    if (!groupedExercises[set.exerciseId]) {
      groupedExercises[set.exerciseId] = [];
    }
    groupedExercises[set.exerciseId].push({...set}); 
  });

  return currentWorkoutDayDetails.value.exercises
    .map(exConfig => {
      const setsForThisEx = groupedExercises[exConfig.id]?.sort((a, b) => a.setNumber - b.setNumber) || [];
      
      if (setsForThisEx.length === 0) return null; 

      let isExercisePR = false;
      const exKey = exConfig.exerciseName.toLowerCase().replace(/\s+/g, '_');
      const initialProg = initialExerciseProgressData.get(exKey);
      const doneSetsCount = setsForThisEx.filter(s => s.status === 'done').length;
      const targetSets = exConfig.targetSets || 0;
      const sessionExerciseConfig = sessionExercises.find(se => se.id === exConfig.id);

      if (sessionExerciseConfig && doneSetsCount === targetSets && targetSets > 0 && initialProg) {
        if (sessionExerciseConfig.prescribedWeight === initialProg.currentWeightToAttempt &&
            sessionExerciseConfig.prescribedReps === initialProg.repsToAttemptNext) {
          if (!initialProg.lastWorkoutAllSetsSuccessfulAtCurrentWeight ||
              (initialProg.consecutiveFailedWorkoutsAtCurrentWeightAndReps && initialProg.consecutiveFailedWorkoutsAtCurrentWeightAndReps > 0) ) {
            isExercisePR = true;
          } else {
            if (initialProg.repsToAttemptNext >= exConfig.maxReps) {
              isExercisePR = true;
            } else {
              const nextRepsIfSuccessful = Math.min(initialProg.repsToAttemptNext + exConfig.repOverloadStep, exConfig.maxReps);
              if (nextRepsIfSuccessful > initialProg.repsToAttemptNext) {
                isExercisePR = true;
              } else if (initialProg.repsToAttemptNext === exConfig.maxReps) {
                isExercisePR = true;
              }
            }
          }
        }
      }
      return {
        exerciseId: exConfig.id,
        exerciseName: exConfig.exerciseName,
        sets: setsForThisEx,
        isPR: isExercisePR,
      };
    })
    .filter(ex => ex !== null) as PerformedExerciseInLog[];
});

const displayConsolidatedSetsInfo = computed(() => {
  const total = workoutLog.length;
  return `${total} (Done: ${completedSetsCount.value}, Failed: ${failedSetsCount.value})`;
});

const getRepresentativeSetInfo = (sets: LoggedSetData[]): string => {
  if (!sets || sets.length === 0) return '';
  let representativeSet: LoggedSetData | null = null;
  let maxWeight = -1;

  for (const set of sets) {
    if (set.status === 'done' && set.actualReps > 0 && typeof set.actualWeight === 'number' && set.actualWeight >= 0) {
      if (set.actualWeight > maxWeight) {
        maxWeight = set.actualWeight;
        representativeSet = set;
      } else if (set.actualWeight === maxWeight && representativeSet && set.actualReps > representativeSet.actualReps) {
        representativeSet = set;
      }
    }
  }
  
  if (!representativeSet) {
    representativeSet = sets.find(s => s.actualReps > 0 && typeof s.actualWeight === 'number' && s.actualWeight >=0) || (sets.length > 0 ? sets[0] : null);
  }

  if (representativeSet && typeof representativeSet.actualWeight === 'number' && typeof representativeSet.actualReps === 'number') {
    return `${toDisplay(representativeSet.actualWeight, settings.value.weightUnit)} ${displayUnit(settings.value.weightUnit)} x ${representativeSet.actualReps} ${representativeSet.isTimed ? 'sec' : 'reps'}`;
  }
  return '';
};

const getExerciseStatusForDisplay = (exercise: PerformedExerciseInLog): string => {
  const doneSets = exercise.sets.filter(s => s.status === 'done').length;
  const totalPerformed = exercise.sets.length;
  if (totalPerformed === 0) return "No sets recorded";
  return `${doneSets}/${totalPerformed} sets done`;
};

const getExerciseLineSuffixForDisplay = (performedExercise: PerformedExerciseInLog): string => {
  if (!performedExercise.sets || performedExercise.sets.length === 0) return '';
  const repInfo = getRepresentativeSetInfo(performedExercise.sets);
  if (repInfo) {
    return `, ${repInfo}`; 
  }
  return '';
};


// --- Wake Lock Functions ---
const requestWakeLock = async () => {
  if ('wakeLock' in navigator && !wakeLockSentinel.value) {
    try {
      wakeLockSentinel.value = await navigator.wakeLock.request('screen');
      wakeLockSentinel.value.addEventListener('release', () => {
        console.log('Screen Wake Lock was released.');
        wakeLockSentinel.value = null;
      });
      console.log('Screen Wake Lock is active.');
    } catch (err: any) {
      console.warn(`Could not acquire screen wake lock: ${err.name}, ${err.message}. Your phone might lock during the workout.`);
      wakeLockSentinel.value = null;
    }
  }
};

const releaseWakeLock = async () => {
  if (wakeLockSentinel.value) {
    try {
      await wakeLockSentinel.value.release();
      console.log('Screen Wake Lock released by component.');
      wakeLockSentinel.value = null;
    } catch (err: any) {
      console.warn(`Failed to release wake lock: ${err.name}, ${err.message}`);
      wakeLockSentinel.value = null;
    }
  }
};

const handleVisibilityChange = async () => {
  if (!wakeLockSentinel.value &&
      document.visibilityState === 'visible' &&
      (workoutPhase.value === 'activeSet' || workoutPhase.value === 'resting')) {
    console.log('Document became visible and workout is active, attempting to re-acquire wake lock.');
    await requestWakeLock();
  }
};

// --- Functions ---
const toggleProgressDotTooltip = (index: number, text: string) => {
  if (showMobileTooltipForIndex.value === index) {
    showMobileTooltipForIndex.value = null;
    mobileTooltipText.value = '';
  } else {
    showMobileTooltipForIndex.value = index;
    mobileTooltipText.value = text;
  }
};

const toggleSetDetailsInSummary = () => {
  showSetDetailsInSummary.value = !showSetDetailsInSummary.value;
};


const startActivitySetTimer = () => {
  activeSetTimeElapsed.value = 0;
  if (activeSetTimerInterval) clearInterval(activeSetTimerInterval);
  activeSetTimerInterval = setInterval(() => {
    activeSetTimeElapsed.value++;
  }, 1000);
};

const stopActivitySetTimer = () => {
  if (activeSetTimerInterval) {
    clearInterval(activeSetTimerInterval);
    activeSetTimerInterval = undefined;
  }
};

const fetchWorkoutData = async () => {
  if (!user.value || !user.value.uid || !props.programId || !props.dayId) {
    error.value = "Missing required information to load workout."; isLoading.value = false; return;
  }
  isLoading.value = true; error.value = null;
  sessionExercises.length = 0; workoutLog.length = 0;
  currentExerciseIndex.value = 0; currentSetNumber.value = 1;
  workoutPhase.value = 'overview'; workoutStartTime.value = null; workoutEndTime.value = null;
  showActualRepsInputForFail.value = false; activeSetTimeElapsed.value = 0;
  showMobileTooltipForIndex.value = null; mobileTooltipText.value = '';
  initialExerciseProgressData.clear(); 
  sessionOverallNotes.value = ""; 
  showSetDetailsInSummary.value = false;

  try {
    const programDocRef = doc(db, 'users', user.value.uid, 'trainingPrograms', props.programId);
    const programSnap = await getDoc(programDocRef);
    if (!programSnap.exists()) throw new Error(`Training program with ID ${props.programId} not found.`);
    const programData = programSnap.data();
    activeProgramName.value = programData?.programName || 'Unnamed Routine';
    const workoutDay = programData?.workoutDays?.find((d: WorkoutDayInRoutine) => d.id === props.dayId);
    if (!workoutDay) throw new Error(`Workout day with ID ${props.dayId} not found in program.`);
    currentWorkoutDayDetails.value = workoutDay;

    if (workoutDay.exercises && workoutDay.exercises.length > 0) {
      for (const exConfig of workoutDay.exercises) { 
        const exProgressKey = exConfig.exerciseName.toLowerCase().replace(/\s+/g, '_');
        const progressDocRef = doc(db, 'users', user.value.uid, 'exerciseProgress', exProgressKey);
        const progressSnap = await getDoc(progressDocRef);
        let pWeight = exConfig.startingWeight ?? 0;
        let pReps = exConfig.minReps;
        if (progressSnap.exists()) {
          const currentExerciseProgData = progressSnap.data() as ExerciseProgress;
          initialExerciseProgressData.set(exProgressKey, currentExerciseProgData);
          pWeight = currentExerciseProgData.currentWeightToAttempt;
          pReps = currentExerciseProgData.repsToAttemptNext;
        } else {
          const baselineProgress: ExerciseProgress = {
              exerciseName: exConfig.exerciseName,
              currentWeightToAttempt: pWeight, 
              repsToAttemptNext: pReps,       
              lastWorkoutAllSetsSuccessfulAtCurrentWeight: false,
              consecutiveFailedWorkoutsAtCurrentWeightAndReps: 0
          };
          initialExerciseProgressData.set(exProgressKey, baselineProgress);
          console.warn(`No progress document found for ${exConfig.exerciseName}. Prescribing based on routine's min reps and starting weight (or default 0).`);
        }
        sessionExercises.push({ ...exConfig, prescribedWeight: pWeight, prescribedReps: pReps });
      }
    }
    if (sessionExercises.length === 0 && workoutDay.exercises && workoutDay.exercises.length > 0) {
        error.value = "Could not prepare exercises for this session. Check exercise progress data.";
    }
  } catch (e: any) { error.value = e.message || "Failed to load workout details."; }
  finally { isLoading.value = false; }
};

const beginActiveWorkout = async () => {
  if (sessionExercises.length === 0) {
    error.value = "No exercises to start. Please define exercises in your routine.";
    workoutPhase.value = 'overview'; return;
  }
  workoutStartTime.value = new Date();
  workoutPhase.value = 'activeSet'; 
  startActivitySetTimer();
  showMobileTooltipForIndex.value = null;
  
  // Create initial draft workout
  await saveDraftWorkout();
};

// Generate short sounds programmatically (very short to minimize interruption)
// Audio logic is now centralized in utils/audio.ts

// generateSound logic removed (it's in useAudio/audio.ts now directly)

const playTimerSound = async () => {
    // Respect mute setting
    if (settings.value.timerSound === 'mute') return;

    // Use settings for volume and type
    const volume = settings.value.timerVolume;
    // Map settings sound to expected handle (no major change needed as strict types match mostly)
    const soundType = settings.value.timerSound === 'bell' ? 'bell' : settings.value.timerSound; 
    
    // Pass existing audioContext if initialized, though playTone handles it too.
    // We try to init context on mount, so it might be ready.
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    try {
        await playTone(soundType, volume, audioContext);
    } catch (e) {
        console.warn("Error playing timer sound:", e);
    }
};

const startRestTimer = () => {
  if (currentExercise.value && currentExercise.value.customRestSeconds && currentExercise.value.customRestSeconds >= 10) {
    restDurationToUse.value = currentExercise.value.customRestSeconds;
  } else {
    restDurationToUse.value = DEFAULT_REST_SECONDS.value;
  }
  restCountdown.value = restDurationToUse.value;
  showMobileTooltipForIndex.value = null;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (restCountdown.value > 0) {
      restCountdown.value--;
    } else {
      clearInterval(timerInterval);
      timerInterval = undefined;
      playTimerSound();
      proceedToNextSet();
    }
  }, 1000);
};

const logSet = async (status: 'done' | 'failed') => {
  stopActivitySetTimer();
  if (!currentExercise.value) return;
  
  // Use effective prescribed values (from overrides if set, otherwise from exercise)
  const effectiveWeight = getEffectivePrescribedWeight.value;
  const effectiveReps = getEffectivePrescribedReps.value;
  
  const loggedSet: LoggedSetData = {
    exerciseId: currentExercise.value.id, 
    exerciseName: currentExercise.value.exerciseName, 
    setNumber: currentSetNumber.value, 
    prescribedWeight: effectiveWeight, 
    prescribedReps: effectiveReps,     
    actualWeight: effectiveWeight, 
    actualReps: status === 'done' ? (currentExercise.value.isTimed ? effectiveReps : effectiveReps) : (currentExercise.value.isTimed ? (effectiveReps - holdCountdown.value) : 0),
    status: status, 
    timestamp: new Date(),
    isTimed: currentExercise.value.isTimed || false,
  };

  if (currentExercise.value.isTimed && isHoldTimerRunning.value) {
    stopHoldTimer(false);
  }
  
  workoutLog.push(loggedSet);
  lastLoggedSetIndex.value = workoutLog.length - 1;
  
  // Clear overrides after logging the set (they only apply to one set)
  overriddenRepsForCurrentSet.value = null;
  overriddenWeightForCurrentSet.value = null;
  const isLastExerciseInSession = currentExerciseIndex.value === sessionExercises.length - 1;
  const isLastSetOfThisExercise = currentSetNumber.value === currentExercise.value.targetSets;
  showActualRepsInputForFail.value = status === 'failed';
  if (status === 'failed') { actualRepsForFailedSet.value = null; }
  if (isLastExerciseInSession && isLastSetOfThisExercise) {
    currentExerciseIndex.value++;
    workoutPhase.value = 'complete'; 
    workoutEndTime.value = new Date(); 
    showMobileTooltipForIndex.value = null;
  } else {
    workoutPhase.value = 'resting'; 
    startRestTimer();
  }
  
  // Auto-save draft after logging set
  await saveDraftWorkout();
};

// Draft workout functions
const getDraftWorkoutRef = () => {
  if (!user.value?.uid) return null;
  // Use a predictable ID based on programId and dayId
  const draftId = `draft_${props.programId}_${props.dayId}`;
  return doc(db, 'users', user.value.uid, 'draftWorkouts', draftId);
};

// Helper function to validate and convert dates for Firestore
const ensureValidDate = (dateValue: Date | Timestamp | null | undefined): Date | null => {
  if (!dateValue) return null;
  if (dateValue instanceof Timestamp) {
    return dateValue.toDate();
  }
  if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
    return dateValue;
  }
  return null;
};

const saveDraftWorkout = async () => {
  if (!user.value?.uid) {
    console.warn('Cannot save draft: no user');
    return;
  }
  
  if (!currentWorkoutDayDetails.value) {
    console.warn('Cannot save draft: no workout day details');
    return;
  }
  
  if (!props.programId || !props.dayId) {
    console.warn('Cannot save draft: missing programId or dayId', { programId: props.programId, dayId: props.dayId });
    return;
  }
  
  try {
    const draftRef = getDraftWorkoutRef();
    if (!draftRef) {
      console.error('Failed to get draft ref');
      return;
    }
    
    // Build draft data object - use 'any' type to conditionally add createdAt
    const draftData: any = {
      userId: user.value.uid,
      programId: props.programId,
      dayId: props.dayId,
      programName: activeProgramName.value || '',
      dayName: currentWorkoutDayDetails.value.dayName,
      // Validate and convert all timestamps in workoutLog
      workoutLog: workoutLog.map(set => {
        const validTimestamp = ensureValidDate(set.timestamp);
        if (!validTimestamp) {
          console.warn('Invalid timestamp in set, using current date:', set);
        }
        return {
          ...set,
          timestamp: validTimestamp || new Date()
        };
      }),
      sessionExercises: sessionExercises.map(ex => ({ ...ex })),
      currentExerciseIndex: currentExerciseIndex.value,
      currentSetNumber: currentSetNumber.value,
      workoutPhase: workoutPhase.value,
      // Validate workoutStartTime before saving
      workoutStartTime: ensureValidDate(workoutStartTime.value),
      sessionOverallNotes: sessionOverallNotes.value,
      lastUpdated: serverTimestamp(),
    };
    
    // Determine if this is a new draft or an update
    // Compare with expected ref ID (constructed from props) to ensure consistency
    const expectedDraftId = draftRef.id;
    const isNewDraft = !draftWorkoutId.value || draftWorkoutId.value !== expectedDraftId;
    
    // Only set createdAt on first save
    // Firestore doesn't allow undefined values, so we conditionally add it
    if (isNewDraft) {
      draftData.createdAt = serverTimestamp();
    }
    
    console.log('💾 Saving draft workout:', {
      programId: props.programId,
      dayId: props.dayId,
      setsCount: workoutLog.length,
      phase: workoutPhase.value,
      currentDraftId: draftWorkoutId.value,
      expectedDraftId: expectedDraftId,
      isUpdate: !isNewDraft,
      isNewDraft: isNewDraft
    });
    
    await setDoc(draftRef, draftData, { merge: true });
    
    // CRITICAL: Always set draftWorkoutId to the expected ref ID after save
    // This ensures consistency - we always use the ID constructed from props
    draftWorkoutId.value = expectedDraftId;
    
    console.log('✅ Draft workout saved successfully', { 
      draftId: draftWorkoutId.value, 
      setsCount: workoutLog.length,
      phase: workoutPhase.value 
    });
  } catch (error) {
    console.error('❌ Failed to save draft workout:', error);
  }
};

const loadDraftWorkout = async () => {
  if (!user.value?.uid) {
    console.log('Cannot load draft: no user');
    return null;
  }
  
  if (!props.programId || !props.dayId) {
    console.log('Cannot load draft: missing programId or dayId', { programId: props.programId, dayId: props.dayId });
    return null;
  }
  
  try {
    const draftRef = getDraftWorkoutRef();
    if (!draftRef) {
      console.error('Failed to get draft ref for loading');
      return null;
    }
    
    console.log('Loading draft workout:', { programId: props.programId, dayId: props.dayId, path: draftRef.path });
    const draftSnap = await getDoc(draftRef);
    
    if (draftSnap.exists()) {
      const data = draftSnap.data() as Omit<DraftWorkout, 'id'>;
      console.log('✅ Draft found:', { setsCount: data.workoutLog?.length || 0, phase: data.workoutPhase });
      return { id: draftSnap.id, ...data } as DraftWorkout;
    } else {
      console.log('No draft found at path:', draftRef.path);
    }
    return null;
  } catch (error) {
    console.error('❌ Failed to load draft workout:', error);
    return null;
  }
};

const deleteDraftWorkout = async () => {
  if (!user.value?.uid) return;
  
  try {
    const draftRef = getDraftWorkoutRef();
    if (!draftRef) return;
    
    await deleteDoc(draftRef);
    draftWorkoutId.value = null;
    console.log('Draft workout deleted');
  } catch (error) {
    console.error('Failed to delete draft workout:', error);
  }
};

// Helper function to convert Firestore Timestamp or Date to Date object
const convertToDate = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  
  // Already a Date object
  if (timestamp instanceof Date && !isNaN(timestamp.getTime())) {
    return timestamp;
  }
  
  // Firestore Timestamp (has toDate method)
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  // Firestore Timestamp (alternative format with seconds)
  if (timestamp && typeof timestamp.seconds === 'number') {
    return new Date(timestamp.seconds * 1000);
  }
  
  // Try to parse as date string or number
  try {
    const parsed = new Date(timestamp);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse timestamp:', e);
  }
  
  // Fallback to current date
  return new Date();
};

const restoreDraftWorkout = (draft: DraftWorkout) => {
  // Restore all state from draft (but don't set draftWorkoutId here - let caller handle it)
  workoutLog.length = 0;
  if (draft.workoutLog && draft.workoutLog.length > 0) {
    workoutLog.push(...draft.workoutLog.map(set => ({
      ...set,
      timestamp: convertToDate(set.timestamp)
    })));
  }
  
  sessionExercises.length = 0;
  if (draft.sessionExercises && draft.sessionExercises.length > 0) {
    sessionExercises.push(...draft.sessionExercises.map(ex => ({ ...ex })));
  }
  
  currentExerciseIndex.value = draft.currentExerciseIndex || 0;
  currentSetNumber.value = draft.currentSetNumber || 1;
  workoutPhase.value = draft.workoutPhase || 'overview';
  // Handle workoutStartTime - use convertToDate helper
  if (draft.workoutStartTime) {
    const parsedDate = convertToDate(draft.workoutStartTime);
    // Validate the parsed date
    if (parsedDate instanceof Date && !isNaN(parsedDate.getTime())) {
      workoutStartTime.value = parsedDate;
    } else {
      console.warn('Invalid workoutStartTime in draft, using null');
      workoutStartTime.value = null;
    }
  } else {
    workoutStartTime.value = null;
  }
  sessionOverallNotes.value = draft.sessionOverallNotes || '';
  
  // Don't set draftWorkoutId here - let the caller set it using getDraftWorkoutRef()
  // This ensures we always use the ref ID (constructed from props) not the stored document ID
  
  console.log('✅ Draft workout state restored', {
    setsCount: workoutLog.length,
    exercisesCount: sessionExercises.length,
    phase: workoutPhase.value,
    exerciseIndex: currentExerciseIndex.value,
    setNumber: currentSetNumber.value
  });
};

// Resume/discard draft handlers
const resumeDraft = async () => {
  showDraftPrompt.value = false;
  isLoading.value = true;
  
  const draft = window._pendingDraft as DraftWorkout;
  if (!draft) {
    console.error('No pending draft found');
    isLoading.value = false;
    await fetchWorkoutData();
    return;
  }
  
  try {
    // Load workout data first to get exercise configs (without clearing state)
    // We need the program/day details to be loaded
    if (!user.value?.uid || !props.programId || !props.dayId) {
      error.value = "Missing required information to load workout."; 
      isLoading.value = false; 
      return;
    }
    
    error.value = null;
    
    // Load program and day details without clearing the restored state
    const programDocRef = doc(db, 'users', user.value.uid, 'trainingPrograms', props.programId);
    const programSnap = await getDoc(programDocRef);
    
    if (programSnap.exists()) {
      const programData = programSnap.data();
      activeProgramName.value = programData.programName || '';
      
      const dayData = programData.workoutDays?.find((d: any) => d.id === props.dayId);
      if (dayData) {
        currentWorkoutDayDetails.value = {
          id: dayData.id,
          dayName: dayData.dayName,
          order: dayData.order,
          exercises: dayData.exercises || []
        };
      }
      
      // Load exercise progress data if user exists
      if (user.value?.uid) {
        const progressPromises = draft.sessionExercises.map(async (sessionEx) => {
          const progressKey = sessionEx.exerciseName.toLowerCase().replace(/\s+/g, '_');
          const progressRef = doc(db, 'users', user.value!.uid, 'exerciseProgress', progressKey);
          const progressSnap = await getDoc(progressRef);
          if (progressSnap.exists()) {
            const progressData = progressSnap.data() as ExerciseProgress;
            initialExerciseProgressData.set(progressKey, progressData);
          }
        });
        await Promise.all(progressPromises);
      }
    }
    
    // Get the draft ref FIRST (before restoring, to ensure we use the correct ID)
    const draftRef = getDraftWorkoutRef();
    if (!draftRef) {
      console.error('Failed to get draft ref');
      isLoading.value = false;
      return;
    }
    
    // Now restore the draft state (this will set all the workout state)
    // But we'll set the draft ID to the ref ID (not draft.id) to ensure consistency
    restoreDraftWorkout(draft);
    
    // CRITICAL: Always use the ref ID (constructed from props) not the document ID from draft
    // This ensures we're updating the same draft document
    draftWorkoutId.value = draftRef.id;
    
    console.log('✅ Draft restored successfully', { 
      setsCount: workoutLog.length, 
      phase: workoutPhase.value,
      draftId: draftWorkoutId.value,
      refId: draftRef.id,
      matches: draftWorkoutId.value === draftRef.id
    });
    
    // If the workout was in a rest period, restart the rest timer
    if (workoutPhase.value === 'resting') {
      startRestTimer();
    } else if (workoutPhase.value === 'activeSet') {
      // If the workout was in an active set, restart the activity timer
      startActivitySetTimer();
    }
    
  } catch (e: any) {
    console.error('Error resuming draft:', e);
    error.value = "Failed to resume workout: " + e.message;
  } finally {
    isLoading.value = false;
    delete window._pendingDraft;
  }
};

const discardDraft = async () => {
  showDraftPrompt.value = false;
  hasDraft.value = false;
  
  // Delete the draft from Firestore
  await deleteDraftWorkout();
  
  // Load fresh workout data
  isLoading.value = true;
  await fetchWorkoutData();
  delete window._pendingDraft;
};

const proceedToNextSet = () => {
  if (timerInterval) clearInterval(timerInterval); timerInterval = undefined;
  if (showActualRepsInputForFail.value && lastLoggedSetIndex.value !== null && workoutLog[lastLoggedSetIndex.value]) {
    if (actualRepsForFailedSet.value !== null && actualRepsForFailedSet.value >= 0) {
      workoutLog[lastLoggedSetIndex.value].actualReps = actualRepsForFailedSet.value;
    }
  }
  showActualRepsInputForFail.value = false;
  actualRepsForFailedSet.value = null;
  showMobileTooltipForIndex.value = null;
  
  // Clear any overrides when moving to next set (overrides only apply to the set they were set for)
  overriddenRepsForCurrentSet.value = null;
  overriddenWeightForCurrentSet.value = null;
  if (currentExercise.value) {
    if (currentSetNumber.value < currentExercise.value.targetSets) {
      currentSetNumber.value++;
    } else {
      currentExerciseIndex.value++;
      currentSetNumber.value = 1;
    }
  }
  if (allExercisesComplete.value) { 
    workoutPhase.value = 'complete'; 
    workoutEndTime.value = new Date(); 
    stopActivitySetTimer(); 
  } else { 
    workoutPhase.value = 'activeSet'; 
    startActivitySetTimer();
    
    // Save draft when starting a new set so we can resume here if user leaves
    saveDraftWorkout();
  }
};

const correctLastSet = () => {
  if (workoutLog.length === 0) {
    console.warn("No sets in log to correct.");
    return;
  }

  if (timerInterval) { 
    clearInterval(timerInterval);
    timerInterval = undefined;
  }

  const setToCorrect = workoutLog.pop();
  if (!setToCorrect) { 
     console.error("Popped set is undefined, cannot correct.");
     startRestTimer(); 
     return;
  }

  const exerciseConfigIndex = sessionExercises.findIndex(ex => ex.id === setToCorrect.exerciseId);
  if (exerciseConfigIndex === -1) {
    console.error("Could not find exercise config for the set to correct. Restoring popped set.");
    workoutLog.push(setToCorrect); 
    startRestTimer(); 
    return;
  }
  currentExerciseIndex.value = exerciseConfigIndex;
  currentSetNumber.value = setToCorrect.setNumber;

  showActualRepsInputForFail.value = false;
  actualRepsForFailedSet.value = null;
  lastLoggedSetIndex.value = workoutLog.length > 0 ? workoutLog.length - 1 : null;
  
  // Clear any overrides when correcting back to a set
  overriddenRepsForCurrentSet.value = null;
  overriddenWeightForCurrentSet.value = null;

  workoutPhase.value = 'activeSet';
  startActivitySetTimer();
  
  // Save draft when correcting to active set so we can resume here if user leaves
  saveDraftWorkout();

  showMobileTooltipForIndex.value = null;
  mobileTooltipText.value = '';

  console.log("Correcting set:", setToCorrect.exerciseName, "Set", setToCorrect.setNumber);
};


const finishWorkoutAndSave = async () => {
  if (!user.value || !user.value.uid || !currentWorkoutDayDetails.value || !props.programId) {
    error.value = "Cannot save workout: missing user or workout context."; isSaving.value = false; return;
  }
  if (workoutPhase.value === 'complete' && showActualRepsInputForFail.value && lastLoggedSetIndex.value !== null && workoutLog[lastLoggedSetIndex.value]?.status === 'failed') {
    if (actualRepsForFailedSet.value !== null && actualRepsForFailedSet.value >= 0) {
      workoutLog[lastLoggedSetIndex.value].actualReps = actualRepsForFailedSet.value;
    }
  }
  if (workoutLog.length === 0) { error.value = "No sets were logged. Workout not saved."; return; }
  isSaving.value = true; error.value = null;
  
  const performedExercisesForDatabase = completedPerformedExercisesSummary.value.map(ex => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      sets: ex.sets.map(s => ({ 
          ...s, 
          timestamp: s.timestamp instanceof Timestamp ? s.timestamp.toDate() : s.timestamp
      })),
      isPR: ex.isPR,
  }));

  if (performedExercisesForDatabase.length === 0) { 
    error.value = "No exercises with logged sets to save."; 
    isSaving.value = false; 
    return; 
  }

  if (!workoutStartTime.value) {
    if (workoutLog.length > 0) {
      const firstTs = workoutLog[0].timestamp;
      if (firstTs instanceof Timestamp) {
        workoutStartTime.value = firstTs.toDate();
      } else if (firstTs instanceof Date) {
        workoutStartTime.value = firstTs;
      } else {
        workoutStartTime.value = new Date();
      }
    } else {
      workoutStartTime.value = new Date();
    }
  }
  if (!workoutEndTime.value) workoutEndTime.value = new Date(); 

  const durationMs = workoutEndTime.value!.getTime() - workoutStartTime.value!.getTime(); 
  const durationMinutes = Math.max(0, Math.floor(durationMs / 60000));

  const newLoggedWorkoutRef = doc(collection(db, 'users', user.value.uid, 'loggedWorkouts'));
  const loggedWorkoutData = {
    id: newLoggedWorkoutRef.id, userId: user.value.uid, date: serverTimestamp(),
    trainingProgramIdUsed: props.programId, trainingProgramNameUsed: activeProgramName.value,
    workoutDayNameUsed: currentWorkoutDayDetails.value.dayName, workoutDayIdUsed: props.dayId,
    performedExercises: performedExercisesForDatabase, 
    overallSessionNotes: sessionOverallNotes.value,
    // Ensure dates are valid Date objects before saving
    startTime: ensureValidDate(workoutStartTime.value), 
    endTime: ensureValidDate(workoutEndTime.value), 
    durationMinutes: durationMinutes
  };

  const batch = writeBatch(db);
  batch.set(newLoggedWorkoutRef, loggedWorkoutData);

  try {
    for (const performedEx of performedExercisesForDatabase) { 
      const exConfigFromRoutine = currentWorkoutDayDetails.value?.exercises.find(cfg => cfg.id === performedEx.exerciseId);
      if (!exConfigFromRoutine) { console.warn(`Config for ${performedEx.exerciseName} not found. Skipping prog.`); continue; }
      if (exConfigFromRoutine.enableProgression === false) { console.log(`Progression disabled for ${exConfigFromRoutine.exerciseName}.`); continue; }

      const progressKey = performedEx.exerciseName.toLowerCase().replace(/\s+/g, '_');
      const currentProgress = initialExerciseProgressData.get(progressKey); 

      if (!currentProgress) { console.warn(`No initial progress found for ${performedEx.exerciseName} during save's progression update. Skipping.`); continue; }
      
      const progressDocRef = doc(db, 'users', user.value.uid, 'exerciseProgress', progressKey);

      let allSetsMarkedDone = true;
      if (performedEx.sets.length < exConfigFromRoutine.targetSets) { allSetsMarkedDone = false; }
      else { for (const set of performedEx.sets) { if (set.status !== 'done') { allSetsMarkedDone = false; break; } } }

      const newProgressUpdate: Partial<ExerciseProgress> = { lastPerformedDate: serverTimestamp() };
      if (allSetsMarkedDone) {
        newProgressUpdate.consecutiveFailedWorkoutsAtCurrentWeightAndReps = 0;
        newProgressUpdate.lastWorkoutAllSetsSuccessfulAtCurrentWeight = true;
        if (currentProgress.repsToAttemptNext >= exConfigFromRoutine.maxReps) {
          newProgressUpdate.currentWeightToAttempt = currentProgress.currentWeightToAttempt + exConfigFromRoutine.weightIncrement;
          newProgressUpdate.repsToAttemptNext = exConfigFromRoutine.minReps;
        } else {
          newProgressUpdate.currentWeightToAttempt = currentProgress.currentWeightToAttempt;
          newProgressUpdate.repsToAttemptNext = Math.min(currentProgress.repsToAttemptNext + exConfigFromRoutine.repOverloadStep, exConfigFromRoutine.maxReps);
        }
      } else {
        newProgressUpdate.lastWorkoutAllSetsSuccessfulAtCurrentWeight = false;
        newProgressUpdate.consecutiveFailedWorkoutsAtCurrentWeightAndReps = (currentProgress.consecutiveFailedWorkoutsAtCurrentWeightAndReps || 0) + 1;
        newProgressUpdate.currentWeightToAttempt = currentProgress.currentWeightToAttempt;
        newProgressUpdate.repsToAttemptNext = currentProgress.repsToAttemptNext;
      }
      batch.update(progressDocRef, newProgressUpdate);
    }
    await batch.commit();

    // Invalidate cache so history page reloads
    invalidateCache();

    // 5. Clean up draft if it exists

    await deleteDraftWorkout();
    
    workoutLog.length = 0; currentExerciseIndex.value = 0; currentSetNumber.value = 1;
    workoutPhase.value = 'overview'; 
    showActualRepsInputForFail.value = false;
    sessionOverallNotes.value = ""; 
    showMobileTooltipForIndex.value = null; mobileTooltipText.value = ''; 
    showSetDetailsInSummary.value = false; 
    router.push('/');
  } catch (e: any) { console.error("Error finishing workout:", e); error.value = "Failed to save. " + e.message; }
  finally { isSaving.value = false; }
};

// --- Lifecycle Hooks ---
let userWatcherUnsubscribe: (() => void) | null = null;
const previousUserRef = ref<typeof user.value | null>(null);

onMounted(async () => {
  isLoading.value = true;
  error.value = null; // Clear any existing errors
  
  // Check for draft workout before loading fresh data
  if (user.value && user.value.uid && props.programId && props.dayId) {
    isLoadingDraft.value = true;
    const draft = await loadDraftWorkout();
    isLoadingDraft.value = false;
    
    if (draft && (draft.workoutLog.length > 0 || draft.workoutPhase !== 'overview')) {
      // Found a draft with progress
      hasDraft.value = true;
      showDraftPrompt.value = true;
      isLoading.value = false;
      error.value = null; // Ensure error is cleared when showing draft prompt
      
      // Store draft for potential restoration
      window._pendingDraft = draft;
      return; // Don't load fresh data yet, wait for user choice
    }
  }
  
  userWatcherUnsubscribe = watch(user, (currentUser) => {
    if (currentUser && currentUser.uid) {
      if (props.programId && props.dayId) {
        if (!activeProgramName.value || previousUserRef.value?.uid !== currentUser.uid) {
          fetchWorkoutData();
        } else { isLoading.value = false; }
      } else { error.value = "Program/Day ID missing."; isLoading.value = false; }
    } else {
      isLoading.value = false; activeProgramName.value = null; currentWorkoutDayDetails.value = null;
      sessionExercises.length = 0; workoutLog.length = 0; workoutPhase.value = 'overview';
      showMobileTooltipForIndex.value = null; mobileTooltipText.value = ''; 
      initialExerciseProgressData.clear(); sessionOverallNotes.value = "";
      showSetDetailsInSummary.value = false; 
      if (currentUser === null) { error.value = "Please log in."; }
    }
    previousUserRef.value = currentUser;
  }, { immediate: true });

  if (timerAudioPlayer.value) {
    timerAudioPlayer.value.load();
  }
  
  // Initialize audio context on mount (needs user interaction on mobile)
  // We'll resume it when needed in playTimerSound
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  } catch (error) {
    console.warn('Failed to initialize audio context:', error);
  }
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onUnmounted(() => {
  if (userWatcherUnsubscribe) userWatcherUnsubscribe();
  if (timerInterval) clearInterval(timerInterval);
  if (activeSetTimerInterval) clearInterval(activeSetTimerInterval);
  releaseWakeLock(); 
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});

// Watch route params to check for draft when navigating to workout
watch(() => [route.params.programId, route.params.dayId], async ([newProgramId, newDayId], [oldProgramId, oldDayId]) => {
  // Only check if params actually changed
  if (newProgramId !== oldProgramId || newDayId !== oldDayId) {
    if (user.value?.uid && newProgramId && newDayId) {
      isLoadingDraft.value = true;
      const draft = await loadDraftWorkout();
      isLoadingDraft.value = false;
      
      if (draft && draft.workoutLog.length > 0) {
        hasDraft.value = true;
        showDraftPrompt.value = true;
        window._pendingDraft = draft;
      } else {
        showDraftPrompt.value = false;
        hasDraft.value = false;
      }
    }
  }
}, { immediate: false });

watch(workoutPhase, async (newPhase, oldPhase) => {
  showMobileTooltipForIndex.value = null;
  mobileTooltipText.value = '';
  if (oldPhase === 'complete' && newPhase !== 'complete') {
    showActualRepsInputForFail.value = false; 
  }
  if (newPhase === 'complete') { 
      if (!workoutEndTime.value) workoutEndTime.value = new Date();
  }

  if (newPhase === 'activeSet' || newPhase === 'resting') {
    await requestWakeLock();
  } else if (newPhase === 'overview' || newPhase === 'complete') {
    await releaseWakeLock();
  }
});

// Edit prescription functions
const openEditPrescriptionModal = () => {
  if (!currentExercise.value) return;
  
  // Initialize with current effective values (accounting for any existing overrides)
  editedReps.value = getEffectivePrescribedReps.value;
  editedWeight.value = toDisplay(getEffectivePrescribedWeight.value, settings.value.weightUnit);
  showEditPrescriptionModal.value = true;
};

const closeEditPrescriptionModal = () => {
  showEditPrescriptionModal.value = false;
  // Don't clear editedReps/editedWeight here - they need to persist for the choice modal
};

const saveEditedPrescription = () => {
  if (editedReps.value === null || editedWeight.value === null) {
    return;
  }
  
  if (editedReps.value < 1) {
    error.value = 'Reps must be at least 1';
    return;
  }
  
  if (editedWeight.value < 0) {
    error.value = 'Weight cannot be negative';
    return;
  }
  
  // Close the edit modal and show the choice modal
  showEditPrescriptionModal.value = false;
  showEditChoiceModal.value = true;
};

const closeEditChoiceModal = () => {
  showEditChoiceModal.value = false;
  // Clear the edited values when canceling
  editedReps.value = null;
  editedWeight.value = null;
};

const updateOnlyThisSetPrescription = () => {
  if (editedReps.value === null || editedWeight.value === null) return;
  
  // Convert back to LBS for internal storage
  const weightInLbs = fromInput(editedWeight.value, settings.value.weightUnit);
  
  overriddenRepsForCurrentSet.value = editedReps.value;
  overriddenWeightForCurrentSet.value = weightInLbs;
  showEditChoiceModal.value = false;
  
  // Clear the edited values when done
  editedReps.value = null;
  editedWeight.value = null;
};

const applyEditAllFutureSets = async () => {
  if (!currentExercise.value || editedReps.value === null || editedWeight.value === null) {
    return;
  }
  
  if (!user.value?.uid) {
    error.value = 'User not logged in';
    return;
  }
  
  try {
    const weightInLbs = fromInput(editedWeight.value, settings.value.weightUnit);
    
    // Update the ExerciseProgress document in Firestore
    const progressKey = currentExercise.value.exerciseName.toLowerCase().replace(/\s+/g, '_');
    const progressDocRef = doc(db, 'users', user.value.uid, 'exerciseProgress', progressKey);
    
    await updateDoc(progressDocRef, {
      currentWeightToAttempt: weightInLbs,
      repsToAttemptNext: editedReps.value
    });
    
    // Update the initialExerciseProgressData cache
    const currentProgress = initialExerciseProgressData.get(progressKey);
    if (currentProgress) {
      currentProgress.currentWeightToAttempt = weightInLbs;
      currentProgress.repsToAttemptNext = editedReps.value;
    }
    
    // Update ALL exercises in sessionExercises that match this exercise ID
    // This ensures that if the same exercise appears multiple times in a routine, all future instances are updated
    sessionExercises.forEach(ex => {
      if (ex.id === currentExercise.value!.id) {
        ex.prescribedWeight = weightInLbs;
        ex.prescribedReps = editedReps.value!;
      }
    });
    
    // Clear any current set overrides (since we're updating the base prescription)
    overriddenRepsForCurrentSet.value = null;
    overriddenWeightForCurrentSet.value = null;
    
    // Clear modals and edited values
    showEditChoiceModal.value = false;
    editedReps.value = null;
    editedWeight.value = null;
    
    console.log('✅ Updated all future sets for', currentExercise.value.exerciseName, {
      newWeight: editedWeight.value,
      newReps: editedReps.value
    });
  } catch (err: any) {
    console.error('Failed to update all future sets:', err);
    error.value = 'Failed to update progression: ' + err.message;
  }
};

// Edit workout functions (for completion screen)
const toggleEditMode = () => {
  isEditModeActive.value = !isEditModeActive.value;
};

const openEditWorkoutModal = (exercise: PerformedExerciseInLog) => {
  // Create a deep copy of the exercise's sets for editing
  editingExercise.value = {
    ...exercise,
    sets: exercise.sets.map(set => ({ ...set }))
  };
  showEditWorkoutModal.value = true;
};

const closeEditWorkoutModal = () => {
  showEditWorkoutModal.value = false;
  editingExercise.value = null;
};

const saveEditedWorkout = () => {
  if (!editingExercise.value) return;
  
  // Find the exercise in workoutLog and update all its sets
  const exerciseId = editingExercise.value.exerciseId;
  
  // Update workoutLog with the edited sets
  editingExercise.value.sets.forEach(editedSet => {
    const setIndex = workoutLog.findIndex(
      set => set.exerciseId === exerciseId && set.setNumber === editedSet.setNumber
    );
    
    if (setIndex !== -1) {
      workoutLog[setIndex] = {
        ...workoutLog[setIndex],
        actualWeight: editedSet.actualWeight,
        actualReps: editedSet.actualReps,
        status: editedSet.status
      };
    }
  });
  
  closeEditWorkoutModal();
};
</script>

<style scoped>
/* NEW styles for failure indication */
.failed-last-attempt-text {
  color: #dc3545 !important; /* Red color, !important to override existing blue if needed */
}

.failure-streak-note {
  color: #dc3545; 
  font-size: 0.85em;
  font-style: italic;
  text-align: center;
  margin-top: 8px; 
  margin-bottom: 10px; 
}

/* Styles for the actions-top-bar and correct-last-set-action */
.actions-top-bar {
  display: flex; 
  justify-content: flex-start; 
  margin-bottom: 10px; 
  min-height: 25px; 
}

.correct-last-set-action {
  font-size: 0.85em;
  color: #007bff; 
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: transparent;
  border: 1px solid transparent; 
  transition: background-color 0.2s, color 0.2s;
  display: inline-flex; 
  align-items: center;
}

.correct-last-set-action:hover {
  background-color: #e9ecef; 
  text-decoration: none; 
}

/* All other existing styles */
.workout-active-view {
  padding-top: 10px; 
  padding-bottom: 10px;
  max-width: 700px; 
  margin: 0 auto;   
}
.card { background-color: var(--color-card-bg);   padding: 20px 25px;
  border-radius: 8px;
  margin-bottom: 25px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  text-align: left;
  border: 1px solid var(--color-card-border);
  color: var(--color-card-text); }
.card-inset { background-color: var(--color-card-mute); padding: 15px; border-radius: 6px; margin-top: 15px; margin-bottom: 15px; border: 1px solid var(--color-card-border); color: var(--color-card-text); }
.workout-overview-content h1, .workout-content h1.workout-day-title, .rest-screen-content h1.workout-day-title { text-align: center; margin-bottom: 5px; font-size: 1.8em; color: var(--color-card-heading); }
.routine-name { text-align: center; margin-top: 0; margin-bottom: 25px; color: var(--color-card-text); opacity: 0.8; font-size: 0.9em; }
.overview-subtitle { text-align: left; font-size: 1.2em; margin-bottom: 15px; color: var(--color-card-heading); font-weight: 500; }
.exercise-overview-list { list-style-type: none; padding: 0; margin-bottom: 25px; }
.exercise-overview-item { padding: 12px; border-bottom: 1px solid var(--color-card-border); font-size: 1em; background-color: var(--color-card-mute); border-radius: 4px; margin-bottom: 8px; color: var(--color-card-text); }
.exercise-overview-item:last-child { border-bottom: none; }
.exercise-overview-item strong { color: #007bff; }
.exercise-overview-item span.overview-details { color: var(--color-card-text); font-size: 0.95em; display: block; margin-top: 4px; opacity: 0.8;}
.exercise-overview-item em { font-size: 0.85em; color: var(--color-card-text); opacity: 0.7; }
.overview-actions { display: flex; flex-direction: column; gap: 10px; margin-top: 20px;}
.button-begin-workout { width: 100%; padding: 15px; font-size: 1.2em; }

.workout-progress-indicator { margin-bottom: 20px; text-align: center; }
.workout-progress-timeline { display: flex; justify-content: center; align-items: center; gap: 4px; margin-bottom: 5px; padding: 5px 0; flex-wrap: wrap; }
.progress-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: var(--color-card-border); transition: background-color 0.3s ease, transform 0.2s ease; cursor: pointer; }
.progress-dot.completed-done { background-color: #28a745; }
.progress-dot.completed-failed { background-color: #ffc107; }
.progress-dot.active { background-color: #007bff; transform: scale(1.3); }
.progress-dot.tooltip-active { outline: 2px solid #007bff; outline-offset: 1px; transform: scale(1.3); }
.progress-dot[title]:hover { outline: 2px solid #007bff; transform: scale(1.2); }
.progress-separator { width: 6px; height: 10px; background-color: #bbb; margin: 0 3px; border-radius: 2px; align-self: center; }

.mobile-progress-tooltip {
  display: inline-block; 
  background-color: #333;
  color: white;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 0.85em;
  margin-top: 10px;
  max-width: 90%;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.current-exercise-block h2 { margin-top: 0; margin-bottom: 10px; font-size: 1.6em; color: var(--color-card-heading); border-bottom: 2px solid #007bff; padding-bottom: 10px;}
.active-set-timer-display { text-align: right; font-size: 0.9em; color: var(--color-card-text); margin-bottom: 15px; padding-right: 5px; opacity: 0.8; }
.exercise-notes { font-style: italic; color: var(--color-card-text); margin-bottom: 15px; font-size: 0.9em; opacity: 0.8; }
.current-set-info h3 { margin-top: 0; margin-bottom: 8px; font-size: 1.3em; color: var(--color-card-heading);}
.set-actions { display: flex; justify-content: space-around; margin-top: 25px; gap: 20px; }
.set-actions button { padding: 12px 0; font-size: 1.1em; font-weight: bold; border: none; border-radius: 5px; color: white; cursor: pointer; flex-grow: 1; margin: 0; max-width: 220px; transition: background-color 0.2s, transform 0.1s; box-shadow: 0 2px 4px rgba(0,0,0,0.15); }
.button-done { background-color: #28a745; }
.button-done:hover { background-color: #218838; transform: translateY(-2px); }
.button-fail { background-color: #dc3545; }
.button-fail:hover { background-color: #c82333; transform: translateY(-2px); }
.rest-screen-content h2 { font-size: 2em; margin-bottom: 10px; text-align: center; color: var(--color-card-heading); }
.timer-display { font-size: 3.5em; font-weight: bold; margin: 20px 0; color: #007bff; text-align: center;}
.timer-bar-container { width: 80%; max-width: 400px; height: 20px; background-color: var(--color-card-border); border-radius: 10px; margin: 0 auto 20px auto; overflow: hidden; }
.timer-bar { height: 100%; background: linear-gradient(90deg, #007bff, #0056b3); border-radius: 10px; transition: width 1s linear; width: 100%; }
.actual-reps-input-section { margin: 20px 0; }
.actual-reps-input-section label { display: block; margin-bottom: 8px; font-weight: 500; color: var(--color-card-text); }
.actual-reps-input-section input[type="number"] { padding: 8px; width: 80px; text-align: center; font-size: 1em; border: 1px solid var(--color-card-border); border-radius: 4px; background-color: var(--color-card-bg); color: var(--color-card-text); }
.next-up-info { margin: 25px 0; text-align: center;}
.next-up-info h4 { margin-top: 0; color: var(--color-card-heading); font-size: 1.2em; }
.start-next-set-button { width: auto; padding: 12px 30px; font-size: 1.1em; display: block; margin-left: auto; margin-right: auto;}

.workout-summary { color: var(--color-card-text); }
.workout-summary h4 { font-size: 1.2em; font-weight: 600; margin-top: 0; margin-bottom: 15px; color: var(--color-card-heading); }
.workout-summary p { margin: 8px 0 8px 15px; font-size: 0.95em; line-height: 1.5; color: var(--color-card-text); }
.workout-summary p strong { font-weight: 500; color: var(--color-card-heading); }
.exercise-breakdown-header { display: flex; justify-content: space-between; align-items: center; margin-top: 25px; padding-top: 20px; border-top: 1px solid var(--color-card-border); }
.workout-summary h5 { font-size: 1.15em; font-weight: 600; color: var(--color-card-heading); margin-top: 0; margin-bottom: 15px; }
.exercise-breakdown-header .button-link { font-size: 0.85em; font-weight: normal; }
.exercise-summary-list { list-style-type: none; padding-left: 0; }
.exercise-summary-item { font-size: 0.95em; padding: 10px 0 10px 15px; margin-bottom: 0; border-bottom: 1px dashed var(--color-card-border); color: var(--color-card-text); }
.exercise-summary-item:last-child { border-bottom: none; }
.exercise-summary-item strong { font-weight: 500; color: var(--color-card-heading); }
.exercise-summary-header { display: flex; justify-content: space-between; align-items: flex-start; }
.exercise-summary-info { flex-grow: 1; }
.set-details-list { list-style-type: none; padding-left: 20px; margin-top: 8px; font-size: 0.9em; color: var(--color-card-text); opacity: 0.9; }
.set-details-list li { padding: 3px 0; border-bottom: none; margin-bottom: 0; }
.button-link { background: none; border: none; color: #007bff; text-decoration: underline; cursor: pointer; padding: 0; font-size: inherit; }
.button-link:hover { color: #0056b3; }
.session-notes-history { margin-top: 20px; padding-top: 15px; border-top: 1px solid var(--color-card-border); }
.session-notes-history strong { display: block; margin-bottom: 8px; font-weight: 600; color: var(--color-card-heading); }
.session-notes-history p { white-space: pre-wrap; font-size: 0.9em; color: var(--color-card-text); line-height: 1.6; margin: 0 0 0 15px; }

.overall-notes-section { margin-top: 20px; margin-bottom: 20px; } 
.overall-notes-section label { display: block; margin-bottom: 8px; font-weight: 500; color: var(--color-card-heading); }
.finish-workout-button { margin-top: 30px; padding: 15px 25px; width: 100%; box-sizing: border-box; font-size: 1.2em; }
.button-secondary { display: inline-block; margin-top: 10px; padding: 10px 15px; background-color: #6c757d; color: white; border: none; border-radius: 4px; text-decoration: none; transition: background-color 0.2s; }
.button-secondary:hover { background-color: #5a6268; }
.button-primary { background-color: #007bff; color:white; border:none; border-radius: 4px; padding:10px 15px; cursor:pointer; font-weight: bold; }
.button-primary:hover:not(:disabled) { background-color: #0056b3; }
.loading-message, .no-items-message, .login-prompt { color: var(--color-card-text); text-align: center; padding: 20px; }
.error-message { color: #dc3545; background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 10px; border-radius: 4px; margin-top: 15px; }
.current-set-info { background-color: var(--color-card-mute); padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 1px solid var(--color-card-border); text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
.current-set-info-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
.current-set-info-header h3 { margin-top: 0; margin-bottom: 0; font-size: 1.5em; color: var(--color-card-heading); font-weight: 600; flex-grow: 1; }
.current-set-info-header .button-icon { margin-left: 10px; }
.prescription-details { display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.2; }
/* Ensure .prescription-reps and .prescription-weight correctly inherit or define their base color if not red */
.prescription-reps, .prescription-weight { font-size: 2.0em; font-weight: bold; color: #007bff; display: block; }
.prescription-separator { font-size: 1.6em; font-weight: normal; color: var(--color-card-text); opacity: 0.6; margin: 5px 0; }

/* Draft Workout Prompt Overlay */
.draft-prompt-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 20px;
}

.draft-prompt-card {
  max-width: 400px;
  width: 100%;
  text-align: center;
  padding: 30px;
  background-color: var(--color-card-bg);
  border-radius: 8px;
  color: var(--color-card-text);
}

.draft-prompt-card h2 {
  margin-top: 0;
  margin-bottom: 15px;
  color: var(--color-card-heading);
}

.draft-prompt-card p {
  margin-bottom: 15px;
  color: var(--color-card-text);
  opacity: 0.8;
}

.draft-prompt-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
}

.draft-prompt-actions .button-primary,
.draft-prompt-actions .button-secondary {
  width: 100%;
  padding: 12px;
  font-size: 1rem;
}

/* Edit Prescription Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 20px;
}

.modal-content {
  background-color: var(--color-card-bg);
  border-radius: 8px;
  padding: 25px;
  max-width: 400px;
  width: 100%;
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  color: var(--color-card-text);
}

.modal-close-button {
  position: absolute;
  top: 10px;
  right: 15px;
  background: none;
  border: none;
  font-size: 28px;
  color: var(--color-card-text);
  opacity: 0.6;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close-button:hover {
  color: var(--color-card-heading);
  opacity: 1;
}

.edit-prescription-modal h3,
.edit-choice-modal h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.3em;
  color: var(--color-card-heading);
}

.edit-choice-modal p {
  margin-bottom: 20px;
  color: var(--color-card-text);
  opacity: 0.8;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--color-card-text);
}

.form-group input[type="number"] {
  width: 100%;
  padding: 10px;
  font-size: 16px;
  border: 1px solid var(--color-card-border);
  border-radius: 4px;
  box-sizing: border-box;
  background-color: var(--color-card-bg);
  color: var(--color-card-text);
}

.form-group input[type="number"]:focus {
  outline: none;
  border-color: #007bff;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 25px;
}

.form-actions .button-primary,
.form-actions .button-secondary {
  flex: 1;
  height: 42px;
  line-height: 1;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-choice-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.edit-choice-actions .button-primary,
.edit-choice-actions .button-secondary {
  width: 100%;
  padding: 12px;
  font-size: 1rem;
}

/* Button Icon Styles */
.button-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1em;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.button-icon:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.button-icon.extra-small {
  font-size: 0.75em;
  filter: grayscale(100%);
  align-self: flex-start;
}

/* Workout Complete Header */
.workout-complete-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.workout-complete-header h2 {
  margin: 0;
  flex-grow: 1;
}

.edit-mode-toggle {
  font-size: 1.2em;
  padding: 8px 12px;
  filter: grayscale(100%);
  opacity: 0.6;
  transition: opacity 0.2s, filter 0.2s;
}

.edit-mode-toggle:hover {
  opacity: 1;
}

.edit-mode-toggle.edit-mode-active {
  filter: none;
  opacity: 1;
}

/* Edit Workout Modal Styles */
.edit-workout-modal {
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.edit-workout-modal h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.3em;
  color: #333;
}

.edit-sets-list {
  margin-bottom: 20px;
}

.edit-set-item {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 15px;
  background-color: #f8f9fa;
}

.edit-set-header {
  margin-bottom: 12px;
  font-size: 1em;
  color: #333;
}

.edit-set-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
}

.edit-set-fields .form-group {
  margin-bottom: 0;
}

.edit-set-fields .form-group label {
  font-size: 0.9em;
  margin-bottom: 5px;
}

.edit-set-fields .form-group input,
.edit-set-fields .form-group select {
  width: 100%;
  padding: 8px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.status-select {
  padding: 8px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
}
</style>