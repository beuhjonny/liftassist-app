<template>
  <div class="routines-view">
    <div class="routine-actions-header">
      <h1>Your Training Routine</h1>
      <button v-if="activeProgram.id && !isLoading && !error && user" @click="toggleOverallEditMode" class="button-primary">
        {{ isInOverallEditMode ? 'Done Editing' : 'Edit Routine' }}
      </button>
    </div>

    <div v-if="isLoading" class="loading-message card">
      <p>Loading routine...</p>
    </div>
    <div v-if="error && !isLoading" class="error-message card">
      <p>Error: {{ error }}</p>
    </div>

    <div v-if="!activeProgram.id && !isLoading && !error && user" class="create-routine-section card">
      <h2>No Active Routine Found</h2>
      <p>Let's set up your primary training routine.</p>
      <form @submit.prevent="saveActiveProgramBaseDetails">
        <div class="form-group">
          <label for="programName">Routine Name (e.g., My PPL):</label>
          <input type="text" id="programName" v-model="editableProgramDetails.programName" required />
        </div>
        <div class="form-group">
          <label for="programDescription">Description (Optional):</label>
          <textarea id="programDescription" v-model="editableProgramDetails.description"></textarea>
        </div>
        <button type="submit" :disabled="isSaving" class="button-primary">
          {{ isSaving ? 'Saving...' : 'Create Routine Base' }}
        </button>
      </form>
    </div>

    <div v-if="activeProgram.id && !isLoading && !error && user" class="active-routine-display card">
      <div v-if="!isInOverallEditMode" class="routine-info-display">
        <h2>{{ activeProgram.programName }}</h2>
        <p class="routine-description"><em>{{ activeProgram.description || 'No description.' }}</em></p>
      </div>

      <form v-if="isInOverallEditMode && showEditProgramDetailsForm" @submit.prevent="saveActiveProgramBaseDetails" class="edit-details-form card-inset">
        <div class="form-group"><label for="editProgramName">Routine Name:</label><input type="text" id="editProgramName" v-model="editableProgramDetails.programName" required /></div>
        <div class="form-group"><label for="editProgramDescription">Description (Optional):</label><textarea id="editProgramDescription" v-model="editableProgramDetails.description"></textarea></div>
        <div class="form-actions">
            <button type="submit" :disabled="isSaving" class="button-primary small">{{ isSaving ? 'Saving...' : 'Save Details' }}</button>
        </div>
      </form>

      <div class="workout-days-list">
        <div v-for="day in sortedWorkoutDays" :key="day.id" class="workout-day-entry card-inset">
          <div class="workout-day-entry-header">
            <h4 v-if="!(isInOverallEditMode && editingDayNameId === day.id)" class="day-name-display">{{ day.dayName }}</h4>
            <div v-if="isInOverallEditMode && editingDayNameId === day.id" class="day-name-edit-form">
              <input type="text" v-model="editableDayName" @keyup.enter="saveWorkoutDayName(day.id)" @keyup.esc="cancelEditWorkoutDayName()" placeholder="Day Name"/>
              <button @click="saveWorkoutDayName(day.id)" :disabled="isSaving" class="button-icon success small" title="Save Name">✔️</button>
              <button @click="cancelEditWorkoutDayName()" class="button-icon danger small" title="Cancel Edit Name">❌</button>
            </div>
            <div v-if="isInOverallEditMode" class="day-header-actions">
              <button v-if="editingDayNameId !== day.id" @click="startEditWorkoutDayName(day)" class="button-icon small" title="Edit Day Name">✏️</button>
              <button @click="removeWorkoutDay(day.id)" :disabled="isSaving" class="button-icon small danger" title="Remove Day">🗑️</button>
            </div>
          </div>

          <ul v-if="day.exercises && day.exercises.length > 0" class="exercise-list-display">
            <li v-for="exercise in day.exercises" :key="exercise.id" class="exercise-item-display">
              <div class="exercise-info-text">
                <span class="ex-name">{{ exercise.exerciseName }}</span>
                <span class="ex-details">
                  : {{ exercise.targetSets }} sets, {{ exercise.currentPrescribedReps ?? exercise.minReps }} reps, {{ exercise.currentPrescribedWeight ?? 'N/A' }} lbs
                  <span v-if="exercise.customRestSeconds">, {{ exercise.customRestSeconds }}s rest</span>
                  <span v-else-if="isInOverallEditMode && (exercise.customRestSeconds === null || exercise.customRestSeconds === undefined)">, (Default Rest)</span>
                  <span v-if="exercise.enableProgression === false" class="no-progression-note"> (No Auto-Progression)</span>
                </span>
              </div>
              <div v-if="isInOverallEditMode" class="exercise-item-actions">
                <button @click="startEditExercise(day.id, exercise)" class="button-icon extra-small" title="Edit Exercise">✏️</button>
                <button @click="removeExerciseFromDay(day.id, exercise.id)" :disabled="isSaving" class="button-icon extra-small danger" title="Remove Exercise">🗑️</button>
              </div>
            </li>
          </ul>
          <p v-if="(!day.exercises || day.exercises.length === 0) && !isInOverallEditMode" class="no-items-message small-text">
            No exercises defined for this day. Click "Edit Routine" to add some.
          </p>

          <div v-if="isInOverallEditMode && (editingExerciseDayId === day.id || (addingExerciseToDayId === day.id && !editingExercise.id))" class="exercise-form-container">
            <form @submit.prevent="addOrUpdateExercise(day.id)" class="add-exercise-form">
              <h5>{{ editingExercise.id ? 'Edit Exercise in ' + day.dayName : `Add New Exercise to ${day.dayName}` }}</h5>
              <div class="form-group"><label>Name:</label><input type="text" v-model="editingExercise.exerciseName" required /></div>
              <div class="form-group" v-if="editingExercise.id">
                <label>Current Weight to Attempt Next (lbs):</label>
                <input type="number" v-model.number="editingExercise.currentWeightToDisplayOrEdit" step="0.1" />
              </div>
              <div class="form-group form-group-inline">
                <div><label>Sets:</label><input type="number" v-model.number="editingExercise.targetSets" min="1" required /></div>
                <div><label>Min Reps:</label><input type="number" v-model.number="editingExercise.minReps" min="1" required /></div>
              </div>
              <div class="form-group form-group-inline">
                <div><label>Max Reps:</label><input type="number" v-model.number="editingExercise.maxReps" min="1" required /></div>
                <div><label>Rep Step:</label><input type="number" v-model.number="editingExercise.repOverloadStep" min="1" required /></div>
              </div>
              <div class="form-group form-group-inline">
                <div><label>Weight Inc (lbs):</label><input type="number" v-model.number="editingExercise.weightIncrement" step="0.1" required /></div>
                <div><label>Rest (s):</label><input type="number" v-model.number="editingExercise.customRestSeconds" min="10" placeholder="Default (90s)" /></div>
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="editingExercise.enableProgression" /> Enable Auto-Progression?
                </label>
              </div>
              <div class="form-group" v-if="!editingExercise.id && addingExerciseToDayId === day.id">
                  <label>Starting Wt (lbs, for new exercise's progress):</label>
                  <input type="number" v-model.number="editingExercise.startingWeight" step="0.1" placeholder="e.g., 45" />
              </div>
              <div class="form-group"><label>Notes (Optional):</label><textarea v-model="editingExercise.notesForExercise"></textarea></div>
              <div class="form-actions">
                  <button type="submit" :disabled="isSaving" class="button-primary small">{{ editingExercise.id ? 'Update Exercise' : 'Add Exercise' }}</button>
                  <button type="button" @click="cancelAddOrEditExercise" class="button-secondary small">Cancel</button>
              </div>
            </form>
          </div>
          <button v-if="isInOverallEditMode && editingExerciseDayId !== day.id && addingExerciseToDayId !== day.id" @click="prepareAddExerciseToDay(day.id)" class="button-primary-outline small add-exercise-btn">
            + Add Exercise to {{day.dayName}}
          </button>
        </div>

        <div v-if="isInOverallEditMode" class="add-day-controls card-inset">
            <button v-if="!addingNewDay" @click="addingNewDay = true" class="button-primary-outline">Add New Workout Day</button>
            <form v-if="addingNewDay" @submit.prevent="addWorkoutDayToList" class="add-day-form-inline">
              <input type="text" v-model="newWorkoutDayName" placeholder="New Day Name (e.g., Full Body)" required />
              <div class="form-actions">
                <button type="submit" :disabled="isSaving" class="button-primary small">Save Day</button>
                <button type="button" @click="addingNewDay = false" class="button-secondary small">Cancel</button>
              </div>
            </form>
        </div>
      </div>
    </div>

    <div v-if="!user && !isLoading && !error" class="login-prompt card">
      <p>Please <router-link to="/login">log in</router-link> to manage your routines.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch, computed } from 'vue';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, collection, writeBatch, type DocumentData } from 'firebase/firestore';
import { db } from '../firebase.js';
import useAuth from '../composables/useAuth';
import { type ExerciseProgress } from '../types'; 

// --- Interface Definitions ---
interface ExerciseConfig {
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
}
interface ExerciseConfigForDisplay extends ExerciseConfig {
    currentPrescribedWeight?: number;
    currentPrescribedReps?: number;
}
interface WorkoutDay {
  id: string;
  dayName: string;
  order: number;
  exercises: ExerciseConfigForDisplay[]; // Corrected: Single semicolon
}
interface TrainingProgram {
  id: string | null;
  programName: string;
  description: string;
  workoutDays: WorkoutDay[];
}

// --- Core State ---
const { user } = useAuth();
const isLoading = ref(true);
const isSaving = ref(false);
const error = ref<string | null>(null);
const ACTIVE_PROGRAM_ID = 'user_active_main_program';
const activeProgram = reactive<TrainingProgram>({ id: null, programName: '', description: '', workoutDays: [] });

// --- Overall Edit Mode State ---
const isInOverallEditMode = ref(false);

// --- Routine Name/Description Edit State ---
const showEditProgramDetailsForm = ref(false);
const editableProgramDetails = reactive({ programName: '', description: '' });

// --- Workout Day Management State ---
const newWorkoutDayName = ref('');
const addingNewDay = ref(false);
const editingDayNameId = ref<string | null>(null);
const editableDayName = ref('');

// --- Exercise Management State ---
const editingExerciseDayId = ref<string | null>(null);
const editingExercise = reactive<Partial<ExerciseConfig> & { startingWeight?: number; currentWeightToDisplayOrEdit?: number }>({
  id: undefined, exerciseName: '', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2,
  weightIncrement: 5, customRestSeconds: undefined, notesForExercise: '', enableProgression: true,
  startingWeight: 45, currentWeightToDisplayOrEdit: undefined,
});
const addingExerciseToDayId = ref<string | null>(null);


// --- Computed Properties ---
const sortedWorkoutDays = computed(() => {
  if (!activeProgram.workoutDays) return [];
  return [...activeProgram.workoutDays].sort((a, b) => a.order - b.order);
});

// --- Functions ---
const toggleOverallEditMode = () => {
  isInOverallEditMode.value = !isInOverallEditMode.value;
  if (isInOverallEditMode.value) {
    editableProgramDetails.programName = activeProgram.programName;
    editableProgramDetails.description = activeProgram.description;
    showEditProgramDetailsForm.value = true;
  } else {
    showEditProgramDetailsForm.value = false;
    cancelEditWorkoutDayName();
    cancelAddOrEditExercise();
    addingNewDay.value = false;
  }
};

const loadActiveProgram = async () => {
  if (!user.value || !user.value.uid) {
    error.value = 'User not available to load program.';
    isLoading.value = false;
    return;
  }
  isLoading.value = true;
  error.value = null;
  try {
    const programDocRef = doc(db, 'users', user.value.uid, 'trainingPrograms', ACTIVE_PROGRAM_ID);
    const programSnap = await getDoc(programDocRef);

    if (programSnap.exists()) {
      const programDataFromDb = programSnap.data() as Omit<TrainingProgram, 'id' | 'workoutDays'> & { workoutDays: WorkoutDay[] };
      activeProgram.id = programSnap.id;
      activeProgram.programName = programDataFromDb.programName || '';
      activeProgram.description = programDataFromDb.description || '';
      
      const tempWorkoutDays: WorkoutDay[] = [];
      if (Array.isArray(programDataFromDb.workoutDays)) {
        for (const dayConfig of programDataFromDb.workoutDays) {
          const exercisesForDisplay: ExerciseConfigForDisplay[] = [];
          if (Array.isArray(dayConfig.exercises)) {
            for (const exConfig of dayConfig.exercises) {
              let currentPrescribedWeightVal: number | undefined = undefined;
              let currentPrescribedRepsVal: number | undefined = exConfig.minReps;

              const progressKey = exConfig.exerciseName.toLowerCase().replace(/\s+/g, '_');
              const progressDocRef = doc(db, 'users', user.value.uid, 'exerciseProgress', progressKey);
              try {
                const progressSnap = await getDoc(progressDocRef);
                if (progressSnap.exists()) {
                  const progressData = progressSnap.data() as ExerciseProgress;
                  currentPrescribedWeightVal = progressData.currentWeightToAttempt;
                  currentPrescribedRepsVal = progressData.repsToAttemptNext;
                } else {
                  currentPrescribedWeightVal = (exConfig as any).startingWeight ?? 0;
                }
              } catch (progressError) {
                console.warn(`Could not fetch progress for ${exConfig.exerciseName}:`, progressError);
                currentPrescribedWeightVal = (exConfig as any).startingWeight ?? 0;
              }
              exercisesForDisplay.push({
                ...exConfig,
                currentPrescribedWeight: currentPrescribedWeightVal,
                currentPrescribedReps: currentPrescribedRepsVal,
              });
            }
          }
          tempWorkoutDays.push({ ...dayConfig, exercises: exercisesForDisplay });
        }
      }
      activeProgram.workoutDays = tempWorkoutDays;
      editableProgramDetails.programName = activeProgram.programName;
      editableProgramDetails.description = activeProgram.description;
    } else {
      activeProgram.id = null; activeProgram.programName = ''; activeProgram.description = '';
      activeProgram.workoutDays = []; editableProgramDetails.programName = ''; editableProgramDetails.description = '';
    }
  } catch (e: any) {
    error.value = "Failed to load routine data. " + e.message;
    console.error("Error in loadActiveProgram:", e);
  } finally {
    isLoading.value = false;
  }
};

const saveActiveProgramBaseDetails = async () => {
  if (!user.value || !user.value.uid) { error.value = 'User not logged in.'; return; }
  if (!editableProgramDetails.programName.trim()) { error.value = 'Routine name is required.'; return; }
  isSaving.value = true; error.value = null;
  try {
    const programDocRef = doc(db, 'users', user.value.uid, 'trainingPrograms', ACTIVE_PROGRAM_ID);
    const workoutDaysToSave = activeProgram.workoutDays.map(day => ({
        ...day,
        exercises: day.exercises.map(ex => {
            const { currentPrescribedReps, currentPrescribedWeight, ...routineExerciseConfig } = ex;
            return routineExerciseConfig as ExerciseConfig;
        })
    }));

    const dataToSave: any = {
      programName: editableProgramDetails.programName,
      description: editableProgramDetails.description,
      workoutDays: workoutDaysToSave,
      updatedAt: serverTimestamp(),
    };
    if (!activeProgram.id) {
      dataToSave.createdAt = serverTimestamp();
      await setDoc(programDocRef, dataToSave);
      activeProgram.id = ACTIVE_PROGRAM_ID;
    } else {
      await updateDoc(programDocRef, dataToSave);
    }
    activeProgram.programName = editableProgramDetails.programName;
    activeProgram.description = editableProgramDetails.description;
    // Re-populate display fields after save
    const reloadedDays = JSON.parse(JSON.stringify(workoutDaysToSave));
    for (const day of reloadedDays) {
        for (const ex of day.exercises) {
            // This is a simplification; ideally, re-fetch or update precisely
            const progressKey = ex.exerciseName.toLowerCase().replace(/\s+/g, '_');
            const progressDocRef = doc(db, 'users', user.value.uid, 'exerciseProgress', progressKey);
            const progressSnap = await getDoc(progressDocRef);
            if (progressSnap.exists()) {
                const progressData = progressSnap.data() as ExerciseProgress;
                (ex as ExerciseConfigForDisplay).currentPrescribedWeight = progressData.currentWeightToAttempt;
                (ex as ExerciseConfigForDisplay).currentPrescribedReps = progressData.repsToAttemptNext;
            } else {
                (ex as ExerciseConfigForDisplay).currentPrescribedWeight = (ex as any).startingWeight ?? 0;
                (ex as ExerciseConfigForDisplay).currentPrescribedReps = ex.minReps;
            }
        }
    }
    activeProgram.workoutDays = reloadedDays;

  } catch (e: any) { error.value = "Failed to save routine details. " + e.message; }
  finally { isSaving.value = false; }
};

const addWorkoutDayToList = async () => {
  if (!user.value || !user.value.uid || !activeProgram.id) { error.value = 'No active routine or user.'; return; }
  if (!newWorkoutDayName.value.trim()) { error.value = 'Day name is required.'; return; }
  isSaving.value = true; error.value = null;
  const newDayId = doc(collection(db, '_')).id;
  const newOrder = activeProgram.workoutDays.length + 1;
  const dayToAdd: WorkoutDay = { id: newDayId, dayName: newWorkoutDayName.value.trim(), order: newOrder, exercises: [] };
  const updatedWorkoutDaysList = [...activeProgram.workoutDays, dayToAdd];
  try {
    const programDocRef = doc(db, 'users', user.value.uid, 'trainingPrograms', activeProgram.id);
    const workoutDaysToSave = updatedWorkoutDaysList.map(day => ({
      ...day, exercises: day.exercises.map(ex => {
        const { currentPrescribedReps, currentPrescribedWeight, ...config } = ex; return config as ExerciseConfig;
      })
    }));
    await updateDoc(programDocRef, { workoutDays: workoutDaysToSave, updatedAt: serverTimestamp() });
    activeProgram.workoutDays = updatedWorkoutDaysList;
    newWorkoutDayName.value = ''; addingNewDay.value = false;
  } catch (e: any) { error.value = "Failed to add workout day. " + e.message; }
  finally { isSaving.value = false; }
};

const removeWorkoutDay = async (dayIdToRemove: string) => {
  if (!user.value || !user.value.uid || !activeProgram.id) return;
  if (!confirm(`Remove this workout day and all its exercises from the routine?`)) return;
  isSaving.value = true; error.value = null;
  let updatedWorkoutDaysList = activeProgram.workoutDays.filter(day => day.id !== dayIdToRemove);
  updatedWorkoutDaysList = updatedWorkoutDaysList.map((day, index) => ({ ...day, order: index + 1 }));
  try {
    const programDocRef = doc(db, 'users', user.value.uid, 'trainingPrograms', activeProgram.id);
    const workoutDaysToSave = updatedWorkoutDaysList.map(day => ({
      ...day, exercises: day.exercises.map(ex => {
        const { currentPrescribedReps, currentPrescribedWeight, ...config } = ex; return config as ExerciseConfig;
      })
    }));
    await updateDoc(programDocRef, { workoutDays: workoutDaysToSave, updatedAt: serverTimestamp() });
    activeProgram.workoutDays = updatedWorkoutDaysList;
    if (editingDayNameId.value === dayIdToRemove) cancelEditWorkoutDayName();
    if (editingExerciseDayId.value === dayIdToRemove) cancelAddOrEditExercise();
  } catch (e: any) { error.value = "Failed to remove workout day. " + e.message; }
  finally { isSaving.value = false; }
};

const startEditWorkoutDayName = (day: WorkoutDay) => {
  cancelAddOrEditExercise(); editingDayNameId.value = day.id; editableDayName.value = day.dayName;
};
const cancelEditWorkoutDayName = () => { editingDayNameId.value = null; editableDayName.value = ''; };

const saveWorkoutDayName = async (dayIdToSave: string) => {
  if (!user.value || !user.value.uid || !activeProgram.id) return;
  if (!editableDayName.value.trim()) { error.value = "Day name cannot be empty."; return; }
  isSaving.value = true; error.value = null;
  const updatedWorkoutDaysList = activeProgram.workoutDays.map(d =>
    d.id === dayIdToSave ? { ...d, dayName: editableDayName.value.trim() } : d
  );
  try {
    const programDocRef = doc(db, 'users', user.value.uid, 'trainingPrograms', activeProgram.id);
    const workoutDaysToSave = updatedWorkoutDaysList.map(day => ({
      ...day, exercises: day.exercises.map(ex => {
        const { currentPrescribedReps, currentPrescribedWeight, ...config } = ex; return config as ExerciseConfig;
      })
    }));
    await updateDoc(programDocRef, { workoutDays: workoutDaysToSave, updatedAt: serverTimestamp() });
    activeProgram.workoutDays = updatedWorkoutDaysList;
    cancelEditWorkoutDayName();
  } catch (e: any) { error.value = "Failed to update day name. " + e.message; }
  finally { isSaving.value = false; }
};

const resetEditingExerciseForm = () => {
  Object.assign(editingExercise, {
    id: undefined, exerciseName: '', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2,
    weightIncrement: 5, customRestSeconds: undefined, notesForExercise: '', enableProgression: true,
    startingWeight: 45, currentWeightToDisplayOrEdit: undefined,
  });
};

const prepareAddExerciseToDay = (dayId: string) => {
  cancelAddOrEditExercise(); cancelEditWorkoutDayName();
  addingExerciseToDayId.value = dayId; editingExerciseDayId.value = dayId;
  resetEditingExerciseForm();
};

const startEditExercise = async (dayId: string, exerciseToEdit: ExerciseConfigForDisplay) => {
  cancelAddOrEditExercise(); cancelEditWorkoutDayName();
  editingExerciseDayId.value = dayId;

  editingExercise.id = exerciseToEdit.id;
  editingExercise.exerciseName = exerciseToEdit.exerciseName || '';
  editingExercise.targetSets = exerciseToEdit.targetSets || 3;
  editingExercise.minReps = exerciseToEdit.minReps || 8;
  editingExercise.maxReps = exerciseToEdit.maxReps || 12;
  editingExercise.repOverloadStep = exerciseToEdit.repOverloadStep || 1;
  editingExercise.weightIncrement = exerciseToEdit.weightIncrement || 5;
  editingExercise.customRestSeconds = exerciseToEdit.customRestSeconds ?? undefined;
  editingExercise.notesForExercise = exerciseToEdit.notesForExercise || '';
  editingExercise.enableProgression = typeof exerciseToEdit.enableProgression === 'boolean' ? exerciseToEdit.enableProgression : true;
  editingExercise.startingWeight = undefined;
  editingExercise.currentWeightToDisplayOrEdit = exerciseToEdit.currentPrescribedWeight;

  addingExerciseToDayId.value = null;
};

const cancelAddOrEditExercise = () => {
  editingExerciseDayId.value = null; addingExerciseToDayId.value = null;
  resetEditingExerciseForm();
};

// Replace this entire function in src/views/Routines.vue
const addOrUpdateExercise = async (dayId: string) => {
  if (!user.value || !user.value.uid || !activeProgram.id) {
    error.value = "User or active program context is missing."; return;
  }

  const exName = editingExercise.exerciseName?.trim();
  const sets = editingExercise.targetSets;
  const minR = editingExercise.minReps;
  const maxR = editingExercise.maxReps;
  const repStep = editingExercise.repOverloadStep;
  const weightInc = editingExercise.weightIncrement;
  const formCustomRest = editingExercise.customRestSeconds;
  const formEnableProg = editingExercise.enableProgression;
  const formNotes = editingExercise.notesForExercise?.trim();
  const formStartingWeight = editingExercise.startingWeight; // For new exercises
  const formCurrentWeightToAttempt = editingExercise.currentWeightToDisplayOrEdit; // For editing progress

  // --- Validation ---
  if (!exName) { error.value = "Exercise name is required."; return; }
  if (typeof sets !== 'number' || sets < 1) { error.value = "Sets must be >= 1."; return; }
  if (typeof minR !== 'number' || minR < 1) { error.value = "Min reps must be >= 1."; return; }
  if (typeof maxR !== 'number' || maxR < minR) { error.value = "Max reps must be >= min reps."; return; }
  if (typeof repStep !== 'number' || repStep < 1) { error.value = "Rep step must be >= 1."; return; }
  if (typeof weightInc !== 'number' || weightInc <= 0) { error.value = "Weight increment must be > 0."; return; }

  let customRestForSave: number | null = null;
  if (formCustomRest !== null && formCustomRest !== undefined && formCustomRest !== '') {
    const restValue = Number(formCustomRest);
    if (!isNaN(restValue) && restValue >= 10) {
      customRestForSave = restValue;
    } else { error.value = "Custom rest must be a number >= 10, or blank."; return; }
  }

  if (!editingExercise.id) { // Only validate startingWeight for brand new exercises
    if (formStartingWeight !== null && formStartingWeight !== undefined && (typeof formStartingWeight !== 'number' || formStartingWeight < 0)) {
      error.value = "Starting weight must be a non-negative number or blank."; return;
    }
  } else { // Validate currentWeightToAttempt only when editing an existing exercise
    if (formCurrentWeightToAttempt !== null && formCurrentWeightToAttempt !== undefined && (typeof formCurrentWeightToAttempt !== 'number' || formCurrentWeightToAttempt < 0)) {
      error.value = "Current weight to attempt must be a non-negative number or blank."; return;
    }
  }
  // --- End Validation ---

  isSaving.value = true; error.value = null;
  const dayIndex = activeProgram.workoutDays.findIndex(d => d.id === dayId);
  if (dayIndex === -1) { error.value = "Workout day not found."; isSaving.value = false; return; }

  let exerciseDataToSaveInRoutine: ExerciseConfig; // This is what's stored in the routine
  const notesToSave = formNotes || null;
  const enableProgToSave = typeof formEnableProg === 'boolean' ? formEnableProg : true;

  const baseDataForRoutine: Omit<ExerciseConfig, 'id'> = {
    exerciseName: exName, targetSets: sets, minReps: minR, maxReps: maxR,
    repOverloadStep: repStep, weightIncrement: weightInc, enableProgression: enableProgToSave,
    customRestSeconds: customRestForSave, notesForExercise: notesToSave,
  };

  if (editingExercise.id) { // UPDATING existing exercise in routine
    const existingExInRoutine = activeProgram.workoutDays[dayIndex].exercises.find(ex => ex.id === editingExercise.id);
    if (!existingExInRoutine) { error.value = "Original exercise not found for update."; isSaving.value = false; return; }
    exerciseDataToSaveInRoutine = { ...existingExInRoutine, ...baseDataForRoutine };
  } else { // ADDING new exercise to routine
    exerciseDataToSaveInRoutine = { id: doc(collection(db, '_')).id, ...baseDataForRoutine };
  }

  const newWorkoutDaysArray = activeProgram.workoutDays.map(day => {
    if (day.id === dayId) {
      let newExercisesForDay: ExerciseConfigForDisplay[]; // For local reactive state
      if (editingExercise.id) {
        newExercisesForDay = day.exercises.map(ex => {
            if (ex.id === exerciseDataToSaveInRoutine.id) {
                // When updating, merge with existing display fields or the new currentWeight
                return {
                    ...exerciseDataToSaveInRoutine,
                    currentPrescribedReps: ex.currentPrescribedReps, // Keep existing or re-fetch later
                    currentPrescribedWeight: editingExercise.currentWeightToDisplayOrEdit ?? ex.currentPrescribedWeight // Use form value if set
                };
            }
            return ex;
        });
      } else {
        newExercisesForDay = [...day.exercises, { ...exerciseDataToSaveInRoutine, currentPrescribedReps: undefined, currentPrescribedWeight: undefined }];
      }
      return { ...day, exercises: newExercisesForDay };
    }
    return day;
  });

  // Prepare workoutDays for Firestore (strip display-only fields)
  const workoutDaysToSaveForFirestore = newWorkoutDaysArray.map(day => ({
      ...day,
      exercises: day.exercises.map(ex => {
          const { currentPrescribedReps, currentPrescribedWeight, ...routineConfig } = ex;
          return routineConfig as ExerciseConfig;
      })
  }));

  const batch = writeBatch(db);
  const programDocRef = doc(db, 'users', user.value.uid, 'trainingPrograms', activeProgram.id);
  batch.update(programDocRef, { workoutDays: workoutDaysToSaveForFirestore, updatedAt: serverTimestamp() });

  // Handle exerciseProgress update
  const exerciseProgressKey = exerciseDataToSaveInRoutine.exerciseName.toLowerCase().replace(/\s+/g, '_');
  const exerciseProgressRef = doc(db, 'users', user.value.uid, 'exerciseProgress', exerciseProgressKey);

  if (!editingExercise.id) { // It's a new exercise being added to the routine
    const exerciseProgressSnap = await getDoc(exerciseProgressRef);
    if (!exerciseProgressSnap.exists()) {
      let actualStartingWeight = 45; // Default for new progress
      if (formStartingWeight !== null && formStartingWeight !== undefined && formStartingWeight >= 0) {
        actualStartingWeight = formStartingWeight;
      }
      const initialProgressData: ExerciseProgress = {
        exerciseName: exerciseDataToSaveInRoutine.exerciseName,
        currentWeightToAttempt: actualStartingWeight,
        repsToAttemptNext: exerciseDataToSaveInRoutine.minReps,
        lastWorkoutAllSetsSuccessfulAtCurrentWeight: false,
        consecutiveFailedWorkoutsAtCurrentWeightAndReps: 0,
        lastPerformedDate: null,
      };
      batch.set(exerciseProgressRef, initialProgressData);
    }
  } else { // It's an existing exercise in the routine being edited
    if (formCurrentWeightToAttempt !== null && formCurrentWeightToAttempt !== undefined && typeof formCurrentWeightToAttempt === 'number' && formCurrentWeightToAttempt >= 0) {
      const progressSnap = await getDoc(exerciseProgressRef);
      if (progressSnap.exists()) {
        const progressData = progressSnap.data() as ExerciseProgress;
        if (progressData.currentWeightToAttempt !== formCurrentWeightToAttempt) {
          batch.update(exerciseProgressRef, { currentWeightToAttempt: formCurrentWeightToAttempt });
        }
      } else {
        // If progress doc doesn't exist for an edited exercise, initialize it
        console.warn(`Progress doc for ${exerciseDataToSaveInRoutine.exerciseName} not found during edit. Initializing with form weight.`);
        const initialProgressData: ExerciseProgress = {
          exerciseName: exerciseDataToSaveInRoutine.exerciseName,
          currentWeightToAttempt: formCurrentWeightToAttempt, // Use the weight from the edit form
          repsToAttemptNext: exerciseDataToSaveInRoutine.minReps, // Default to min reps from routine
          lastWorkoutAllSetsSuccessfulAtCurrentWeight: false,
          consecutiveFailedWorkoutsAtCurrentWeightAndReps: 0,
          lastPerformedDate: null,
        };
        batch.set(exerciseProgressRef, initialProgressData);
      }
    }
  }

  try {
    await batch.commit();
    // Forcing a full reload of the program data will ensure all local display values are correct.
    await loadActiveProgram();
    cancelAddOrEditExercise();
  } catch (e: any) {
    error.value = "Failed to save exercise changes. Firestore error: " + e.message;
    console.error("Error committing batch for exercise changes:", e);
  } finally {
    isSaving.value = false;
  }
};

const removeExerciseFromDay = async (dayId: string, exerciseIdToRemove: string) => {
  if (!user.value || !user.value.uid || !activeProgram.id) return;
  if (!confirm(`Remove this exercise from ${activeProgram.workoutDays.find(d=>d.id===dayId)?.dayName || 'this day'}? Progress for this exercise won't be deleted.`)) return;
  isSaving.value = true; error.value = null;
  const dayIndex = activeProgram.workoutDays.findIndex(d => d.id === dayId);
  if (dayIndex === -1) { isSaving.value = false; return; }
  const updatedExercises = activeProgram.workoutDays[dayIndex].exercises.filter(ex => ex.id !== exerciseIdToRemove);
  const newWorkoutDaysArray = activeProgram.workoutDays.map(d => d.id === dayId ? { ...d, exercises: updatedExercises } : d);
  try {
    const programDocRef = doc(db, 'users', user.value.uid, 'trainingPrograms', ACTIVE_PROGRAM_ID);
    const workoutDaysToSave = newWorkoutDaysArray.map(day => ({
      ...day, exercises: day.exercises.map(ex => {
        const { currentPrescribedReps, currentPrescribedWeight, ...config } = ex; return config as ExerciseConfig;
      })
    }));
    await updateDoc(programDocRef, { workoutDays: workoutDaysToSave, updatedAt: serverTimestamp() });
    activeProgram.workoutDays = newWorkoutDaysArray;
  } catch (e: any) { error.value = "Failed to remove exercise. " + e.message; }
  finally { isSaving.value = false; }
};

// --- Lifecycle Hooks ---
let userWatcherUnsubscribe: (() => void) | null = null;
const previousUserRef = ref<typeof user.value | null>(null);
onMounted(() => {
  isLoading.value = true;
  userWatcherUnsubscribe = watch(user, (currentUser) => {
    if (currentUser && currentUser.uid) {
      if (!activeProgram.id || previousUserRef.value?.uid !== currentUser.uid) {
          loadActiveProgram();
      } else {
          isLoading.value = false;
      }
    } else {
      isLoading.value = false;
      activeProgram.id = null; activeProgram.programName = '';
      activeProgram.description = ''; activeProgram.workoutDays = [];
      if (currentUser === null) {
          error.value = 'You must be logged in to manage routines.';
      }
    }
    previousUserRef.value = currentUser;
  }, { immediate: true });
});

onUnmounted(() => {
  if (userWatcherUnsubscribe) {
    userWatcherUnsubscribe();
  }
});
</script>

<style scoped>
/* ... (All the styles from your last version should be here) ... */
.routines-view { padding: 20px; max-width: 800px; margin: 20px auto; background-color: #fdfdfd; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
.routine-actions-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom:15px; border-bottom: 1px solid #eee;}
.routine-actions-header h1 { margin: 0; font-size: 1.8em; }
.card { background-color: #fff; padding: 20px 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); text-align: left; }
.card-inset { background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin-top: 15px; margin-bottom:15px; border: 1px solid #e9ecef;}
.active-routine-display h2, .active-routine-display h3, .active-routine-display h4, .active-routine-display h5 { text-align:left; margin-bottom: 0.5em; }
.active-routine-display h3 { margin-top: 1.5em; padding-bottom: 0.3em; border-bottom: 1px solid #eee; }
.routine-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0px; }
.routine-header h3 { margin: 0; font-size:1.4em; }
.routine-description { margin-top: 5px; margin-bottom: 15px; color: #555; font-style: italic; font-size: 0.95em; text-align:left;}
.edit-link { background: none; border: none; color: #007bff; cursor: pointer; font-size: 1em; padding: 5px; }
.edit-link:hover { color: #0056b3; }
.edit-details-form { margin-top: 10px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 6px; background-color: #f0f0f0; }
.edit-details-form .button-secondary { margin-left: 10px; }
.form-group { margin-bottom: 12px; }
.form-group-inline { display: flex; gap: 10px; flex-wrap: wrap; }
.form-group-inline > div { flex: 1; min-width: 120px; }
label { display: block; margin-bottom: 5px; font-weight: 500; font-size:0.9em; color: #333; }
input[type="text"], input[type="number"], textarea { width: 100%; padding: 8px 10px; border: 1px solid #ced4da; border-radius: 4px; box-sizing: border-box; font-size: 0.95rem; }
textarea { min-height: 70px; resize: vertical; }
.button-primary { padding: 10px 15px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; transition: background-color 0.2s; }
.button-primary:hover:not(:disabled) { background-color: #0056b3; }
.button-primary.small, .button-secondary.small { padding: 6px 10px; font-size: 0.85em; }
.button-primary-outline { padding: 8px 12px; background-color: transparent; color: #007bff; border: 1px solid #007bff; border-radius: 4px; cursor: pointer; font-size: 0.9em; transition: background-color 0.2s, color 0.2s; margin-top:10px; }
.button-primary-outline:hover:not(:disabled) { background-color: #007bff; color:white; }
.button-secondary { background-color: #6c757d; color:white; border:none; border-radius:4px; padding:10px 15px; cursor:pointer;}
.button-secondary:hover:not(:disabled) { background-color: #545b62; }
button:disabled { background-color: #e9ecef; color: #6c757d; cursor: not-allowed; border-color: #ced4da !important; }
.workout-days-management { margin-top: 20px; }
.workout-days-management h4 { margin-bottom:10px; font-size: 1.2em; text-align:left;}
.workout-day-list { list-style-type: none; padding: 0; margin-bottom: 20px; }
.workout-day-entry { margin-bottom: 15px; text-align:left; }
.workout-day-entry-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.day-name-display { font-weight: 600; font-size: 1.1em; color: #0056b3; flex-grow: 1; }
.day-name-edit-form { display: flex; align-items: center; flex-grow: 1; gap: 5px; }
.day-name-edit-form input[type="text"] { flex-grow: 1; }
.day-header-actions .button-icon { margin-left: 5px; }
.button-icon { background: none; border: none; cursor: pointer; padding: 4px; font-size: 1.1em; }
.button-icon.small { font-size: 1em; } .button-icon.extra-small { font-size: 0.9em; }
.button-icon.danger { color: #dc3545; } .button-icon.danger:hover { color: #c82333; }
.button-icon.success { color: #28a745; } .button-icon.success:hover { color: #218838; }
.button-icon:hover { opacity: 0.7; }
.exercise-list-display { list-style-type: none; padding-left: 0; margin-top:10px; margin-bottom: 10px; }
.exercise-item-display { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 0.9em; border-bottom: 1px solid #f0f0f0; }
.exercise-item-display:last-child { border-bottom: none; }
.exercise-info-text { text-align:left; flex-grow:1; }
.ex-name { font-weight: 500; }
.ex-details { color: #444; font-size: 0.9em; margin-left: 5px; }
.no-progression-note { font-style: italic; color: #777; }
.exercise-item-actions { white-space: nowrap; }
.exercise-form-container { margin-top: 15px; padding-top:15px; border-top:1px dashed #ccc;}
.add-exercise-form h5 { margin-top: 0; margin-bottom: 15px; font-size: 1.1em; text-align:left; }
.add-day-controls { text-align: center; padding-top: 10px; }
.add-day-form-inline { display: flex; gap: 10px; align-items: center; margin-top:10px; }
.add-day-form-inline input {flex-grow:1;}
.form-actions { margin-top:15px; display:flex; gap:10px; justify-content: flex-start;}
.no-items-message, .loading-message, .login-prompt { color: #6c757d; text-align: center; padding: 20px; }
.no-items-message.small-text { font-size:0.9em; padding:10px 0; text-align:left; }
.error-message { color: #dc3545; background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 10px; border-radius: 4px; margin-top: 15px; }
.checkbox-label { display: flex; align-items: center; font-weight: normal; color: #555; font-size: 0.9em; }
.checkbox-label input[type="checkbox"] { width: auto; margin-right: 8px; }
/* Removed the debug-info-summary style as the div is removed */
</style>
