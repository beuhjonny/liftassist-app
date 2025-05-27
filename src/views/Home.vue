<template>
  <div class="home-view">
    <h1>Home Dashboard</h1>

    <div v-if="isLoading" class="loading-message">
      <p>Loading your program...</p>
    </div>
    <div v-if="error && !isLoading" class="error-message">
      <p>Error: {{ error }}</p>
    </div>

    <div v-if="!activeProgram.id && !isLoading && !error && user" class="no-program-message card">
      <h2>Welcome, {{ user.displayName || 'Fitness Enthusiast' }}!</h2>
      <p>You don't have an active training routine set up yet.</p>
      <router-link to="/routines" class="button-primary">Setup Your Routine</router-link>
    </div>

    <div v-if="activeProgram.id && !isLoading && !error && user" class="active-program-display card">
      <h2>{{ activeProgram.programName }}</h2>
      <p class="routine-description"><em>{{ activeProgram.description || 'Time to train!' }}</em></p>

      <h3>Choose a Workout to Start:</h3>
      <div v-if="sortedWorkoutDays.length > 0" class="workout-day-selection">
        <button
          v-for="day in sortedWorkoutDays"
          :key="day.id"
          @click="startWorkout(day)"
          class="button-workout-day"
        >
          Start {{ day.dayName }}
        </button>
      </div>
      <p v-else class="no-items-message">
        This routine has no workout days defined yet.
        <router-link to="/routines">Go to Routines to add them.</router-link>
      </p>
    </div>

    <div v-if="!user && !isLoading && !error"> <p>Please <router-link to="/login">log in</router-link> to see your program.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch, computed } from 'vue';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import useAuth from '../composables/useAuth';
import { useRouter } from 'vue-router';

// --- Interface Definitions ---
interface ExerciseConfig { id: string; exerciseName: string; targetSets: number; targetRepRange: string; minRepsInTargetRange: number; maxRepsInTargetRange: number; weightIncrement: number; notesForExercise?: string; }
interface WorkoutDay { id: string; dayName: string; order: number; exercises: ExerciseConfig[]; }
interface TrainingProgram { id: string | null; programName: string; description: string; workoutDays: WorkoutDay[]; }

const { user } = useAuth();
const router = useRouter();
const isLoading = ref(true);
const error = ref<string | null>(null);

const ACTIVE_PROGRAM_ID = 'user_active_main_program'; // As used in Routines.vue

const activeProgram = reactive<TrainingProgram>({
  id: null,
  programName: '',
  description: '',
  workoutDays: [],
});

const sortedWorkoutDays = computed(() => {
  if (!activeProgram.workoutDays) return [];
  return [...activeProgram.workoutDays].sort((a, b) => a.order - b.order);
});

const loadActiveProgram = async () => {
  if (!user.value || !user.value.uid) {
    // This case should be handled by the watcher, which won't call this if no user.
    // But as a safeguard:
    error.value = 'User not authenticated to load program.';
    isLoading.value = false;
    return;
  }
  isLoading.value = true;
  error.value = null;
  try {
    const programDocRef = doc(db, 'users', user.value.uid, 'trainingPrograms', ACTIVE_PROGRAM_ID);
    const programSnap = await getDoc(programDocRef);

    if (programSnap.exists()) {
      const data = programSnap.data() as Omit<TrainingProgram, 'id'>;
      activeProgram.id = programSnap.id; // Should be ACTIVE_PROGRAM_ID
      activeProgram.programName = data.programName || 'Your Active Routine';
      activeProgram.description = data.description || '';
      activeProgram.workoutDays = Array.isArray(data.workoutDays) ? data.workoutDays : [];
    } else {
      console.log(`Home.vue: No program document found with ID ${ACTIVE_PROGRAM_ID} for user ${user.value.uid}`);
      activeProgram.id = null;
      activeProgram.programName = '';
      activeProgram.description = '';
      activeProgram.workoutDays = [];
    }
  } catch (e: any) {
    console.error("Home.vue: Error loading active program:", e);
    error.value = "Failed to load your active routine. " + e.message;
  } finally {
    isLoading.value = false;
  }
};

const startWorkout = (day: WorkoutDay) => {
  if (!activeProgram.id || !day.id) {
    error.value = "Cannot start workout: Program or Day ID is missing.";
    return;
  }
  // console.log(`Home.vue: Starting workout for program: ${activeProgram.id}, Day: ${day.dayName} (ID: ${day.id})`);
  router.push({ name: 'WorkoutActive', params: { programId: activeProgram.id, dayId: day.id } });
};

let userWatcherUnsubscribe: (() => void) | null = null;
onMounted(() => {
  // console.log("Home.vue: onMounted. Initial user:", user.value);
  isLoading.value = true; // Set loading true at the start of onMounted
  userWatcherUnsubscribe = watch(user, (currentUser) => {
    // console.log("Home.vue: watch(user) triggered. Current user:", currentUser);
    if (currentUser && currentUser.uid) {
      loadActiveProgram();
    } else {
      isLoading.value = false; // Stop loading if no user or user logged out
      activeProgram.id = null; // Clear program data
      activeProgram.programName = '';
      activeProgram.description = '';
      activeProgram.workoutDays = [];
      if (currentUser === null) { // Explicitly logged out
        // No error message needed here, template will show login prompt
      }
    }
  }, { immediate: true }); // immediate: true to run on mount
});

onUnmounted(() => {
  if (userWatcherUnsubscribe) {
    userWatcherUnsubscribe();
  }
});
</script>

<style scoped>
/* Styles are the same as previously provided for Home.vue */
.home-view {
  padding: 20px;
  max-width: 800px;
  margin: 20px auto;
  text-align: center;
}
.card {
  background-color: #fff;
  padding: 25px;
  border-radius: 8px;
  margin-bottom: 25px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  text-align: left;
}
.active-program-display h2 {
  margin-top: 0;
  color: #333;
  font-size: 1.8em;
  margin-bottom: 8px;
}
.routine-description {
  margin-top: 0;
  margin-bottom: 25px;
  color: #555;
  font-style: italic;
}
.active-program-display h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #444;
  font-size: 1.4em;
}
.workout-day-selection {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.button-workout-day {
  padding: 15px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.1em;
  text-align: center;
  transition: background-color 0.2s ease-in-out, transform 0.1s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.button-workout-day:hover {
  background-color: #0056b3;
  transform: translateY(-2px);
}
.button-workout-day:active {
  transform: translateY(0px);
}
.no-program-message, .login-prompt {
  padding: 30px;
  text-align: center;
}
.no-program-message h2 {
  margin-top:0;
  margin-bottom: 15px;
}
.button-primary {
  padding: 12px 20px;
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
.loading-message,
.no-items-message {
  color: #6c757d;
  padding: 20px;
  text-align: center;
}
.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 10px;
  border-radius: 4px;
  margin-top: 15px;
  text-align: left;
}
</style>