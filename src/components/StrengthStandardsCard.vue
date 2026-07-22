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

    <!-- Matched Overview Cards Grid -->
    <div v-if="liftEvaluations.length > 0" style="display: flex; flex-direction: column; gap: 10px;">
      <div 
        v-for="lift in liftEvaluations" 
        :key="lift.exerciseName"
        style="background: var(--color-card-bg); padding: 12px 14px; border-radius: 8px; border: 1px solid var(--color-card-border);"
      >
        <!-- Row 1: Exercise Name (Left) + Badge & Pencil Edit Button (Right) -->
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 4px;">
          <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; color: var(--color-card-heading); font-size: 0.95em; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            <span>{{ lift.icon }}</span>
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ lift.exerciseName }}</span>
          </div>

          <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
            <span 
              :style="{ backgroundColor: lift.tierBadge.bg, color: lift.tierBadge.color }"
              style="padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: 0.8em; display: inline-flex; align-items: center; gap: 4px;"
            >
              <span>{{ lift.tierBadge.icon }}</span>
              <span>{{ lift.tierBadge.name }}</span>
            </span>

            <!-- Pencil Edit Match Button -->
            <button 
              @click="toggleEditMatch(lift.exerciseName)"
              style="background: none; border: none; cursor: pointer; font-size: 0.9em; opacity: 0.7; padding: 2px 4px;"
              title="Edit Movement Category or Equipment Type"
            >
              ✏️
            </button>
          </div>
        </div>

        <!-- Row 2: Stats & Equipment Tag -->
        <div style="display: flex; align-items: center; gap: 8px; font-size: 0.85em; margin-bottom: 8px; flex-wrap: wrap;">
          <span style="font-size: 0.85em; opacity: 0.75; background: var(--color-card-mute); padding: 1px 6px; border-radius: 4px; border: 1px solid var(--color-card-border); font-weight: 500;">
            {{ lift.equipment === 'dumbbell' ? '🤹 DB per hand' : '🏋️ Barbell total' }}
          </span>
          <span style="font-weight: 600; color: var(--color-card-text);">
            Est. 1RM: {{ lift.bestWeight }} {{ weightUnit }} <small style="opacity: 0.75;">({{ lift.bwRatio }}x BW)</small>
          </span>
        </div>

        <!-- Edit Match Inline Drawer -->
        <div 
          v-if="editingExerciseName === lift.exerciseName" 
          style="margin-top: 8px; margin-bottom: 10px; padding: 10px 12px; background: var(--color-card-mute); border: 1px solid var(--color-card-border); border-radius: 6px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center; font-size: 0.85em;"
        >
          <div style="display: flex; align-items: center; gap: 6px;">
            <label style="font-weight: 600; opacity: 0.8;">Movement:</label>
            <select 
              :value="lift.matchedCategoryId"
              @change="updateOverrideCategory(lift.exerciseName, ($event.target as HTMLSelectElement).value)"
              style="padding: 4px 6px; border-radius: 4px; border: 1px solid var(--color-card-border); background: var(--color-card-bg); color: var(--color-card-text);"
            >
              <option value="none">❌ None / Do Not Match</option>
              <option v-for="cat in standardLiftsConfig" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>

          <div v-if="lift.matchedCategoryId !== 'none'" style="display: flex; align-items: center; gap: 6px;">
            <label style="font-weight: 600; opacity: 0.8;">Equipment:</label>
            <select 
              :value="lift.equipment"
              @change="updateOverrideEquipment(lift.exerciseName, ($event.target as HTMLSelectElement).value as any)"
              style="padding: 4px 6px; border-radius: 4px; border: 1px solid var(--color-card-border); background: var(--color-card-bg); color: var(--color-card-text);"
            >
              <option value="barbell">🏋️ Barbell (Total Load)</option>
              <option value="dumbbell">🤹 Dumbbell (Per Hand)</option>
            </select>
          </div>

          <button 
            @click="editingExerciseName = null" 
            style="margin-left: auto; padding: 3px 8px; font-size: 0.8em; border-radius: 4px; border: 1px solid var(--color-card-border); background: var(--color-card-bg); color: var(--color-card-text); cursor: pointer;"
          >
            Done
          </button>
        </div>

        <!-- Row 3: Next Milestone Progress Bar -->
        <div v-if="lift.nextTier" style="margin-top: 4px;">
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

    <!-- Manage Unmatched / Excluded Lifts Drawer Toggle -->
    <div v-if="unmatchedExercises.length > 0" style="margin-top: 14px; border-top: 1px dashed var(--color-card-border); padding-top: 10px; text-align: center;">
      <button 
        @click="showUnmatchedDrawer = !showUnmatchedDrawer" 
        style="background: none; border: none; color: var(--color-card-text); opacity: 0.75; cursor: pointer; font-size: 0.8em; font-weight: 600; text-decoration: underline;"
      >
        {{ showUnmatchedDrawer ? '🙈 Hide Excluded Lifts' : `👁️ Manage Excluded & Unmatched Lifts (${unmatchedExercises.length})` }}
      </button>

      <div v-if="showUnmatchedDrawer" style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px; text-align: left;">
        <div 
          v-for="unmatched in unmatchedExercises" 
          :key="unmatched.exerciseName"
          style="background: var(--color-card-bg); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--color-card-border); display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 0.85em;"
        >
          <span style="font-weight: 600; color: var(--color-card-text);">{{ unmatched.exerciseName }}</span>
          
          <div style="display: flex; align-items: center; gap: 6px;">
            <label style="opacity: 0.75; font-size: 0.8em;">Match to:</label>
            <select 
              @change="updateOverrideCategory(unmatched.exerciseName, ($event.target as HTMLSelectElement).value)"
              style="padding: 2px 6px; border-radius: 4px; border: 1px solid var(--color-card-border); background: var(--color-card-mute); color: var(--color-card-text); font-size: 0.8em;"
            >
              <option value="none">❌ Do Not Match</option>
              <option v-for="cat in standardLiftsConfig" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
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
const editingExerciseName = ref<string | null>(null);
const showUnmatchedDrawer = ref<boolean>(false);

// Sync with settings when loaded from Firestore
watch(() => settings.value, (s) => {
  if (s) {
    if (s.bodyweight && s.bodyweight > 0) bodyweight.value = s.bodyweight;
    if (s.userAgeBracket) ageBracket.value = s.userAgeBracket;
  }
}, { immediate: true, deep: true });

const saveUserSettings = () => {
  saveSettings({ 
    bodyweight: bodyweight.value > 0 ? bodyweight.value : 180,
    userAgeBracket: ageBracket.value
  });
};

const toggleEditMatch = (exName: string) => {
  if (editingExerciseName.value === exName) {
    editingExerciseName.value = null;
  } else {
    editingExerciseName.value = exName;
  }
};

const updateOverrideCategory = (exName: string, categoryId: string) => {
  const currentOverrides = { ...(settings.value.standardsOverrides || {}) };
  const existing = currentOverrides[exName] || { categoryId, equipment: 'barbell' };
  currentOverrides[exName] = { ...existing, categoryId };
  saveSettings({ standardsOverrides: currentOverrides });
};

const updateOverrideEquipment = (exName: string, equipment: 'barbell' | 'dumbbell') => {
  const currentOverrides = { ...(settings.value.standardsOverrides || {}) };
  const existing = currentOverrides[exName] || { categoryId: 'bench_press', equipment };
  currentOverrides[exName] = { ...existing, equipment };
  saveSettings({ standardsOverrides: currentOverrides });
};

// Age adjustment multipliers
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
       .filter(t => t.length > 1 && !['barbell', 'dumbbell', 'db', 'bb', 'machine', 'cable', 'smith', 'elastics', 'band', 'underhand'].includes(t))
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

// Standard strength reference categories with separate ratios for Barbell vs Dumbbell per hand
const standardLiftsConfig = [
  {
    id: 'incline_press',
    name: 'Incline Bench Press',
    icon: '🏋️',
    keywords: ['incline bench', 'incline press', 'incline dumbbell', 'incline db', 'incline'],
    ratios: {
      barbell: { beginner: 0.42, novice: 0.65, intermediate: 0.95, advanced: 1.30, elite: 1.65 },
      dumbbell: { beginner: 0.14, novice: 0.23, intermediate: 0.35, advanced: 0.48, elite: 0.62 }
    }
  },
  {
    id: 'bench_press',
    name: 'Bench Press',
    icon: '🏋️‍♂️',
    keywords: ['flat bench', 'bench press', 'chest press', 'pec press', 'bench'],
    ratios: {
      barbell: { beginner: 0.50, novice: 0.75, intermediate: 1.10, advanced: 1.50, elite: 1.90 },
      dumbbell: { beginner: 0.18, novice: 0.28, intermediate: 0.40, advanced: 0.55, elite: 0.70 }
    }
  },
  {
    id: 'overhead_press',
    name: 'Overhead / Shoulder Press',
    icon: '🙆‍♂️',
    keywords: ['overhead press', 'ohp', 'shoulder press', 'military press'],
    ratios: {
      barbell: { beginner: 0.35, novice: 0.55, intermediate: 0.75, advanced: 1.00, elite: 1.25 },
      dumbbell: { beginner: 0.12, novice: 0.20, intermediate: 0.30, advanced: 0.42, elite: 0.55 }
    }
  },
  {
    id: 'squat',
    name: 'Squat',
    icon: '🦵',
    keywords: ['squat', 'back squat', 'front squat'],
    ratios: {
      barbell: { beginner: 0.75, novice: 1.10, intermediate: 1.50, advanced: 2.00, elite: 2.40 },
      dumbbell: { beginner: 0.28, novice: 0.42, intermediate: 0.58, advanced: 0.78, elite: 1.00 }
    }
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    icon: '💥',
    keywords: ['deadlift', 'sumo deadlift', 'rdl', 'romanian deadlift'],
    ratios: {
      barbell: { beginner: 0.90, novice: 1.30, intermediate: 1.75, advanced: 2.25, elite: 2.75 },
      dumbbell: { beginner: 0.35, novice: 0.52, intermediate: 0.72, advanced: 0.95, elite: 1.20 }
    }
  },
  {
    id: 'bicep_curl',
    name: 'Bicep / Hammer Curl',
    icon: '💪',
    keywords: ['bicep curl', 'hammer curl', 'spider curl', 'preacher curl', 'dumbbell curl', 'curl'],
    ratios: {
      barbell: { beginner: 0.25, novice: 0.40, intermediate: 0.60, advanced: 0.82, elite: 1.05 },
      dumbbell: { beginner: 0.10, novice: 0.16, intermediate: 0.24, advanced: 0.34, elite: 0.45 }
    }
  },
  {
    id: 'barbell_row',
    name: 'Row / Lat Pulldown',
    icon: '🚣',
    keywords: ['bent row', 'barbell row', 'helms row', 'dumbbell row', 'lat pulldown', 'pull up', 'row'],
    ratios: {
      barbell: { beginner: 0.40, novice: 0.65, intermediate: 0.90, advanced: 1.20, elite: 1.50 },
      dumbbell: { beginner: 0.22, novice: 0.34, intermediate: 0.46, advanced: 0.60, elite: 0.75 }
    }
  }
];

// Determine equipment default (Dumbbell vs Barbell) based on name
const detectEquipmentType = (name: string): 'barbell' | 'dumbbell' => {
  const lower = name.toLowerCase();
  if (lower.includes('dumbbell') || lower.includes('db') || lower.includes('hammer') || lower.includes('curl') || lower.includes('helms')) {
    return 'dumbbell';
  }
  return 'barbell';
};

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
  let bestMatch: any = null;
  let maxScore = 0;

  standardLiftsConfig.forEach(config => {
    const configString = `${config.name} ${config.keywords.join(' ')}`;
    const score = calculateJaccardSimilarity(userExName, configString);
    if (score > maxScore) {
      maxScore = score;
      bestMatch = config;
    }
  });

  // Only auto-match if Jaccard similarity score is sufficiently high (>= 0.35)
  return maxScore >= 0.35 ? bestMatch : null;
};

interface TierInfo {
  name: string;
  icon: string;
  bg: string;
  color: string;
}

const getTierBadge = (ratio: number, config: any, equipment: 'barbell' | 'dumbbell'): { badge: TierInfo; nextTier: { name: string; weight: number } | null; progressPercent: number } => {
  const bw = bodyweight.value || 180;
  const ageMult = getAgeMultiplier(ageBracket.value);

  const baseRatios = config.ratios[equipment] || config.ratios.barbell;

  // Age-adjusted ratio thresholds
  const r = {
    beginner: baseRatios.beginner * ageMult,
    novice: baseRatios.novice * ageMult,
    intermediate: baseRatios.intermediate * ageMult,
    advanced: baseRatios.advanced * ageMult,
    elite: baseRatios.elite * ageMult
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

// Process all exercises from workout history
const processedExercises = computed(() => {
  if (!props.workouts || props.workouts.length === 0) return { matched: [], unmatched: [] };
  const bw = bodyweight.value || 180;
  const userOverrides = settings.value.standardsOverrides || {};

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

  const matched: any[] = [];
  const unmatched: any[] = [];

  const exercisesToEvaluate = props.selectedExerciseName 
    ? [props.selectedExerciseName] 
    : Array.from(exerciseMaxes.keys());

  exercisesToEvaluate.forEach(exName => {
    const bestWeight = exerciseMaxes.get(exName) || 0;
    if (bestWeight > 0) {
      const override = userOverrides[exName];
      
      let category: any = null;
      if (override) {
        if (override.categoryId === 'none') {
          category = null;
        } else {
          category = standardLiftsConfig.find(c => c.id === override.categoryId) || matchStandardCategory(exName);
        }
      } else {
        category = matchStandardCategory(exName);
      }

      if (category) {
        const equipment: 'barbell' | 'dumbbell' = override?.equipment || detectEquipmentType(exName);
        const ratio = Math.round((bestWeight / bw) * 100) / 100;
        const { badge, nextTier, progressPercent } = getTierBadge(ratio, category, equipment);
        const lbsNeeded = nextTier ? Math.max(1, nextTier.weight - bestWeight) : 0;

        matched.push({
          exerciseName: exName,
          matchedCategoryId: category.id,
          matchedStandardName: category.name,
          equipment,
          icon: category.icon,
          bestWeight,
          bwRatio: ratio,
          tierBadge: badge,
          nextTier,
          lbsNeeded,
          progressPercent
        });
      } else {
        unmatched.push({
          exerciseName: exName,
          bestWeight
        });
      }
    }
  });

  return { matched, unmatched };
});

const liftEvaluations = computed(() => processedExercises.value.matched.slice(0, 10));
const unmatchedExercises = computed(() => processedExercises.value.unmatched);
</script>
