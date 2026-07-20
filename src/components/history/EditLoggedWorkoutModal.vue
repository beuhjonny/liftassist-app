<template>
  <div v-if="show && editableWorkout" class="modal-overlay edit-workout-modal-overlay" @click.self="$emit('close')">
    <div class="modal-content edit-workout-modal card">
      <button @click="$emit('close')" class="modal-close-button" title="Close">&times;</button>
      
      <div class="modal-header">
        <h2>✏️ Edit Logged Workout</h2>
      </div>

      <!-- Delete Confirmation State -->
      <div v-if="showDeleteConfirm" class="delete-confirmation-banner card-inset">
        <h3 class="delete-confirm-title">⚠️ Delete Workout Session?</h3>
        <p class="delete-confirm-text">
          Are you sure you want to permanently delete <strong>"{{ editableWorkout.workoutDayNameUsed || 'Workout' }}"</strong>? This action cannot be undone.
        </p>
        <div class="delete-confirm-actions">
          <button @click="confirmDelete" class="button-primary btn-danger" :disabled="isSaving">
            {{ isSaving ? 'Deleting...' : 'Yes, Delete Permanently' }}
          </button>
          <button @click="showDeleteConfirm = false" class="button-secondary" :disabled="isSaving">
            Cancel
          </button>
        </div>
      </div>

      <div v-else class="modal-body-scroll">
        <!-- Basic Info Section -->
        <div class="edit-section">
          <label class="form-label">Workout Day Name</label>
          <input 
            v-model="editableWorkout.workoutDayNameUsed" 
            type="text" 
            class="form-input" 
            placeholder="e.g. Upper Body Power"
          />
        </div>

        <div class="edit-section-row">
          <div class="edit-section">
            <label class="form-label">Duration (minutes)</label>
            <input 
              v-model.number="editableWorkout.durationMinutes" 
              type="number" 
              min="0" 
              class="form-input"
            />
          </div>
        </div>

        <!-- Exercises & Sets Breakdown -->
        <div class="edit-section">
          <h4 class="section-subtitle">Performed Exercises</h4>

          <div 
            v-for="(ex, exIdx) in editableWorkout.performedExercises" 
            :key="exIdx" 
            class="exercise-edit-card card-inset"
          >
            <div class="exercise-card-header">
              <input 
                v-model="ex.exerciseName" 
                type="text" 
                class="form-input ex-name-input" 
                placeholder="Exercise Name"
              />
              <button @click="removeExercise(exIdx)" class="icon-btn-delete" title="Remove Exercise">&times;</button>
            </div>

            <!-- Sets Editor Table -->
            <div class="sets-editor">
              <div class="sets-header-row">
                <span>Set</span>
                <span>Weight ({{ weightUnit }})</span>
                <span>Reps / Sec</span>
                <span>Status</span>
                <span></span>
              </div>

              <div v-for="(set, setIdx) in ex.sets" :key="setIdx" class="set-edit-row">
                <span class="set-num-label">#{{ set.setNumber }}</span>
                
                <input 
                  v-model.number="set.actualWeight" 
                  type="number" 
                  step="0.5" 
                  class="form-input mini-input"
                />
                
                <input 
                  v-model.number="set.actualReps" 
                  type="number" 
                  min="0" 
                  class="form-input mini-input"
                />

                <select v-model="set.status" class="form-select mini-select">
                  <option value="done">Done</option>
                  <option value="failed">Failed</option>
                </select>

                <button @click="removeSet(ex, setIdx)" class="icon-btn-remove-set" title="Remove Set">&times;</button>
              </div>

              <button @click="addSet(ex)" class="button-link add-set-btn">+ Add Set</button>
            </div>
          </div>
        </div>

        <!-- Overall Session Notes -->
        <div class="edit-section">
          <label class="form-label">Overall Session Notes</label>
          <textarea 
            v-model="editableWorkout.overallSessionNotes" 
            class="form-textarea" 
            rows="3" 
            placeholder="Add notes about energy levels, feeling, PRs..."
          ></textarea>
        </div>

        <!-- Danger Zone: Delete Button -->
        <div class="danger-zone">
          <button @click="showDeleteConfirm = true" class="button-secondary btn-delete-workout full-width">
            🗑️ Delete Workout
          </button>
        </div>
      </div>

      <!-- Action Buttons -->
      <div v-if="!showDeleteConfirm" class="modal-footer">
        <button @click="saveChanges" class="button-primary full-width" :disabled="isSaving">
          {{ isSaving ? 'Saving Changes...' : '💾 Save Changes' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { LoggedWorkout, PerformedExerciseInLog, LoggedSetData } from '@/types';
import useSettings from '@/composables/useSettings';

const props = defineProps<{
  show: boolean;
  workout: LoggedWorkout | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', updatedWorkout: LoggedWorkout): void;
  (e: 'delete', workoutId: string): void;
}>();

const { settings } = useSettings();
const weightUnit = ref(settings.value?.weightUnit || 'lbs');

const editableWorkout = ref<LoggedWorkout | null>(null);
const showDeleteConfirm = ref(false);
const isSaving = ref(false);

function cloneWorkout(wk: LoggedWorkout): LoggedWorkout {
  return {
    ...wk,
    performedExercises: wk.performedExercises ? wk.performedExercises.map(ex => ({
      ...ex,
      sets: ex.sets ? ex.sets.map(s => ({ ...s })) : []
    })) : []
  };
}

watch(() => [props.show, props.workout], () => {
  if (props.show && props.workout) {
    editableWorkout.value = cloneWorkout(props.workout);
  } else {
    editableWorkout.value = null;
  }
  showDeleteConfirm.value = false;
  isSaving.value = false;
}, { immediate: true });

function removeExercise(idx: number) {
  if (editableWorkout.value && editableWorkout.value.performedExercises) {
    editableWorkout.value.performedExercises.splice(idx, 1);
  }
}

function removeSet(ex: PerformedExerciseInLog, setIdx: number) {
  if (ex.sets) {
    ex.sets.splice(setIdx, 1);
    ex.sets.forEach((s, i) => {
      s.setNumber = i + 1;
    });
  }
}

function addSet(ex: PerformedExerciseInLog) {
  if (!ex.sets) ex.sets = [];
  const nextNum = ex.sets.length + 1;
  const lastSet = ex.sets[ex.sets.length - 1];
  
  ex.sets.push({
    exerciseId: ex.exerciseId || '',
    exerciseName: ex.exerciseName || '',
    setNumber: nextNum,
    prescribedWeight: lastSet ? lastSet.prescribedWeight : 0,
    prescribedReps: lastSet ? lastSet.prescribedReps : 10,
    actualWeight: lastSet ? lastSet.actualWeight : 0,
    actualReps: lastSet ? lastSet.actualReps : 10,
    status: 'done',
    timestamp: new Date(),
    isTimed: lastSet ? lastSet.isTimed : false
  });
}

async function saveChanges() {
  if (!editableWorkout.value) return;
  isSaving.value = true;
  try {
    emit('save', editableWorkout.value);
  } finally {
    isSaving.value = false;
  }
}

async function confirmDelete() {
  if (!editableWorkout.value || !editableWorkout.value.id) return;
  isSaving.value = true;
  try {
    emit('delete', editableWorkout.value.id);
  } finally {
    isSaving.value = false;
  }
}
</script>

<style scoped>
.edit-workout-modal-overlay {
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(6px);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.edit-workout-modal {
  max-width: 520px;
  width: 94%;
  padding: 24px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  text-align: left;
  position: relative;
}

.modal-header h2 {
  font-size: 1.4em;
  margin: 0 0 16px 0;
  color: var(--color-card-heading);
}

.modal-body-scroll {
  overflow-y: auto;
  padding-right: 4px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.edit-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.edit-section-row {
  display: flex;
  gap: 12px;
}

.form-label {
  font-size: 0.85em;
  font-weight: 600;
  color: var(--color-card-text);
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--color-card-border);
  background-color: var(--color-card-mute, #1a1a1a);
  color: var(--color-card-text, #ffffff);
  font-size: 0.95em;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary, #007bff);
}

.section-subtitle {
  font-size: 1em;
  font-weight: 700;
  margin: 10px 0 6px 0;
  color: var(--color-card-heading);
}

.exercise-edit-card {
  padding: 14px;
  border-radius: 10px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.exercise-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ex-name-input {
  font-weight: 600;
  flex: 1;
}

.icon-btn-delete {
  background: none;
  border: none;
  color: #ff4d4d;
  font-size: 1.4em;
  cursor: pointer;
  padding: 0 6px;
  line-height: 1;
}

.sets-editor {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sets-header-row {
  display: grid;
  grid-template-columns: 32px 1fr 1fr 1.2fr 24px;
  gap: 6px;
  font-size: 0.75em;
  font-weight: 700;
  opacity: 0.7;
  text-transform: uppercase;
}

.set-edit-row {
  display: grid;
  grid-template-columns: 32px 1fr 1fr 1.2fr 24px;
  gap: 6px;
  align-items: center;
}

.set-num-label {
  font-size: 0.85em;
  font-weight: 600;
  text-align: center;
}

.mini-input,
.mini-select {
  padding: 6px 8px;
  font-size: 0.85em;
}

.icon-btn-remove-set {
  background: none;
  border: none;
  color: #ff4d4d;
  font-size: 1.2em;
  cursor: pointer;
  padding: 0;
  text-align: center;
}

.add-set-btn {
  align-self: flex-start;
  font-size: 0.85em;
  margin-top: 4px;
}

.danger-zone {
  margin-top: 10px;
  padding-top: 12px;
  border-top: 1px dashed var(--color-card-border);
}

.btn-delete-workout {
  color: #ff4d4d;
  border-color: #ff4d4d44;
  background-color: transparent;
}

.btn-delete-workout:hover {
  background-color: #ff4d4d15;
}

/* Delete confirmation banner */
.delete-confirmation-banner {
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  border: 1px solid #ff4d4d55;
  background-color: #ff4d4d10;
}

.delete-confirm-title {
  font-size: 1.1em;
  color: #ff4d4d;
  margin: 0 0 10px 0;
}

.delete-confirm-text {
  font-size: 0.9em;
  margin: 0 0 16px 0;
  color: var(--color-card-text);
  line-height: 1.5;
}

.delete-confirm-actions {
  display: flex;
  gap: 10px;
}

.btn-danger {
  background-color: #dc3545 !important;
  color: #ffffff !important;
}

.modal-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--color-card-border);
}

.full-width {
  width: 100%;
}
</style>
