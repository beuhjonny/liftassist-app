<template>
  <div class="current-exercise-block">
    <div class="active-set-timer-display">Set Timer: {{ activeSetTime }}</div>
    <h2>{{ exercise.exerciseName }}</h2>
    <p v-if="exercise.notesForExercise" class="exercise-notes">
      <em>Notes: {{ exercise.notesForExercise }}</em>
    </p>
    <div class="current-set-info card-inset">
      <div class="current-set-info-header">
        <h3>Set {{ setNumber }} of {{ exercise.targetSets }}</h3>
        <button @click="$emit('openEdit')" class="button-icon extra-small" title="Edit Weight/Reps">✏️</button>
      </div>
      <div class="prescription-details">
        <span 
          class="prescription-reps" 
          :class="{ 'failed-last-attempt-text': didFailLastAttempt }">
          <template v-if="exercise.isToFailure">To Failure</template>
          <template v-else>{{ effectiveReps }} {{ exercise.isTimed ? 'sec hold' : 'reps' }}</template>
        </span>
        <span class="prescription-separator">@</span>
        <span 
          class="prescription-weight" 
          :class="{ 'failed-last-attempt-text': didFailLastAttempt }">
          {{ displayWeight }} {{ displayUnit(weightUnit) }}
        </span>
        <div v-if="lastPerformance" class="last-performance-info" style="font-size: 0.85em; color: #6c757d; margin-top: 5px;">
          Last: {{ toDisplay(lastPerformance.actualWeight, weightUnit) }} {{ displayUnit(weightUnit) }} x {{ lastPerformance.actualReps }} 
          <span v-if="lastPerformance.status === 'failed'">(Failed)</span>
        </div>
      </div>
    </div>

    <div v-if="exercise.isTimed" class="timed-exercise-controls card-inset" style="margin-top: 20px; text-align: center;">
      <div v-if="!isHoldTimerRunning" class="hold-timer-prep">
        <button @click="$emit('startHold')" class="button-primary full-width-button">START HOLD TIMER</button>
      </div>
      <div v-else class="hold-timer-active">
        <div class="hold-timer-display" style="font-size: 3rem; font-weight: bold; margin-bottom: 10px; color: var(--color-primary);">{{ formattedHoldTime }}</div>
        <button @click="$emit('cancelHold')" class="button-secondary full-width-button">Cancel Timer</button>
      </div>
    </div>
    
    <p v-if="didFailLastAttempt && failureStreak && failureStreak > 0" 
       class="failure-streak-note">
      Failed last {{ failureStreak }} 
      attempt{{ failureStreak > 1 ? 's' : '' }} 
      at this prescription. Time to break the cycle!
    </p>

    <div class="set-actions" v-if="!exercise.isTimed || (!isHoldTimerRunning && !exercise.isTimed)">
      <button @click="$emit('logSet', 'done')" class="button-done" :class="{ 'embiggened': embiggenButtons }">DONE</button>
      <button @click="$emit('logSet', 'failed')" class="button-fail" :class="{ 'embiggened': embiggenButtons }">FAIL</button>
    </div>
    <div class="set-actions" v-else-if="exercise.isTimed && !isHoldTimerRunning">
       <!-- Allow manual logging if hold timer not running -->
       <button @click="$emit('logSet', 'done')" class="button-done" :class="{ 'embiggened': embiggenButtons }">DONE MANUALLY</button>
       <button @click="$emit('logSet', 'failed')" class="button-fail" :class="{ 'embiggened': embiggenButtons }">FAIL</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SessionExercise, LoggedSetData } from '@/types';
import { toDisplay, displayUnit } from '@/utils/weight';

defineProps<{
  exercise: SessionExercise;
  setNumber: number;
  activeSetTime: string;
  effectiveReps: number;
  displayWeight: number | string; // Pre-formatted or raw? Let's assume pre-formatted for display
  weightUnit: 'lbs' | 'kg';
  didFailLastAttempt: boolean;
  lastPerformance: LoggedSetData | null;
  failureStreak?: number;
  isHoldTimerRunning: boolean;
  formattedHoldTime: string;
  embiggenButtons: boolean;
}>();

defineEmits<{
  (e: 'openEdit'): void;
  (e: 'startHold'): void;
  (e: 'cancelHold'): void;
  (e: 'logSet', status: 'done' | 'failed'): void;
}>();
</script>

<style scoped>
/* Scoped styles extracted from WorkoutActive.vue active-set section */
.current-exercise-block {
    text-align: center;
}

.active-set-timer-display {
    font-size: 0.9rem;
    color: var(--color-text-light);
    margin-bottom: 5px;
    font-family: monospace;
}

.exercise-notes {
    font-size: 0.9em;
    color: var(--color-text-light);
    margin-bottom: 15px;
    background-color: var(--color-background-soft);
    padding: 8px;
    border-radius: 4px;
    display: inline-block;
}

.current-set-info {
    margin-bottom: 20px;
    padding: 15px;
}

.current-set-info-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 5px;
}
.current-set-info-header h3 {
    margin: 0;
}

.prescription-details {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: bold;
    flex-wrap: wrap;
}

.prescription-reps, .prescription-weight {
    color: var(--color-primary);
}

.prescription-separator {
    margin: 0 10px;
    color: var(--color-text-light);
    font-weight: normal;
    font-size: 1.5rem;
}

.last-performance-info {
    width: 100%; /* Force new line */
}

/* Specific text colors */
.failed-last-attempt-text {
    color: #e67e22; /* Orange-ish to indicate "warning/retry" */
}

.failure-streak-note {
    color: #e74c3c;
    font-weight: bold;
    margin-bottom: 15px;
    font-size: 0.9em;
    padding: 8px;
    background-color: rgba(231, 76, 60, 0.1);
    border-radius: 4px;
}

.set-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-top: 10px;
}

.button-done, .button-fail {
    padding: 20px;
    font-size: 1.2rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
    color: white;
    transition: transform 0.1s;
    display: flex; /* Centering content if needed */
    justify-content: center;
    align-items: center;
    min-height: 60px; /* Ensure logical hit area */
}
.button-done:active, .button-fail:active {
    transform: scale(0.98);
}

.button-done {
    background-color: var(--color-primary); /* Greenish usually, or brand primary */
    /* If primary is blue, maybe make Done Green? 
       Check style.css or user pref. 
       Usually Done = Primary in this app based on logic.
    */
    background-color: #2ecc71; 
}
.button-fail {
    background-color: #e74c3c; 
}

/* Embiggen mode */
.button-done.embiggened, .button-fail.embiggened {
    min-height: 120px;
    font-size: 2rem; 
}

/* Full width util */
.full-width-button {
    width: 100%;
    padding: 15px;
    font-size: 1.1rem;
}
</style>
