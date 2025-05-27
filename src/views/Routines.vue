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

      <div class="import-routine-section card-inset">
        <h4>Have a Routine Code/Text?</h4>
        <p>Paste your routine data (JSON format) below and click import.</p>
        <form @submit.prevent="importPastedRoutine">
          <div class="form-group">
            <label for="routineJsonData">Routine Data (JSON):</label>
            <textarea id="routineJsonData" v-model="pastedRoutineJson" rows="10" placeholder="Paste your routine JSON here..."></textarea>
          </div>
          <button type="submit" :disabled="isSaving || !pastedRoutineJson.trim()" class="button-primary">
            {{ isSaving ? 'Importing...' : 'Import Pasted Routine' }}
          </button>
        </form>
      </div>

      <hr class="section-divider">

      <div class="manual-create-section">
        <h4>Or, Create a New Routine Manually:</h4>
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
            {{ isSaving ? 'Saving...' : 'Create Routine Base Manually' }}
          </button>
        </form>
      </div>
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
              <div class="form-group" v-if="editingExercise.id">
                <label>Current Reps to Attempt Next:</label>
                <input type="number" v-model.number="editingExercise.currentRepsToDisplayOrEdit" step="1" min="1" />
              </div>
              <div class="form-group form-group-inline">
                <div><label>Sets:</label><input type="number" v-model.number="editingExercise.targetSets" min="1" required /></div>
                <div><label>Min Reps:</label><input type="number" v-model.number="editingExercise.minReps" min="1" required /></div>
              </div>
              <div class="form-group form-group-inline">
                <div><label>Max Reps:</label><input type="number" v-model.number="editingExercise.maxReps" min="1" required /></div>
                <div><label>Reps to Add on Progression:</label><input type="number" v-model.number="editingExercise.repOverloadStep" min="1" required /></div>
              </div>
              <div class="form-group form-group-inline">
                <div><label>Weight to Add on Progression (lbs):</label><input type="number" v-model.number="editingExercise.weightIncrement" step="0.1" required /></div>
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

      <div v-if="isInOverallEditMode" class="routine-level-actions card-inset">
        <h4>Routine Danger Zone</h4>
        <button @click="confirmAndDeleteActiveProgram" :disabled="isSaving" class="button-danger full-width">
          {{ isSaving ? 'Deleting...' : 'Delete Entire Routine' }}
        </button>
        <p class="small-text warning-text">This action will remove the current routine program. Exercise progress data will remain.</p>
      </div>

    </div>

    <div v-if="!user && !isLoading && !error" class="login-prompt card">
      <p>Please <router-link to="/login">log in</router-link> to manage your routines.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch, computed } from 'vue';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, collection, writeBatch, deleteDoc, type DocumentData } from 'firebase/firestore'; // Added deleteDoc
import { db } from '../firebase.js'; // Assuming firebase.js is in src/
import useAuth from '../composables/useAuth';
// Correctly import types from your central types file
import {
  type ExerciseProgress,
  type ExerciseConfig,
  type ExerciseConfigForDisplay,
  type WorkoutDay,
  type TrainingProgram
} from '../types'; // Assuming types.ts is in src/

// --- Core State ---
const { user } = useAuth();
const isLoading = ref(true);
const isSaving = ref(false);
const error = ref<string | null>(null);
const ACTIVE_PROGRAM_ID = 'user_active_main_program';
const activeProgram = reactive<TrainingProgram>({ id: null, programName: '', description: '', workoutDays: [] });

// --- Import Routine State ---
const pastedRoutineJson = ref('');

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
const editingExercise = reactive<Partial<ExerciseConfig> & { startingWeight?: number; currentWeightToDisplayOrEdit?: number; currentRepsToDisplayOrEdit?: number }>({
  id: undefined, exerciseName: '', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2,
  weightIncrement: 5, customRestSeconds: undefined, notesForExercise: '', enableProgression: true,
  startingWeight: 45, currentWeightToDisplayOrEdit: undefined, currentRepsToDisplayOrEdit: undefined,
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
// This is the entire loadActiveProgram function, modified for Promise.all()

const loadActiveProgram = async () => {
  if (!user.value || !user.value.uid) { // Initial check for user
    error.value = 'User not available.'; 
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
          // --- START OF MODIFIED SECTION FOR PROMISE.ALL() ---
          let exercisesForDisplay: ExerciseConfigForDisplay[] = [];

          if (Array.isArray(dayConfig.exercises) && dayConfig.exercises.length > 0) {
            const exerciseProgressPromises = dayConfig.exercises.map(async (exConfig) => {
              let currentPrescribedWeightVal: number | undefined = undefined;
              let currentPrescribedRepsVal: number | undefined = exConfig.minReps; // Default to minReps

              // Ensure exConfig.exerciseName is valid before creating a key
              // user.value.uid is confirmed non-null by the check at the start of this function
              if (typeof exConfig.exerciseName === 'string' && exConfig.exerciseName.trim() !== '') {
                const progressKey = exConfig.exerciseName.toLowerCase().replace(/\s+/g, '_');
                const progressDocRef = doc(db, 'users', user.value!.uid, 'exerciseProgress', progressKey);
                
                try {
                  const progressSnap = await getDoc(progressDocRef);
                  if (progressSnap.exists()) {
                    const progressData = progressSnap.data() as ExerciseProgress;
                    currentPrescribedWeightVal = progressData?.currentWeightToAttempt;
                    currentPrescribedRepsVal = progressData?.repsToAttemptNext;
                  } else {
                    currentPrescribedWeightVal = (exConfig as any).startingWeight ?? 0; 
                  }
                } catch (progressError) {
                  console.warn(`Could not fetch progress for ${exConfig.exerciseName}:`, progressError);
                  currentPrescribedWeightVal = (exConfig as any).startingWeight ?? 0;
                }
              } else {
                console.warn('Exercise encountered with missing or invalid name:', exConfig);
                currentPrescribedWeightVal = (exConfig as any).startingWeight ?? 0;
              }
              
              return { 
                ...exConfig, 
                currentPrescribedWeight: currentPrescribedWeightVal, 
                currentPrescribedReps: currentPrescribedRepsVal 
              };
            });

            exercisesForDisplay = await Promise.all(exerciseProgressPromises);
          } else {
            // If dayConfig.exercises is not an array or is empty, initialize as empty
            exercisesForDisplay = [];
          }
          // --- END OF MODIFIED SECTION FOR PROMISE.ALL() ---
          
          tempWorkoutDays.push({ ...dayConfig, exercises: exercisesForDisplay });
        }
      }
      activeProgram.workoutDays = tempWorkoutDays;
      editableProgramDetails.programName = activeProgram.programName;
      editableProgramDetails.description = activeProgram.description;
    } else {
      // Handle case where no active program exists
      activeProgram.id = null; 
      activeProgram.programName = ''; 
      activeProgram.description = '';
      activeProgram.workoutDays = []; 
      editableProgramDetails.programName = ''; 
      editableProgramDetails.description = '';
    }
  } catch (e: any) {
    error.value = "Failed to load routine data. " + e.message; 
    console.error("Error in loadActiveProgram:", e); 
  }
  finally { 
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
      updatedAt: serverTimestamp(),
    };
    if (!activeProgram.id) { 
      dataToSave.createdAt = serverTimestamp();
      dataToSave.workoutDays = []; // Start with empty workout days for a new manual routine
      await setDoc(programDocRef, dataToSave);
      activeProgram.id = ACTIVE_PROGRAM_ID; 
    } else { 
      dataToSave.workoutDays = workoutDaysToSave; // Keep existing days if just editing details
      await updateDoc(programDocRef, dataToSave);
    }
    activeProgram.programName = editableProgramDetails.programName;
    activeProgram.description = editableProgramDetails.description;
    await loadActiveProgram(); // Reload to ensure consistency
  } catch (e: any) { error.value = "Failed to save routine details. " + e.message; }
  finally { isSaving.value = false; }
};

const importPastedRoutine = async () => {
  if (!user.value || !user.value.uid) {
    error.value = "You must be logged in to import a routine.";
    return;
  }
  if (!pastedRoutineJson.value.trim()) {
    error.value = "Please paste routine data into the text area.";
    return;
  }

  isSaving.value = true;
  error.value = null;

  try {
    console.log("Attempting to parse JSON:", pastedRoutineJson.value);
    const importedData = JSON.parse(pastedRoutineJson.value);
    console.log("Parsed data:", importedData);

    if (!importedData || !importedData.programName || !Array.isArray(importedData.workoutDays)) {
        throw new Error("Invalid routine data structure. Missing programName or workoutDays array.");
    }

    // Prepare data for saving, this structure is what programToSave will look like
    // but it will have startingWeight on exercises temporarily
    const programToSaveTemp: any = {
        programName: importedData.programName,
        description: importedData.description || "",
        workoutDays: importedData.workoutDays.map((day: any) => ({
            id: day.id || doc(collection(db, '_')).id,
            dayName: day.dayName || "Unnamed Day",
            order: typeof day.order === 'number' ? day.order : 0,
            exercises: Array.isArray(day.exercises) ? day.exercises.map((ex: any) => ({
                id: ex.id || doc(collection(db, '_')).id,
                exerciseName: ex.exerciseName || "Unnamed Exercise",
                targetSets: ex.targetSets || 3,
                minReps: ex.minReps || 8,
                maxReps: ex.maxReps || 12,
                repOverloadStep: ex.repOverloadStep || 1,
                weightIncrement: ex.weightIncrement || 5,
                customRestSeconds: (ex.customRestSeconds !== null && ex.customRestSeconds !== undefined && ex.customRestSeconds >=10) ? ex.customRestSeconds : null,
                notesForExercise: ex.notesForExercise || null,
                enableProgression: typeof ex.enableProgression === 'boolean' ? ex.enableProgression : true,
                // Capture startingWeight if present, used only for progress init
                startingWeight: (ex.startingWeight !== null && ex.startingWeight !== undefined && typeof ex.startingWeight === 'number' && ex.startingWeight >=0) ? ex.startingWeight : undefined,
            })) : [],
        })).sort((a: WorkoutDay, b: WorkoutDay) => a.order - b.order),
    };
    programToSaveTemp.workoutDays.forEach((day: WorkoutDay, index: number) => day.order = index + 1);

    // Now, create the actual data to save to Firestore, removing startingWeight from the program exercises
    const finalProgramDataToSave: Omit<TrainingProgram, 'id' | 'createdAt' | 'updatedAt'> = {
        programName: programToSaveTemp.programName,
        description: programToSaveTemp.description,
        workoutDays: programToSaveTemp.workoutDays.map((day: any) => ({
            ...day,
            exercises: day.exercises.map((ex: any) => {
                const { startingWeight, ...exerciseConfig } = ex; // Destructure to remove startingWeight
                return exerciseConfig as ExerciseConfig;
            })
        }))
    };

    const programDocRef = doc(db, 'users', user.value.uid, 'trainingPrograms', ACTIVE_PROGRAM_ID);
    const fullSaveData: any = { ...finalProgramDataToSave, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };

    const batch = writeBatch(db);
    batch.set(programDocRef, fullSaveData);

    // Initialize exerciseProgress using the original importedData which contains startingWeight
    for (const day of importedData.workoutDays) {
      if (Array.isArray(day.exercises)) {
        for (const exConfig of day.exercises) {
            if (!exConfig.exerciseName) continue; // Skip if no exercise name
            const exerciseProgressKey = (exConfig.exerciseName as string).toLowerCase().replace(/\s+/g, '_');
            const exerciseProgressRef = doc(db, 'users', user.value.uid, 'exerciseProgress', exerciseProgressKey);
            
            const progressSnap = await getDoc(exerciseProgressRef);
            if (!progressSnap.exists()) {
                let actualStartingWeight = 45; // Default
                const importedStartingWeight = (exConfig as any).startingWeight;
                if (importedStartingWeight !== null && importedStartingWeight !== undefined && typeof importedStartingWeight === 'number' && importedStartingWeight >= 0) {
                    actualStartingWeight = importedStartingWeight;
                }

                const initialProgressData: ExerciseProgress = {
                    exerciseName: exConfig.exerciseName,
                    currentWeightToAttempt: actualStartingWeight,
                    repsToAttemptNext: exConfig.minReps || 8,
                    lastWorkoutAllSetsSuccessfulAtCurrentWeight: false,
                    consecutiveFailedWorkoutsAtCurrentWeightAndReps: 0,
                    lastPerformedDate: null,
                };
                batch.set(exerciseProgressRef, initialProgressData);
            }
        }
      }
    }

    await batch.commit();
    alert('Routine imported successfully!');
    pastedRoutineJson.value = '';
    await loadActiveProgram();

  } catch (e: any) {
    console.error("Error importing routine:", e);
    error.value = "Failed to import routine. Ensure data is valid JSON and matches expected structure. " + e.message;
  } finally {
    isSaving.value = false;
  }
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

// Exercise Management
const resetEditingExerciseForm = () => {
  Object.assign(editingExercise, {
    id: undefined, exerciseName: '', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2,
    weightIncrement: 5, customRestSeconds: undefined, notesForExercise: '', enableProgression: true,
    startingWeight: 45, currentWeightToDisplayOrEdit: undefined, currentRepsToDisplayOrEdit: undefined,
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
  editingExercise.startingWeight = undefined; // Not for edit
  editingExercise.currentWeightToDisplayOrEdit = exerciseToEdit.currentPrescribedWeight;
  editingExercise.currentRepsToDisplayOrEdit = exerciseToEdit.currentPrescribedReps;

  if ((editingExercise.currentWeightToDisplayOrEdit === undefined || editingExercise.currentRepsToDisplayOrEdit === undefined) &&
      user.value && user.value.uid && exerciseToEdit.exerciseName) {
    console.warn(`Re-fetching progress for ${exerciseToEdit.exerciseName} as display values were missing.`);
    const progressKey = exerciseToEdit.exerciseName.toLowerCase().replace(/\s+/g, '_');
    const progressDocRef = doc(db, 'users', user.value.uid, 'exerciseProgress', progressKey);
    try {
      const progressSnap = await getDoc(progressDocRef);
      if (progressSnap.exists()) {
        const progressData = progressSnap.data() as ExerciseProgress;
        editingExercise.currentWeightToDisplayOrEdit = progressData?.currentWeightToAttempt;
        editingExercise.currentRepsToDisplayOrEdit = progressData?.repsToAttemptNext;
      } else {
         editingExercise.currentRepsToDisplayOrEdit = editingExercise.minReps;
      }
    } catch (e) { console.error("Fallback fetch progress error:", e); }
  }
  addingExerciseToDayId.value = null;
};

const cancelAddOrEditExercise = () => {
  editingExerciseDayId.value = null; addingExerciseToDayId.value = null;
  resetEditingExerciseForm();
};

const addOrUpdateExercise = async (dayId: string) => {
  if (!user.value || !user.value.uid || !activeProgram.id) { error.value = "User or active program context missing."; return; }

  const exName = editingExercise.exerciseName?.trim();
  const sets = editingExercise.targetSets; const minR = editingExercise.minReps;
  const maxR = editingExercise.maxReps; const repStep = editingExercise.repOverloadStep;
  const weightInc = editingExercise.weightIncrement; const formCustomRest = editingExercise.customRestSeconds;
  const formEnableProg = editingExercise.enableProgression; const formNotes = editingExercise.notesForExercise?.trim();
  const formStartingWeight = editingExercise.startingWeight;
  const formCurrentWeight = editingExercise.currentWeightToDisplayOrEdit;
  const formCurrentReps = editingExercise.currentRepsToDisplayOrEdit;

  if (!exName) { error.value = "Exercise name is required."; return; }
  if (typeof sets !== 'number' || sets < 1) { error.value = "Target sets must be >= 1."; return; }
  if (typeof minR !== 'number' || minR < 1) { error.value = "Min reps must be >= 1."; return; }
  if (typeof maxR !== 'number' || maxR < minR) { error.value = "Max reps must be >= min reps."; return; }
  if (typeof repStep !== 'number' || repStep < 1) { error.value = "Rep step must be >= 1."; return; }
  if (typeof weightInc !== 'number' || weightInc <= 0) { error.value = "Weight increment must be > 0."; return; }

  let customRestForSave: number | null = null;
  if (formCustomRest !== null && formCustomRest !== undefined) {
    const restValue = Number(formCustomRest);
    if (!isNaN(restValue) && restValue >= 10) { customRestForSave = restValue; }
    else { error.value = "Custom rest must be a number >= 10, or blank."; isSaving.value = false; return; }
  }

  if (!editingExercise.id) {
    if (formStartingWeight !== null && formStartingWeight !== undefined && (typeof formStartingWeight !== 'number' || formStartingWeight < 0)) {
      error.value = "Starting weight must be >= 0 or blank."; return;
    }
  } else {
    if (formCurrentWeight !== null && formCurrentWeight !== undefined && (typeof formCurrentWeight !== 'number' || formCurrentWeight < 0)) {
      error.value = "Current weight must be >= 0 or blank."; return;
    }
    if (formCurrentReps !== null && formCurrentReps !== undefined && (typeof formCurrentReps !== 'number' || formCurrentReps < 1)) {
      error.value = "Current reps must be >= 1 or blank."; return;
    }
  }

  isSaving.value = true; error.value = null;
  const dayIndex = activeProgram.workoutDays.findIndex(d => d.id === dayId);
  if (dayIndex === -1) { error.value = "Workout day not found."; isSaving.value = false; return; }

  let exerciseDataToSaveForRoutine: ExerciseConfig;
  const notesToSave = formNotes || null;
  const enableProgToSave = typeof formEnableProg === 'boolean' ? formEnableProg : true;

  const baseDataForRoutine: Omit<ExerciseConfig, 'id'> = {
    exerciseName: exName, targetSets: sets, minReps: minR, maxReps: maxR,
    repOverloadStep: repStep, weightIncrement: weightInc, enableProgression: enableProgToSave,
    customRestSeconds: customRestForSave, notesForExercise: notesToSave,
  };

  if (editingExercise.id) {
    const existingEx = activeProgram.workoutDays[dayIndex].exercises.find(ex => ex.id === editingExercise.id);
    if (!existingEx) { error.value = "Original exercise not found for update."; isSaving.value = false; return; }
    exerciseDataToSaveForRoutine = {
        id: existingEx.id,
        exerciseName: baseDataForRoutine.exerciseName,
        targetSets: baseDataForRoutine.targetSets,
        minReps: baseDataForRoutine.minReps,
        maxReps: baseDataForRoutine.maxReps,
        repOverloadStep: baseDataForRoutine.repOverloadStep,
        weightIncrement: baseDataForRoutine.weightIncrement,
        enableProgression: baseDataForRoutine.enableProgression,
        customRestSeconds: baseDataForRoutine.customRestSeconds,
        notesForExercise: baseDataForRoutine.notesForExercise,
    };
  } else {
    exerciseDataToSaveForRoutine = { id: doc(collection(db, '_')).id, ...baseDataForRoutine };
  }

  const newWorkoutDaysArrayForDisplay = activeProgram.workoutDays.map(day => {
    if (day.id === dayId) {
      let newExercisesForDayDisplay: ExerciseConfigForDisplay[];
      if (editingExercise.id) {
        newExercisesForDayDisplay = day.exercises.map(ex => {
            if (ex.id === exerciseDataToSaveForRoutine.id) {
                return {
                    ...exerciseDataToSaveForRoutine,
                    currentPrescribedWeight: editingExercise.currentWeightToDisplayOrEdit ?? ex.currentPrescribedWeight,
                    currentPrescribedReps: editingExercise.currentRepsToDisplayOrEdit ?? ex.currentPrescribedReps
                };
            }
            return ex;
        });
      } else {
        newExercisesForDayDisplay = [...day.exercises, {
            ...exerciseDataToSaveForRoutine,
            currentPrescribedWeight: editingExercise.startingWeight ?? 0,
            currentPrescribedReps: exerciseDataToSaveForRoutine.minReps
        }];
      }
      return { ...day, exercises: newExercisesForDayDisplay };
    }
    return day;
  });

  const workoutDaysToSaveForFirestore = newWorkoutDaysArrayForDisplay.map(d => ({
      ...d,
      exercises: d.exercises.map(exDisp => {
          const { currentPrescribedReps, currentPrescribedWeight, ...config } = exDisp;
          return config as ExerciseConfig;
      })
  }));

  const batch = writeBatch(db);
  const programDocRef = doc(db, 'users', user.value.uid, 'trainingPrograms', ACTIVE_PROGRAM_ID);
  batch.update(programDocRef, { workoutDays: workoutDaysToSaveForFirestore, updatedAt: serverTimestamp() });

  const exerciseProgressKey = exerciseDataToSaveForRoutine.exerciseName.toLowerCase().replace(/\s+/g, '_');
  const exerciseProgressRef = doc(db, 'users', user.value.uid, 'exerciseProgress', exerciseProgressKey);

  if (!editingExercise.id) {
    const exerciseProgressSnap = await getDoc(exerciseProgressRef);
    if (!exerciseProgressSnap.exists()) {
      let actualStartingWeight = 45;
      if (formStartingWeight !== null && formStartingWeight !== undefined && formStartingWeight >= 0) {
        actualStartingWeight = formStartingWeight;
      }
      const initialProgressData: ExerciseProgress = {
        exerciseName: exerciseDataToSaveForRoutine.exerciseName, currentWeightToAttempt: actualStartingWeight,
        repsToAttemptNext: exerciseDataToSaveForRoutine.minReps, lastWorkoutAllSetsSuccessfulAtCurrentWeight: false,
        consecutiveFailedWorkoutsAtCurrentWeightAndReps: 0, lastPerformedDate: null,
      };
      batch.set(exerciseProgressRef, initialProgressData);
    }
  } else {
    const progressUpdates: Partial<ExerciseProgress> = {};
    let needsProgressDocUpdate = false;

    if (formCurrentWeight !== null && formCurrentWeight !== undefined && typeof formCurrentWeight === 'number' && formCurrentWeight >= 0) {
        progressUpdates.currentWeightToAttempt = formCurrentWeight;
        needsProgressDocUpdate = true;
    }
    if (formCurrentReps !== null && formCurrentReps !== undefined && typeof formCurrentReps === 'number' && formCurrentReps >= 1) {
        progressUpdates.repsToAttemptNext = formCurrentReps;
        needsProgressDocUpdate = true;
    }

    if (needsProgressDocUpdate) {
        const progressSnap = await getDoc(exerciseProgressRef);
        if (progressSnap.exists()) {
            const currentProgData = progressSnap.data() as ExerciseProgress;
            const finalProgressUpdates: Partial<ExerciseProgress> = {};
            if (progressUpdates.currentWeightToAttempt !== undefined && progressUpdates.currentWeightToAttempt !== currentProgData.currentWeightToAttempt) {
                finalProgressUpdates.currentWeightToAttempt = progressUpdates.currentWeightToAttempt;
            }
            if (progressUpdates.repsToAttemptNext !== undefined && progressUpdates.repsToAttemptNext !== currentProgData.repsToAttemptNext) {
                finalProgressUpdates.repsToAttemptNext = progressUpdates.repsToAttemptNext;
            }
            if (Object.keys(finalProgressUpdates).length > 0) {
                 batch.update(exerciseProgressRef, finalProgressUpdates);
            }
        } else {
            const initWeight = (typeof formCurrentWeight === 'number' && formCurrentWeight >=0) ? formCurrentWeight : 45;
            const initReps = (typeof formCurrentReps === 'number' && formCurrentReps >=1) ? formCurrentReps : exerciseDataToSaveForRoutine.minReps;
            const initialProgressData: ExerciseProgress = {
                exerciseName: exerciseDataToSaveForRoutine.exerciseName, currentWeightToAttempt: initWeight,
                repsToAttemptNext: initReps, lastWorkoutAllSetsSuccessfulAtCurrentWeight: false,
                consecutiveFailedWorkoutsAtCurrentWeightAndReps: 0, lastPerformedDate: null,
            };
            batch.set(exerciseProgressRef, initialProgressData);
            console.warn(`Progress doc for ${exerciseDataToSaveForRoutine.exerciseName} created during edit as it was missing.`);
        }
    }
  }

  try {
    await batch.commit();
    activeProgram.workoutDays = newWorkoutDaysArrayForDisplay;
    cancelAddOrEditExercise();
  } catch (e: any) { error.value = "Failed to save exercise. Firestore error: " + e.message; console.error("Error committing batch for exercise save:", e); }
  finally { isSaving.value = false; }
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

const confirmAndDeleteActiveProgram = () => {
  if (!activeProgram.id) return; 

  if (confirm(`Are you sure you want to delete the entire routine "${activeProgram.programName}"? This action cannot be undone.`)) {
    deleteActiveProgramFromFirestore();
  }
};

const deleteActiveProgramFromFirestore = async () => {
  if (!user.value || !user.value.uid) {
    error.value = "User not logged in.";
    return;
  }
  if (!activeProgram.id) {
    error.value = "No active routine to delete.";
    return;
  }

  isSaving.value = true; 
  error.value = null;

  try {
    const programDocRef = doc(db, 'users', user.value.uid, 'trainingPrograms', ACTIVE_PROGRAM_ID);
    await deleteDoc(programDocRef);

    activeProgram.id = null;
    activeProgram.programName = '';
    activeProgram.description = '';
    activeProgram.workoutDays = [];
    
    editableProgramDetails.programName = ''; 
    editableProgramDetails.description = '';
    
    isInOverallEditMode.value = false; 
    showEditProgramDetailsForm.value = false;
    cancelEditWorkoutDayName();
    cancelAddOrEditExercise();
    addingNewDay.value = false;

    alert('Routine deleted successfully.');

  } catch (e: any) {
    console.error("Error deleting routine:", e);
    error.value = "Failed to delete routine. " + e.message;
  } finally {
    isSaving.value = false;
  }
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

.import-routine-section {
  margin-bottom: 20px;
}
.import-routine-section h4, .manual-create-section h4 {
  margin-top: 0;
  margin-bottom: 10px;
}
.import-routine-section textarea {
  width: 100%;
  min-height: 150px; 
  font-family: monospace; 
  font-size: 0.9em;
}
.section-divider {
  margin: 30px 0;
  border: 0;
  border-top: 1px solid #eee;
}

.button-danger {
  padding: 10px 15px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
  box-sizing: border-box;
}
.button-danger:hover:not(:disabled) {
  background-color: #c82333;
}
.button-danger:disabled {
  background-color: #f8d7da;
  color: #721c24;
  cursor: not-allowed;
}

.full-width {
  width: 100%;
  display: block; 
}

.routine-level-actions {
  margin-top: 25px; 
  padding: 20px;
  border: 1px solid #f5c6cb; 
  background-color: #fdf2f2; 
  border-radius: 6px;
}
.routine-level-actions h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #721c24; 
}
.warning-text {
    color: #721c24;
    margin-top: 10px;
    font-size: 0.85em;
}
.small-text { 
    font-size: 0.9em;
}
</style>