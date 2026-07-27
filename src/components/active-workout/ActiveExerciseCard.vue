<template>
  <div class="current-exercise-block">
    <!-- Header: exercise name + info, live timers -->
    <div class="ex-header">
      <div class="ex-title-wrap">
        <h2 class="ex-title">{{ exercise.exerciseName }}</h2>
        <button
          v-if="showVideoDemos !== false"
          class="icon-button subtle"
          type="button"
          :aria-label="`Form and info for ${exercise.exerciseName}`"
          @click="$emit('openDemo', exercise.exerciseName)"
        >
          <Info :size="18" />
        </button>
      </div>
      <div class="ex-timers">
        <span class="timer-chip"><span class="t-label">Total</span> {{ workoutDuration }}</span>
        <span class="timer-chip"><span class="t-label">Set</span> {{ activeSetTime }}</span>
      </div>
    </div>
    <p v-if="exercise.notesForExercise" class="exercise-notes"><em>{{ exercise.notesForExercise }}</em></p>

    <!-- Spoken set flow: announce each new prescription to screen readers -->
    <p class="sr-only" aria-live="polite">
      Set {{ setNumber }} of {{ exercise.targetSets }}:
      <template v-if="exercise.isToFailure">{{ displayWeight }} {{ displayUnit(weightUnit) }}, as many reps as possible.</template>
      <template v-else>{{ displayWeight }} {{ displayUnit(weightUnit) }}, {{ effectiveReps }} {{ exercise.isTimed ? 'second hold' : 'reps' }}.</template>
    </p>

    <!-- Prescription hero: one dominant number -->
    <div class="prescription-hero">
      <div class="set-line">
        <span class="set-eyebrow">SET {{ setNumber }} OF {{ exercise.targetSets }}</span>
        <div class="set-actions-icons">
          <button class="icon-button" type="button" aria-label="Edit weight and reps" @click="$emit('openEdit')"><Pencil :size="20" /></button>
          <button class="icon-button danger" type="button" aria-label="Skip exercise" @click="$emit('skipExercise')"><SkipForward :size="20" /></button>
        </div>
      </div>

      <div class="hero-number" :class="{ failed: didFailLastAttempt }">
        <template v-if="exercise.isToFailure">
          <span class="to-failure">To Failure</span>
        </template>
        <template v-else>
          <span class="hero-weight">{{ displayWeight }}</span>
          <span class="hero-unit">{{ displayUnit(weightUnit) }}</span>
        </template>
      </div>
      <div class="hero-reps" :class="{ failed: didFailLastAttempt }">
        <template v-if="!exercise.isToFailure">x {{ effectiveReps }} {{ exercise.isTimed ? 'sec hold' : 'reps' }}</template>
        <template v-else>as many reps as possible</template>
      </div>

      <p v-if="whyReason" class="why-reason"><TrendingUp :size="14" /> {{ whyReason }}</p>
    </div>

    <!-- History / failure context -->
    <div class="history-context-block" v-if="(didFailLastAttempt || exercise.isToFailure) && (lastPerformance || (didFailLastAttempt && failureStreak && failureStreak > 0))">
      <div v-if="lastPerformance" class="last-performance-info">
        Last: {{ toDisplay(lastPerformance.actualWeight, weightUnit) }} {{ displayUnit(weightUnit) }} x {{ lastPerformance.actualReps }}
        <span v-if="lastPerformance.status === 'failed'">(Failed)</span>
      </div>
      <div v-if="didFailLastAttempt && failureStreak && failureStreak > 0" class="failure-streak-note">
        Failed last {{ failureStreak }} attempt{{ failureStreak > 1 ? 's' : '' }} here.
      </div>
    </div>

    <!-- Timed hold controls -->
    <div v-if="exercise.isTimed" class="timed-controls">
      <BaseButton v-if="!isHoldTimerRunning" variant="primary" size="lg" block @click="$emit('startHold')">Start Hold Timer</BaseButton>
      <template v-else>
        <div class="hold-display">{{ formattedHoldTime }}</div>
        <BaseButton variant="secondary" size="lg" block @click="$emit('cancelHold')">Cancel Timer</BaseButton>
      </template>
    </div>

    <!-- On-card rep capture: DONE logs the actual reps in 2 taps, no keyboard.
         Prefilled to the prescription, so an untouched DONE behaves as before. -->
    <div v-if="!exercise.isTimed" class="rep-capture">
      <span class="rep-capture-label">Reps completed</span>
      <BaseStepper
        v-model="repsInput"
        :min="0"
        :max="99"
        aria-label="Reps completed"
      />
      <span v-if="repDelta !== 0" class="rep-delta" :class="repDelta > 0 ? 'over' : 'under'">
        {{ repDelta > 0 ? '+' + repDelta + ' over target' : repDelta + ' vs target' }}
      </span>
    </div>

    <!-- DONE / FAIL asymmetry: DONE dominant, FAIL demoted -->
    <div class="set-actions" v-if="!exercise.isTimed || !isHoldTimerRunning">
      <BaseButton
        variant="success"
        :size="embiggenButtons ? 'xl' : 'lg'"
        block
        class="btn-done"
        @click="onLog('done')"
      >
        <template #trailing><Check :size="22" /></template>
        {{ exercise.isTimed ? 'Done Manually' : 'Done' }}
      </BaseButton>
      <button class="btn-fail" type="button" @click="onLog('failed')">Failed this set</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { SessionExercise, LoggedSetData } from '@/types';
import { toDisplay, displayUnit } from '@/utils/weight';
import { Info, Pencil, SkipForward, Check, TrendingUp } from 'lucide-vue-next';
import BaseButton from '@/components/base/BaseButton.vue';
import BaseStepper from '@/components/base/BaseStepper.vue';
import { haptics } from '@/utils/haptics';

const props = defineProps<{
  exercise: SessionExercise;
  setNumber: number;
  activeSetTime: string;
  workoutDuration: string;
  effectiveReps: number;
  displayWeight: number | string;
  weightUnit: 'lbs' | 'kg';
  didFailLastAttempt: boolean;
  lastPerformance: LoggedSetData | null;
  failureStreak?: number;
  isHoldTimerRunning: boolean;
  formattedHoldTime: string;
  embiggenButtons: boolean;
  showVideoDemos?: boolean;
  whyReason?: string;
}>();

const emit = defineEmits<{
  (e: 'openEdit'): void;
  (e: 'startHold'): void;
  (e: 'cancelHold'): void;
  (e: 'logSet', status: 'done' | 'failed', actualReps?: number): void;
  (e: 'openDemo', name: string): void;
  (e: 'skipExercise'): void;
}>();

// Rep capture prefilled to the prescription; reset whenever the set changes.
const repsInput = ref(props.effectiveReps);
const repsTouched = ref(false);
watch(
  () => [props.setNumber, props.exercise.exerciseName, props.effectiveReps],
  () => { repsInput.value = props.effectiveReps; repsTouched.value = false; },
);
watch(repsInput, (v) => { if (v !== props.effectiveReps) repsTouched.value = true; });
const repDelta = computed(() => repsInput.value - props.effectiveReps);

const onLog = (status: 'done' | 'failed') => {
  if (status === 'done') haptics.logDone();
  else haptics.logFail();
  // DONE always carries the captured count. FAIL carries it only when the
  // user actually adjusted the stepper (an untouched FAIL at prescribed reps
  // would be a contradiction - the post-hoc prompt handles that case).
  if (status === 'done') emit('logSet', status, repsInput.value);
  else emit('logSet', status, repsTouched.value ? repsInput.value : undefined);
};
</script>

<style scoped>
.current-exercise-block { display: flex; flex-direction: column; gap: var(--space-4); }

.sr-only {
  position: absolute; width: 1px; height: 1px; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; padding: 0;
}

/* Header */
.ex-header {
  display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-3);
  padding-bottom: var(--space-3); border-bottom: 1px solid var(--color-hairline);
}
.ex-title-wrap { display: flex; align-items: center; gap: var(--space-2); min-width: 0; }
.ex-title {
  margin: 0; font-family: var(--font-display); font-size: var(--text-xl); font-weight: var(--weight-bold);
  color: var(--color-card-heading); line-height: var(--leading-snug);
}
.ex-timers { display: flex; flex-direction: column; gap: var(--space-1); align-items: flex-end; flex-shrink: 0; }
/* Demoted peers: timers whisper so the hero numeral is the only loud thing (1.9) */
.timer-chip {
  font-size: var(--text-xs); font-feature-settings: 'tnum' 1, 'lnum' 1; font-variant-numeric: tabular-nums; font-weight: var(--weight-medium);
  color: var(--text-tertiary); background: var(--color-card-mute); border-radius: var(--radius-full);
  padding: 2px var(--space-2); white-space: nowrap;
}
.timer-chip .t-label { color: var(--text-tertiary); font-weight: var(--weight-regular); margin-right: 4px; }
.exercise-notes { margin: 0; font-size: var(--text-sm); color: var(--color-card-text); opacity: 0.8; text-align: center; }

/* Prescription hero: the 96px instrument numeral owns the screen (1.8) */
.prescription-hero {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-2);
  padding: var(--space-5) var(--space-4);
  min-height: 34dvh;
  background: var(--surface-sunken); border: 1px solid var(--color-hairline);
  border-radius: var(--radius-md);
  box-shadow: var(--edge-highlight);
}
.set-line { display: flex; align-items: center; justify-content: space-between; width: 100%; }
.set-eyebrow {
  font-size: var(--text-sm); font-weight: var(--weight-semibold); letter-spacing: var(--tracking-wide);
  text-transform: uppercase; color: var(--text-tertiary);
}
.set-actions-icons { display: flex; gap: var(--space-2); }
.icon-button {
  min-width: var(--tap-min); min-height: var(--tap-min);
  display: inline-flex; align-items: center; justify-content: center;
  background: transparent; border: none; border-radius: var(--radius-md);
  color: var(--color-card-text); opacity: 0.75; cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-standard), opacity var(--duration-fast) var(--ease-standard);
}
.icon-button:active { transform: scale(0.94); }
.icon-button.subtle { min-width: 32px; min-height: 32px; }
@media (hover: hover) { .icon-button:hover { opacity: 1; background: var(--color-card-mute); } }
.icon-button.danger:active { color: var(--color-danger-fg); }

.hero-number {
  display: flex; align-items: baseline; justify-content: center; gap: var(--space-2);
  color: var(--color-card-heading);
}
.hero-number.failed { color: var(--color-danger-fg); }
.hero-weight {
  font-family: var(--font-display);
  font-size: var(--text-hero);
  font-weight: var(--weight-bold);
  line-height: var(--leading-none);
  letter-spacing: var(--tracking-tight);
  font-feature-settings: 'tnum' 1, 'lnum' 1;
  font-variant-numeric: tabular-nums lining-nums;
}
.hero-unit { font-size: var(--text-xl); font-weight: var(--weight-semibold); opacity: 0.6; }
.to-failure { font-size: var(--text-2xl); font-weight: var(--weight-bold); }
.hero-reps { font-size: var(--text-lg); color: var(--color-card-text); font-variant-numeric: tabular-nums; }
.hero-reps.failed { color: var(--color-danger-fg); }

.why-reason {
  display: inline-flex; align-items: center; gap: var(--space-1);
  margin: var(--space-2) 0 0; max-width: 40ch;
  font-size: var(--text-sm); line-height: var(--leading-normal);
  color: var(--color-card-text); text-align: center;
}
.why-reason svg { opacity: 0.7; flex-shrink: 0; }

/* On-card rep capture (2.12) */
.rep-capture {
  display: flex; flex-direction: column; align-items: center; gap: var(--space-2);
}
.rep-capture-label {
  font-size: var(--text-xs); font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-wide); text-transform: uppercase;
  color: var(--text-tertiary);
}
.rep-delta {
  font-size: var(--text-sm); font-weight: var(--weight-semibold);
  font-variant-numeric: tabular-nums;
  padding: 2px var(--space-3); border-radius: var(--radius-full);
}
.rep-delta.over { background: var(--color-success-bg); color: var(--color-success-fg); border: 1px solid var(--color-success-line); }
.rep-delta.under { background: var(--color-warning-bg); color: var(--color-warning-fg); border: 1px solid var(--color-warning-line); }

/* History / failure */
.history-context-block { text-align: center; font-size: var(--text-sm); color: var(--color-card-text); }
.failed-last-attempt-text { color: var(--color-danger-fg); }
.failure-streak-note { color: var(--color-danger-fg); font-weight: var(--weight-semibold); margin-top: var(--space-1); }
.last-performance-info { color: var(--text-tertiary); }

/* Timed */
.timed-controls { display: flex; flex-direction: column; gap: var(--space-3); align-items: center; }
.hold-display { font-size: var(--text-display); font-weight: var(--weight-bold); font-variant-numeric: tabular-nums; color: var(--color-accent-line); }

/* DONE / FAIL asymmetry */
.set-actions { display: flex; flex-direction: column; gap: var(--space-2); }
.btn-done { font-size: var(--text-lg); }
.btn-fail {
  align-self: center; min-height: var(--tap-min); padding-inline: var(--space-4);
  background: transparent; border: 1px solid var(--color-danger-line); border-radius: var(--radius-md);
  color: var(--color-danger-fg); font-size: var(--text-base); font-weight: var(--weight-medium); cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-standard);
}
.btn-fail:active { transform: scale(0.98); }
@media (hover: hover) { .btn-fail:hover { background: var(--color-danger-bg); } }
</style>
