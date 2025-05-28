<template>
  <div class="history-view">
    <h1>Workout History</h1>

    <div v-if="isLoading" class="loading-message">
      <p>Loading workout history...</p>
    </div>
    <div v-if="error && !isLoading" class="error-message card">
      <p>Error: {{ error }}</p>
    </div>

    <div v-if="!isLoading && !error && user && loggedWorkouts.length === 0" class="no-history card">
      <p>No workouts logged yet. Go crush a session!</p>
      <router-link to="/" class="button-primary">Start a Workout</router-link>
    </div>

    <div v-if="!isLoading && !error && user && loggedWorkouts.length > 0" class="history-list">
      <div v-for="workout in loggedWorkouts" :key="workout.id" class="history-item-card">
        <div class="history-item-header">
          <h2>{{ workout.workoutDayNameUsed || 'Workout Session' }}</h2>
          <p class="workout-date">
            {{ formatWorkoutDate(workout.date) }}
          </p>
          <p v-if="workout.trainingProgramNameUsed" class="program-name">
            Routine: {{ workout.trainingProgramNameUsed }}
          </p>
        </div>

        <div class="workout-summary card-inset">
          <h4>Session Summary:</h4>
          <p><strong>Workout Time:</strong> {{ formatDuration(workout.durationMinutes) }}</p>
          <p><strong>Total Volume:</strong> {{ calculateTotalVolume(workout.performedExercises).toLocaleString() }} lbs</p>
          <p><strong>Total Sets:</strong> {{ getConsolidatedSetsInfo(workout.performedExercises) }}</p>

          <div class="exercise-breakdown-header" v-if="workout.performedExercises && workout.performedExercises.length > 0">
            <h5>Exercise Breakdown:</h5>
            <button @click="toggleAllDetailsForWorkout(workout.id)" class="button-link">
              {{ allDetailsExpandedForWorkout[workout.id] ? 'Hide Set Details' : 'Show Set Details' }}
            </button>
          </div>

          <ul class="exercise-summary-list" v-if="workout.performedExercises && workout.performedExercises.length > 0">
            <li v-for="ex in workout.performedExercises" :key="ex.exerciseId || ex.exerciseName">
              <strong>{{ ex.exerciseName }}</strong>
              <span v-if="ex.isPR" title="Personal Record!"> 🏅</span>
              <span>: {{ getExerciseStatusForHistory(ex) }}</span>
              <span class="representative-set-info" v-if="ex.sets && ex.sets.length > 0">
                , {{ getRepresentativeSetInfo(ex.sets) }}
              </span>
              <ul v-if="allDetailsExpandedForWorkout[workout.id] && ex.sets && ex.sets.length > 0" class="set-details-list">
                <li v-for="(set, setIndex) in ex.sets" :key="setIndex">
                  Set {{ set.setNumber }}: {{ set.actualWeight }} lbs x {{ set.actualReps }} reps ({{set.status}})
                </li>
              </ul>
            </li>
          </ul>

          <div v-if="workout.overallSessionNotes" class="session-notes-history">
            <strong>Overall Session Notes:</strong>
            <p>{{ workout.overallSessionNotes }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!user && !isLoading" class="login-prompt">
      <p>Please <router-link to="/login">log in</router-link> to view your history.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue';
import { collection, query, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase.js'; // Ensure this path is correct
import useAuth from '../composables/useAuth'; // Ensure this path is correct

// --- Interfaces (should match what's saved) ---
interface LoggedSetData {
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  prescribedWeight: number;
  prescribedReps: number;
  actualWeight: number;
  actualReps: number;
  status: 'done' | 'failed';
  timestamp: any; // or Date
}

interface PerformedExerciseInLog {
  exerciseId: string;
  exerciseName: string;
  sets: LoggedSetData[];
  isPR?: boolean;
}

interface LoggedWorkout {
  id: string;
  userId: string;
  date: Timestamp;
  trainingProgramIdUsed: string;
  workoutDayNameUsed: string;
  workoutDayIdUsed: string;
  performedExercises: PerformedExerciseInLog[];
  trainingProgramNameUsed?: string;
  overallSessionNotes?: string;
  startTime?: any; // or Date
  endTime?: any; // or Date
  durationMinutes?: number;
}

const { user } = useAuth();
const isLoading = ref(true);
const error = ref<string | null>(null);
const loggedWorkouts = reactive<LoggedWorkout[]>([]);
const allDetailsExpandedForWorkout = reactive<Record<string, boolean>>({});

const fetchWorkoutHistory = async () => {
  if (!user.value || !user.value.uid) {
    error.value = "User not available.";
    isLoading.value = false;
    loggedWorkouts.length = 0; // Clear workouts if no user
    return;
  }
  isLoading.value = true;
  error.value = null;
  loggedWorkouts.length = 0; // Clear previous results before fetching new ones

  try {
    const historyCollectionRef = collection(db, 'users', user.value.uid, 'loggedWorkouts');
    const q = query(historyCollectionRef, orderBy('date', 'desc'));

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((docSnap) => {
      loggedWorkouts.push({ id: docSnap.id, ...docSnap.data() } as LoggedWorkout);
    });
  } catch (e: any) {
    console.error("Error fetching workout history:", e);
    error.value = "Failed to load workout history. " + e.message;
  } finally {
    isLoading.value = false;
  }
};

const formatWorkoutDate = (timestamp: Timestamp | Date | undefined): string => {
  if (!timestamp) return 'Date not available';
  const date = (timestamp instanceof Timestamp) ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatDuration = (minutes: number | undefined): string => {
  if (minutes === undefined || minutes === null || isNaN(minutes) || minutes < 0) return 'N/A';
  if (minutes === 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  let formatted = '';
  if (h > 0) formatted += `${h}h `;
  if (m > 0 || h === 0) formatted += `${m}m`;
  return formatted.trim();
};

const calculateTotalVolume = (performedExercises: PerformedExerciseInLog[] | undefined): number => {
  if (!performedExercises) return 0;
  return performedExercises.reduce((totalVolume, ex) => {
    const exerciseVolume = ex.sets.reduce((vol, set) => {
      if (typeof set.actualWeight === 'number' && typeof set.actualReps === 'number' && set.actualReps > 0) {
        return vol + (set.actualWeight * set.actualReps);
      }
      return vol;
    }, 0);
    return totalVolume + exerciseVolume;
  }, 0);
};

const getTotalSetsLogged = (performedExercises: PerformedExerciseInLog[] | undefined): number => {
  if (!performedExercises) return 0;
  return performedExercises.reduce((count, ex) => count + ex.sets.length, 0);
};

const getSetsByStatus = (performedExercises: PerformedExerciseInLog[] | undefined, status: 'done' | 'failed'): number => {
  if (!performedExercises) return 0;
  return performedExercises.reduce((count, ex) => {
    return count + ex.sets.filter(set => set.status === status).length;
  }, 0);
};

const getConsolidatedSetsInfo = (performedExercises: PerformedExerciseInLog[] | undefined): string => {
  if (!performedExercises) return 'N/A';
  const total = getTotalSetsLogged(performedExercises);
  const done = getSetsByStatus(performedExercises, 'done');
  const failed = getSetsByStatus(performedExercises, 'failed');
  return `${total} (Done: ${done}, Failed: ${failed})`;
};

const getRepresentativeSetInfo = (sets: LoggedSetData[]): string => {
  if (!sets || sets.length === 0) return 'No sets recorded';
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
  return 'Set data N/A';
};

const getExerciseStatusForHistory = (exercise: PerformedExerciseInLog): string => {
  const doneSets = exercise.sets.filter(s => s.status === 'done').length;
  const totalPerformed = exercise.sets.length;
  if (totalPerformed === 0) return "No sets recorded.";
  return `${doneSets}/${totalPerformed} sets done.`;
};

const toggleAllDetailsForWorkout = (workoutId: string) => {
  allDetailsExpandedForWorkout[workoutId] = !allDetailsExpandedForWorkout[workoutId];
};

let userWatcherUnsubscribe: (() => void) | null = null;
onMounted(() => {
  isLoading.value = true; 
  userWatcherUnsubscribe = watch(user, (currentUser, previousUser) => {
    if (currentUser && currentUser.uid) {
      // Fetch only if user changed or if workouts haven't been loaded for current user
      if (!previousUser || currentUser.uid !== previousUser.uid || loggedWorkouts.length === 0 && !error.value) {
        fetchWorkoutHistory();
      } else {
        isLoading.value = false; // Data likely already loaded for this user
      }
    } else {
      isLoading.value = false;
      loggedWorkouts.length = 0;
      for (const key in allDetailsExpandedForWorkout) { // Clear expansion state on logout
        delete allDetailsExpandedForWorkout[key];
      }
    }
  }, { immediate: true });
});

onUnmounted(() => {
  if (userWatcherUnsubscribe) {
    userWatcherUnsubscribe();
  }
});
</script>

<style scoped>
.history-view {
  padding-top: 20px;
  padding-bottom: 20px;
  max-width: 800px;
  margin: 0 auto;
}
.history-view h1 {
  text-align: center;
  margin-bottom: 30px;
  /* Assuming this should use theme color for dark mode */
  color: var(--color-heading);
}

/* General card style for loading/error/no-history messages */
.card {
  background-color: #fff;
  padding: 20px 25px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  text-align: left;
  color: #333; /* Default dark text for these general cards */
}

.history-item-card {
  background-color: #fff; /* Main card for each workout log */
  padding: 20px 25px;
  border-radius: 8px;
  margin-bottom: 25px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  text-align: left;
  border: 1px solid var(--color-border);
  color: #333; /* Default dark text for content directly in this card */
}

.history-item-header {
  border-bottom: 1px solid #e0e0e0; /* Softer border */
  padding-bottom: 15px;
  margin-bottom: 15px;
}
.history-item-header h2 {
  margin-top: 0;
  margin-bottom: 5px;
  color: #333;
  font-size: 1.5em;
}
.workout-date {
  font-size: 0.9em;
  color: #6c757d;
  margin-bottom: 5px;
}
.program-name {
  font-size: 0.9em;
  color: #555;
  font-style: italic;
}

.workout-summary { /* This is the light grey inset card: class="workout-summary card-inset" */
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 6px;
  margin-top: 20px;
  border: 1px solid #e0e0e0;
  color: #333; /* Default dark text for this light inset area */
}

.workout-summary h4 { /* "Session Summary:" */
  font-size: 1.2em;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 15px;
}
.workout-summary p { /* Sub-items like Workout Time, Volume */
  margin: 8px 0 8px 15px; /* Indent and adjust vertical spacing */
  font-size: 0.95em;
  line-height: 1.5;
}
.workout-summary p strong {
  font-weight: 500; /* Or 600 if you want labels bolder */
}

.exercise-breakdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #d0d0d0; /* Differentiator line */
}

.workout-summary h5 { /* "Exercise Breakdown:" */
  font-size: 1.15em;
  font-weight: 600;
  color: #333;
  margin-top: 0;
  margin-bottom: 15px;
}
.exercise-breakdown-header .button-link {
  font-size: 0.85em;
  font-weight: normal;
}

.exercise-summary-list {
  list-style-type: none;
  padding-left: 0;
}
.exercise-summary-list li {
  font-size: 0.95em;
  padding: 10px 0;
  margin-bottom: 0;
  border-bottom: 1px dashed #e0e0e0; /* Subtle separator for exercises */
}
.exercise-summary-list li:last-child {
  border-bottom: none;
}
.exercise-summary-list li strong { /* Exercise Name */
  font-weight: 500;
}

.representative-set-info {
  color: #555;
  font-size: 0.9em; /* Relative to li font-size */
  margin-left: 5px;
}

.set-details-list {
  list-style-type: none; /* Cleaner look */
  padding-left: 20px; /* Indentation */
  margin-top: 8px;
  font-size: 0.9em; /* Relative to li font-size */
  color: #555;
}
.set-details-list li {
  padding: 3px 0;
  border-bottom: none;
}

.button-link {
  background: none;
  border: none;
  color: #007bff;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  font-size: inherit; /* Inherit size, or specific size if needed */
}
.button-link:hover {
  color: #0056b3;
}

.session-notes-history {
  margin-top: 20px; /* More space above notes */
  padding-top: 15px;
  border-top: 1px solid #d0d0d0; /* Separator line */
}
.session-notes-history strong {
  display: block;
  margin-bottom: 8px; /* More space after "Overall Session Notes:" */
  font-weight: 600;
}
.session-notes-history p {
  white-space: pre-wrap;
  font-size: 0.9em;
  color: #444;
  line-height: 1.6;
}

.button-primary {
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  text-decoration: none;
  display: inline-block;
  transition: background-color 0.2s;
}
.button-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.loading-message, .no-history, .login-prompt {
  color: var(--color-text); /* Use theme variable for better dark mode compatibility */
  text-align: center;
  padding: 20px;
}
.no-history {
  padding: 30px; /* Keep extra padding for this specific message card */
}
.error-message { /* This is usually a card with its own background */
  color: #721c24; /* Dark red text for errors */
  background-color: #f8d7da; /* Light red background */
  border: 1px solid #f5c6cb; /* Reddish border */
}
.login-prompt p {
    /* Text color will be inherited from .login-prompt which uses var(--color-text) */
}
.login-prompt a {
    color: #007bff; /* Or use var(--green) for consistency with other links */
}

</style>