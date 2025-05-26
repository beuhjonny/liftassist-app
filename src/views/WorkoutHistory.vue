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
      <div v-for="workout in loggedWorkouts" :key="workout.id" class="history-item card">
        <h3>{{ workout.workoutDayNameUsed || 'Workout' }}</h3>
        <p class="workout-date">
          Performed on: {{ formatWorkoutDate(workout.date) }}
        </p>
        <p v-if="workout.trainingProgramNameUsed" class="program-name">
          Routine: {{ workout.trainingProgramNameUsed }}
        </p>
        <div v-if="workout.performedExercises && workout.performedExercises.length > 0" class="exercises-summary">
          <strong>Exercises:</strong>
          <ul>
            <li v-for="ex in workout.performedExercises" :key="ex.exerciseId || ex.exerciseName">
              {{ ex.exerciseName }} - {{ ex.sets.length }} set(s)
            </li>
          </ul>
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
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase.js';
import useAuth from '../composables/useAuth';

// Interface for the structure of a logged workout document
// This should match what you save in `finishWorkoutAndSave`
interface LoggedSetDataSummary { // Simplified for history display if needed
  setNumber: number;
  status: string;
  actualReps: number;
  actualWeight: number;
}
interface PerformedExerciseSummary {
  exerciseId: string;
  exerciseName: string;
  sets: LoggedSetDataSummary[]; // Or just sets.length for a count
}
interface LoggedWorkout {
  id: string;
  userId: string;
  date: Timestamp; // Firestore Timestamp
  trainingProgramIdUsed: string;
  workoutDayNameUsed: string;
  workoutDayIdUsed: string;
  performedExercises: PerformedExerciseSummary[];
  trainingProgramNameUsed?: string; // Optional: Denormalize for easier display
  // Add other fields you save, like overallSessionNotes
}

const { user } = useAuth();
const isLoading = ref(true);
const error = ref<string | null>(null);
const loggedWorkouts = reactive<LoggedWorkout[]>([]);

const fetchWorkoutHistory = async () => {
  if (!user.value || !user.value.uid) {
    error.value = "User not available.";
    isLoading.value = false;
    return;
  }
  isLoading.value = true;
  error.value = null;
  loggedWorkouts.length = 0; // Clear previous results

  try {
    const historyCollectionRef = collection(db, 'users', user.value.uid, 'loggedWorkouts');
    const q = query(historyCollectionRef, orderBy('date', 'desc')); // Order by date, newest first

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((docSnap) => {
      loggedWorkouts.push({ id: docSnap.id, ...docSnap.data() } as LoggedWorkout);
    });
    if (loggedWorkouts.length === 0) {
      // console.log("No workout history found.");
    }
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

let userWatcherUnsubscribe: (() => void) | null = null;
onMounted(() => {
  isLoading.value = true;
  userWatcherUnsubscribe = watch(user, (currentUser) => {
    if (currentUser && currentUser.uid) {
      fetchWorkoutHistory();
    } else {
      isLoading.value = false;
      loggedWorkouts.length = 0; // Clear history if user logs out
      if (currentUser === null) {
        // No error message needed, template will show login prompt
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
  padding: 20px;
  max-width: 800px;
  margin: 20px auto;
}
.history-view h1 {
  text-align: center;
  margin-bottom: 30px;
}
.card {
  background-color: #fff;
  padding: 20px 25px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  text-align: left;
}
.history-item h3 {
  margin-top: 0;
  margin-bottom: 8px;
  color: #007bff; /* Primary color for workout day name */
}
.workout-date {
  font-size: 0.9em;
  color: #6c757d; /* Gray for date */
  margin-bottom: 10px;
}
.program-name {
  font-size: 0.95em;
  color: #555;
  margin-bottom: 15px;
  font-style: italic;
}
.exercises-summary strong {
  display: block;
  margin-bottom: 5px;
}
.exercises-summary ul {
  list-style-type: disc; /* Or none, or other */
  padding-left: 20px;
  margin: 0;
  font-size: 0.9em;
}
.exercises-summary li {
  margin-bottom: 3px;
}

.button-primary { /* Copied from Home.vue, make global later */
  padding: 12px 20px; background-color: #007bff; color: white;
  border: none; border-radius: 4px; cursor: pointer; font-size: 1rem;
  text-decoration: none; display: inline-block; transition: background-color 0.2s;
}
.button-primary:hover:not(:disabled) { background-color: #0056b3; }

.loading-message, .no-history, .login-prompt {
  color: #6c757d;
  text-align: center;
  padding: 20px;
}
.no-history { /* Specifically style the no-history card */
  padding: 30px;
}
.error-message {
  color: #dc3545; background-color: #f8d7da; border: 1px solid #f5c6cb;
  padding: 10px; border-radius: 4px; margin-top: 15px;
}
</style>