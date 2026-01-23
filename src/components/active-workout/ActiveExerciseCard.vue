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
.current-exercise-block {
  text-align: center;
}
.current-exercise-block h2 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1.6em;
  color: var(--color-card-heading);
  border-bottom: 2px solid var(--color-primary, #007bff);
  padding-bottom: 10px;
}
.active-set-timer-display {
  text-align: right;
  font-size: 0.9em;
  color: var(--color-card-text);
  margin-bottom: 15px;
  padding-right: 5px;
  opacity: 0.8;
}
.exercise-notes {
  font-style: italic;
  color: var(--color-card-text);
  margin-bottom: 15px;
  font-size: 0.9em;
  opacity: 0.8;
}
.current-set-info {
  background-color: var(--color-card-mute);
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 25px;
  border: 1px solid var(--color-card-border);
  text-align: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
}
.current-set-info-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}
.current-set-info-header h3 {
  margin-top: 0;
  margin-bottom: 0;
  font-size: 1.5em; /* Original size */
  color: var(--color-card-heading);
  font-weight: 600;
  flex-grow: 1;
}

.prescription-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1.2;
}
.prescription-reps, .prescription-weight {
  font-size: 2.0em;
  font-weight: bold;
  color: var(--color-primary, #007bff);
  display: block;
}
.prescription-separator {
  font-size: 1.6em;
  font-weight: normal;
  color: var(--color-card-text);
  opacity: 0.6;
  margin: 5px 0;
}

/* Failure Styles */
.failed-last-attempt-text {
  color: var(--color-danger, #dc3545) !important;
}
.failure-streak-note {
  color: var(--color-danger, #dc3545);
  font-size: 0.85em;
  font-style: italic;
  text-align: center;
  margin-top: 8px;
  margin-bottom: 10px;
}

/* Set Actions */
.set-actions {
  display: flex;
  justify-content: space-around;
  margin-top: 25px;
  gap: 20px;
}
.set-actions button {
  padding: 12px 0;
  font-size: 1.1em;
  font-weight: bold;
  border: none;
  border-radius: 5px;
  color: white;
  cursor: pointer;
  flex-grow: 1;
  margin: 0;
  max-width: 220px;
  transition: background-color 0.2s, transform 0.1s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.15);
}
.button-done {
  background-color: var(--color-success, #28a745);
}
.button-done:hover {
  background-color: #218838;
  transform: translateY(-2px);
}
.button-fail {
  background-color: var(--color-danger, #dc3545);
}
.button-fail:hover {
  background-color: #c82333;
  transform: translateY(-2px);
}

/* Embiggen mode */
.embiggened {
    padding: 25px !important;
    font-size: 1.5em !important;
    min-height: 80px !important;
    font-weight: 800 !important;
}

.button-primary {
  background-color: var(--color-primary, #007bff);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 15px;
  cursor: pointer;
  font-weight: bold;
}
.button-secondary {
    display: inline-block;
    padding: 10px 15px;
    background-color: var(--color-secondary, #6c757d);
    color: white;
    border: none;
    border-radius: 4px;
    text-decoration: none;
    cursor: pointer;
}
.full-width-button {
  width: 100%;
  margin-bottom: 10px;
}

.button-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1em;
  padding: 4px 8px;
  border-radius: 4px;
}
.button-icon.extra-small {
  font-size: 0.75em;
  filter: grayscale(100%);
}
</style>
