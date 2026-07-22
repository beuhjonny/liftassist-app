<template>
  <div class="rep-max-table-container">
    <div v-if="!exerciseName" class="placeholder-text card-inset" style="text-align: center; padding: 16px; color: var(--color-card-text); opacity: 0.75; border-radius: 8px;">
      Select an exercise above to view your actual Rep Max (RM) records and projections.
    </div>

    <div v-else-if="rmRecords.length === 0" class="placeholder-text card-inset" style="text-align: center; padding: 16px; color: var(--color-card-text); opacity: 0.75; border-radius: 8px;">
      No completed sets with weights recorded for <strong>{{ exerciseName }}</strong> yet.
    </div>

    <div v-else class="rm-content-wrapper" style="display: flex; flex-direction: column; gap: 16px;">
      <!-- Actual RM Spectrum Table -->
      <div class="card-inset" style="padding: 14px 16px; background: var(--color-card-mute); border: 1px solid var(--color-card-border); border-radius: 10px;">
        <div style="font-size: 0.8em; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.75; color: var(--color-card-text); margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
          <span>🏆 Actual Personal Records (1RM - 12RM)</span>
          <span style="font-size: 0.9em; font-weight: normal; opacity: 0.8;">{{ exerciseName }}</span>
        </div>

        <div class="table-responsive" style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9em;">
            <thead>
              <tr style="border-bottom: 1px solid var(--color-card-border); opacity: 0.75; font-size: 0.85em; text-transform: uppercase;">
                <th style="padding: 6px 8px;">Rep Target</th>
                <th style="padding: 6px 8px; text-align: right;">Best Weight</th>
                <th style="padding: 6px 8px; text-align: right;">Reps Done</th>
                <th style="padding: 6px 8px; text-align: right;">Date Achieved</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="row in rmRecords" 
                :key="row.targetReps"
                style="border-bottom: 1px dashed var(--color-card-border);"
              >
                <td style="padding: 8px; font-weight: 700; color: var(--color-primary, #007bff);">
                  {{ row.targetReps }}RM
                </td>
                <td style="padding: 8px; text-align: right; font-weight: 600; color: var(--color-card-heading);">
                  <template v-if="row.weight > 0">
                    {{ row.weight }} {{ weightUnit }}
                  </template>
                  <template v-else>
                    <span style="opacity: 0.4;">—</span>
                  </template>
                </td>
                <td style="padding: 8px; text-align: right; color: var(--color-card-text); opacity: 0.85;">
                  <template v-if="row.reps > 0">
                    {{ row.reps }} reps
                  </template>
                  <template v-else>
                    <span style="opacity: 0.4;">—</span>
                  </template>
                </td>
                <td style="padding: 8px; text-align: right; font-size: 0.85em; color: var(--color-card-text); opacity: 0.75;">
                  {{ row.dateStr || '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Estimated 1RM & Rep Matrix Calculator -->
      <div class="card-inset" style="padding: 14px 16px; background: var(--color-card-mute); border: 1px solid var(--color-card-border); border-radius: 10px;">
        <div style="font-size: 0.8em; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.75; color: var(--color-card-text); margin-bottom: 10px;">
          🧮 Theoretical 1RM & Working Weight Calculator
        </div>

        <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 14px; background: var(--color-card-bg); padding: 10px 12px; border-radius: 8px; border: 1px solid var(--color-card-border);">
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <label style="font-size: 0.75em; font-weight: 600; opacity: 0.7;">Working Weight ({{ weightUnit }})</label>
            <input 
              v-model.number="calcWeight" 
              type="number" 
              min="0" 
              step="2.5" 
              style="width: 100px; padding: 6px 8px; border-radius: 6px; border: 1px solid var(--color-card-border); font-size: 0.9em; background: var(--color-card-mute); color: var(--color-card-text);"
            />
          </div>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <label style="font-size: 0.75em; font-weight: 600; opacity: 0.7;">Reps</label>
            <input 
              v-model.number="calcReps" 
              type="number" 
              min="1" 
              max="30" 
              style="width: 70px; padding: 6px 8px; border-radius: 6px; border: 1px solid var(--color-card-border); font-size: 0.9em; background: var(--color-card-mute); color: var(--color-card-text);"
            />
          </div>
          <div style="display: flex; flex-direction: column; gap: 2px; margin-left: auto;">
            <span style="font-size: 0.75em; opacity: 0.7; font-weight: 600;">Est. 1RM (Epley)</span>
            <span style="font-size: 1.15em; font-weight: 800; color: var(--color-primary, #007bff);">
              {{ estimated1RM }} {{ weightUnit }}
            </span>
          </div>
        </div>

        <!-- Working Weight Conversion Table -->
        <div style="font-size: 0.8em; font-weight: 600; opacity: 0.8; margin-bottom: 6px; color: var(--color-card-text);">
          Projected Equivalent Working Weights:
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 8px;">
          <div 
            v-for="target in repTargets" 
            :key="target" 
            style="background: var(--color-card-bg); padding: 6px 8px; border-radius: 6px; border: 1px solid var(--color-card-border); text-align: center;"
          >
            <div style="font-size: 0.75em; opacity: 0.7; font-weight: 600;">{{ target }}RM</div>
            <div style="font-size: 0.95em; font-weight: 700; color: var(--color-card-heading); margin-top: 2px;">
              {{ getProjectedWeight(target) }} <small style="font-size: 0.7em;">{{ weightUnit }}</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { LoggedWorkout } from '@/types';

const props = defineProps<{
  exerciseName: string;
  workouts: LoggedWorkout[];
  weightUnit?: string;
}>();

const repTargets = [1, 2, 3, 4, 5, 6, 8, 10, 12];

const calcWeight = ref<number>(0);
const calcReps = ref<number>(10);

const formatDateStr = (rawDate: any): string => {
  if (!rawDate) return '';
  const d = rawDate instanceof Date 
    ? rawDate 
    : (rawDate && typeof rawDate.toDate === 'function') 
      ? rawDate.toDate() 
      : new Date(rawDate);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

// Calculate actual PRs for 1RM through 12RM
const rmRecords = computed(() => {
  if (!props.exerciseName || !props.workouts || props.workouts.length === 0) {
    return [];
  }

  const targetName = props.exerciseName.trim().toLowerCase();
  
  // Map of targetRep -> { weight, reps, dateStr }
  const records = new Map<number, { weight: number; reps: number; dateStr: string }>();
  repTargets.forEach(t => records.set(t, { weight: 0, reps: 0, dateStr: '' }));

  props.workouts.forEach(workout => {
    if (!workout.performedExercises || !workout.date) return;

    workout.performedExercises.forEach((ex: any) => {
      if (ex.exerciseName?.trim().toLowerCase() !== targetName) return;

      ex.sets?.forEach((set: any) => {
        const weight = typeof set.actualWeight === 'number' ? set.actualWeight : (typeof set.prescribedWeight === 'number' ? set.prescribedWeight : 0);
        const reps = typeof set.actualReps === 'number' ? set.actualReps : (typeof set.prescribedReps === 'number' ? set.prescribedReps : 0);

        if (weight > 0 && reps > 0 && set.status !== 'failed') {
          repTargets.forEach(targetRep => {
            if (reps >= targetRep) {
              const currentBest = records.get(targetRep)!;
              if (weight > currentBest.weight || (weight === currentBest.weight && reps > currentBest.reps)) {
                records.set(targetRep, {
                  weight,
                  reps,
                  dateStr: formatDateStr(workout.date)
                });
              }
            }
          });
        }
      });
    });
  });

  return repTargets.map(t => ({
    targetReps: t,
    ...(records.get(t) || { weight: 0, reps: 0, dateStr: '' })
  }));
});

// Auto-fill calculator with top recorded lift when exercise changes
watch(() => props.exerciseName, () => {
  const topPr = rmRecords.value.find(r => r.weight > 0);
  if (topPr) {
    calcWeight.value = topPr.weight;
    calcReps.value = topPr.reps || 1;
  } else {
    calcWeight.value = 0;
    calcReps.value = 10;
  }
}, { immediate: true });

// Estimated 1RM using Epley formula: W * (1 + R/30)
const estimated1RM = computed(() => {
  if (!calcWeight.value || calcWeight.value <= 0 || !calcReps.value || calcReps.value <= 0) {
    return 0;
  }
  if (calcReps.value === 1) return Math.round(calcWeight.value);
  const epley = calcWeight.value * (1 + calcReps.value / 30);
  return Math.round(epley);
});

// Calculate projected equivalent weight for a target rep scheme from estimated 1RM
const getProjectedWeight = (targetReps: number): number => {
  const e1rm = estimated1RM.value;
  if (!e1rm || e1rm <= 0) return 0;
  if (targetReps === 1) return e1rm;
  // Inverse Epley: W = 1RM / (1 + R/30)
  const proj = e1rm / (1 + targetReps / 30);
  return Math.round(proj * 2) / 2;
};
</script>
