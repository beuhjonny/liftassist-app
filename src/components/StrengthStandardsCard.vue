<template>
  <div class="strength-standards-container card-inset" style="padding: 14px 16px; background: var(--color-card-mute); border: 1px solid var(--color-card-border); border-radius: 10px;">
    <div style="font-size: 0.8em; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.75; color: var(--color-card-text); margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
      <span>🎖️ Comparative Strength Standards ("How Do I Compare?")</span>
      
      <!-- Bodyweight & Age Setting Inputs -->
      <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 4px;">
          <span style="font-size: 0.85em; font-weight: 500; text-transform: none; opacity: 0.85;">BW:</span>
          <input 
            v-model.number="bodyweight" 
            type="number" 
            min="50" 
            max="500" 
            step="1"
            style="width: 60px; padding: 3px 6px; border-radius: 4px; border: 1px solid var(--color-card-border); font-size: 0.85em; background: var(--color-card-bg); color: var(--color-card-text); text-align: center; font-weight: 600;"
            @change="saveUserSettings"
          />
          <span style="font-size: 0.85em; opacity: 0.8;">{{ weightUnit }}</span>
        </div>

        <div style="display: flex; align-items: center; gap: 4px;">
          <span style="font-size: 0.85em; font-weight: 500; text-transform: none; opacity: 0.85;">Age:</span>
          <select 
            v-model="ageBracket" 
            @change="saveUserSettings"
            style="padding: 3px 6px; border-radius: 4px; border: 1px solid var(--color-card-border); font-size: 0.85em; background: var(--color-card-bg); color: var(--color-card-text); font-weight: 600;"
          >
            <option value="20-29">20–29</option>
            <option value="30-39">30–39</option>
            <option value="40-49">40–49</option>
            <option value="50-59">50–59</option>
            <option value="60+">60+</option>
          </select>
        </div>
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
            <small v-if="lift.matchedStandardName !== lift.exerciseName" style="opacity: 0.65; font-weight: normal; font-size: 0.8em;">
              (Matched: {{ lift.matchedStandardName }})
            </small>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 0.85em; font-weight: 600; opacity: 0.8; color: var(--color-card-text);">
              Est. 1RM: {{ lift.bestWeight }} {{ weightUnit }} <small>({{ lift.bwRatio }}x BW)</small>
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
      Select an exercise above or log workouts for major movements to view comparative strength standards.
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
  selectedExerciseName?: string;
}>();

const { settings, saveSettings } = useSettings();

const bodyweight = ref<number>(settings.value.bodyweight || 180);
const ageBracket = ref<string>(settings.value.userAgeBracket || '30-39');

const saveUserSettings = () => {
  saveSettings({ 
    bodyweight: bodyweight.value > 0 ? bodyweight.value : 180,
    userAgeBracket: ageBracket.value
  });
};

// Age adjustment multipliers (Standards become proportionally adjusted for age brackets)
const getAgeMultiplier = (bracket: string): number => {
  switch (bracket) {
    case '40-49': return 0.95; // 5% adjustment for age 40s
    case '50-59': return 0.88; // 12% adjustment for age 50s
    case '60+': return 0.78;   // 22% adjustment for age 60+
    default: return 1.00;     // 20-39 baseline
  }
};

// Jaccard Token Similarity Fuzzy Matching Algorithm
const calculateJaccardSimilarity = (str1: string, str2: string): number => {
  const cleanTokens = (s: string) => {
    return new Set(
      s.toLowerCase()
       .replace(/[^a-z0-9\s]/g, ' ')
       .split(/\s+/)
       .filter(t => t.length > 1 && !['barbell', 'dumbbell', 'db', 'bb', 'machine', 'cable', 'smith'].includes(t))
    );
  };

  const tokens1 = cleanTokens(str1);
  const tokens2 = cleanTokens(str2);

  if (tokens1.size === 0 || tokens2.size === 0) return 0;

  let intersectionCount = 0;
  tokens1.forEach(t => {
    if (tokens2.has(t)) intersectionCount++;
  });

  const unionCount = tokens1.size + tokens2.size - intersectionCount;
  return unionCount > 0 ? intersectionCount / unionCount : 0;
};

// Standard strength reference categories
const standardLiftsConfig = [
  {
    id: 'bench_press',
    name: 'Bench Press',
    icon: '🏋️‍♂️',
    keywords: ['bench', 'press', 'chest', 'pec'],
    ratios: { beginner: 0.50, novice: 0.75, intermediate: 1.10, advanced: 1.50, elite: 1.90 }
  },
  {
    id: 'incline_press',
    name: 'Incline Press',
    icon: '🏋️',
    keywords: ['incline', 'bench', 'press', 'upper chest'],
    ratios: { beginner: 0.25, novice: 0.35, intermediate: 0.50, advanced: 0.65, elite: 0.85 }
  },
  {
    id: 'overhead_press',
    name: 'Overhead Press',
    icon: '🙆‍♂️',
    keywords: ['overhead', 'press', 'ohp', 'shoulder', 'military'],
    ratios: { beginner: 0.35, novice: 0.55, intermediate: 0.75, advanced: 1.00, elite: 1.25 }
  },
  {
    id: 'squat',
    name: 'Squat',
    icon: '🦵',
    keywords: ['squat', 'back squat', 'front squat', 'leg press'],
    ratios: { beginner: 0.75, novice: 1.10, intermediate: 1.50, advanced: 2.00, elite: 2.40 }
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    icon: '💥',
    keywords: ['deadlift', 'sumo', 'rdl', 'romanian'],
    ratios: { beginner: 0.90, novice: 1.30, intermediate: 1.75, advanced: 2.25, elite: 2.75 }
  },
  {
    id: 'bicep_curl',
    name: 'Bicep Curl',
    icon: '💪',
    keywords: ['curl', 'bicep', 'hammer', 'preacher'],
    ratios: { beginner: 0.15, novice: 0.25, intermediate: 0.38, advanced: 0.52, elite: 0.68 }
  },
  {
    id: 'barbell_row',
    name: 'Row / Pull',
    icon: '🚣',
    keywords: ['row', 'pullup', 'pulldown', 'lat', 'back'],
    ratios: { beginner: 0.40, novice: 0.65, intermediate: 0.90, advanced: 1.20, elite: 1.50 }
  }
];

// Match user exercise name to closest standard category using Jaccard similarity
const matchStandardCategory = (userExName: string) => {
  const nameLower = userExName.toLowerCase();
  
  // 1. Direct Keyword Check
  for (const config of standardLiftsConfig) {
    if (config.keywords.some(k => nameLower.includes(k))) {
      return config;
    }
  }

  // 2. Jaccard Similarity Fuzzy Match
  let bestMatch = standardLiftsConfig[0];
  let maxScore = 0;

  standardLiftsConfig.forEach(config => {
    const configString = `${config.name} ${config.keywords.join(' ')}`;
    const score = calculateJaccardSimilarity(userExName, configString);
    if (score > maxScore) {
      maxScore = score;
      bestMatch = config;
    }
  });

  return maxScore >= 0.15 ? bestMatch : standardLiftsConfig[0];
};

interface TierInfo {
  name: string;
  icon: string;
  bg: string;
  color: string;
}

const getTierBadge = (ratio: number, config: any): { badge: TierInfo; nextTier: { name: string; weight: number } | null; progressPercent: number } => {
  const bw = bodyweight.value || 180;
  const ageMult = getAgeMultiplier(ageBracket.value);

  // Age-adjusted ratio thresholds
  const r = {
    beginner: config.ratios.beginner * ageMult,
    novice: config.ratios.novice * ageMult,
    intermediate: config.ratios.intermediate * ageMult,
    advanced: config.ratios.advanced * ageMult,
    elite: config.ratios.elite * ageMult
  };

  if (ratio < r.novice) {
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

  // Build map of all exercises performed in history with their max estimated 1RM
  const exerciseMaxes = new Map<string, number>();

  props.workouts.forEach(workout => {
    workout.performedExercises?.forEach((ex: any) => {
      const name = ex.exerciseName?.trim();
      if (!name) return;

      ex.sets?.forEach((set: any) => {
        const w = typeof set.actualWeight === 'number' ? set.actualWeight : (typeof set.prescribedWeight === 'number' ? set.prescribedWeight : 0);
        const r = typeof set.actualReps === 'number' ? set.actualReps : (typeof set.prescribedReps === 'number' ? set.prescribedReps : 0);

        if (w > 0 && r > 0 && set.status !== 'failed') {
          const epley = r === 1 ? w : w * (1 + r / 30);
          const currentMax = exerciseMaxes.get(name) || 0;
          if (epley > currentMax) {
            exerciseMaxes.set(name, Math.round(epley));
          }
        }
      });
    });
  });

  const results: any[] = [];

  // Filter exercises: if selectedExerciseName is passed, focus on that exercise; otherwise evaluate all exercises
  const exercisesToEvaluate = props.selectedExerciseName 
    ? [props.selectedExerciseName] 
    : Array.from(exerciseMaxes.keys());

  exercisesToEvaluate.forEach(exName => {
    const bestWeight = exerciseMaxes.get(exName) || 0;
    if (bestWeight > 0) {
      const category = matchStandardCategory(exName);
      const ratio = Math.round((bestWeight / bw) * 100) / 100;
      const { badge, nextTier, progressPercent } = getTierBadge(ratio, category);
      const lbsNeeded = nextTier ? Math.max(1, nextTier.weight - bestWeight) : 0;

      results.push({
        exerciseName: exName,
        matchedStandardName: category.name,
        icon: category.icon,
        bestWeight,
        bwRatio: ratio,
        tierBadge: badge,
        nextTier,
        lbsNeeded,
        progressPercent
      });
    }
  });

  return results.slice(0, 10);
});
</script>
