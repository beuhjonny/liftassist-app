<template>
  <div class="routines-view">
    <h1>Training Routines</h1>

    <!-- Loading / Error -->
    <div v-if="isLoading" class="loading-message card">
      <p>Loading routine...</p>
    </div>
    <div v-if="error && !isLoading" class="error-message card" style="position: relative;">
      <button @click="error = null" class="modal-close-button" style="top: 5px; right: 10px; font-size: 1.2em;">&times;</button>
      <p>Error: {{ error }}</p>
    </div>

    <!-- Creation Choices (Active ID null) -->
    <div v-if="!activeProgram.id && !isLoading && user" class="create-routine-section">
      <div v-if="!creationMode" class="creation-choice-phase card">
        <h2>How would you like to start?</h2>
        <p class="choice-subtitle">Choose the method that works best for your training style.</p>
        
        <div class="choice-grid">
          <button @click="quickStartManualRoutine" class="choice-card manual-choice">
            <div class="choice-icon">✍️</div>
            <div class="choice-content">
              <h3>Create Manually</h3>
              <p>Build your routine from scratch, exercise by exercise.</p>
            </div>
            <div class="choice-arrow">→</div>
          </button>

          <button @click="creationMode = 'ai'" class="choice-card ai-choice">
            <div class="choice-icon">✨</div>
            <div class="choice-content">
              <h3>AI Assisted</h3>
              <p>Import from notes, screenshots, or let AI design a plan for you.</p>
            </div>
            <div class="choice-arrow">→</div>
          </button>
        </div>
      </div>


      <div v-if="creationMode === 'ai'" class="ai-creation-flow card animate-fade-in">
        <header class="flow-header">
          <button @click="creationMode = null" class="back-link">← Back to choices</button>
          <h2>AI Assisted Setup</h2>
        </header>

        <div class="ai-sub-options">
          <div class="ai-nudge-section">
             <button @click="toggleExistingRoutineHelp" class="ai-nudge-card">
               <div class="nudge-icon">📸</div>
               <div class="nudge-text">
                 <strong>Import Existing Routine</strong>
                 <span>From Notes, Screenshots, or raw text</span>
               </div>
             </button>
             <button @click="toggleNewRoutineHelp" class="ai-nudge-card">
               <div class="nudge-icon">🤖</div>
               <div class="nudge-text">
                 <strong>Design New with AI</strong>
                 <span>Let AI build a plan based on your goals</span>
               </div>
             </button>
          </div>

          <div class="import-routine-section card-inset">
            <h4>Import via JSON (Advanced)</h4>
            <p class="small-text">If you have correctly formatted JSON data, paste it here.</p>
            <form @submit.prevent="importPastedRoutine">
              <div class="form-group">
                <textarea id="routineJsonData" v-model="pastedRoutineJson" rows="4" placeholder="Paste your routine JSON here..."></textarea>
              </div>
              <button type="submit" :disabled="isSaving || !pastedRoutineJson.trim()" class="button-primary button-large full-width">
                {{ isSaving ? 'Importing...' : 'Perform Import' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Active Routine Display -->
    <div v-if="activeProgram.id && !isLoading && user" class="active-routine-display card">
      <div v-if="!isInOverallEditMode" class="routine-info-display">
        <div class="routine-header-flex" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
             <h2 style="margin: 0;">{{ activeProgram.programName }}</h2>
             <div class="header-actions" style="display:flex; gap:10px;">
                 <button 
                    v-if="settings.activeProgramId !== activeProgram.id" 
                    @click="handleSetAsActive(activeProgram.id)" 
                    class="button-secondary small"
                    title="Make this my primary routine"
                 >
                    Set as Active
                 </button>
                 <button @click="toggleOverallEditMode" class="button-primary small">Edit Routine</button>
             </div>
        </div>
        <p class="routine-description"><em>{{ activeProgram.description || 'No description.' }}</em></p>
      </div>

      <form v-if="isInOverallEditMode" @submit.prevent="saveActiveProgramBaseDetails" class="edit-details-form card-inset">
        <div class="edit-mode-header" style="display: flex; justify-content: space-between; align-items:center; margin-bottom: 15px;">
            <h4 style="margin:0;">Editing Routine Details</h4>
            <button type="button" @click="toggleOverallEditMode" class="button-primary small">Done Editing</button>
        </div>
        
        <div class="form-group"><label for="editProgramName">Routine Name:</label><input type="text" id="editProgramName" v-model="editableProgramDetails.programName" required /></div>
        <div class="form-group"><label for="editProgramDescription">Description (Optional):</label><textarea id="editProgramDescription" v-model="editableProgramDetails.description"></textarea></div>
      </form>

      <div class="workout-days-list">
        <draggable 
            v-model="activeProgram.workoutDays" 
            item-key="id" 
            handle=".drag-handle-day"
            :disabled="!isInOverallEditMode"
            @end="onDayDragEnd"
            class="days-draggable-area"
        >
            <template #item="{ element: day }">
                <div class="workout-day-entry card-inset">
                  <div class="workout-day-entry-header">
                    <div class="header-left-group" style="display:flex; align-items:center;">
                        <span v-if="isInOverallEditMode" class="drag-handle-day" style="cursor: grab; margin-right: 10px; font-size: 1.2rem;" title="Drag to reorder session">☰</span>
                        <h4 v-if="!(isInOverallEditMode && editingDayNameId === day.id)" class="day-name-display">{{ day.dayName }}</h4>
                        <div v-if="isInOverallEditMode && editingDayNameId === day.id" class="day-name-edit-form">
                          <input type="text" v-model="editableDayName" @keyup.enter="saveWorkoutDayName(day.id)" @keyup.esc="cancelEditWorkoutDayName()" placeholder="Session Name"/>
                          <button @click="saveWorkoutDayName(day.id)" :disabled="isSaving" class="button-icon success small" title="Save Name">✔️</button>
                          <button @click="cancelEditWorkoutDayName()" class="button-icon danger small" title="Cancel Edit Name">❌</button>
                        </div>
                    </div>
                    
                    <div v-if="isInOverallEditMode" class="day-header-actions">
                      <button v-if="editingDayNameId !== day.id" @click="startEditWorkoutDayName(day)" class="button-icon small" title="Edit Session Name">✏️</button>
                      <button @click="removeWorkoutDay(day.id)" :disabled="isSaving" class="button-icon small danger" title="Remove Session">🗑️</button>
                    </div>
                  </div>

                  <!-- Exercise List Draggable -->
                  <div v-if="day.exercises && day.exercises.length > 0" class="exercise-list-display">
                      <draggable 
                        v-model="day.exercises" 
                        item-key="id" 
                        handle=".drag-handle-exercise"
                        group="exercises" 
                        :disabled="!isInOverallEditMode"
                        @end="() => onExerciseDragEnd(day.id)"
                      >
                        <template #item="{ element: exercise }">
                            <div class="exercise-item-with-inline-form">
                              <div class="exercise-item-display">
                                <div class="exercise-info-text" style="display:flex; align-items:center;">
                                  <span v-if="isInOverallEditMode" class="drag-handle-exercise" style="cursor: grab; margin-right: 8px; color:#888;" title="Drag to reorder exercise">::</span>
                                  <span class="ex-name">{{ exercise.exerciseName }}</span>
                                  <span class="ex-details">
                                    : {{ exercise.targetSets }} sets, {{ exercise.currentPrescribedReps ?? exercise.minReps }} {{ exercise.isTimed ? 'sec' : 'reps' }}, {{ toDisplay(exercise.currentPrescribedWeight, settings.weightUnit) }} {{ displayUnit(settings.weightUnit) }}
                                    <span v-if="exercise.customRestSeconds">, {{ exercise.customRestSeconds }}s rest</span>
                                    <span v-else-if="isInOverallEditMode && (exercise.customRestSeconds === null || exercise.customRestSeconds === undefined)">, (Default Rest)</span>
                                    <span v-if="exercise.enableProgression === false" class="no-progression-note"> (No Auto-Progression)</span>
                                  </span>
                                </div>
                                <div v-if="isInOverallEditMode" class="exercise-item-actions">
                                  <button @click="startEditExercise(day.id!, exercise)" class="button-icon extra-small" title="Edit Exercise">✏️</button>
                                  <button @click="removeExerciseFromDay(day.id!, exercise.id!)" :disabled="isSaving" class="button-icon extra-small danger" title="Remove Exercise">🗑️</button>
                                </div>
                              </div>

                              <!-- Inline Edit Form (Keep existing logic) -->
                              <div v-if="isInOverallEditMode && editingExerciseDayId === day.id && editingExercise.id === exercise.id" 
                                   class="exercise-form-container edit-exercise-form-inline" 
                                   style="margin-top: 10px; padding-top:10px; border-top: 1px dashed #ddd; margin-bottom: 10px; padding-bottom:10px; border-bottom: 1px dashed #ddd;">
                                <form @submit.prevent="addOrUpdateExercise(day.id!)" class="add-exercise-form">
                                  <h5>{{ 'Edit Exercise: ' + editingExercise.exerciseName }}</h5>
                                  <div class="form-group"><label>Name:</label><input type="text" v-model="editingExercise.exerciseName" required /></div>
                                  
                                  <div class="form-group form-group-inline" v-if="editingExercise.id">
                                    <div>
                                        <label>Current Weight to Attempt Next ({{ displayUnit(settings.weightUnit) }}):</label>
                                        <input type="number" v-model.number="editingExercise.currentWeightToDisplayOrEdit" step="0.1" />
                                    </div>
                                    <div>
                                        <label>{{ editingExercise.isTimed ? 'Current Hold to Attempt Next (sec):' : 'Current Reps to Attempt Next:' }}</label>
                                        <input type="number" v-model.number="editingExercise.currentRepsToDisplayOrEdit" step="1" min="1" />
                                    </div>
                                  </div>

                                  <div class="form-group form-group-inline">
                                    <div><label>Sets:</label><input type="number" v-model.number="editingExercise.targetSets" min="1" required /></div>
                                    <div><label>Rest (sec):</label><input type="number" v-model.number="editingExercise.customRestSeconds" min="10" :placeholder="'Default (' + settings.defaultRestTimer + 's)'" /></div>
                                  </div>
                                  <div class="form-group form-group-inline">
                                    <div><label>{{ editingExercise.isTimed ? 'Min Hold (sec):' : 'Min Reps:' }}</label><input type="number" v-model.number="editingExercise.minReps" min="1" required /></div>
                                    <div><label>{{ editingExercise.isTimed ? 'Max Hold (sec):' : 'Max Reps:' }}</label><input type="number" v-model.number="editingExercise.maxReps" min="1" required /></div>
                                  </div>
                                  
                                  <div class="form-group" style="display: flex; gap: 20px;">
                                    <label class="checkbox-label">
                                      <input type="checkbox" v-model="editingExercise.enableProgression" /> Enable Auto-Progression?
                                    </label>
                                    <label class="checkbox-label">
                                      <input type="checkbox" v-model="editingExercise.isTimed" /> Timed Exercise (e.g. Plank)
                                    </label>
                                  </div>

                                  <div class="form-group form-group-inline">
                                    <div v-if="!editingExercise.id">
                                        <label>Starting Weight ({{ displayUnit(settings.weightUnit) }}):</label>
                                        <input type="number" v-model.number="editingExercise.startingWeight" step="0.1" :required="!editingExercise.id" />
                                    </div>
                                    <div><label>Weight Increment ({{ displayUnit(settings.weightUnit) }}):</label><input type="number" v-model.number="editingExercise.weightIncrement" step="0.1" required /></div>
                                  </div>
                                  <div class="form-group"><label>Notes:</label><textarea v-model="editingExercise.notesForExercise"></textarea></div>

                                  <div class="form-actions">
                                    <button type="submit" :disabled="isSaving" class="button-primary small">{{ isSaving ? 'Saving...' : (editingExercise.id ? 'Update Exercise' : 'Add Exercise') }}</button>
                                    <button type="button" @click="cancelAddOrEditExercise" class="button-secondary small">Cancel</button>
                                  </div>
                                </form>
                              </div>
                            </div>
                        </template>
                      </draggable>
                  </div>
                  <div v-else class="no-items-message small-text">
                      No exercises yet.
                  </div>

                  <!-- Inline Add Exercise Form (Only if active for this day) --> 
                   <div v-if="isInOverallEditMode && addingExerciseToDayId === day.id && !editingExercise.id" class="exercise-form-container add-exercise-form-inline">
                      <form @submit.prevent="addOrUpdateExercise(day.id)" class="add-exercise-form">
                          <h5>Add New Exercise to {{ day.dayName }}</h5>
                          <div class="form-group"><label>Exercise Name:</label><input type="text" v-model="editingExercise.exerciseName" required placeholder="e.g. Bench Press" /></div>
                          <div class="form-group form-group-inline">
                              <div><label>Target Sets:</label><input type="number" v-model.number="editingExercise.targetSets" min="1" required /></div>
                              <div><label>Rest (sec):</label><input type="number" v-model.number="editingExercise.customRestSeconds" min="10" :placeholder="'Default (' + settings.defaultRestTimer + 's)'" /></div>
                          </div>
                          <div class="form-group form-group-inline">
                            <div><label>{{ editingExercise.isTimed ? 'Min Hold (sec):' : 'Min Reps:' }}</label><input type="number" v-model.number="editingExercise.minReps" min="1" required /></div>
                            <div><label>{{ editingExercise.isTimed ? 'Max Hold (sec):' : 'Max Reps:' }}</label><input type="number" v-model.number="editingExercise.maxReps" min="1" required /></div>
                          </div>
                          <div class="form-group" style="display: flex; gap: 20px;">
                            <label class="checkbox-label"><input type="checkbox" v-model="editingExercise.enableProgression" /> Enable Auto-Progression?</label>
                            <label class="checkbox-label"><input type="checkbox" v-model="editingExercise.isTimed" /> Timed Exercise</label>
                          </div>
                          <div class="form-group form-group-inline">
                            <div><label>Starting Weight ({{ displayUnit(settings.weightUnit) }}):</label><input type="number" v-model.number="editingExercise.startingWeight" step="0.1" /></div>
                            <div><label>Weight Increment ({{ displayUnit(settings.weightUnit) }}):</label><input type="number" v-model.number="editingExercise.weightIncrement" step="0.1" required /></div>
                          </div>
                          <div class="form-group"><label>Notes:</label><textarea v-model="editingExercise.notesForExercise"></textarea></div>
                          <div class="form-actions">
                              <button type="submit" :disabled="isSaving" class="button-primary small">{{ isSaving ? 'Scanning...' : 'Add Exercise' }}</button>
                              <button type="button" @click="cancelAddOrEditExercise" class="button-secondary small">Cancel</button>
                          </div>
                      </form>
                   </div>
                  
                  <div v-if="isInOverallEditMode" class="add-day-controls" style="text-align: left; padding-top: 0; margin-top: 10px;">
                       <button v-if="addingExerciseToDayId !== day.id" @click="prepareAddExerciseToDay(day.id)" class="button-primary-outline small">+ Add Exercise</button>
                  </div>
                </div>
            </template>
        </draggable>
      </div>
        
        <!-- Add New Session Logic -->
        <div v-if="isInOverallEditMode" class="add-day-section card-inset" style="text-align: center; margin-top: 25px;">
           <button v-if="!addingNewDay" @click="addingNewDay = true" class="button-primary full-width">+ Add Session</button>
           <div v-if="addingNewDay" class="add-day-form-inline">
               <input type="text" v-model="newWorkoutDayName" placeholder="New Session Name (e.g. Pull Day)" @keyup.enter="addWorkoutDayToList" />
               <button @click="addWorkoutDayToList" :disabled="isSaving" class="button-primary small" style="height: 38px;">Save</button>
               <button @click="addingNewDay = false" class="button-secondary small" style="height: 38px;">Cancel</button>
           </div>
        </div>
      
      <!-- Routine Actions Footer -->
      <div v-if="isInOverallEditMode" class="routine-level-actions">
           <h4>Danger Zone</h4>
           <button @click.prevent="requestDeleteRoutine" class="button-danger full-width" :disabled="isSaving" style="margin-top:20px;">
               Delete Entire Routine
           </button>
           <p class="warning-text">This will delete the routine "{{ activeProgram.programName }}" and all its configuration. Exercise history will be preserved.</p>
      </div>
    
    </div> <!-- End active-routine-display -->
    
    <!-- Manage Routines List -->
    <div v-if="!isLoading && user" class="manage-routines-section card" style="margin-top: 40px;">
        <div class="header-with-actions" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0;">Manage Routines</h3>
            <button @click="showProgressionHint = !showProgressionHint" class="button-icon" title="Progression Tip" style="font-size: 1.2rem; cursor: pointer; background: none; border: none;">
                💡
            </button>
        </div>
        
        <div v-if="showProgressionHint" class="info-hint-box animate-fade-in" style="background-color: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 10px; border-radius: 4px; margin-bottom: 20px; font-size: 0.9em;">
            <strong>Pro Tip:</strong> Using the exact same exercise name across multiple routines will share your progress (weight/reps) between them automatically.
        </div>
        
        <div class="routines-list">
             <div 
                v-for="program in validPrograms" 
                :key="program.id"
                class="routine-list-item"
                style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;"
            >
                <div class="routine-info">
                    <span class="routine-name">{{ program.programName || 'Untitled' }}</span>
                    <span v-if="settings.activeProgramId === program.id" class="active-badge-inline" style="margin-left: 8px; font-size: 0.8em; color: #ffc107; font-weight: bold;">★ Active</span>
                </div>
                
                <div class="routine-actions" style="display:flex; gap:10px;">
                    <button 
                        v-if="settings.activeProgramId !== program.id" 
                        @click.stop="handleSetAsActive(program.id)" 
                        class="button-secondary small"
                    >
                       Set Active
                    </button>
                     <button 
                         @click="handleSwitchRoutine(program.id)" 
                         class="button-primary-outline small"
                     >
                        View/Edit
                     </button>
                 </div>
             </div>
        </div>
        
        <div style="margin-top: 20px;">
            <button class="button-primary full-width" @click="startCreatingNewRoutine">
                + Add New Routine
            </button>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirmation" class="modal-overlay">
        <div class="modal-content" style="max-width: 500px; text-align: center;">
            <button @click="cancelDeleteRoutine" class="modal-close-button">&times;</button>
            <h3 style="color: #dc3545;">Delete Routine?</h3>
            <p>Are you sure you want to permanently delete <strong>{{ activeProgram.programName }}</strong>?</p>
            <p class="small-text warning-text" style="margin-bottom: 25px;">This action cannot be undone.</p>
            
            <div class="form-actions" style="justify-content: center; gap: 15px;">
                <button @click="confirmDeleteRoutine" class="button-danger" :disabled="isSaving">
                    {{ isSaving ? 'Deleting...' : 'Yes, Delete Routine' }}
                </button>
                <button @click="cancelDeleteRoutine" class="button-secondary">Cancel</button>
            </div>
        </div>
    </div>

  </div> <!-- End routines-view -->
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, collection, writeBatch, deleteDoc, type DocumentData } from 'firebase/firestore';
import { db } from '../firebase.js';
import useAuth from '../composables/useAuth';
import useSettings, { type WeightUnitOption } from '../composables/useSettings';
import useTrainingProgram from '../composables/useTrainingProgram';
import { toDisplay, fromInput, displayUnit } from '../utils/weight';
import {
  type ExerciseProgress,
  type ExerciseConfig,
  type ExerciseConfigForDisplay,
  type WorkoutDay,
  type TrainingProgram,
  type SessionExercise
} from '../types';
import draggable from 'vuedraggable';

// --- Core State ---
const router = useRouter();
const { user } = useAuth();
const { settings, saveSettings } = useSettings();
const { 
  activeProgram, 
  loadProgram, 
  isProgramLoading, 
  programLoadingError, 
  fetchAllPrograms, 
  allPrograms,
  createProgram,
  setActiveProgram
} = useTrainingProgram();

const isLoading = computed(() => isProgramLoading.value);
const isSaving = ref(false);
const error = ref<string | null>(null);
const showDeleteConfirmation = ref(false);
const showExerciseDeleteConfirmation = ref(false); // Potential future use, but let's stick to routine for now
const itemToDelete = ref<any>(null); // For generic delete if needed
const showProgressionHint = ref(false);

const validPrograms = computed(() => {
  return allPrograms.value.filter(p => p.id !== null) as (TrainingProgram & { id: string })[];
});

// --- Switcher Logic ---
const isActiveRoutine = computed(() => {
  return activeProgram.id === settings.value.activeProgramId;
});

const handleSwitchRoutine = async (programId: string) => {
    creationMode.value = null; // Exit creation if searching
    await loadProgram(programId);
};

const handleSetAsActive = async (programId?: string) => {
  const idToSet = programId || activeProgram.id;
  if (!idToSet) return;
  
  try {
    isSaving.value = true;
    await setActiveProgram(idToSet);
  } catch (e: any) {
    console.error(e);
    error.value = "Failed to set active routine.";
  } finally {
    isSaving.value = false;
  }
};

const startCreatingNewRoutine = () => {
    // Clear active program view to show the "Choice" screen, but we need to ensure we don't think we are loading.
    // Actually, createProgram creates it then bumps us to it.
    // But the UI currently uses (!activeProgram.id) to show the creation choice.
    // So we can:
    activeProgram.id = null; // Unsets current view
    creationMode.value = null; // Resets choice
};

// --- Import Routine State ---
const pastedRoutineJson = ref('');
const showExistingRoutineHelpDialog = ref(false);
const showNewRoutineHelpDialog = ref(false);

// --- Overall Edit Mode State ---
const isInOverallEditMode = ref(false);
const creationMode = ref<'manual' | 'ai' | null>(null);

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
  isTimed: false,
  startingWeight: 45, currentWeightToDisplayOrEdit: undefined, currentRepsToDisplayOrEdit: undefined,
});
const addingExerciseToDayId = ref<string | null>(null);


// --- Computed Properties ---
// We no longer use a computed property for sorting because we need to bind v-model directly to the array for drag-and-drop.
// Instead, we will rely on activeProgram.workoutDays being sorted upon load, and maintained in order.
// const sortedWorkoutDays = computed(() => { ... }); REMOVED

// --- Functions ---
const onDayDragEnd = async () => {
    isSaving.value = true;
    try {
        // Update order property based on new index
        activeProgram.workoutDays.forEach((day, index) => {
            day.order = index + 1;
        });

        const programDocRef = doc(db, 'users', user.value!.uid, 'trainingPrograms', activeProgram.id!);
        // We need to save the new order to Firestore
        // We'll map to the persistable structure (removing display-only fields is handled in saveActiveProgramBaseDetails but we can duplicate minimal logic here for speed or reuse)
        
        // Let's reuse the logic from saveActiveProgramBaseDetails or create a dedicate saveOrder function.
        // For safety, let's just trigger a full update of the workoutDays structure.
        
        const workoutDaysToSave = activeProgram.workoutDays.map(day => ({
             ...day,
             exercises: day.exercises.map(ex => {
                 // eslint-disable-next-line @typescript-eslint/no-unused-vars
                 const { currentPrescribedReps, currentPrescribedWeight, ...routineExerciseConfig } = ex;
                 return routineExerciseConfig as ExerciseConfig;
             })
         }));

         await updateDoc(programDocRef, { workoutDays: workoutDaysToSave, updatedAt: serverTimestamp() });

    } catch (e: any) {
        error.value = "Failed to save new order. " + e.message;
        // Optionally revert order here if needed, but for MVP we just show error
    } finally {
        isSaving.value = false;
    }
};

const onExerciseDragEnd = async (dayId: string) => {
    // When exercises are reordered within a day (or between days if we enable that),
    // we need to save the parent structure.
    // v-model on nested draggable will have already updated the array in memory.
    // We just need to persist it.
    
    // If we support dragging between days, we might need to update the dayId of the exercise if we track that? 
    // In our structure, exercises are nested in the day object, so moving them in the UI moves them in the data structure automatically.
    
    await onDayDragEnd(); // Reusing the save logic since it saves the entire tree
};

const toggleExistingRoutineHelp = () => {
  showExistingRoutineHelpDialog.value = !showExistingRoutineHelpDialog.value;
  if (showExistingRoutineHelpDialog.value) {
    showNewRoutineHelpDialog.value = false; 
  }
};

const toggleNewRoutineHelp = () => {
  showNewRoutineHelpDialog.value = !showNewRoutineHelpDialog.value;
  if (showNewRoutineHelpDialog.value) {
    showExistingRoutineHelpDialog.value = false; 
  }
};

const toggleOverallEditMode = async () => {
  if (isInOverallEditMode.value) {
    // We are exiting edit mode - Auto Save
    await saveActiveProgramBaseDetails();
    if (!error.value) {
        isInOverallEditMode.value = false;
        showEditProgramDetailsForm.value = false; // Cleanup
        cancelEditWorkoutDayName();
        cancelAddOrEditExercise();
        addingNewDay.value = false;
    }
  } else {
    // Entering edit mode
    editableProgramDetails.programName = activeProgram.programName;
    editableProgramDetails.description = activeProgram.description;
    isInOverallEditMode.value = true;
    showEditProgramDetailsForm.value = true;
  }
};

// Local loadActiveProgram removed in favor of useTrainingProgram

const quickStartManualRoutine = async () => {
    if (!user.value || !user.value.uid) { error.value = 'User not logged in.'; return; }
    isSaving.value = true;
    try {
        const newProgramId = await createProgram("New Routine", "");
        await loadProgram(newProgramId); // View it
        
        // Reset UI states
        creationMode.value = null;
        isInOverallEditMode.value = true;
        
        // Pre-fill edit forms
        editableProgramDetails.programName = "New Routine";
        editableProgramDetails.description = "";
        showEditProgramDetailsForm.value = true;
        
        // Open Add Exercise for first day logic...
        // We know createProgram makes 0 days. Wait, createProgram in useTrainingProgram makes empty workoutDays?
        // Let's check. Yes `workoutDays: []`.
        // So we need to add a day.
        
        addingNewDay.value = true; // Open the "Add Day" form
        
    } catch (e: any) {
        error.value = "Failed to create routine. " + e.message;
    } finally {
        isSaving.value = false;
    }
};

const saveActiveProgramBaseDetails = async () => {
  if (!user.value || !user.value.uid) { error.value = 'User not logged in.'; return; }
  if (!editableProgramDetails.programName.trim()) { error.value = 'Routine name is required.'; return; }
  
  const initialCreationMode = creationMode.value; // Capture mode at start
  
  isSaving.value = true; error.value = null;
  try {
    // If we don't have an ID, we should technically be creating a new one, but 
    // saveActiveProgramBaseDetails is usually called when editing an EXISTING one.
    // If it's called during "Quick Start Manual", we already created the program.
    // If it's called via "AI Import", we should use createProgram.
    
    // However, for existing logic compatibility:
    const programId = activeProgram.id;
    if (!programId) {
        throw new Error("No active routine to save to.");
    }

    const programDocRef = doc(db, 'users', user.value.uid, 'trainingPrograms', programId);
    
    // We only need to save name/desc here, usually.
    // But the original function saved workoutDays too?
    // Let's keep it safe.
    
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
    
    await updateDoc(programDocRef, dataToSave);

    activeProgram.programName = editableProgramDetails.programName;
    activeProgram.description = editableProgramDetails.description;
    
    await loadProgram(programId); 
    await fetchAllPrograms(); // Refresh list to show new name in switcher
    
    // After successful save, if we were in manual creation mode, transition to full edit mode
    // AND automatically open the "Add Day" form
    if (initialCreationMode === 'manual') {
      creationMode.value = null;
      isInOverallEditMode.value = true;
      showEditProgramDetailsForm.value = false; 
      addingNewDay.value = true; // <--- Auto-open the "Add Day" form
    }
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
    const importedData = JSON.parse(pastedRoutineJson.value);

    if (!importedData || !importedData.programName || !Array.isArray(importedData.workoutDays)) {
        throw new Error("Invalid routine data structure. Missing programName or workoutDays array.");
    }
    
    // Use createProgram to get an ID
    const newId = await createProgram(importedData.programName, importedData.description || "");
    
    // Now update that program with the full workout days
    const programDocRef = doc(db, 'users', user.value.uid, 'trainingPrograms', newId);
    
    const workoutDaysToSave = importedData.workoutDays.map((day: any) => ({
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
                isTimed: typeof ex.isTimed === 'boolean' ? ex.isTimed : false,
                startingWeight: typeof ex.startingWeight === 'number' ? ex.startingWeight : 45
            })) : []
    }));

    await updateDoc(programDocRef, { workoutDays: workoutDaysToSave });
    
    // Load it
    await loadProgram(newId);

    // Reset UI
    pastedRoutineJson.value = '';
    creationMode.value = null;

 } catch (e: any) {
    console.error("Import error:", e);
    error.value = "Failed to import routine. " + (e.message || "Unknown error.");
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

const resetEditingExerciseForm = () => {
  Object.assign(editingExercise, {
    id: undefined, exerciseName: '', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2,
    weightIncrement: 5, customRestSeconds: undefined, notesForExercise: '', enableProgression: true,
    isTimed: false,
    startingWeight: 45, currentWeightToDisplayOrEdit: undefined, currentRepsToDisplayOrEdit: undefined,
  });
};

const prepareAddExerciseToDay = (dayId: string) => {
  cancelAddOrEditExercise(); cancelEditWorkoutDayName();
  addingExerciseToDayId.value = dayId; editingExerciseDayId.value = dayId;
  resetEditingExerciseForm();
};

const startEditExercise = async (dayId: string, exerciseToEdit: ExerciseConfigForDisplay) => {
  const isCurrentlyEditingThis = editingExerciseDayId.value === dayId && editingExercise.id === exerciseToEdit.id;

  if (isCurrentlyEditingThis) {
    cancelAddOrEditExercise(); // This will clear editingExercise.id, thus closing the form
    // You might optionally call cancelEditWorkoutDayName() here if you want to ensure
    // day name editing also cancels, though it's likely not what's active.
  } else {
    // If a different exercise is being edited, or "add new" is open, or day name is being edited, cancel them.
    cancelAddOrEditExercise();
    cancelEditWorkoutDayName();

    // Proceed to open/populate the form for the clicked exercise
    editingExerciseDayId.value = dayId;
    editingExercise.id = exerciseToEdit.id; // This ID makes it an "edit" context
    editingExercise.exerciseName = exerciseToEdit.exerciseName || '';
    editingExercise.targetSets = exerciseToEdit.targetSets || 3;
    editingExercise.minReps = exerciseToEdit.minReps || 8;
    editingExercise.maxReps = exerciseToEdit.maxReps || 12;
    editingExercise.repOverloadStep = exerciseToEdit.repOverloadStep || 1;
    editingExercise.weightIncrement = exerciseToEdit.weightIncrement || 5;
    editingExercise.customRestSeconds = exerciseToEdit.customRestSeconds ?? undefined; // Use ?? for null/undefined
    editingExercise.notesForExercise = exerciseToEdit.notesForExercise || '';
    editingExercise.enableProgression = exerciseToEdit.enableProgression !== false;
    editingExercise.isTimed = exerciseToEdit.isTimed === true;
    
    // Convert to display units
    editingExercise.weightIncrement = toDisplay(exerciseToEdit.weightIncrement, settings.value.weightUnit);
    editingExercise.startingWeight = toDisplay((exerciseToEdit as any).startingWeight, settings.value.weightUnit);
    
    // We already have the current prescriptions from fetchWorkoutData if they exist 
    editingExercise.currentWeightToDisplayOrEdit = toDisplay(exerciseToEdit.currentPrescribedWeight, settings.value.weightUnit);
    editingExercise.currentRepsToDisplayOrEdit = exerciseToEdit.currentPrescribedReps;
    // Note: startingWeight is not used when editing an existing exercise's config,
    // but it might be populated if the exercise was newly added and then immediately edited.
    // The line below ensures it's cleared if it's an existing exercise being edited.
    if (exerciseToEdit.id) { // Only clear if it's an existing exercise
        editingExercise.startingWeight = undefined; 
    }

    // Fallback for fetching progress data if not available on exerciseToEdit or needs refresh
    if ((editingExercise.currentWeightToDisplayOrEdit === undefined || editingExercise.currentRepsToDisplayOrEdit === undefined) &&
        user.value && user.value.uid && exerciseToEdit.exerciseName) {
      const progressKey = exerciseToEdit.exerciseName.toLowerCase().replace(/\s+/g, '_');
      const progressDocRef = doc(db, 'users', user.value.uid, 'exerciseProgress', progressKey);
      try {
        const progressSnap = await getDoc(progressDocRef);
        if (progressSnap.exists()) {
          const progressData = progressSnap.data() as ExerciseProgress;
          // Only update if the form values are still undefined from exerciseToEdit
          if (editingExercise.currentWeightToDisplayOrEdit === undefined) {
               editingExercise.currentWeightToDisplayOrEdit = toDisplay(progressData?.currentWeightToAttempt, settings.value.weightUnit);
          }
          if (editingExercise.currentRepsToDisplayOrEdit === undefined) {
               editingExercise.currentRepsToDisplayOrEdit = progressData?.repsToAttemptNext;
          }
        } else {
           // If no progress doc, and currentRepsToDisplayOrEdit is still undefined, default to minReps from config
           if (editingExercise.currentRepsToDisplayOrEdit === undefined) {
              editingExercise.currentRepsToDisplayOrEdit = editingExercise.minReps;
           }
           if (editingExercise.currentWeightToDisplayOrEdit === undefined) {
              editingExercise.currentWeightToDisplayOrEdit = toDisplay((editingExercise as any).startingWeight, settings.value.weightUnit) || 0;
           }
        }
      } catch (e) { 
        console.error("Fallback fetch progress error for " + exerciseToEdit.exerciseName + ":", e); 
        // If error and still undefined, ensure reps default to minReps
        if (editingExercise.currentRepsToDisplayOrEdit === undefined && editingExercise.minReps) {
            editingExercise.currentRepsToDisplayOrEdit = editingExercise.minReps;
        }
      }
    }
    
    // Final safety net for reps if it's still undefined
    if (editingExercise.currentRepsToDisplayOrEdit === undefined && editingExercise.minReps) {
        editingExercise.currentRepsToDisplayOrEdit = editingExercise.minReps;
    }

    addingExerciseToDayId.value = null; // Ensure we are not in "add new exercise" mode for this day
  }
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
  const weightInc = fromInput(editingExercise.weightIncrement, settings.value.weightUnit); const formCustomRest = editingExercise.customRestSeconds;
  const formEnableProg = editingExercise.enableProgression; const formNotes = editingExercise.notesForExercise?.trim();
  const formStartingWeight = fromInput(editingExercise.startingWeight, settings.value.weightUnit);
  const formCurrentWeight = fromInput(editingExercise.currentWeightToDisplayOrEdit, settings.value.weightUnit);
  const formCurrentReps = editingExercise.currentRepsToDisplayOrEdit;

  if (!exName) { error.value = "Exercise name is required."; return; }
  if (typeof sets !== 'number' || sets < 1) { error.value = "Target sets must be >= 1."; return; }
  if (typeof minR !== 'number' || minR < 1) { error.value = editingExercise.isTimed ? "Min hold must be >= 1s." : "Min reps must be >= 1."; return; }
  if (typeof maxR !== 'number' || maxR < minR) { error.value = editingExercise.isTimed ? "Max hold must be >= min hold." : "Max reps must be >= min reps."; return; }
  if (typeof repStep !== 'number' || repStep < 0) { error.value = editingExercise.isTimed ? "Time step must be >= 0." : "Rep step must be >= 0."; return; }
  if (typeof weightInc !== 'number' || weightInc < 0) { error.value = "Weight increment must be >= 0."; return; }

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
    isTimed: editingExercise.isTimed || false,
  };

  if (editingExercise.id) {
    const existingEx = activeProgram.workoutDays[dayIndex].exercises.find(ex => ex.id === editingExercise.id);
    if (!existingEx) { error.value = "Original exercise not found for update."; isSaving.value = false; return; }
    exerciseDataToSaveForRoutine = { id: existingEx.id, ...baseDataForRoutine };
  } else {
    exerciseDataToSaveForRoutine = { id: doc(collection(db, '_')).id, ...baseDataForRoutine };
  }

  const newWorkoutDaysArrayForDisplay = activeProgram.workoutDays.map(day => {
    if (day.id === dayId) {
      let newExercisesForDayDisplay: ExerciseConfigForDisplay[];
      if (editingExercise.id) {
        newExercisesForDayDisplay = day.exercises.map(ex => 
            ex.id === exerciseDataToSaveForRoutine.id ? 
            { ...exerciseDataToSaveForRoutine, currentPrescribedWeight: editingExercise.currentWeightToDisplayOrEdit ?? ex.currentPrescribedWeight, currentPrescribedReps: editingExercise.currentRepsToDisplayOrEdit ?? ex.currentPrescribedReps } : 
            ex
        );
      } else {
        newExercisesForDayDisplay = [...day.exercises, { ...exerciseDataToSaveForRoutine, currentPrescribedWeight: editingExercise.startingWeight ?? 0, currentPrescribedReps: exerciseDataToSaveForRoutine.minReps }];
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
  const programDocRef = doc(db, 'users', user.value.uid, 'trainingPrograms', activeProgram.id);
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
        progressUpdates.currentWeightToAttempt = formCurrentWeight; needsProgressDocUpdate = true;
    }
    if (formCurrentReps !== null && formCurrentReps !== undefined && typeof formCurrentReps === 'number' && formCurrentReps >= 1) {
        progressUpdates.repsToAttemptNext = formCurrentReps; needsProgressDocUpdate = true;
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
            if (Object.keys(finalProgressUpdates).length > 0) { batch.update(exerciseProgressRef, finalProgressUpdates); }
        } else {
            const initWeight = (typeof formCurrentWeight === 'number' && formCurrentWeight >=0) ? formCurrentWeight : 45;
            const initReps = (typeof formCurrentReps === 'number' && formCurrentReps >=1) ? formCurrentReps : exerciseDataToSaveForRoutine.minReps;
            const initialProgressData: ExerciseProgress = {
                exerciseName: exerciseDataToSaveForRoutine.exerciseName, currentWeightToAttempt: initWeight,
                repsToAttemptNext: initReps, lastWorkoutAllSetsSuccessfulAtCurrentWeight: false,
                consecutiveFailedWorkoutsAtCurrentWeightAndReps: 0, lastPerformedDate: null,
            };
            batch.set(exerciseProgressRef, initialProgressData);
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
    const programDocRef = doc(db, 'users', user.value.uid, 'trainingPrograms', activeProgram.id);
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

const deleteActiveProgramFromFirestore = async (programId: string) => {
    if (!user.value || !user.value.uid) return;
    const programRef = doc(db, 'users', user.value.uid, 'trainingPrograms', programId);
    await deleteDoc(programRef);
};

const requestDeleteRoutine = () => {
    if (!activeProgram.id) return;
    showDeleteConfirmation.value = true;
};

const cancelDeleteRoutine = () => {
    showDeleteConfirmation.value = false;
};

const confirmDeleteRoutine = async () => {
  showDeleteConfirmation.value = false; // Close immediately or wait? Better wait.
  // Actually, keeping it open with loading state is better UX.
  // But we reused `isSaving` for overall page...
  
  if (!activeProgram.id) return;
  isSaving.value = true;
  const idToDelete = activeProgram.id;

  try {
    console.log("Deleting program:", idToDelete);
    await deleteActiveProgramFromFirestore(idToDelete);
    
    if (settings.value.activeProgramId === idToDelete) {
         settings.value.activeProgramId = null;
         saveSettings();
    }
    
    await fetchAllPrograms();

    activeProgram.id = null; 
    activeProgram.programName = '';
    activeProgram.description = '';
    activeProgram.workoutDays = [];
    isInOverallEditMode.value = false;
    showDeleteConfirmation.value = false; // Close after success

  } catch (e: any) {
    console.error("Delete failed", e);
    error.value = "Failed to delete routine: " + e.message;
    // We can reopen modal or just show error on page
  } finally {
    isSaving.value = false;
    // ensure modal is closed if it wasn't
    showDeleteConfirmation.value = false;
  }
};

// --- Lifecycle Hooks ---
onMounted(() => {
    // We don't need to manually watch user here to load active program, 
    // because useTrainingProgram does it.
    // However, if we want to ensure we fetch the LIST of programs:
    if (user.value) {
        fetchAllPrograms();
    }
    
    watch(user, (u) => {
        if (u) fetchAllPrograms();
    });
});

onUnmounted(() => {
  // Cleanup if needed
});
</script>

<style scoped>
/* --- New Routine Creation UX Styles --- */
.creation-choice-phase {
  text-align: center;
  padding: 40px 20px;
}
.choice-subtitle {
  margin-bottom: 30px;
  opacity: 0.8;
  font-size: 1.1em;
}
.choice-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}
.choice-card {
  background: var(--color-card-mute);
  border: 1px solid var(--color-card-border);
  border-radius: 12px;
  padding: 30px 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.choice-card:hover {
  transform: translateY(-5px);
  border-color: #007bff;
  box-shadow: 0 8px 25px rgba(0, 123, 255, 0.15);
  background: var(--color-card-bg);
}
.choice-icon {
  font-size: 3em;
  line-height: 1;
}
.choice-content h3 {
  margin: 0 0 8px 0;
  font-size: 1.3em;
  color: var(--color-card-heading);
}
.choice-content p {
  margin: 0;
  font-size: 0.9em;
  opacity: 0.8;
  line-height: 1.4;
}
.choice-arrow {
  font-size: 1.5em;
  color: #007bff;
  opacity: 0;
  transition: all 0.3s;
  margin-top: 10px;
}
.choice-card:hover .choice-arrow {
  opacity: 1;
  transform: translateX(5px);
}

/* AI Creation Flow Specifics */
.ai-nudge-section {
  display: grid;
  gap: 15px;
  margin-bottom: 25px;
}
.ai-nudge-card {
  display: flex;
  align-items: center;
  gap: 15px;
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  padding: 15px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
}
.ai-nudge-card:hover {
  border-color: #007bff;
  background: var(--color-card-mute);
  transform: translateX(5px);
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.1);
}
.nudge-icon { font-size: 1.5em; }
.nudge-text { display: flex; flex-direction: column; }
.nudge-text strong { color: var(--color-card-heading); font-size: 1.1em; }
.nudge-text span { font-size: 0.9em; opacity: 0.8; }

/* Flow Headers & Back Links */
.flow-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 25px;
  border-bottom: 1px solid var(--color-card-border);
  padding-bottom: 15px;
}
.back-link {
  background: none;
  border: none;
  color: var(--color-interactive);
  cursor: pointer;
  padding: 0;
  font-size: 0.9em;
  text-decoration: underline;
}

/* --- Routine Switcher Styles --- */
.routine-switcher-container {
  margin-bottom: 20px;
  width: 100%;
}

.tabs-scroll-area {
  display: flex;
  overflow-x: auto;
  gap: 10px;
  padding: 5px 2px;
  scrollbar-width: none; 
  -ms-overflow-style: none;
}
.tabs-scroll-area::-webkit-scrollbar {
  display: none;
}

.tab-chip {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 20px;
  background-color: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  color: var(--color-text);
  font-size: 0.9em;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.tab-chip:hover {
  background-color: var(--color-card-mute);
  border-color: #aaa;
}

.tab-chip.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.4);
}

.tab-chip.is-main {
  font-weight: 600;
}

.tab-chip .active-badge {
  margin-left: 6px;
  font-size: 0.8em;
  color: #FFD700;
}

.tab-chip.create-new {
  background-color: transparent;
  border: 1px dashed #aaa;
  color: var(--color-text-mute);
}
.tab-chip.create-new:hover {
  border-color: #007bff;
  color: #007bff;
  background-color: rgba(0, 123, 255, 0.05);
}

/* Edit Routine Button - Font Boost */
.active-routine-display .button-primary.small,
.routine-info-display .button-primary.small {
    font-size: 1rem;
    padding: 8px 16px;
}

/* --- Routine List Styles --- */
.routine-list-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 0;
    border-bottom: 1px solid var(--color-card-border);
}
.routine-list-item:last-child {
    border-bottom: none;
}
.routine-name {
    font-size: 1.05em;
    color: var(--color-card-heading);
}
.active-badge-inline {
    color: #FFD700;
    font-size: 0.85em;
    margin-left: 8px;
    font-weight: normal;
}
.routine-actions {
    display: flex;
    gap: 8px;
}

@media (max-width: 500px) {
    .routine-list-item {
        flex-direction: row !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 5px; /* Reduce gap slightly */
    }
    .routine-info {
        text-align: left;
        flex: 1;
        padding-right: 5px;
    }
    .routine-actions {
        width: auto;
        justify-content: flex-end !important;
    }
}
.back-link:hover { text-decoration: underline; }
.section-hint {
  margin-bottom: 20px;
  font-style: italic;
  opacity: 0.8;
  font-size: 0.95em;
}

/* Animations */
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 500px) {
  .choice-grid {
    grid-template-columns: 1fr;
  }
}
.routines-view {
  padding: 10px;
  max-width: 700px;
  margin: 20px auto;
}
.routines-view h1 {
  text-align: center;
  margin-bottom: 20px;
  color: var(--color-heading);
  font-family: 'Montserrat', sans-serif;
  font-weight: 400;
}
.routine-actions-header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 20px; 
  padding-bottom: 15px; 
  border-bottom: 1px solid var(--color-card-border);
}
.card { 
  background-color: var(--color-card-bg);   
  padding: 20px 25px;
  border-radius: 8px; /* Standardize with Home */
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08); /* Standardize with Home */
  text-align: left;
  border: 1px solid var(--color-card-border); 
  color: var(--color-card-text);  
}
.card-inset { background-color: var(--color-card-mute); color: var(--color-card-text); padding: 15px; border-radius: 6px; margin-top: 15px; margin-bottom:15px; border: 1px solid var(--color-card-border);}
.active-routine-display h2, .active-routine-display h3, .active-routine-display h4, .active-routine-display h5 { text-align:left; margin-bottom: 0.5em; color: var(--color-card-heading); }
.active-routine-display h3 { margin-top: 1.5em; padding-bottom: 0.3em; border-bottom: 1px solid var(--color-card-border); }
.routine-description { margin-top: 5px; margin-bottom: 15px; color: var(--color-card-text); font-style: italic; font-size: 0.95em; text-align:left;}
.edit-details-form { margin-top: 10px; padding: 20px; border: 1px solid var(--color-card-border); border-radius: 6px; background-color: var(--color-card-mute); }
.form-group { margin-bottom: 12px; }
.form-group-inline { display: flex; gap: 10px; flex-wrap: wrap; }
.form-group-inline > div { flex: 1; min-width: 120px; }
label { display: block; margin-bottom: 5px; font-weight: 500; font-size:0.9em; color: var(--color-card-text); }
input[type="text"], input[type="number"], textarea { width: 100%; padding: 8px 10px; border: 1px solid var(--color-card-border); border-radius: 4px; box-sizing: border-box; font-size: 0.95rem; background-color: var(--color-card-bg); color: var(--color-card-text); }
textarea { min-height: 70px; resize: vertical; }
.button-primary { padding: 10px 15px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; transition: background-color 0.2s; }
.button-primary:hover:not(:disabled) { background-color: #0056b3; }
.button-primary.small, .button-secondary.small { padding: 6px 10px; font-size: 0.85em; border: 1px solid transparent; }
.button-primary-outline.small { padding: 6px 10px; font-size: 0.85em; margin-top: 0; }
.button-primary-outline { padding: 8px 12px; background-color: transparent; color: #007bff; border: 1px solid #007bff; border-radius: 4px; cursor: pointer; font-size: 0.9em; transition: background-color 0.2s, color 0.2s; margin-top:10px; }
.button-primary-outline:hover:not(:disabled) { background-color: #007bff; color:white; }
.button-secondary { background-color: #6c757d; color:white; border:none; border-radius:4px; padding:10px 15px; cursor:pointer; font-size: 0.95rem; transition: background-color 0.2s;}
.button-secondary:hover:not(:disabled) { background-color: #545b62; }
button:disabled { background-color: #e9ecef; color: #6c757d; cursor: not-allowed; border-color: #ced4da !important; }
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
.exercise-item-display { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 0.9em; border-bottom: 1px solid var(--color-card-border); }
.exercise-item-display:last-child { border-bottom: none; }
.exercise-info-text { text-align:left; flex-grow:1; color: var(--color-card-text);}
.ex-name { font-weight: 500; color: var(--color-card-heading); }
.ex-details { color: var(--color-card-text); opacity: 0.8; font-size: 0.9em; margin-left: 5px; }
.no-progression-note { font-style: italic; color: #777; }
.exercise-item-actions { white-space: nowrap; }
.exercise-form-container { margin-top: 15px; padding-top:15px; border-top:1px dashed var(--color-card-border);}
.add-exercise-form h5 { margin-top: 0; margin-bottom: 15px; font-size: 1.1em; text-align:left; color: var(--color-card-heading); }
.add-day-controls { text-align: center; padding-top: 10px; }
.add-day-form-inline { display: flex; gap: 10px; align-items: center; margin-top:10px; }
.add-day-form-inline input {flex-grow:1;}
.form-actions { margin-top:15px; display:flex; gap:10px; justify-content: flex-start;}
.no-items-message, .loading-message, .login-prompt { color: #6c757d; text-align: center; padding: 20px; }
.no-items-message.small-text { font-size:0.9em; padding:10px 0; text-align:left; }
.error-message { color: #dc3545; background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 10px; border-radius: 4px; margin-top: 15px; }
.checkbox-label { display: flex; align-items: center; font-weight: normal; color: var(--color-card-text); font-size: 0.9em; }
.checkbox-label input[type="checkbox"] { width: auto; margin-right: 8px; }

.import-routine-section h4, .manual-create-section h4 { margin-top: 0; margin-bottom: 10px; color: var(--color-card-heading); }
.import-routine-section textarea { width: 100%; min-height: 150px; font-family: monospace; font-size: 0.9em; background-color: var(--color-card-bg); color: var(--color-card-text); }
.section-divider { margin: 30px 0; border: 0; border-top: 1px solid var(--color-card-border); }

.button-danger { padding: 10px 15px; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; transition: background-color 0.2s; box-sizing: border-box;}
.button-danger:hover:not(:disabled) { background-color: #c82333; }
.button-danger:disabled { background-color: #f8d7da; color: #721c24; cursor: not-allowed; }
.full-width { width: 100%; display: block; }
.routine-level-actions { margin-top: 25px; padding: 20px; border: 1px solid #f5c6cb; background-color: #fdf2f2; border-radius: 6px;}
.routine-level-actions h4 { margin-top: 0; margin-bottom: 10px; color: #721c24;}
.warning-text { color: #721c24; margin-top: 10px; font-size: 0.85em;}
.small-text { font-size: 0.9em; }

.lazy-import-help { padding: 15px; margin-bottom: 20px; }
.full-width-button-link {
  width: 100%;
  display: block;
  box-sizing: border-box;
  text-align: center;
  /* Uses .button-secondary styles implicitly or add them if needed */
}

.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.6); display: flex; justify-content: center; align-items: center; z-index: 1000;}
.modal-content { background-color: var(--color-card-bg); padding: 25px 30px; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); width: 90%; max-width: 750px; max-height: 85vh; overflow-y: auto; position: relative; color: var(--color-card-text);}
.modal-close-button { position: absolute; top: 10px; right: 15px; background: none; border: none; font-size: 2rem; line-height: 1; color: #888; cursor: pointer;}
.modal-close-button:hover { color: var(--color-card-text); }
.modal-content h3 { margin-top: 0; color: var(--color-card-heading); border-bottom: 1px solid var(--color-card-border); padding-bottom: 10px; margin-bottom: 15px;}
.ai-instructions { margin-top: 10px; background-color: var(--color-card-mute); border: 1px solid var(--color-card-border); padding: 15px; border-radius: 4px; font-size: 0.9em; color: var(--color-card-text);}
.ai-instructions pre { white-space: pre-wrap; word-wrap: break-word; background-color: var(--color-card-bg); padding: 10px; border-radius: 4px; max-height: 40vh; overflow-y: auto; font-family: monospace; font-size: 0.90em; line-height: 1.4; color: var(--color-card-text);}

@media (max-width: 600px) {
  .routines-view {
    padding: 5px;
  }
  /* Align header with card content (5px view + 10px header = 15px visual start, matching card text loosely) */
  .routine-actions-header {
    padding: 0 10px; 
    margin-bottom: 10px;
  }
  .routine-actions-header h1 {
    font-size: 1.5rem; /* Slightly smaller for mobile */
  }
  
  .card {
    padding: 15px 15px; /* Reduced from 20px 25px */
    margin-bottom: 15px;
  }
  /* Reduce inset card padding to save even more space for lists */
  .card-inset {
    padding: 10px;
    margin-top: 10px;
    margin-bottom: 10px;
  }
  
  .section-divider {
    margin: 20px 0;
  }
  .import-routine-section textarea {
    min-height: 100px;
  }
}
</style>