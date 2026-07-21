<template>
  <div class="current-exercise-block">
    <!-- Header Grid: Spacer | Title+Notes | Timer -->
    <div class="card-header-grid">
        <div class="header-spacer"></div>
        
        <div class="header-content" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;">
            <div style="display: inline-flex; align-items: center; gap: 6px; justify-content: center;">
              <h2 style="margin: 0; line-height: 1.2;">{{ exercise.exerciseName }}</h2>
              <button 
                v-if="showVideoDemos !== false" 
                @click="$emit('openDemo', exercise.exerciseName)" 
                class="button-icon extra-small" 
                title="Exercise Form & Info"
                style="font-size: 1.05em; cursor: pointer; background: none; border: none; padding: 0; line-height: 1; display: inline-flex; align-items: center; vertical-align: middle;"
              >
                ℹ️
              </button>
            </div>
            <p v-if="exercise.notesForExercise" class="exercise-notes" style="margin: 0;">
              <em>Notes: {{ exercise.notesForExercise }}</em>
            </p>
        </div>

        <div class="header-timer">
            <div class="timer-float-container current-set-info-style">
                <div class="timer-row">
                    <span class="timer-label">Total:</span>
                    <span class="timer-value">{{ workoutDuration }}</span>
                </div>
                <div class="timer-row">
                    <span class="timer-label">Set:</span>
                    <span class="timer-value">{{ activeSetTime }}</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Normal Set Info Card -->
    <div class="current-set-info card-inset">

      <div class="current-set-info-header">
        <div class="set-header-spacer"></div>
        <h3>Set {{ setNumber }} of {{ exercise.targetSets }}</h3>
        <div class="set-header-action" style="display: flex; align-items: center; justify-content: flex-end; gap: 4px;">
            <button @click="$emit('openEdit')" class="action-icon-btn" title="Edit Weight/Reps">✏️</button>
            <button @click="$emit('skipExercise')" class="action-icon-btn danger-icon-btn" title="Skip Exercise (Log 0 reps for remaining sets)">⏭️</button>
        </div>
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
      </div>
    </div>

    <!-- History / Context Block -->
    <div class="history-context-block" v-if="(didFailLastAttempt || exercise.isToFailure) && (lastPerformance || (didFailLastAttempt && failureStreak && failureStreak > 0))">
         <div v-if="lastPerformance" class="last-performance-info">
          Last: {{ toDisplay(lastPerformance.actualWeight, weightUnit) }} {{ displayUnit(weightUnit) }} x {{ lastPerformance.actualReps }} 
          <span v-if="lastPerformance.status === 'failed'">(Failed)</span>
        </div>
        <div v-if="didFailLastAttempt && failureStreak && failureStreak > 0" class="failure-streak-note">
            Failed last {{ failureStreak }} attempt{{ failureStreak > 1 ? 's' : '' }} here.
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
  workoutDuration: string;
  effectiveReps: number;
  displayWeight: number | string; // Pre-formatted or raw? Let's assume pre-formatted for display
  weightUnit: 'lbs' | 'kg';
  didFailLastAttempt: boolean;
  lastPerformance: LoggedSetData | null;
  failureStreak?: number;
  isHoldTimerRunning: boolean;
  formattedHoldTime: string;
  embiggenButtons: boolean;
  showVideoDemos?: boolean;
}>();

defineEmits<{
  (e: 'openEdit'): void;
  (e: 'startHold'): void;
  (e: 'cancelHold'): void;
  (e: 'logSet', status: 'done' | 'failed'): void;
  (e: 'openDemo', name: string): void;
  (e: 'skipExercise'): void;
}>();
</script>

<style scoped>
.current-exercise-block {
  text-align: center;
}

/* Header Grid Layout */
.card-header-grid {
    display: grid;
    grid-template-columns: 1fr auto 1fr; /* Center takes content width, sides split remainder */
    align-items: center; /* Vertically center items */
    gap: 10px;
    
    /* The Blue Line is now here, ensuring it clears all content */
    border-bottom: 2px solid var(--color-primary, #007bff);
    padding-bottom: 15px; /* Interior space above line */
    margin-bottom: 15px; /* Exterior space below line (matches spacing of other items) */
}

/* Spacer (Left) */
.header-spacer { width: 100%; }

/* Content (Center) */
.header-content { 
    text-align: center; 
    min-width: 0; /* Allow flex shrinking if needed */
}
.header-content h2 {
  margin: 0;
  font-size: 1.6em;
  color: var(--color-card-heading);
}

/* Timer (Right) */
.header-timer {
    display: flex;
    justify-content: flex-end;
}

.timer-float-container {
    /* No longer absolute positioning */
    text-align: right;
    font-size: 0.9em;
    padding: 8px 12px;
    
    /* Current Set Info Card Style Mixin */
    background-color: var(--color-card-mute);
    border: 1px solid var(--color-card-border);
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    
    min-width: 120px;
}
.timer-row {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 2px;
}
.timer-row:last-child { margin-bottom: 0; }

.timer-label { font-weight: normal; opacity: 0.8; color: var(--color-card-text); }
.timer-value { font-family: monospace; font-weight: bold; color: var(--color-card-heading); }

/* Cleaned up redundant styles */


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
  margin-bottom: 15px;
  border: 1px solid var(--color-card-border);
  text-align: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
}
.current-set-info-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  margin-bottom: 15px;
}
.set-header-spacer { width: 100%; }
.set-header-action { 
  display: flex; 
  align-items: center; 
  justify-content: flex-end;
}

.action-icon-btn {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  padding: 3px 6px;
  font-size: 0.9em;
  opacity: 0.7;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-card-text);
}

.action-icon-btn:hover {
  opacity: 1;
  background-color: var(--color-card-bg);
  border-color: var(--color-card-border);
}

.current-set-info-header h3 {
  margin: 0;
  font-size: 1.5em; /* Original size */
  color: var(--color-card-heading);
  font-weight: 600;
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

/* History Context Block */
.history-context-block {
    margin-bottom: 10px; /* Reduced from 25px */
    font-size: 0.9em;
    color: var(--color-card-text);
    opacity: 0.9;
    background-color: rgba(0,0,0,0.02);
    padding: 8px;
    border-radius: 4px;
    display: inline-block;
}

/* Failure Styles */
.failed-last-attempt-text {
  color: var(--color-danger, #dc3545) !important;
}
.failure-streak-note {
  color: var(--color-danger, #dc3545);
  font-weight: bold;
  margin-top: 4px;
}
.last-performance-info {
    color: #6c757d;
}

/* Set Actions */
.set-actions {
  display: flex;
  justify-content: space-around;
  margin-top: 10px; /* Reduced from 25px */
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
