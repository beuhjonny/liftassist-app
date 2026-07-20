<template>
  <div class="chart-container">
    <div class="chart-controls-row">
      <div class="control-group">
        <label class="control-label">Set Counting Mode</label>
        <div class="toggle-buttons">
          <button 
            @click="includeIndirect = false" 
            class="toggle-btn"
            :class="{ active: !includeIndirect }"
          >
            Direct Sets Only (1.0x)
          </button>
          <button 
            @click="includeIndirect = true" 
            class="toggle-btn"
            :class="{ active: includeIndirect }"
          >
            Include Indirect Sets (0.5x)
          </button>
        </div>
      </div>

      <div class="control-group">
        <label class="control-label">Time Window</label>
        <select v-model="timeWindow" class="chart-select">
          <option value="4w">Last 4 Weeks</option>
          <option value="8w">Last 8 Weeks</option>
          <option value="12w">Last 12 Weeks</option>
          <option value="6m">Last 6 Months</option>
          <option value="1y">Last 1 Year</option>
          <option value="all">All Time</option>
        </select>
      </div>
    </div>

    <!-- Optimal Volume Benchmark Legend -->
    <div class="benchmark-legend card-inset">
      <span class="legend-badge low">🟡 &lt; 10 sets/wk (Maintenance)</span>
      <span class="legend-badge optimal">🟢 10–20 sets/wk (Hypertrophy)</span>
      <span class="legend-badge high">🔵 &gt; 20 sets/wk (High Volume)</span>
    </div>

    <div v-if="chartData.labels.length > 0" class="canvas-wrapper">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
    <div v-else class="no-data card-inset">
      <p>No logged workout data found in the selected timeframe.</p>
    </div>

    <!-- Exercise to Muscle Mapping Inspector Drawer -->
    <div class="breakdown-drawer-container">
      <button 
        @click="showBreakdownDrawer = !showBreakdownDrawer" 
        class="button-secondary breakdown-toggle-btn"
      >
        <span>📋 {{ showBreakdownDrawer ? 'Hide' : 'Inspect & Edit' }} Exercise Muscle Mappings</span>
        <span class="drawer-arrow">{{ showBreakdownDrawer ? '▲' : '▼' }}</span>
      </button>

      <div v-if="showBreakdownDrawer" class="breakdown-content card-inset">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
          <div>
            <h4 style="margin:0;">Exercise Muscle Group Contributions</h4>
            <p class="breakdown-subtitle" style="margin: 4px 0 0 0;">
              Below are movements logged in your workouts. Click ✏️ Edit to customize which muscle groups any exercise targets!
            </p>
          </div>
        </div>

        <div v-if="exerciseBreakdownList.length > 0" class="table-responsive">
          <table class="breakdown-table">
            <thead>
              <tr>
                <th>Exercise Name</th>
                <th>Primary (1.0x)</th>
                <th>Secondary (0.5x)</th>
                <th>Sets Logged</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ex in exerciseBreakdownList" :key="ex.name">
                <td class="ex-name-cell">
                  <strong>{{ ex.name }}</strong>
                  <span v-if="ex.isCustom" class="custom-tag" title="User Custom Mapping">✏️ Custom</span>
                </td>
                <td>
                  <span class="muscle-chip primary-chip">{{ ex.primary.join(', ') || 'Unmapped' }}</span>
                </td>
                <td>
                  <span v-if="ex.secondary.length > 0" class="muscle-chip secondary-chip">{{ ex.secondary.join(', ') }}</span>
                  <span v-else class="text-muted">—</span>
                </td>
                <td class="sets-cell">
                  <strong>{{ ex.setsCount }}</strong> sets
                </td>
                <td>
                  <button @click="openEditModal(ex)" class="edit-mapping-btn" title="Edit Muscle Group Mapping">
                    ✏️ Edit
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="no-data-text">
          No exercise breakdown available.
        </div>
      </div>
    </div>

    <!-- Edit Mapping Modal -->
    <div v-if="editingExercise" class="modal-overlay" @click.self="editingExercise = null">
      <div class="edit-modal-card card">
        <h3>✏️ Edit Muscle Mapping</h3>
        <p class="modal-exercise-name"><strong>{{ editingExercise.name }}</strong></p>

        <div class="mapping-section">
          <label class="modal-label">Primary Muscle Groups (1.0x Set Count)</label>
          <div class="chips-selector">
            <button 
              v-for="mGroup in MUSCLE_GROUPS" 
              :key="'p-' + mGroup"
              @click="togglePrimary(mGroup)"
              class="chip-select-btn"
              :class="{ selected: editForm.primary.includes(mGroup) }"
            >
              {{ mGroup }}
            </button>
          </div>
        </div>

        <div class="mapping-section" style="margin-top: 16px;">
          <label class="modal-label">Secondary / Synergist Muscles (0.5x Set Count)</label>
          <div class="chips-selector">
            <button 
              v-for="mGroup in MUSCLE_GROUPS" 
              :key="'s-' + mGroup"
              @click="toggleSecondary(mGroup)"
              class="chip-select-btn secondary"
              :class="{ selected: editForm.secondary.includes(mGroup) }"
            >
              {{ mGroup }}
            </button>
          </div>
        </div>

        <div class="modal-actions" style="margin-top: 24px; display: flex; gap: 10px; justify-content: flex-end;">
          <button @click="editingExercise = null" class="button-secondary">Cancel</button>
          <button @click="saveMapping" class="button-primary">Save Mapping</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Bar } from 'vue-chartjs';
import { 
  Chart as ChartJS, 
  Title, 
  Tooltip, 
  Legend, 
  BarElement, 
  CategoryScale, 
  LinearScale,
  type ChartOptions 
} from 'chart.js';
import type { LoggedWorkout } from '@/types';
import { getExerciseDemo } from '@/utils/exerciseDemos';
import useMuscleMappings, { type ExerciseMuscleMapping } from '@/composables/useMuscleMappings';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const props = defineProps<{
  workouts: LoggedWorkout[];
  weightUnit?: 'lbs' | 'kg';
}>();

const { customMappings, fetchCustomMappings, setCustomMapping, getCustomMapping } = useMuscleMappings();

onMounted(() => {
  fetchCustomMappings();
});

const includeIndirect = ref(false);
const timeWindow = ref<string>('all');
const showBreakdownDrawer = ref(false);

// Edit Modal State
const editingExercise = ref<{ name: string; primary: string[]; secondary: string[] } | null>(null);
const editForm = ref<{ primary: string[]; secondary: string[] }>({ primary: [], secondary: [] });

interface MuscleSetCount {
  [muscleGroup: string]: number;
}

const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Quads',
  'Hamstrings & Glutes',
  'Biceps',
  'Triceps',
  'Abs & Core',
  'Calves',
  'Forearms',
  'Traps'
];

/**
 * Robust Date Parser handling Firestore Timestamp, plain {seconds, nanoseconds} objects,
 * Date objects, ISO strings, and epoch numbers.
 */
const getObjDate = (dateVal: any): Date => {
  if (!dateVal) return new Date(0);
  if (typeof dateVal.toDate === 'function') {
    return dateVal.toDate();
  }
  if (typeof dateVal.seconds === 'number') {
    return new Date(dateVal.seconds * 1000);
  }
  if (dateVal instanceof Date) {
    return dateVal;
  }
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? new Date(0) : d;
};

// Filter workouts within timeframe
const filteredWorkouts = computed(() => {
  if (!props.workouts || props.workouts.length === 0) return [];

  const now = new Date();
  let cutoffDate: Date | null = null;

  if (timeWindow.value === '4w') {
    cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() - (4 * 7));
  } else if (timeWindow.value === '8w') {
    cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() - (8 * 7));
  } else if (timeWindow.value === '12w') {
    cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() - (12 * 7));
  } else if (timeWindow.value === '6m') {
    cutoffDate = new Date();
    cutoffDate.setMonth(now.getMonth() - 6);
  } else if (timeWindow.value === '1y') {
    cutoffDate = new Date();
    cutoffDate.setFullYear(now.getFullYear() - 1);
  }

  return props.workouts.filter(w => {
    const d = getObjDate(w.date);
    return d.getTime() > 0 && (!cutoffDate || d >= cutoffDate);
  });
});

// Calculate total weeks span in selected timeframe
const calculatedWeeksSpan = computed(() => {
  if (filteredWorkouts.value.length === 0) return 1;

  if (timeWindow.value === '4w') return 4;
  if (timeWindow.value === '8w') return 8;
  if (timeWindow.value === '12w') return 12;
  if (timeWindow.value === '6m') return 24;
  if (timeWindow.value === '1y') return 52;

  const timestamps = filteredWorkouts.value
    .map(w => getObjDate(w.date).getTime())
    .filter(t => t > 0);

  if (timestamps.length === 0) return 1;

  const minDate = Math.min(...timestamps);
  const maxDate = Math.max(...timestamps, new Date().getTime());
  const diffDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.ceil(diffDays / 7));
});

const chartData = computed(() => {
  const muscleTotals: MuscleSetCount = {};
  MUSCLE_GROUPS.forEach(m => { muscleTotals[m] = 0; });

  filteredWorkouts.value.forEach(w => {
    if (!w.performedExercises) return;
    w.performedExercises.forEach(ex => {
      if (!ex.sets || ex.sets.length === 0) return;
      
      const validSetsCount = ex.sets.filter(s => 
        s && s.status !== 'failed' && (s.actualReps === undefined || s.actualReps > 0)
      ).length;

      if (validSetsCount === 0) return;

      const muscleMappings = categorizeExerciseMuscles(ex.exerciseName);

      // Add Direct Sets (1.0x)
      muscleMappings.primary.forEach(mGroup => {
        if (muscleTotals[mGroup] !== undefined) {
          muscleTotals[mGroup] += validSetsCount * 1.0;
        }
      });

      // Add Indirect Sets (0.5x) if enabled
      if (includeIndirect.value) {
        muscleMappings.secondary.forEach(mGroup => {
          if (muscleTotals[mGroup] !== undefined) {
            muscleTotals[mGroup] += validSetsCount * 0.5;
          }
        });
      }
    });
  });

  const labels: string[] = [];
  const setValues: number[] = [];
  const backgroundColors: string[] = [];
  const weeks = calculatedWeeksSpan.value;

  MUSCLE_GROUPS.forEach(mGroup => {
    const weeklyAvg = Math.round((muscleTotals[mGroup] / weeks) * 10) / 10;
    labels.push(mGroup);
    setValues.push(weeklyAvg);

    if (weeklyAvg < 10) {
      backgroundColors.push('rgba(245, 158, 11, 0.85)'); // Low (Amber)
    } else if (weeklyAvg <= 20) {
      backgroundColors.push('rgba(16, 185, 129, 0.85)'); // Optimal (Green)
    } else {
      backgroundColors.push('rgba(59, 130, 246, 0.85)'); // High (Blue)
    }
  });

  return {
    labels,
    datasets: [
      {
        label: 'Avg Weekly Sets',
        data: setValues,
        backgroundColor: backgroundColors,
        borderRadius: 6,
        borderWidth: 0
      }
    ]
  };
});

// Detailed list of exercises logged in timeframe for the Inspector Drawer
const exerciseBreakdownList = computed(() => {
  const exerciseMap: Record<string, { name: string; primary: string[]; secondary: string[]; setsCount: number; isCustom: boolean }> = {};

  filteredWorkouts.value.forEach(w => {
    if (!w.performedExercises) return;
    w.performedExercises.forEach(ex => {
      if (!ex.exerciseName || !ex.sets) return;
      
      const validSetsCount = ex.sets.filter(s => 
        s && s.status !== 'failed' && (s.actualReps === undefined || s.actualReps > 0)
      ).length;

      if (validSetsCount === 0) return;

      const key = ex.exerciseName.trim();
      if (!exerciseMap[key]) {
        const mappings = categorizeExerciseMuscles(key);
        const hasCustom = !!getCustomMapping(key);
        exerciseMap[key] = {
          name: key,
          primary: mappings.primary,
          secondary: mappings.secondary,
          setsCount: 0,
          isCustom: hasCustom
        };
      }
      exerciseMap[key].setsCount += validSetsCount;
    });
  });

  return Object.values(exerciseMap).sort((a, b) => b.setsCount - a.setsCount);
});

function openEditModal(ex: { name: string; primary: string[]; secondary: string[] }) {
  editingExercise.value = ex;
  const current = categorizeExerciseMuscles(ex.name);
  editForm.value = {
    primary: [...current.primary],
    secondary: [...current.secondary]
  };
}

function togglePrimary(mGroup: string) {
  const idx = editForm.value.primary.indexOf(mGroup);
  if (idx > -1) {
    editForm.value.primary.splice(idx, 1);
  } else {
    editForm.value.primary.push(mGroup);
    // Remove from secondary if present
    const sIdx = editForm.value.secondary.indexOf(mGroup);
    if (sIdx > -1) editForm.value.secondary.splice(sIdx, 1);
  }
}

function toggleSecondary(mGroup: string) {
  const idx = editForm.value.secondary.indexOf(mGroup);
  if (idx > -1) {
    editForm.value.secondary.splice(idx, 1);
  } else {
    editForm.value.secondary.push(mGroup);
    // Remove from primary if present
    const pIdx = editForm.value.primary.indexOf(mGroup);
    if (pIdx > -1) editForm.value.primary.splice(pIdx, 1);
  }
}

async function saveMapping() {
  if (!editingExercise.value) return;
  await setCustomMapping(editingExercise.value.name, {
    primary: editForm.value.primary,
    secondary: editForm.value.secondary
  });
  editingExercise.value = null;
}

function categorizeExerciseMuscles(rawName: string): { primary: string[]; secondary: string[] } {
  if (!rawName) return { primary: ['Chest'], secondary: [] };

  // Check user custom mapping first!
  const userOverride = getCustomMapping(rawName);
  if (userOverride) {
    return userOverride;
  }

  const norm = rawName.toLowerCase().replace(/[-_]/g, ' ').trim();
  const demo = getExerciseDemo(rawName);

  const primary: string[] = [];
  const secondary: string[] = [];

  // Face Pull Check
  if (norm.includes('face pull') || norm.includes('facepull')) {
    primary.push('Shoulders', 'Back');
    secondary.push('Traps');
    return { primary, secondary };
  }

  // Wrist / Forearm Check
  if (norm.includes('wrist') || norm.includes('forearm')) {
    primary.push('Forearms');
    return { primary, secondary };
  }

  // Shrugs / Traps
  if (norm.includes('shrug') || norm.includes('trap')) {
    primary.push('Traps');
    secondary.push('Shoulders');
    return { primary, secondary };
  }

  // Chest Movements
  if (norm.includes('bench') || norm.includes('chest press') || norm.includes('push up') || norm.includes('flye') || norm.includes('pec') || norm.includes('chest')) {
    primary.push('Chest');
    secondary.push('Triceps', 'Shoulders');
  } else if (norm.includes('incline')) {
    primary.push('Chest', 'Shoulders');
    secondary.push('Triceps');
  } 
  // Shoulder Movements
  else if (norm.includes('overhead') || norm.includes('military') || norm.includes('shoulder press') || norm.includes('lateral raise') || norm.includes('delt') || norm.includes('shoulder') || norm.includes('arnold')) {
    primary.push('Shoulders');
    secondary.push('Triceps');
  } 
  // Back Movements
  else if (norm.includes('row') || norm.includes('pulldown') || norm.includes('pull up') || norm.includes('chin') || norm.includes('lat') || norm.includes('back')) {
    primary.push('Back');
    secondary.push('Biceps', 'Shoulders');
  } 
  // Leg / Quad Movements
  else if (norm.includes('squat') || norm.includes('leg press') || norm.includes('leg extension') || norm.includes('quad extension') || norm.includes('lunge') || norm.includes('quad')) {
    primary.push('Quads');
    secondary.push('Hamstrings & Glutes');
  } 
  // Hamstring / Glute Movements
  else if (norm.includes('deadlift') || norm.includes('rdl') || norm.includes('leg curl') || norm.includes('hip thrust') || norm.includes('glute') || norm.includes('hamstring')) {
    primary.push('Hamstrings & Glutes');
    secondary.push('Back');
  } 
  // Bicep Movements
  else if (norm.includes('curl') || norm.includes('bicep') || norm.includes('hammer')) {
    primary.push('Biceps');
    secondary.push('Forearms');
  } 
  // Tricep Movements
  else if (norm.includes('tricep') || norm.includes('pushdown') || norm.includes('skullcrusher') || norm.includes('dip')) {
    primary.push('Triceps');
    secondary.push('Chest');
  } 
  // Abs & Core
  else if (norm.includes('crunch') || norm.includes('leg raise') || norm.includes('plank') || norm.includes('ab')) {
    primary.push('Abs & Core');
  } 
  // Calves
  else if (norm.includes('calf') || norm.includes('calves')) {
    primary.push('Calves');
  } 
  else {
    // Fallback using exerciseDemos category
    if (demo.category === 'Chest') {
      primary.push('Chest');
      secondary.push('Triceps');
    } else if (demo.category === 'Back') {
      primary.push('Back');
      secondary.push('Biceps');
    } else if (demo.category === 'Shoulders') {
      primary.push('Shoulders');
      secondary.push('Triceps');
    } else if (demo.category === 'Legs') {
      primary.push('Quads');
      secondary.push('Hamstrings & Glutes');
    } else if (demo.category === 'Arms') {
      primary.push('Biceps', 'Triceps');
    } else {
      primary.push('Chest');
    }
  }

  return { primary, secondary };
}

const chartOptions = computed<ChartOptions<'bar'>>(() => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#1a1f29',
        titleColor: '#ffffff',
        bodyColor: '#10b981',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context) => {
            return ` ${context.parsed.x} sets / week (${includeIndirect.value ? 'Direct + Indirect 0.5x' : 'Direct Only'})`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.08)'
        },
        ticks: {
          color: '#a0aec0',
          font: { size: 11, weight: 'bold' }
        },
        title: {
          display: true,
          text: `Avg Weekly Sets (${calculatedWeeksSpan.value} Wks Span)`,
          color: '#a0aec0',
          font: { size: 12, weight: 'bold' }
        },
        beginAtZero: true
      },
      y: {
        grid: {
          display: false
        },
        ticks: {
          color: '#cbd5e1',
          font: { size: 12, weight: 'bold' }
        }
      }
    }
  };
});
</script>

<style scoped>
.chart-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chart-controls-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.control-label {
  font-size: 0.75em;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-card-text);
  opacity: 0.75;
}

.toggle-buttons {
  display: flex;
  gap: 6px;
  background-color: var(--color-card-mute, #1a1a1a);
  padding: 3px;
  border-radius: 8px;
  border: 1px solid var(--color-card-border);
}

.toggle-btn {
  background: none;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  color: var(--color-card-text);
  font-size: 0.8em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0.7;
}

.toggle-btn.active {
  background-color: var(--color-primary, #007bff);
  color: #ffffff;
  opacity: 1;
}

.chart-select {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--color-card-border);
  background-color: var(--color-card-mute, #1a1a1a);
  color: var(--color-card-text, #ffffff);
  font-size: 0.85em;
  font-weight: 600;
}

.benchmark-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 0.78em;
  font-weight: 600;
}

.legend-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.canvas-wrapper {
  height: 380px;
  position: relative;
  width: 100%;
}

.no-data {
  padding: 30px;
  text-align: center;
  border-radius: 12px;
  color: var(--color-card-text);
  opacity: 0.75;
  font-size: 0.9em;
}

/* Breakdown Inspector Drawer */
.breakdown-drawer-container {
  margin-top: 10px;
}

.breakdown-toggle-btn {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  font-size: 0.85em;
  font-weight: 600;
  border-radius: 8px;
}

.breakdown-content {
  margin-top: 10px;
  padding: 16px;
  border-radius: 12px;
}

.breakdown-subtitle {
  font-size: 0.8em;
  opacity: 0.75;
}

.table-responsive {
  overflow-x: auto;
}

.breakdown-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85em;
  text-align: left;
}

.breakdown-table th,
.breakdown-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-card-border, rgba(255,255,255,0.1));
}

.breakdown-table th {
  font-size: 0.75em;
  text-transform: uppercase;
  opacity: 0.7;
}

.custom-tag {
  display: inline-block;
  margin-left: 6px;
  font-size: 0.75em;
  color: #3b82f6;
  font-weight: 700;
}

.muscle-chip {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.82em;
  font-weight: 600;
}

.primary-chip {
  background-color: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.secondary-chip {
  background-color: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.text-muted {
  opacity: 0.4;
}

.edit-mapping-btn {
  background-color: var(--color-card-mute, #222);
  border: 1px solid var(--color-card-border, #444);
  color: var(--color-card-text, #fff);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.78em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-mapping-btn:hover {
  background-color: var(--color-primary, #007bff);
  color: #fff;
}

.no-data-text {
  text-align: center;
  font-size: 0.85em;
  opacity: 0.6;
  padding: 15px;
}

/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 16px;
}

.edit-modal-card {
  width: 100%;
  max-width: 520px;
  padding: 24px;
  border-radius: 16px;
  text-align: left;
}

.modal-exercise-name {
  font-size: 1.1em;
  color: var(--color-primary, #007bff);
  margin: 4px 0 16px 0;
}

.modal-label {
  display: block;
  font-size: 0.8em;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 8px;
  opacity: 0.8;
}

.chips-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip-select-btn {
  background-color: var(--color-card-mute, #222);
  border: 1px solid var(--color-card-border, #444);
  color: var(--color-card-text, #fff);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.chip-select-btn.selected {
  background-color: #10b981;
  border-color: #10b981;
  color: #ffffff;
}

.chip-select-btn.secondary.selected {
  background-color: #3b82f6;
  border-color: #3b82f6;
  color: #ffffff;
}
</style>
