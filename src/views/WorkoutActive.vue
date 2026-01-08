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
    <div v-if="error && !isLoading" class="error-message card">
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
            : {{ exercise.targetSets }} sets of {{ exercise.prescribedReps }} reps @ {{ exercise.prescribedWeight }} lbs
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
          <h3>Set {{ currentSetNumber }} of {{ currentExercise.targetSets }}</h3>
          <div class="prescription-details">
            <span 
              class="prescription-reps" 
              :class="{ 'failed-last-attempt-text': didFailLastAttemptAtCurrentPrescription }">
              {{ currentExercise.prescribedReps }} reps
            </span>
            <span class="prescription-separator">@</span>
            <span 
              class="prescription-weight" 
              :class="{ 'failed-last-attempt-text': didFailLastAttemptAtCurrentPrescription }">
              {{ currentExercise.prescribedWeight }} lbs
            </span>
          </div>
        </div>
        
        <p v-if="didFailLastAttemptAtCurrentPrescription && currentExerciseProgress?.consecutiveFailedWorkoutsAtCurrentWeightAndReps" 
           class="failure-streak-note">
          Failed last {{ currentExerciseProgress.consecutiveFailedWorkoutsAtCurrentWeightAndReps }} 
          attempt{{ currentExerciseProgress.consecutiveFailedWorkoutsAtCurrentWeightAndReps > 1 ? 's' : '' }} 
          at this prescription. Time to break the cycle!
        </p>

        <div class="set-actions">
          <button @click="logSet('done')" class="button-done">DONE</button>
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
        <p>Set {{ nextSetDetails.setNumber }} of {{ nextSetDetails.targetSets }}: {{ nextSetDetails.prescribedReps }} reps @ {{ nextSetDetails.prescribedWeight }} lbs</p>
      </div>
      <button @click="proceedToNextSet" class="button-primary start-next-set-button">
        {{ restCountdown > 0 ? 'Skip Rest & Start Next Set' : 'Start Next Set' }}
      </button>
    </div>

    <div v-if="workoutPhase === 'complete'" class="workout-content card">
        <h2>Workout Complete!</h2>
        <p>Great job finishing your {{ currentWorkoutDayDetails?.dayName }} workout!</p>

        <div class="workout-summary card-inset">
          <h4>Session Summary:</h4>
          <p><strong>Workout Time:</strong> {{ displayDurationForCompletedWorkout }}</p>
          <p><strong>Total Volume:</strong> {{ totalWorkoutVolume.toLocaleString() }} lbs</p>
          <p><strong>Total Sets:</strong> {{ displayConsolidatedSetsInfo }}</p>

          <div class="exercise-breakdown-header" v-if="completedPerformedExercisesSummary.length > 0">
            <h5>Exercise Breakdown:</h5>
            <button @click="toggleSetDetailsInSummary" class="button-link">
              {{ showSetDetailsInSummary ? 'Hide Set Details' : 'Show Set Details' }}
            </button>
          </div>

          <ul class="exercise-summary-list" v-if="completedPerformedExercisesSummary.length > 0">
            <li v-for="ex in completedPerformedExercisesSummary" :key="ex.exerciseId || ex.exerciseName">
              <strong>{{ ex.exerciseName }}</strong>
              <span v-if="ex.isPR" title="Personal Record!"> 🏅</span>
              <span>: {{ getExerciseStatusForDisplay(ex) }}{{ getExerciseLineSuffixForDisplay(ex) }}</span>
              
              <ul v-if="showSetDetailsInSummary && ex.sets && ex.sets.length > 0" class="set-details-list">
                <li v-for="(set, setIndex) in ex.sets" :key="setIndex">
                  Set {{ set.setNumber }}: {{ set.actualWeight }} lbs x {{ set.actualReps }} reps ({{set.status}})
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


    <div v-if="!isLoading && !error && !currentWorkoutDayDetails && user && workoutPhase ==='overview'" class="card">
        <p>Could not load workout day details. Please try again or check your routine setup.</p>
        <router-link to="/" class="button-secondary">Back to Home</router-link>
    </div>
      <div v-if="!user && !isLoading && !error">
        <p>Please <router-link to="/login">log in</router-link> to view workouts.</p>
    </div>

    <!-- Audio element for final fallback -->
    <audio ref="timerAudioPlayer" style="display: none;">
      <source src="/sounds/bell.mp3" type="audio/mpeg">
    </audio>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, onUnmounted, computed } from 'vue';
import { doc, getDoc, setDoc, updateDoc, collection, writeBatch, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase.js'; 
import useAuth from '../composables/useAuth'; 
import { useRouter, useRoute } from 'vue-router';

// --- Type Definitions ---
interface ExerciseProgress {
  exerciseName: string; currentWeightToAttempt: number; repsToAttemptNext: number;
  lastWorkoutAllSetsSuccessfulAtCurrentWeight?: boolean;
  consecutiveFailedWorkoutsAtCurrentWeightAndReps?: number;
  lastPerformedDate?: any; 
}

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
interface SessionExercise extends ExerciseConfigInRoutine {
  prescribedWeight: number; 
  prescribedReps: number;   
}
interface LoggedSetData {
  exerciseId: string; exerciseName: string; setNumber: number;
  prescribedWeight: number; prescribedReps: number;
  actualWeight: number; actualReps: number;
  status: 'done' | 'failed'; timestamp: Date;
}

interface PerformedExerciseInLog { 
  exerciseId: string;
  exerciseName: string;
  sets: LoggedSetData[];
  isPR?: boolean;
}

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

const DEFAULT_REST_SECONDS = 90;
const restDurationToUse = ref(DEFAULT_REST_SECONDS);
const restCountdown = ref(DEFAULT_REST_SECONDS);
const showActualRepsInputForFail = ref(false);
const actualRepsForFailedSet = ref<number | null>(null);
const lastLoggedSetIndex = ref<number | null>(null);
let timerInterval: number | undefined = undefined;
const timerAudioPlayer = ref<HTMLAudioElement | null>(null);
let audioContext: AudioContext | null = null;
let audioBuffer: AudioBuffer | null = null; // For loaded MP3 file

// Sound type options - can be extended later
type SoundType = 'bell' | 'beep' | 'chime' | 'ding' | 'file';
const selectedSoundType = ref<SoundType>('file'); // Default to file (MP3)
const useLocalFile = ref(true); // Toggle between generated sound and file

const workoutPhase = ref<WorkoutPhase>('overview');
const workoutStartTime = ref<Date | null>(null);
const workoutEndTime = ref<Date | null>(null);

const activeSetTimeElapsed = ref(0);
let activeSetTimerInterval: number | undefined = undefined;

const showMobileTooltipForIndex = ref<number | null>(null);
const mobileTooltipText = ref<string>('');

const initialExerciseProgressData = reactive<Map<string, ExerciseProgress>>(new Map());
const sessionOverallNotes = ref("");

const wakeLockSentinel = ref<WakeLockSentinel | null>(null);

const showSetDetailsInSummary = ref(false);

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
  return workoutLog.reduce((volume, set) => {
    if (typeof set.actualWeight === 'number' && typeof set.actualReps === 'number' && set.actualReps > 0) {
      return volume + (set.actualWeight * set.actualReps);
    }
    return volume;
  }, 0);
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
      return { ...firstExercise, exerciseName: firstExercise.exerciseName, setNumber: 1, targetSets: firstExercise.targetSets, prescribedReps: firstExercise.prescribedReps, prescribedWeight: firstExercise.prescribedWeight };
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
    exerciseName: nextExerciseDetails.exerciseName, setNumber: tempCurrentSetNumber,
    targetSets: nextExerciseDetails.targetSets, prescribedReps: nextExerciseDetails.prescribedReps,
    prescribedWeight: nextExerciseDetails.prescribedWeight,
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
    return `${representativeSet.actualWeight} lbs x ${representativeSet.actualReps} reps`;
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
const generateSound = (context: AudioContext, type: SoundType): AudioBufferSourceNode => {
  const sampleRate = context.sampleRate;
  const duration = 0.25; // Very short - 250ms to minimize interruption
  const frameCount = sampleRate * duration;
  const buffer = context.createBuffer(1, frameCount, sampleRate);
  const data = buffer.getChannelData(0);
  
  let fundamentalFreq: number;
  let harmonics: Array<{ freq: number; amplitude: number }>;
  let envelopeDecay: number;
  
  switch (type) {
    case 'bell':
      fundamentalFreq = 800;
      harmonics = [
        { freq: fundamentalFreq, amplitude: 1.0 },
        { freq: fundamentalFreq * 2, amplitude: 0.5 },
        { freq: fundamentalFreq * 3, amplitude: 0.3 },
        { freq: fundamentalFreq * 4, amplitude: 0.15 }
      ];
      envelopeDecay = 8;
      break;
    case 'beep':
      fundamentalFreq = 1000;
      harmonics = [{ freq: fundamentalFreq, amplitude: 1.0 }];
      envelopeDecay = 10;
      break;
    case 'chime':
      fundamentalFreq = 600;
      harmonics = [
        { freq: fundamentalFreq, amplitude: 1.0 },
        { freq: fundamentalFreq * 2.5, amplitude: 0.6 },
        { freq: fundamentalFreq * 4, amplitude: 0.3 }
      ];
      envelopeDecay = 6;
      break;
    case 'ding':
      fundamentalFreq = 1200;
      harmonics = [
        { freq: fundamentalFreq, amplitude: 1.0 },
        { freq: fundamentalFreq * 2, amplitude: 0.4 }
      ];
      envelopeDecay = 12;
      break;
    default:
      fundamentalFreq = 800;
      harmonics = [{ freq: fundamentalFreq, amplitude: 1.0 }];
      envelopeDecay = 8;
  }
  
  for (let i = 0; i < frameCount; i++) {
    let sample = 0;
    const t = i / sampleRate;
    // Exponential decay envelope
    const envelope = Math.exp(-t * envelopeDecay);
    
    for (const harmonic of harmonics) {
      sample += Math.sin(2 * Math.PI * harmonic.freq * t) * harmonic.amplitude * envelope;
    }
    
    data[i] = sample * 0.3; // Scale down to reasonable volume
  }
  
  const source = context.createBufferSource();
  source.buffer = buffer;
  return source;
};

const playTimerSound = async () => {
  // Try to use local MP3 file first (better sound quality)
  // If file not available, fall back to generated sound
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    // Resume audio context if suspended (required on mobile after user interaction)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    // Try to load and use MP3 file if available
    if (useLocalFile.value) {
      if (!audioBuffer) {
        try {
          // Try to load the bell sound from public folder
          const response = await fetch('/sounds/bell.mp3');
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            // Check if sound is too long (warn if > 1 second)
            if (audioBuffer.duration > 1.0) {
              console.warn(`Bell sound is ${audioBuffer.duration.toFixed(2)}s - consider using a shorter file (< 1s) to minimize interruption`);
            }
          } else {
            console.log('Bell MP3 file not found, using generated sound instead');
            useLocalFile.value = false;
          }
        } catch (fetchError) {
          console.log('Could not load bell MP3 file, using generated sound:', fetchError);
          useLocalFile.value = false;
        }
      }
      
      // Play the loaded MP3 file
      if (audioBuffer) {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.6; // 60% volume - less intrusive
        
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        source.start(0);
        return; // Successfully played MP3 file
      }
    }
    
    // Fallback to programmatically generated sound
    const source = generateSound(audioContext, selectedSoundType.value);
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.6; // 60% volume - less intrusive
    
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    source.start(0);
    return; // Successfully played generated sound
  } catch (error) {
    console.warn('Web Audio API failed:', error);
  }
  
  // Final fallback to HTML5 audio (if file exists)
  if (timerAudioPlayer.value) {
    timerAudioPlayer.value.currentTime = 0;
    timerAudioPlayer.value.volume = 0.6;
    timerAudioPlayer.value.play().catch(e => console.warn("Audio play failed:", e));
  }
};

const startRestTimer = () => {
  if (currentExercise.value && currentExercise.value.customRestSeconds && currentExercise.value.customRestSeconds >= 10) {
    restDurationToUse.value = currentExercise.value.customRestSeconds;
  } else {
    restDurationToUse.value = DEFAULT_REST_SECONDS;
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
  const currentEx = currentExercise.value; 
  const loggedSet: LoggedSetData = {
    exerciseId: currentEx.id, exerciseName: currentEx.exerciseName, setNumber: currentSetNumber.value, 
    prescribedWeight: currentEx.prescribedWeight, prescribedReps: currentEx.prescribedReps,     
    actualWeight: currentEx.prescribedWeight, 
    actualReps: status === 'done' ? currentEx.prescribedReps : 0,
    status: status, timestamp: new Date(),
  };
  workoutLog.push(loggedSet);
  lastLoggedSetIndex.value = workoutLog.length - 1;
  const isLastExerciseInSession = currentExerciseIndex.value === sessionExercises.length - 1;
  const isLastSetOfThisExercise = currentSetNumber.value === currentEx.targetSets;
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
      workoutLog: workoutLog.map(set => ({
        ...set,
        timestamp: set.timestamp instanceof Date ? set.timestamp : new Date(set.timestamp)
      })),
      sessionExercises: sessionExercises.map(ex => ({ ...ex })),
      currentExerciseIndex: currentExerciseIndex.value,
      currentSetNumber: currentSetNumber.value,
      workoutPhase: workoutPhase.value,
      workoutStartTime: workoutStartTime.value,
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

const restoreDraftWorkout = (draft: DraftWorkout) => {
  // Restore all state from draft (but don't set draftWorkoutId here - let caller handle it)
  workoutLog.length = 0;
  if (draft.workoutLog && draft.workoutLog.length > 0) {
    workoutLog.push(...draft.workoutLog.map(set => ({
      ...set,
      timestamp: set.timestamp instanceof Date ? set.timestamp : (set.timestamp ? new Date(set.timestamp) : new Date())
    })));
  }
  
  sessionExercises.length = 0;
  if (draft.sessionExercises && draft.sessionExercises.length > 0) {
    sessionExercises.push(...draft.sessionExercises.map(ex => ({ ...ex })));
  }
  
  currentExerciseIndex.value = draft.currentExerciseIndex || 0;
  currentSetNumber.value = draft.currentSetNumber || 1;
  workoutPhase.value = draft.workoutPhase || 'overview';
  workoutStartTime.value = draft.workoutStartTime ? new Date(draft.workoutStartTime) : null;
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

  workoutPhase.value = 'activeSet';
  startActivitySetTimer(); 

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
          timestamp: s.timestamp instanceof Date ? s.timestamp : new Date(s.timestamp) 
      })),
      isPR: ex.isPR,
  }));

  if (performedExercisesForDatabase.length === 0) { 
    error.value = "No exercises with logged sets to save."; 
    isSaving.value = false; 
    return; 
  }

  if (!workoutStartTime.value) workoutStartTime.value = workoutLog.length > 0 ? workoutLog[0].timestamp : new Date();
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
    startTime: workoutStartTime.value, endTime: workoutEndTime.value, durationMinutes: durationMinutes
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
    
    // Delete draft workout after successful save
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
  
  // Check for draft workout before loading fresh data
  if (user.value && user.value.uid && props.programId && props.dayId) {
    isLoadingDraft.value = true;
    const draft = await loadDraftWorkout();
    isLoadingDraft.value = false;
    
    if (draft && draft.workoutLog.length > 0) {
      // Found a draft with progress
      hasDraft.value = true;
      showDraftPrompt.value = true;
      isLoading.value = false;
      
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
  max-width: 750px; 
  margin: 0 auto;   
}
.card { background-color: #fff;   padding: 20px 25px;
  border-radius: 8px;
  margin-bottom: 25px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  text-align: left;
  border: 1px solid var(--color-border);}
.card-inset { background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-top: 15px; margin-bottom: 15px; border: 1px solid #e9ecef;}
.workout-overview-content h1, .workout-content h1.workout-day-title, .rest-screen-content h1.workout-day-title { text-align: center; margin-bottom: 5px; font-size: 1.8em; color: #333; }
.routine-name { text-align: center; margin-top: 0; margin-bottom: 25px; color: #555; font-size: 0.9em; }
.overview-subtitle { text-align: left; font-size: 1.2em; margin-bottom: 15px; color: #333; font-weight: 500; }
.exercise-overview-list { list-style-type: none; padding: 0; margin-bottom: 25px; }
.exercise-overview-item { padding: 12px; border-bottom: 1px solid #f0f0f0; font-size: 1em; background-color: #fdfdfd; border-radius: 4px; margin-bottom: 8px; }
.exercise-overview-item:last-child { border-bottom: none; }
.exercise-overview-item strong { color: #0056b3; }
.exercise-overview-item span.overview-details { color: #555; font-size: 0.95em; display: block; margin-top: 4px;}
.exercise-overview-item em { font-size: 0.85em; color: #777; }
.overview-actions { display: flex; flex-direction: column; gap: 10px; margin-top: 20px;}
.button-begin-workout { width: 100%; padding: 15px; font-size: 1.2em; }

.workout-progress-indicator { margin-bottom: 20px; text-align: center; }
.workout-progress-timeline { display: flex; justify-content: center; align-items: center; gap: 4px; margin-bottom: 5px; padding: 5px 0; flex-wrap: wrap; }
.progress-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: #e0e0e0; transition: background-color 0.3s ease, transform 0.2s ease; cursor: pointer; }
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

.current-exercise-block h2 { margin-top: 0; margin-bottom: 10px; font-size: 1.6em; color: #2c3e50; border-bottom: 2px solid #007bff; padding-bottom: 10px;}
.active-set-timer-display { text-align: right; font-size: 0.9em; color: #555; margin-bottom: 15px; padding-right: 5px; }
.exercise-notes { font-style: italic; color: #666; margin-bottom: 15px; font-size: 0.9em; }
.current-set-info h3 { margin-top: 0; margin-bottom: 8px; font-size: 1.3em; color: #333;}
.set-actions { display: flex; justify-content: space-around; margin-top: 25px; gap: 20px; }
.set-actions button { padding: 12px 0; font-size: 1.1em; font-weight: bold; border: none; border-radius: 5px; color: white; cursor: pointer; flex-grow: 1; margin: 0; max-width: 220px; transition: background-color 0.2s, transform 0.1s; box-shadow: 0 2px 4px rgba(0,0,0,0.15); }
.button-done { background-color: #28a745; }
.button-done:hover { background-color: #218838; transform: translateY(-2px); }
.button-fail { background-color: #dc3545; }
.button-fail:hover { background-color: #c82333; transform: translateY(-2px); }
.rest-screen-content h2 { font-size: 2em; margin-bottom: 10px; text-align: center;}
.timer-display { font-size: 3.5em; font-weight: bold; margin: 20px 0; color: #007bff; text-align: center;}
.timer-bar-container { width: 80%; max-width: 400px; height: 20px; background-color: #e9ecef; border-radius: 10px; margin: 0 auto 20px auto; overflow: hidden; }
.timer-bar { height: 100%; background: linear-gradient(90deg, #007bff, #0056b3); border-radius: 10px; transition: width 1s linear; width: 100%; }
.actual-reps-input-section { margin: 20px 0; }
.actual-reps-input-section label { display: block; margin-bottom: 8px; font-weight: 500; }
.actual-reps-input-section input[type="number"] { padding: 8px; width: 80px; text-align: center; font-size: 1em; border: 1px solid #ccc; border-radius: 4px; }
.next-up-info { margin: 25px 0; text-align: center;}
.next-up-info h4 { margin-top: 0; color: #333; font-size: 1.2em; }
.start-next-set-button { width: auto; padding: 12px 30px; font-size: 1.1em; display: block; margin-left: auto; margin-right: auto;}

.workout-summary { color: #333; }
.workout-summary h4 { font-size: 1.2em; font-weight: 600; margin-top: 0; margin-bottom: 15px; }
.workout-summary p { margin: 8px 0 8px 15px; font-size: 0.95em; line-height: 1.5; }
.workout-summary p strong { font-weight: 500; }
.exercise-breakdown-header { display: flex; justify-content: space-between; align-items: center; margin-top: 25px; padding-top: 20px; border-top: 1px solid #d0d0d0; }
.workout-summary h5 { font-size: 1.15em; font-weight: 600; color: #333; margin-top: 0; margin-bottom: 15px; }
.exercise-breakdown-header .button-link { font-size: 0.85em; font-weight: normal; }
.exercise-summary-list { list-style-type: none; padding-left: 0; }
.exercise-summary-list > li { font-size: 0.95em; padding: 10px 0 10px 15px; margin-bottom: 0; border-bottom: 1px dashed #e0e0e0; }
.exercise-summary-list > li:last-child { border-bottom: none; }
.exercise-summary-list > li strong { font-weight: 500; }
.set-details-list { list-style-type: none; padding-left: 20px; margin-top: 8px; font-size: 0.9em; color: #555; }
.set-details-list li { padding: 3px 0; border-bottom: none; margin-bottom: 0; }
.button-link { background: none; border: none; color: #007bff; text-decoration: underline; cursor: pointer; padding: 0; font-size: inherit; }
.button-link:hover { color: #0056b3; }
.session-notes-history { margin-top: 20px; padding-top: 15px; border-top: 1px solid #d0d0d0; }
.session-notes-history strong { display: block; margin-bottom: 8px; font-weight: 600; }
.session-notes-history p { white-space: pre-wrap; font-size: 0.9em; color: #444; line-height: 1.6; margin: 0 0 0 15px; }

.overall-notes-section { margin-top: 20px; margin-bottom: 20px; } 
.overall-notes-section label { display: block; margin-bottom: 8px; font-weight: 500; }
.finish-workout-button { margin-top: 30px; padding: 15px 25px; width: 100%; box-sizing: border-box; font-size: 1.2em; }
.button-secondary { display: inline-block; margin-top: 10px; padding: 10px 15px; background-color: #6c757d; color: white; border: none; border-radius: 4px; text-decoration: none; transition: background-color 0.2s; }
.button-secondary:hover { background-color: #5a6268; }
.button-primary { background-color: #007bff; color:white; border:none; border-radius: 4px; padding:10px 15px; cursor:pointer; font-weight: bold; }
.button-primary:hover:not(:disabled) { background-color: #0056b3; }
.loading-message, .no-items-message, .login-prompt { color: var(--color-text); text-align: center; padding: 20px; }
.error-message { color: #dc3545; background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 10px; border-radius: 4px; margin-top: 15px; }
.current-set-info { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 1px solid var(--color-border); text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
.current-set-info h3 { margin-top: 0; margin-bottom: 15px; font-size: 1.5em; color: #495057; font-weight: 600; }
.prescription-details { display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.2; }
/* Ensure .prescription-reps and .prescription-weight correctly inherit or define their base color if not red */
.prescription-reps, .prescription-weight { font-size: 2.0em; font-weight: bold; color: #007bff; display: block; }
.prescription-separator { font-size: 1.6em; font-weight: normal; color: #6c757d; margin: 5px 0; }

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
}

.draft-prompt-card h2 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.draft-prompt-card p {
  margin-bottom: 15px;
  color: #555;
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
</style>