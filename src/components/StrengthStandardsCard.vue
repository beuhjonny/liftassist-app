<template>
  <div class="strength-standards-container card-inset" style="padding: 14px 16px; background: var(--color-card-mute); border: 1px solid var(--color-card-border); border-radius: 10px;">
    <div style="font-size: 0.8em; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.75; color: var(--color-card-text); margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
      <span>🎖️ Comparative Strength Standards ("How Do I Compare?")</span>
      
      <!-- Bodyweight Setting Input -->
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="font-size: 0.85em; font-weight: 500; text-transform: none; opacity: 0.8;">Your Bodyweight:</span>
        <input 
          v-model.number="bodyweight" 
          type="number" 
          min="50" 
          max="500" 
          step="1"
          style="width: 65px; padding: 3px 6px; border-radius: 4px; border: 1px solid var(--color-card-border); font-size: 0.85em; background: var(--color-card-bg); color: var(--color-card-text); text-align: center; font-weight: 600;"
          @change="saveBodyweight"
        />
        <span style="font-size: 0.85em; opacity: 0.8;">{{ weightUnit }}</span>
      </div>
    </div>

    <!-- Overview Cards Grid -->
    <div v-if="liftEvaluations.length > 0" style="display: flex; flex-direction: column; gap: 10px;">
      <div 
        v-for="lift in liftEvaluations" 
        :key="lift.exerciseName"
        style="background: var(--color-card-bg); padding: 12px 14px; border-radius: 8px; border: 1px solid var(--color-card-border);"
      >
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 6px;">
          <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; color: var(--color-card-heading); font-size: 0.95em;">
            <span>{{ lift.icon }}</span>
            <span>{{ lift.exerciseName }}</span>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 0.85em; font-weight: 600; opacity: 0.8; color: var(--color-card-text);">
              1RM: {{ lift.bestWeight }} {{ weightUnit }} <small>({{ lift.bwRatio }}x BW)</small>
            </span>
            <span 
              :style="{ backgroundColor: lift.tierBadge.bg, color: lift.tierBadge.color }"
              style="padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: 0.8em; display: inline-flex; align-items: center; gap: 4px;"
            >
              <span>{{ lift.tierBadge.icon }}</span>
              <span>{{ lift.tierBadge.name }}</span>
            </span>
          </div>
        </div>

        <!-- Next Milestone Progress Bar -->
        <div v-if="lift.nextTier" style="margin-top: 6px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.75em; opacity: 0.75; color: var(--color-card-text); margin-bottom: 4px;">
            <span>Next Rank: {{ lift.nextTier.name }} ({{ lift.nextTier.weight }} {{ weightUnit }})</span>
            <span>+{{ lift.lbsNeeded }} {{ weightUnit }} away</span>
          </div>
          <div style="height: 6px; width: 100%; background: var(--color-card-mute); border-radius: 3px; overflow: hidden; border: 1px solid var(--color-card-border);">
            <div 
              :style="{ width: lift.progressPercent + '%', backgroundColor: lift.tierBadge.bg }"
              style="height: 100%; transition: width 0.3s ease;"
            ></div>
          </div>
        </div>
        <div v-else style="font-size: 0.75em; opacity: 0.8; color: #ffc107; font-weight: 600; margin-top: 4px;">
          👑 Elite Strength Tier Achieved! Top 1% of lifters worldwide.
        </div>
      </div>
    </div>

    <div v-else style="text-align: center; padding: 16px; opacity: 0.75; font-size: 0.9em; color: var(--color-card-text);">
      Log workouts for major lifts (Bench, Squat, Deadlift, OHP, Incline DB Press) to calculate strength standards.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { LoggedWorkout } from '@/types';
import useSettings from '../composables/useSettings';

const props = defineProps<{
  workouts: LoggedWorkout[];
  weightUnit?: string;
}>();

const { settings, saveSettings } = useSettings();

const bodyweight = ref<number>(settings.value.bodyweight || 180);

const saveBodyweight = () => {
  if (bodyweight.value > 0) {
    saveSettings({ bodyweight: bodyweight.value });
  }
};

// Recognized major lifts with standard ratios (relative to 1RM / Bodyweight)
const standardLiftsConfig = [
  {
    name: 'Bench Press',
    icon: '🏋️‍♂️',
    keywords: ['bench press', 'barbell bench press', 'flat bench'],
    ratios: { beginner: 0.50, novice: 0.75, intermediate: 1.10, advanced: 1.50, elite: 1.90 }
  },
  {
    name: 'Incline DB Bench',
    icon: '🏋️',
    keywords: ['incline dumbbell bench press', 'incline db bench', 'incline dumbbell press', 'incline db press'],
    ratios: { beginner: 0.25, novice: 0.35, intermediate: 0.50, advanced: 0.65, elite: 0.85 }
  },
  {
    name: 'Squat',
    icon: '🦵',
    keywords: ['squat', 'barbell squat', 'back squat'],
    ratios: { beginner: 0.75, novice: 1.10, intermediate: 1.50, advanced: 2.00, elite: 2.40 }
  },
  {
    name: 'Deadlift',
    icon: '💥',
    keywords: ['deadlift', 'barbell deadlift', 'conventional deadlift'],
    ratios: { beginner: 0.90, novice: 1.30, intermediate: 1.75, advanced: 2.25, elite: 2.75 }
  },
  {
    name: 'Overhead Press',
    icon: '🙆‍♂️',
    keywords: ['overhead press', 'ohp', 'military press', 'shoulder press', 'barbell shoulder press'],
    ratios: { beginner: 0.35, novice: 0.55, intermediate: 0.75, advanced: 1.00, elite: 1.25 }
  }
];

interface TierInfo {
  name: string;
  icon: string;
  bg: string;
  color: string;
}

const getTierBadge = (ratio: number, config: any): { badge: TierInfo; nextTier: { name: string; weight: number } | null; progressPercent: number } => {
  const r = config.ratios;
  const bw = bodyweight.value || 180;

  if (ratio < r.novice) {
    const minW = Math.round(r.beginner * bw);
    const nextW = Math.round(r.novice * bw);
    const pct = Math.min(100, Math.max(0, Math.round(((ratio - r.beginner) / (r.novice - r.beginner)) * 100)));
    return {
      badge: { name: 'Beginner', icon: '🥉', bg: '#6c757d', color: '#ffffff' },
      nextTier: { name: 'Novice', weight: nextW },
      progressPercent: pct
    };
  } else if (ratio < r.intermediate) {
    const nextW = Math.round(r.intermediate * bw);
    const pct = Math.min(100, Math.max(0, Math.round(((ratio - r.novice) / (r.intermediate - r.novice)) * 100)));
    return {
      badge: { name: 'Novice', icon: '🥈', bg: '#17a2b8', color: '#ffffff' },
      nextTier: { name: 'Intermediate', weight: nextW },
      progressPercent: pct
    };
  } else if (ratio < r.advanced) {
    const nextW = Math.round(r.advanced * bw);
    const pct = Math.min(100, Math.max(0, Math.round(((ratio - r.intermediate) / (r.advanced - r.intermediate)) * 100)));
    return {
      badge: { name: 'Intermediate', icon: '🥇', bg: '#28a745', color: '#ffffff' },
      nextTier: { name: 'Advanced', weight: nextW },
      progressPercent: pct
    };
  } else if (ratio < r.elite) {
    const nextW = Math.round(r.elite * bw);
    const pct = Math.min(100, Math.max(0, Math.round(((ratio - r.advanced) / (r.elite - r.advanced)) * 100)));
    return {
      badge: { name: 'Advanced', icon: '🏆', bg: '#fd7e14', color: '#ffffff' },
      nextTier: { name: 'Elite', weight: nextW },
      progressPercent: pct
    };
  } else {
    return {
      badge: { name: 'Elite', icon: '👑', bg: '#6f42c1', color: '#ffffff' },
      nextTier: null,
      progressPercent: 100
    };
  }
};

const liftEvaluations = computed(() => {
  if (!props.workouts || props.workouts.length === 0) return [];
  const bw = bodyweight.value || 180;

  const results: any[] = [];

  standardLiftsConfig.forEach(config => {
    let maxEstimated1RM = 0;

    props.workouts.forEach(workout => {
      workout.performedExercises?.forEach((ex: any) => {
        const nameClean = ex.exerciseName?.trim().toLowerCase();
        if (!nameClean) return;

        const isMatch = config.keywords.some(k => nameClean.includes(k) || k.includes(nameClean));
        if (isMatch) {
          ex.sets?.forEach((set: any) => {
            const w = typeof set.actualWeight === 'number' ? set.actualWeight : (typeof set.prescribedWeight === 'number' ? set.prescribedWeight : 0);
            const r = typeof set.actualReps === 'number' ? set.actualReps : (typeof set.prescribedReps === 'number' ? set.prescribedReps : 0);

            if (w > 0 && r > 0 && set.status !== 'failed') {
              const epley = r === 1 ? w : w * (1 + r / 30);
              if (epley > maxEstimated1RM) {
                maxEstimated1RM = Math.round(epley);
              }
            }
          });
        }
      });
    });

    if (maxEstimated1RM > 0) {
      const ratio = Math.round((maxEstimated1RM / bw) * 100) / 100;
      const { badge, nextTier, progressPercent } = getTierBadge(ratio, config);
      const lbsNeeded = nextTier ? Math.max(1, nextTier.weight - maxEstimated1RM) : 0;

      results.push({
        exerciseName: config.name,
        icon: config.icon,
        bestWeight: maxEstimated1RM,
        bwRatio: ratio,
        tierBadge: badge,
        nextTier,
        lbsNeeded,
        progressPercent
      });
    }
  });

  return results;
});
</script>
