<template>
  <div class="workout-active-view">
    <div v-if="isLoading" class="loading-message card">
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
            <span class="prescription-reps">{{ currentExercise.prescribedReps }} reps</span>
            <span class="prescription-separator">@</span>
            <span class="prescription-weight">{{ currentExercise.prescribedWeight }} lbs</span>
          </div>
        </div>

        <div class="set-actions">
          <button @click="logSet('done')" class="button-done">DONE</button>
          <button @click="logSet('failed')" class="button-fail">FAIL</button>
        </div>
      </div>
    </div>

    <div v-if="workoutPhase === 'resting' && !allExercisesComplete" class="rest-screen-content card">
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
            <p><strong>Workout Time:</strong> {{ workoutDurationFormatted }}</p>
            <p><strong>Total Volume:</strong> {{ totalWorkoutVolume.toLocaleString() }} lbs</p>
            <p><strong>Total Sets Logged:</strong> {{ workoutLog.length }}</p>
            <p><strong>Sets "DONE":</strong> {{ completedSetsCount }}</p>
            <p><strong>Sets "FAIL":</strong> {{ failedSetsCount }}</p>
            <h5 v-if="exerciseSessionSummary.length > 0">Exercise Breakdown:</h5>
            <ul class="exercise-summary-list" v-if="exerciseSessionSummary.length > 0">
                <li v-for="summary in exerciseSessionSummary" :key="summary.exerciseId">
                    <strong>{{ summary.exerciseName }}</strong>
                    <span v-if="summary.isPR" title="Personal Record!"> 🏅</span>
                    : {{ summary.status }} ({{ summary.doneSets }}/{{ summary.targetSets }} target sets done)
                </li>
            </ul>
        </div>

        <div v-if="showActualRepsInputForFail && lastLoggedSetIndex !== null && workoutLog[lastLoggedSetIndex]?.status === 'failed'" class="actual-reps-input-section card-inset">
          <label :for="'finalActualRepsFailed'">Reps completed for last failed set of {{ workoutLog[lastLoggedSetIndex]?.exerciseName }}:</label>
          <input type="number" :id="'finalActualRepsFailed'" v-model.number="actualRepsForFailedSet" min="0" />
        </div>

        <div class="overall-notes-section card-inset">
          <label for="overallSessionNotesInput">Overall Session Notes (optional):</label>
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

    <audio ref="timerAudioPlayer" style="display: none;">
      <source src="https://www.myinstants.com/media/sounds/boxing-bell.mp3" type="audio/mpeg">
      Your browser does not support the audio element.
    </audio>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, onUnmounted, computed } from 'vue';
import { doc, getDoc, setDoc, updateDoc, collection, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.js'; // Ensure this path is correct
import useAuth from '../composables/useAuth'; // Ensure this path is correct
import { useRouter } from 'vue-router';

// --- Type Definitions ---
interface ExerciseProgress {
  exerciseName: string; currentWeightToAttempt: number; repsToAttemptNext: number;
  lastWorkoutAllSetsSuccessfulAtCurrentWeight?: boolean;
  consecutiveFailedWorkoutsAtCurrentWeightAndReps?: number;
  lastPerformedDate?: any; // Firestore Timestamp or null
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
  prescribedWeight: number; // Weight prescribed for this session
  prescribedReps: number;   // Reps prescribed for this session
}
interface LoggedSetData {
  exerciseId: string; exerciseName: string; setNumber: number;
  prescribedWeight: number; prescribedReps: number;
  actualWeight: number; actualReps: number;
  status: 'done' | 'failed'; timestamp: Date;
}

// Interface for what's stored in loggedWorkout.performedExercises
interface PerformedExerciseForLog {
  exerciseId: string;
  exerciseName: string;
  sets: LoggedSetData[];
  isPR?: boolean; // Will be calculated before saving
}


const props = defineProps<{ programId: string; dayId: string; }>();
const { user } = useAuth();
const router = useRouter();
const isLoading = ref(true);
const isSaving = ref(false);
const error = ref<string | null>(null);

const activeProgramName = ref<string | null>(null);
const currentWorkoutDayDetails = ref<WorkoutDayInRoutine | null>(null);
const sessionExercises = reactive<SessionExercise[]>([]); // Holds exercises with prescribed weight/reps for THIS session
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

const workoutPhase = ref<WorkoutPhase>('overview');
const workoutStartTime = ref<Date | null>(null);
const workoutEndTime = ref<Date | null>(null);

const activeSetTimeElapsed = ref(0);
let activeSetTimerInterval: number | undefined = undefined;

const showMobileTooltipForIndex = ref<number | null>(null);
const mobileTooltipText = ref<string>('');

const initialExerciseProgressData = reactive<Map<string, ExerciseProgress>>(new Map());
const sessionOverallNotes = ref("");

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

interface ExerciseSummary {
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  loggedSetsCount: number;
  doneSets: number;
  status: string;
  isPR?: boolean;
}
const exerciseSessionSummary = computed<ExerciseSummary[]>(() => {
  if (sessionExercises.length === 0 ) return [];
  return sessionExercises.map(sessionEx => { // sessionEx is a SessionExercise
    const loggedSetsForThisEx = workoutLog.filter(log => log.exerciseId === sessionEx.id);
    const doneSetsCount = loggedSetsForThisEx.filter(s => s.status === 'done').length;
    const targetSets = sessionEx.targetSets || 0; // Target sets for this specific exercise config
    let statusMessage = 'Not all sets logged "DONE"';

    if (loggedSetsForThisEx.length === 0 && targetSets > 0) {
        statusMessage = 'No sets performed.';
    } else if (loggedSetsForThisEx.length >= targetSets && doneSetsCount === targetSets) {
      statusMessage = 'All sets DONE!';
    } else if (loggedSetsForThisEx.some(s => s.status === 'failed')) {
        statusMessage = 'Some sets FAILED.';
    } else if (loggedSetsForThisEx.length < targetSets && doneSetsCount === loggedSetsForThisEx.length && loggedSetsForThisEx.length > 0) {
        statusMessage = `Completed ${doneSetsCount}/${targetSets} sets.`;
    }

    let isPR = false;
    if (doneSetsCount === targetSets && targetSets > 0) {
      const exKey = sessionEx.exerciseName.toLowerCase().replace(/\s+/g, '_');
      const initialProg = initialExerciseProgressData.get(exKey); // Progress state *before* this session

      if (initialProg) {
        // Check if performance matched what was prescribed (which came from initialProg) for this session
        if (sessionEx.prescribedWeight === initialProg.currentWeightToAttempt &&
            sessionEx.prescribedReps === initialProg.repsToAttemptNext) {
            
            if (!initialProg.lastWorkoutAllSetsSuccessfulAtCurrentWeight || 
                (initialProg.consecutiveFailedWorkoutsAtCurrentWeightAndReps && initialProg.consecutiveFailedWorkoutsAtCurrentWeightAndReps > 0) ) {
              isPR = true;
            } else {
              // Already successful at this level, check if it triggers further progression
              if (initialProg.repsToAttemptNext >= sessionEx.maxReps) {
                  isPR = true;
              } else {
                  const nextRepsIfSuccessful = Math.min(initialProg.repsToAttemptNext + sessionEx.repOverloadStep, sessionEx.maxReps);
                  if (nextRepsIfSuccessful > initialProg.repsToAttemptNext) {
                       isPR = true;
                  } else if (initialProg.repsToAttemptNext === sessionEx.maxReps) {
                       isPR = true; 
                  }
              }
            }
        }
      }
    }

    return {
      exerciseId: sessionEx.id,
      exerciseName: sessionEx.exerciseName,
      targetSets: targetSets,
      loggedSetsCount: loggedSetsForThisEx.length,
      doneSets: doneSetsCount,
      status: statusMessage,
      isPR: isPR,
    };
  });
});

const allExercisesComplete = computed(() => sessionExercises.length > 0 && currentExerciseIndex.value >= sessionExercises.length);
const currentExercise = computed<SessionExercise | null>(() => (sessionExercises.length > 0 && currentExerciseIndex.value < sessionExercises.length) ? sessionExercises[currentExerciseIndex.value] : null);
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
      return { ...firstExercise, exerciseName: firstExercise.exerciseName, setNumber: 1, targetSets: firstExercise.targetSets };
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
      for (const exConfig of workoutDay.exercises) { // exConfig is ExerciseConfigInRoutine
        const exProgressKey = exConfig.exerciseName.toLowerCase().replace(/\s+/g, '_');
        const progressDocRef = doc(db, 'users', user.value.uid, 'exerciseProgress', exProgressKey);
        const progressSnap = await getDoc(progressDocRef);
        
        let pWeight = exConfig.startingWeight ?? 0;
        let pReps = exConfig.minReps;
        let currentExerciseProg: ExerciseProgress | null = null;

        if (progressSnap.exists()) {
          currentExerciseProg = progressSnap.data() as ExerciseProgress;
          initialExerciseProgressData.set(exProgressKey, currentExerciseProg);
          pWeight = currentExerciseProg.currentWeightToAttempt;
          pReps = currentExerciseProg.repsToAttemptNext;
        } else {
          const baselineProgress: ExerciseProgress = {
              exerciseName: exConfig.exerciseName,
              currentWeightToAttempt: pWeight, // uses startingWeight or 0
              repsToAttemptNext: pReps,       // uses minReps
              lastWorkoutAllSetsSuccessfulAtCurrentWeight: false,
              consecutiveFailedWorkoutsAtCurrentWeightAndReps: 0
          };
          initialExerciseProgressData.set(exProgressKey, baselineProgress);
          console.warn(`No progress document found for ${exConfig.exerciseName}. Prescribing based on routine's min reps and starting weight (or default 0).`);
        }
        // Push to sessionExercises with prescribed values for *this* session
        sessionExercises.push({ ...exConfig, prescribedWeight: pWeight, prescribedReps: pReps });
      }
    }
    if (sessionExercises.length === 0 && workoutDay.exercises && workoutDay.exercises.length > 0) {
        error.value = "Could not prepare exercises for this session. Check exercise progress data.";
    }
  } catch (e: any) { error.value = e.message || "Failed to load workout details."; }
  finally { isLoading.value = false; }
};

const beginActiveWorkout = () => {
  if (sessionExercises.length === 0) {
    error.value = "No exercises to start. Please define exercises in your routine.";
    workoutPhase.value = 'overview'; return;
  }
  workoutStartTime.value = new Date();
  workoutPhase.value = 'activeSet';
  startActivitySetTimer();
  showMobileTooltipForIndex.value = null;
};

const playTimerSound = () => { if (timerAudioPlayer.value) { timerAudioPlayer.value.currentTime = 0; timerAudioPlayer.value.play().catch(e => console.warn("Audio play failed:", e)); } };

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

const logSet = (status: 'done' | 'failed') => {
  stopActivitySetTimer();
  if (!currentExercise.value) return;
  const currentEx = currentExercise.value; // currentEx is a SessionExercise
  const loggedSet: LoggedSetData = {
    exerciseId: currentEx.id, exerciseName: currentEx.exerciseName,
    setNumber: currentSetNumber.value, 
    prescribedWeight: currentEx.prescribedWeight, // Log what was prescribed for this session
    prescribedReps: currentEx.prescribedReps,     // Log what was prescribed for this session
    actualWeight: currentEx.prescribedWeight, // Assuming actual is same as prescribed unless changed
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
  
  const performedExercisesGrouped: { exerciseId: string; exerciseName: string; sets: LoggedSetData[]; }[] = [];
  if (currentWorkoutDayDetails.value && currentWorkoutDayDetails.value.exercises) {
    for (const exConfig of currentWorkoutDayDetails.value.exercises) { // exConfig is ExerciseConfigInRoutine
      const setsForThisEx = workoutLog.filter(log => log.exerciseId === exConfig.id);
      if (setsForThisEx.length > 0) {
        performedExercisesGrouped.push({
          exerciseId: exConfig.id,
          exerciseName: exConfig.exerciseName,
          sets: setsForThisEx.sort((a,b) => a.setNumber - b.setNumber)
        });
      }
    }
  }

  if (performedExercisesGrouped.length === 0) { 
    error.value = "No exercises with logged sets to save."; 
    isSaving.value = false; 
    return; 
  }

  const performedExercisesForLogging: PerformedExerciseForLog[] = performedExercisesGrouped.map(perfExGroup => {
    const exConfig = currentWorkoutDayDetails.value?.exercises.find(cfg => cfg.id === perfExGroup.exerciseId);
    let isExercisePR = false;

    if (exConfig) { // exConfig is ExerciseConfigInRoutine (from the day's routine definition)
      const exKey = exConfig.exerciseName.toLowerCase().replace(/\s+/g, '_');
      const initialProg = initialExerciseProgressData.get(exKey); // Progress state *before* this session
      const doneSetsCount = perfExGroup.sets.filter(s => s.status === 'done').length;
      const targetSets = exConfig.targetSets || 0;

      // Find the corresponding SessionExercise to get what was prescribed for *this* session
      const sessionExerciseConfig = sessionExercises.find(se => se.id === exConfig.id);

      if (sessionExerciseConfig && doneSetsCount === targetSets && targetSets > 0 && initialProg) {
        // Ensure PR logic compares against what was prescribed for this session,
        // and that this prescription aligns with the initialProg's attempt values.
        if (sessionExerciseConfig.prescribedWeight === initialProg.currentWeightToAttempt &&
            sessionExerciseConfig.prescribedReps === initialProg.repsToAttemptNext) {
            
            if (!initialProg.lastWorkoutAllSetsSuccessfulAtCurrentWeight || 
                (initialProg.consecutiveFailedWorkoutsAtCurrentWeightAndReps && initialProg.consecutiveFailedWorkoutsAtCurrentWeightAndReps > 0) ) {
              isExercisePR = true;
            } else {
              if (initialProg.repsToAttemptNext >= exConfig.maxReps) { // Used exConfig for maxReps here
                  isExercisePR = true;
              } else {
                  const nextRepsIfSuccessful = Math.min(initialProg.repsToAttemptNext + exConfig.repOverloadStep, exConfig.maxReps); // Used exConfig
                  if (nextRepsIfSuccessful > initialProg.repsToAttemptNext) {
                       isExercisePR = true;
                  } else if (initialProg.repsToAttemptNext === exConfig.maxReps) { // Used exConfig
                       isExercisePR = true; 
                  }
              }
            }
        }
      }
    }
    return { ...perfExGroup, isPR: isExercisePR };
  });


  if (!workoutStartTime.value) workoutStartTime.value = workoutLog.length > 0 ? workoutLog[0].timestamp : new Date();
  if (!workoutEndTime.value) workoutEndTime.value = new Date();

  const durationMs = workoutEndTime.value.getTime() - workoutStartTime.value.getTime();
  const durationMinutes = Math.max(0, Math.floor(durationMs / 60000));

  const newLoggedWorkoutRef = doc(collection(db, 'users', user.value.uid, 'loggedWorkouts'));
  const loggedWorkoutData = {
    id: newLoggedWorkoutRef.id, userId: user.value.uid, date: serverTimestamp(),
    trainingProgramIdUsed: props.programId, trainingProgramNameUsed: activeProgramName.value,
    workoutDayNameUsed: currentWorkoutDayDetails.value.dayName, workoutDayIdUsed: props.dayId,
    performedExercises: performedExercisesForLogging, 
    overallSessionNotes: sessionOverallNotes.value,
    startTime: workoutStartTime.value, endTime: workoutEndTime.value, durationMinutes: durationMinutes
  };

  const batch = writeBatch(db);
  batch.set(newLoggedWorkoutRef, loggedWorkoutData);

  try {
    for (const performedEx of performedExercisesForLogging) { // Iterate over the array that has .isPR
      const exConfigFromRoutine = currentWorkoutDayDetails.value?.exercises.find(cfg => cfg.id === performedEx.exerciseId);
      if (!exConfigFromRoutine) { console.warn(`Config for ${performedEx.exerciseName} not found. Skipping prog.`); continue; }
      if (exConfigFromRoutine.enableProgression === false) { console.log(`Progression disabled for ${exConfigFromRoutine.exerciseName}.`); continue; }

      const progressKey = performedEx.exerciseName.toLowerCase().replace(/\s+/g, '_');
      const currentProgress = initialExerciseProgressData.get(progressKey); // Use initial progress for update base

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
    alert("Workout saved and progress updated!");
    workoutLog.length = 0; currentExerciseIndex.value = 0; currentSetNumber.value = 1;
    workoutPhase.value = 'overview'; showActualRepsInputForFail.value = false;
    sessionOverallNotes.value = ""; 
    showMobileTooltipForIndex.value = null; mobileTooltipText.value = ''; 
    router.push('/');
  } catch (e: any) { console.error("Error finishing workout:", e); error.value = "Failed to save. " + e.message; }
  finally { isSaving.value = false; }
};

// --- Lifecycle Hooks ---
let userWatcherUnsubscribe: (() => void) | null = null;
const previousUserRef = ref<typeof user.value | null>(null);
onMounted(() => {
  isLoading.value = true;
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
      if (currentUser === null) { error.value = "Please log in."; }
    }
    previousUserRef.value = currentUser;
  }, { immediate: true });
  if (timerAudioPlayer.value) { timerAudioPlayer.value.load(); }
});
onUnmounted(() => { if (userWatcherUnsubscribe) userWatcherUnsubscribe(); if (timerInterval) clearInterval(timerInterval); if (activeSetTimerInterval) clearInterval(activeSetTimerInterval); });

watch(workoutPhase, (newPhase, oldPhase) => {
    if (newPhase !== oldPhase) {
        showMobileTooltipForIndex.value = null;
        mobileTooltipText.value = '';
        if (oldPhase === 'complete' && newPhase !== 'complete') {
            showActualRepsInputForFail.value = false; 
        }
    }
});
</script>

<style scoped>
/* Styles remain the same as the previous full version you provided */
.workout-active-view { padding: 20px; max-width: 750px; margin: 20px auto; }
.card { background-color: #fff; padding: 20px 25px; border-radius: 8px; margin-bottom: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); text-align: left; }
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
/* .prescription class was not used in the final template for current set, using .prescription-details */
.set-actions { display: flex; justify-content: space-around; margin-top: 25px; gap: 20px; }
.set-actions button { padding: 12px 0; font-size: 1.1em; font-weight: bold; border: none; border-radius: 5px; color: white; cursor: pointer; flex-grow: 1; margin: 0; max-width: 220px; transition: background-color 0.2s, transform 0.1s; box-shadow: 0 2px 4px rgba(0,0,0,0.15); }
.button-done { background-color: #28a745; }
.button-done:hover { background-color: #218838; transform: translateY(-2px); }
.button-fail { background-color: #dc3545; }
.button-fail:hover { background-color: #c82333; transform: translateY(-2px); }
.rest-screen-content h2 { font-size: 2em; margin-bottom: 10px; }
.timer-display { font-size: 3.5em; font-weight: bold; margin: 20px 0; color: #007bff; }
.timer-bar-container { width: 80%; max-width: 400px; height: 20px; background-color: #e9ecef; border-radius: 10px; margin: 0 auto 20px auto; overflow: hidden; }
.timer-bar { height: 100%; background: linear-gradient(90deg, #007bff, #0056b3); border-radius: 10px; transition: width 1s linear; width: 100%; }
.actual-reps-input-section { margin: 20px 0; }
.actual-reps-input-section label { display: block; margin-bottom: 8px; font-weight: 500; }
.actual-reps-input-section input[type="number"] { padding: 8px; width: 80px; text-align: center; font-size: 1em; border: 1px solid #ccc; border-radius: 4px; }
.next-up-info { margin: 25px 0; }
.next-up-info h4 { margin-top: 0; color: #333; font-size: 1.2em; }
.start-next-set-button { width: auto; padding: 12px 30px; font-size: 1.1em; }
.workout-summary { margin-top: 20px; margin-bottom: 20px; text-align: left; }
.workout-summary h4 { margin-top: 0; margin-bottom: 10px; }
.workout-summary p { margin: 5px 0; font-size: 1em; }
.workout-summary h5 { margin-top: 15px; margin-bottom: 5px; font-size: 1.05em; color: #333; }
.exercise-summary-list { list-style-type: none; padding-left: 0; }
.exercise-summary-list li { font-size: 0.95em; margin-bottom: 4px; }
.overall-notes-section { margin-top: 20px; margin-bottom: 20px; } /* For the textarea section */
.overall-notes-section label { display: block; margin-bottom: 8px; font-weight: 500; }
.finish-workout-button { margin-top: 30px; padding: 15px 25px; width: 100%; box-sizing: border-box; font-size: 1.2em; }
.button-secondary { display: inline-block; margin-top: 10px; padding: 10px 15px; background-color: #6c757d; color: white; border: none; border-radius: 4px; text-decoration: none; transition: background-color 0.2s; }
.button-secondary:hover { background-color: #5a6268; }
.button-primary { background-color: #007bff; color:white; border:none; border-radius: 4px; padding:10px 15px; cursor:pointer; font-weight: bold; }
.button-primary:hover:not(:disabled) { background-color: #0056b3; }
.loading-message, .no-items-message, .login-prompt { color: #6c757d; text-align: center; padding: 20px; }
.error-message { color: #dc3545; background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 10px; border-radius: 4px; margin-top: 15px; }
.current-set-info {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 6px;
  margin-bottom: 25px;
  border: 1px solid #e9ecef;
  text-align: center;
}

.current-set-info h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.5em;
  color: #495057;
  font-weight: 600;
}

.prescription-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1.2;
}

.prescription-reps,
.prescription-weight {
  font-size: 2.0em;
  font-weight: bold;
  color: #007bff;
  display: block;
}

.prescription-separator {
  font-size: 1.6em;
  font-weight: normal;
  color: #6c757d;
  margin: 5px 0;
}
</style>