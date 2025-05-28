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
            <p><strong>Total Sets Logged:</strong> {{ getTotalSetsLogged(workout.performedExercises) }}</p>
            <p><strong>Sets "DONE":</strong> {{ getSetsByStatus(workout.performedExercises, 'done') }}</p>
            <p><strong>Sets "FAIL":</strong> {{ getSetsByStatus(workout.performedExercises, 'failed') }}</p>

            <h5 v-if="workout.performedExercises && workout.performedExercises.length > 0">Exercise Breakdown:</h5>
            <ul class="exercise-summary-list" v-if="workout.performedExercises && workout.performedExercises.length > 0">
                <li v-for="ex in workout.performedExercises" :key="ex.exerciseId || ex.exerciseName">
                    <strong>{{ ex.exerciseName }}</strong>
                    <span v-if="ex.isPR" title="Personal Record!"> 🏅</span>
                    : {{ getExerciseStatusForHistory(ex) }}
                    <ul v-if="expandedExercises[workout.id + '-' + ex.exerciseId]" class="set-details-list">
                        <li v-for="(set, setIndex) in ex.sets" :key="setIndex">
                           Set {{ set.setNumber }}: {{ set.actualWeight }} lbs x {{ set.actualReps }} reps ({{set.status}})
                        </li>
                    </ul>
                    <button class="button-link toggle-set-details" @click="toggleExerciseDetails(workout.id, ex.exerciseId)">
                        {{ expandedExercises[workout.id + '-' + ex.exerciseId] ? 'Hide Sets' : 'Show Sets' }}
                    </button>
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
import { db } from '../firebase.js';
import useAuth from '../composables/useAuth';

// --- Interfaces (should match what's saved) ---
interface LoggedSetData { // Full structure from WorkoutActive
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
  isPR?: boolean; // Expect this from new logs
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
const expandedExercises = reactive<Record<string, boolean>>({}); // For toggling set details

const fetchWorkoutHistory = async () => {
  if (!user.value || !user.value.uid) {
    error.value = "User not available.";
    isLoading.value = false;
    return;
  }
  isLoading.value = true;
  error.value = null;
  loggedWorkouts.length = 0;

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
  if (m > 0 || h === 0) formatted += `${m}m`; // Show 0m if duration is less than 1 minute but non-zero seconds (though we only have minutes)
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

const getExerciseStatusForHistory = (exercise: PerformedExerciseInLog): string => {
  const doneSets = exercise.sets.filter(s => s.status === 'done').length;
  const totalPerformed = exercise.sets.length;
  // Note: We don't have targetSets from the routine here, so status is simpler.
  if (totalPerformed === 0) return "No sets recorded.";
  return `${doneSets}/${totalPerformed} sets done.`;
};

const toggleExerciseDetails = (workoutId: string, exerciseId: string) => {
    const key = `${workoutId}-${exerciseId}`;
    expandedExercises[key] = !expandedExercises[key];
};

let userWatcherUnsubscribe: (() => void) | null = null;
onMounted(() => {
  isLoading.value = true;
  userWatcherUnsubscribe = watch(user, (currentUser) => {
    if (currentUser && currentUser.uid) {
      fetchWorkoutHistory();
    } else {
      isLoading.value = false;
      loggedWorkouts.length = 0;
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
  padding: 20px;
  max-width: 800px;
  margin: 20px auto;
}
.history-view h1 {
  text-align: center;
  margin-bottom: 30px;
}
.card { /* Keep general card style if used for error/loading messages */
  background-color: #fff;
  padding: 20px 25px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  text-align: left;
}

/* New styles for history item to match summary */
.history-item-card {
  background-color: #fff;
  padding: 20px 25px;
  border-radius: 8px;
  margin-bottom: 25px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  text-align: left;
}
.history-item-header {
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;
  margin-bottom: 15px;
}
.history-item-header h2 {
  margin-top: 0;
  margin-bottom: 5px;
  color: #333; /* Match WorkoutActive title */
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

.workout-summary { /* Re-using class from WorkoutActive for consistency */
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  margin-top: 15px;
  border: 1px solid #e9ecef;
}
.workout-summary h4 { margin-top: 0; margin-bottom: 10px; }
.workout-summary p { margin: 5px 0; font-size: 1em; }
.workout-summary h5 { margin-top: 15px; margin-bottom: 5px; font-size: 1.05em; color: #333; }

.exercise-summary-list { list-style-type: none; padding-left: 0; }
.exercise-summary-list li {
  font-size: 0.95em;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #eee;
}
.exercise-summary-list li:last-child {
    border-bottom: none;
}

.set-details-list {
    list-style-type: circle;
    padding-left: 20px;
    margin-top: 5px;
    font-size: 0.9em;
    color: #555;
}
.set-details-list li {
    border-bottom: none;
    padding-bottom: 2px;
    margin-bottom: 2px;
}

.toggle-set-details {
    margin-left: 10px;
    font-size: 0.8em;
}
.button-link {
  background: none;
  border: none;
  color: #007bff;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  font-size: inherit;
}
.button-link:hover {
  color: #0056b3;
}

.session-notes-history {
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}
.session-notes-history strong {
  display: block;
  margin-bottom: 5px;
}
.session-notes-history p {
  white-space: pre-wrap; /* Respect line breaks in notes */
  font-size: 0.9em;
  color: #444;
}

.button-primary {
  padding: 10px 15px; background-color: #007bff; color: white;
  border: none; border-radius: 4px; cursor: pointer; font-size: 1rem;
  text-decoration: none; display: inline-block; transition: background-color 0.2s;
}
.button-primary:hover:not(:disabled) { background-color: #0056b3; }

.loading-message, .no-history, .login-prompt {
  color: #6c757d;
  text-align: center;
  padding: 20px;
}
.no-history { padding: 30px; }
.error-message {
  color: #dc3545; background-color: #f8d7da; border: 1px solid #f5c6cb;
  padding: 10px; border-radius: 4px; margin-top: 15px;
}
</style>