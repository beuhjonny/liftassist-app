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
              <button 
                @click="resumeDraftWorkout" 
                class="button-primary"
                style="width: 100%;"
              >
                Resume Workout
              </button>
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
       <div v-if="!activeProgram.id && !isProgramLoading && !programLoadingError && user" class="no-program-message card">
        <h2>Welcome, {{ user.displayName || 'Fitness Enthusiast' }}!</h2>
        <p>You don't have an active training routine set up yet.</p>
        <router-link to="/routines" class="button-primary">Setup Your Routine</router-link>
      </div>

      <div class="about-section-logged-in">
        <button @click="toggleManifestoModal" class="button-about">
          <span class="info-icon" aria-hidden="true">ⓘ</span> About LiftAssist
        </button>
      </div>
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
import { ref, reactive, watch, computed } from 'vue';
import { doc, getDoc, collection, query, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import useAuth from '../composables/useAuth';
import { useRouter } from 'vue-router';
import ManifestoComponent from '@/components/ManifestoComponent.vue';

// --- START Interface Definitions ---
interface LoggedSetData {
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  prescribedWeight: number;
  prescribedReps: number;
  actualWeight: number;
  actualReps: number;
  status: 'done' | 'failed';
  timestamp: any;
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
  date: Timestamp | Date;
  trainingProgramIdUsed: string;
  workoutDayNameUsed: string;
  workoutDayIdUsed: string;
  performedExercises: PerformedExerciseInLog[];
  trainingProgramNameUsed?: string;
  overallSessionNotes?: string;
  startTime?: any;
  endTime?: any;
  durationMinutes?: number;
}

interface ExerciseConfig { id: string; exerciseName: string; targetSets: number; targetRepRange: string; minRepsInTargetRange: number; maxRepsInTargetRange: number; weightIncrement: number; notesForExercise?: string; }
interface WorkoutDay { id: string; dayName: string; order: number; exercises: ExerciseConfig[]; }
interface TrainingProgram { id: string | null; programName: string; description: string; workoutDays: WorkoutDay[]; }

interface EnhancedWorkoutDay extends WorkoutDay {
  isNextRecommended: boolean;
  isLastDoneOverall: boolean;
  skipIndicatorCount: number;
  lastCompletedThisDayDate: Date | null;
}
// --- END Interface Definitions ---

const { user } = useAuth();
const router = useRouter();

const isProgramLoading = ref(false);
const programLoadingError = ref<string | null>(null);
const showManifestoModal = ref(false);

const ACTIVE_PROGRAM_ID = 'user_active_main_program';

const activeProgram = reactive<TrainingProgram>({
  id: null,
  programName: '',
  description: '',
  workoutDays: [],
});

const programWorkoutsHistory = ref<LoggedWorkout[]>([]);
const isLoadingHistory = ref(false);
const historyError = ref<string | null>(null);

// Draft workout state
const activeDraft = ref<{ programId: string; dayId: string; dayName: string; setsCount: number } | null>(null);
const isLoadingDraft = ref(false);

const formatDate = (date: Date | null | undefined): string => {
  if (!date) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const ensureDateObject = (dateInput: Timestamp | Date): Date => {
  if (dateInput instanceof Timestamp) {
    return dateInput.toDate();
  }
  return new Date(dateInput.getTime()); // Create a new Date instance from milliseconds
};

const sortedWorkoutDays = computed((): WorkoutDay[] => {
  if (!activeProgram.workoutDays) return [];
  return [...activeProgram.workoutDays].sort((a, b) => a.order - b.order);
});

const clearActiveProgram = () => {
  activeProgram.id = null;
  activeProgram.programName = '';
  activeProgram.description = '';
  activeProgram.workoutDays = [];
  programWorkoutsHistory.value = [];
  historyError.value = null;
};

const loadActiveProgram = async () => {
  if (!user.value || !user.value.uid) {
    clearActiveProgram();
    isProgramLoading.value = false;
    return;
  }
  isProgramLoading.value = true;
  programLoadingError.value = null;
  try {
    const programDocRef = doc(db, 'users', user.value.uid, 'trainingPrograms', ACTIVE_PROGRAM_ID);
    const programSnap = await getDoc(programDocRef);

    if (programSnap.exists()) {
      const data = programSnap.data() as Omit<TrainingProgram, 'id'>;
      activeProgram.id = programSnap.id;
      activeProgram.programName = data.programName || 'Your Active Routine';
      activeProgram.description = data.description || '';
      activeProgram.workoutDays = Array.isArray(data.workoutDays) ? data.workoutDays : [];
    } else {
      clearActiveProgram();
    }
  } catch (e: any) {
    console.error("Home.vue: Error loading active program:", e);
    programLoadingError.value = "Failed to load your active routine. " + e.message;
    clearActiveProgram();
  } finally {
    isProgramLoading.value = false;
  }
};

const fetchProgramWorkoutsHistory = async () => {
  if (!user.value || !user.value.uid || !activeProgram.id) {
    programWorkoutsHistory.value = [];
    isLoadingHistory.value = false;
    return;
  }
  isLoadingHistory.value = true;
  historyError.value = null;
  const fetchedHistory: LoggedWorkout[] = [];
  try {
    const historyCollectionRef = collection(db, 'users', user.value.uid, 'loggedWorkouts');
    const q = query(historyCollectionRef, orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as Omit<LoggedWorkout, 'id'>;
      if (data.trainingProgramIdUsed === activeProgram.id) {
        fetchedHistory.push({ id: docSnap.id, ...data });
      }
    });
    programWorkoutsHistory.value = fetchedHistory;
  } catch (e: any) {
    console.error("Error fetching program workout history:", e);
    historyError.value = "Failed to load workout insights: " + e.message;
    programWorkoutsHistory.value = [];
  } finally {
    isLoadingHistory.value = false;
  }
};

watch([user, () => activeProgram.id], async ([currentUser, currentProgramId], [oldUser, oldProgramId]) => {
  if (currentUser && currentUser.uid) {
    const userChanged = oldUser?.uid !== currentUser.uid;
    const programIdActuallyChanged = currentProgramId !== oldProgramId;

    if (!currentProgramId || userChanged || (programIdActuallyChanged && oldProgramId !== undefined) ) {
      await loadActiveProgram();
      // Check for draft after loading program
      if (activeProgram.id) {
        await checkForDraftWorkout();
      }
    }
  } else {
    isProgramLoading.value = false;
    programLoadingError.value = null;
    clearActiveProgram();
    activeDraft.value = null;
  }
}, { immediate: true, deep: true });

watch(() => activeProgram.id, async (newProgramId) => {
  if (newProgramId && user.value?.uid) {
    await checkForDraftWorkout();
  }
});

watch(() => activeProgram.id, (newProgramId, oldProgramId) => {
  if (newProgramId) {
    if (newProgramId !== oldProgramId || programWorkoutsHistory.value.length === 0) {
      fetchProgramWorkoutsHistory();
    }
  } else {
    programWorkoutsHistory.value = [];
  }
}, { immediate: true });


const enhancedWorkoutDays = computed<EnhancedWorkoutDay[]>(() => {
  if (!activeProgram.id || sortedWorkoutDays.value.length === 0) return [];

  const localSortedWorkoutDays = sortedWorkoutDays.value;
  const historyNewestFirst = programWorkoutsHistory.value;
  const historyOldestFirst = [...historyNewestFirst].slice().reverse();

  const skipCounts = new Map<string, number>();
  localSortedWorkoutDays.forEach(day => skipCounts.set(day.id, 0));
  let lastCompletedDayIdInStrictSequence: string | null = null;

  if (localSortedWorkoutDays.length > 0) {
    for (const log of historyOldestFirst) {
      const loggedDayInProgram = localSortedWorkoutDays.find(d => d.id === log.workoutDayIdUsed);
      
      if (!loggedDayInProgram) {
        if (lastCompletedDayIdInStrictSequence === log.workoutDayIdUsed) {
            lastCompletedDayIdInStrictSequence = null;
        }
        continue;
      }

      let expectedNextDayIdInStrictSequence: string | null = null;
      if (lastCompletedDayIdInStrictSequence === null) {
        expectedNextDayIdInStrictSequence = localSortedWorkoutDays[0]?.id || null;
      } else {
        const lastCompletedIndex = localSortedWorkoutDays.findIndex(d => d.id === lastCompletedDayIdInStrictSequence);
        if (lastCompletedIndex === -1) {
          lastCompletedDayIdInStrictSequence = null;
          expectedNextDayIdInStrictSequence = localSortedWorkoutDays[0]?.id || null;
        } else {
          const nextIndex = (lastCompletedIndex + 1) % localSortedWorkoutDays.length;
          expectedNextDayIdInStrictSequence = localSortedWorkoutDays[nextIndex]?.id || null;
        }
      }

      if (log.workoutDayIdUsed === expectedNextDayIdInStrictSequence) {
        // User completed the expected day. Reset its skip count.
        if (expectedNextDayIdInStrictSequence) {
          skipCounts.set(expectedNextDayIdInStrictSequence, 0);
        }
        lastCompletedDayIdInStrictSequence = log.workoutDayIdUsed;
      } else {
        // User completed a different day. The 'expected' day was skipped.
        if (expectedNextDayIdInStrictSequence) {
          skipCounts.set(
            expectedNextDayIdInStrictSequence,
            (skipCounts.get(expectedNextDayIdInStrictSequence) || 0) + 1
          );
        }
        // The day ACTUALLY completed has its skip count reset.
        skipCounts.set(log.workoutDayIdUsed, 0);
        lastCompletedDayIdInStrictSequence = log.workoutDayIdUsed;
      }
    }
  }

  const lastCompletionDateMap = new Map<string, Date>();
  if (historyNewestFirst.length > 0) {
    const processedDayIds = new Set<string>();
    for (const log of historyNewestFirst) {
      if (localSortedWorkoutDays.some(d => d.id === log.workoutDayIdUsed)) {
        if (!processedDayIds.has(log.workoutDayIdUsed)) {
          lastCompletionDateMap.set(log.workoutDayIdUsed, ensureDateObject(log.date));
          processedDayIds.add(log.workoutDayIdUsed);
        }
        if (processedDayIds.size === localSortedWorkoutDays.length) break;
      }
    }
  }

  const lastOverallCompletedLog = historyNewestFirst.length > 0 ? historyNewestFirst[0] : null;
  let nextRecommendedDayIdBasedOnOverallLast: string | null = null;

  if (localSortedWorkoutDays.length > 0) {
    if (lastOverallCompletedLog && localSortedWorkoutDays.some(d => d.id === lastOverallCompletedLog.workoutDayIdUsed)) {
      const lastDayIndex = localSortedWorkoutDays.findIndex(d => d.id === lastOverallCompletedLog!.workoutDayIdUsed);
      nextRecommendedDayIdBasedOnOverallLast = localSortedWorkoutDays[(lastDayIndex + 1) % localSortedWorkoutDays.length].id;
    } else {
      nextRecommendedDayIdBasedOnOverallLast = localSortedWorkoutDays[0].id;
    }
  }

  return localSortedWorkoutDays.map(day => {
    return {
      ...day,
      isNextRecommended: day.id === nextRecommendedDayIdBasedOnOverallLast,
      isLastDoneOverall: lastOverallCompletedLog ? day.id === lastOverallCompletedLog.workoutDayIdUsed : false,
      skipIndicatorCount: skipCounts.get(day.id) || 0,
      lastCompletedThisDayDate: lastCompletionDateMap.get(day.id) || null,
    };
  });
});

const lastDoneDayOverallDisplay = computed(() => {
  if (programWorkoutsHistory.value.length > 0) {
    const lastLog = programWorkoutsHistory.value[0];
    const dayDetails = sortedWorkoutDays.value.find(d => d.id === lastLog.workoutDayIdUsed);
    const dayName = lastLog.workoutDayNameUsed || dayDetails?.dayName || 'Workout';
    return { name: dayName, date: ensureDateObject(lastLog.date) };
  }
  return null;
});

const nextRecommendedDayObject = computed(() => {
  if (enhancedWorkoutDays.value.length === 0) return null;
  return enhancedWorkoutDays.value.find(d => d.isNextRecommended) || null;
});

const nextRecommendedDayNameDisplay = computed(() => {
  return nextRecommendedDayObject.value?.dayName || (sortedWorkoutDays.value[0]?.dayName || null);
});


const checkForDraftWorkout = async () => {
  if (!user.value?.uid || !activeProgram.id) return;
  
  isLoadingDraft.value = true;
  try {
    // Check for draft for any day in the active program
    for (const day of activeProgram.workoutDays) {
      const draftId = `draft_${activeProgram.id}_${day.id}`;
      const draftRef = doc(db, 'users', user.value.uid, 'draftWorkouts', draftId);
      const draftSnap = await getDoc(draftRef);
      
      if (draftSnap.exists()) {
        const draftData = draftSnap.data();
        if (draftData.workoutLog && draftData.workoutLog.length > 0) {
          activeDraft.value = {
            programId: activeProgram.id,
            dayId: day.id,
            dayName: draftData.dayName || day.dayName,
            setsCount: draftData.workoutLog.length
          };
          isLoadingDraft.value = false;
          return; // Found a draft, stop checking
        }
      }
    }
    activeDraft.value = null;
  } catch (error) {
    console.error('Error checking for draft workout:', error);
  } finally {
    isLoadingDraft.value = false;
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
    programLoadingError.value = "Cannot start workout: Program or Day ID is missing.";
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
  max-width: 800px;
  margin: 20px auto;
}
.card {
  background-color: #fff; padding: 20px 25px;
  border-radius: 8px;
  margin-bottom: 25px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  text-align: left;
  border: 1px solid var(--color-border);
}

/* Unauthenticated View */
.unauthenticated-view.card {
  text-align: center; padding: 30px 25px;
}
.welcome-title { font-size: 2.2em; color: #333; margin-bottom: 10px; }
.welcome-subtitle { font-size: 1.1em; color: #555; margin-bottom: 25px; }
.cta-container { margin: 25px 0; text-align: center; }
.cta-container.top-cta { margin-bottom: 30px; }
.cta-container.bottom-cta { margin-top: 30px; }
.button-large { padding: 15px 30px; font-size: 1.1em; font-weight: bold; }

/* Authenticated View */
.authenticated-view h1 { text-align: center; margin-bottom: 20px; }
.active-program-display h2 {
  margin-top: 0; color: #333; font-size: 1.8em; margin-bottom: 8px;
}
.routine-description {
  margin-top: 0; margin-bottom: 20px; color: #555; font-style: italic;
}

/* Program Insights Section - REFINED STYLES */
.program-insights {
  background-color: #f8f9fa;
  padding: 10px 15px; /* Reduced padding */
  border-radius: 6px;
  margin-bottom: 15px; /* Reduced space before H3 */
  border: 1px solid #e9ecef;
  text-align: left;
}
.insight-item {
  margin: 4px 0; /* Reduced vertical margin */
  font-size: 0.95em; /* Slightly smaller font */
  line-height: 1.5; /* Adjusted line height */
  color: #333;
}
.insight-label {
  font-weight: 600; /* Can be 'bold' if preferred */
  color: #495057;
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
  color: #6c757d;
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
  color: #444;
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
.no-program-message { padding: 30px; text-align: center; }
.no-program-message h2 { margin-top:0; margin-bottom: 15px; }
.button-primary {
  padding: 12px 20px; background-color: #007bff; color: white;
  border: none; border-radius: 4px; cursor: pointer; font-size: 1rem;
  text-decoration: none; display: inline-block; transition: background-color 0.2s;
}
.button-primary:hover:not(:disabled) { background-color: #0056b3; }
.loading-message { color: #6c757d; padding: 20px; text-align: center; }
.loading-message.small-loading p { font-size: 0.9em; padding: 10px 0 0 0; }
.no-items-message { color: #6c757d; padding: 20px; text-align: center; }
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
}
.modal-close-button {
  position: absolute; top: 10px; right: 15px; background: none; border: none;
  font-size: 2em; color: #777; cursor: pointer; line-height: 1; padding: 5px;
}
.modal-close-button:hover { color: #333; }

</style>