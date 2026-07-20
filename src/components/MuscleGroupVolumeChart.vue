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
        <select v-model="timeWindowWeeks" class="chart-select">
          <option :value="4">Last 4 Weeks</option>
          <option :value="8">Last 8 Weeks</option>
          <option :value="12">Last 12 Weeks</option>
          <option :value="24">Last 6 Months</option>
          <option :value="52">Last 1 Year</option>
        </select>
      </div>
    </div>

    <!-- Optimal Volume Benchmark Legend -->
    <div class="benchmark-legend card-inset">
      <span class="legend-badge low">🟡 &lt; 10 sets/wk (Maintenance)</span>
      <span class="legend-badge optimal">🟢 10–20 sets/wk (Optimal Hypertrophy)</span>
      <span class="legend-badge high">🔵 &gt; 20 sets/wk (High Volume)</span>
    </div>

    <div v-if="chartData.labels.length > 0" class="canvas-wrapper">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
    <div v-else class="no-data card-inset">
      <p>No logged workout data found in the selected timeframe.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
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

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const props = defineProps<{
  workouts: LoggedWorkout[];
  weightUnit?: 'lbs' | 'kg';
}>();

const includeIndirect = ref(false);
const timeWindowWeeks = ref<number>(4);

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
  'Calves'
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

const chartData = computed(() => {
  if (!props.workouts || props.workouts.length === 0) {
    return { labels: [], datasets: [] };
  }

  const now = new Date();
  const cutoffDate = new Date();
  cutoffDate.setDate(now.getDate() - (timeWindowWeeks.value * 7));

  // Filter workouts within timeframe
  const filtered = props.workouts.filter(w => {
    const d = getObjDate(w.date);
    return d.getTime() > 0 && d >= cutoffDate;
  });

  const muscleTotals: MuscleSetCount = {};
  MUSCLE_GROUPS.forEach(m => { muscleTotals[m] = 0; });

  filtered.forEach(w => {
    if (!w.performedExercises) return;
    w.performedExercises.forEach(ex => {
      if (!ex.sets || ex.sets.length === 0) return;
      
      // Count any set with reps > 0 or status != failed
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

  // Calculate Average Weekly Sets
  const labels: string[] = [];
  const setValues: number[] = [];
  const backgroundColors: string[] = [];

  MUSCLE_GROUPS.forEach(mGroup => {
    const weeksCount = Math.max(1, timeWindowWeeks.value);
    const weeklyAvg = Math.round((muscleTotals[mGroup] / weeksCount) * 10) / 10;
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

function categorizeExerciseMuscles(rawName: string): { primary: string[]; secondary: string[] } {
  if (!rawName) return { primary: ['Chest'], secondary: [] };

  const norm = rawName.toLowerCase().trim().replace(/_/g, ' ');
  const demo = getExerciseDemo(rawName);

  const primary: string[] = [];
  const secondary: string[] = [];

  if (norm.includes('bench') || norm.includes('chest press') || norm.includes('push up') || norm.includes('flye') || norm.includes('pec')) {
    primary.push('Chest');
    secondary.push('Triceps', 'Shoulders');
  } else if (norm.includes('incline')) {
    primary.push('Chest', 'Shoulders');
    secondary.push('Triceps');
  } else if (norm.includes('overhead') || norm.includes('military') || norm.includes('shoulder press') || norm.includes('lateral raise') || norm.includes('delt')) {
    primary.push('Shoulders');
    secondary.push('Triceps');
  } else if (norm.includes('row') || norm.includes('pulldown') || norm.includes('pull up') || norm.includes('chin') || norm.includes('lat')) {
    primary.push('Back');
    secondary.push('Biceps', 'Shoulders');
  } else if (norm.includes('squat') || norm.includes('leg press') || norm.includes('extension') || norm.includes('lunge') || norm.includes('quad')) {
    primary.push('Quads');
    secondary.push('Hamstrings & Glutes');
  } else if (norm.includes('deadlift') || norm.includes('rdl') || norm.includes('curl') && (norm.includes('leg') || norm.includes('hamstring')) || norm.includes('hip thrust') || norm.includes('glute')) {
    primary.push('Hamstrings & Glutes');
    secondary.push('Back');
  } else if (norm.includes('curl') || norm.includes('bicep') || norm.includes('hammer')) {
    primary.push('Biceps');
  } else if (norm.includes('tricep') || norm.includes('pushdown') || norm.includes('skullcrusher') || norm.includes('dip')) {
    primary.push('Triceps');
  } else if (norm.includes('crunch') || norm.includes('leg raise') || norm.includes('plank') || norm.includes('ab')) {
    primary.push('Abs & Core');
  } else if (norm.includes('calf') || norm.includes('calves')) {
    primary.push('Calves');
  } else {
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
          text: 'Avg Weekly Sets',
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
  height: 340px;
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
</style>
