<template>
  <div class="chart-container">
    <div class="chart-controls-row">
      <div class="control-group">
        <label class="control-label">Metric</label>
        <select v-model="selectedMetric" class="chart-select">
          <option value="totalVolume">Total Volume ({{ weightUnit }})</option>
          <option value="workoutFrequency">Workout Frequency (Sessions/wk)</option>
          <option value="totalSets">Total Weekly Sets</option>
          <option value="overloadRate">Overload Rate (%)</option>
        </select>
      </div>

      <div class="control-group">
        <label class="control-label">Smoothing</label>
        <div class="toggle-buttons">
          <button 
            @click="useMovingAverage = false" 
            class="toggle-btn"
            :class="{ active: !useMovingAverage }"
          >
            Raw Logs
          </button>
          <button 
            @click="useMovingAverage = true" 
            class="toggle-btn"
            :class="{ active: useMovingAverage }"
          >
            3-Wk Moving Avg
          </button>
        </div>
      </div>
    </div>

    <div v-if="chartData.labels.length > 0" class="canvas-wrapper">
      <Line :data="chartData" :options="chartOptions" />
    </div>
    <div v-else class="no-data card-inset">
      <p>Not enough workout logs found in selected timeframe.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Line } from 'vue-chartjs';
import { 
  Chart as ChartJS, 
  Title, 
  Tooltip, 
  Legend, 
  LineElement, 
  PointElement, 
  CategoryScale, 
  LinearScale, 
  Filler,
  type ChartOptions 
} from 'chart.js';
import type { LoggedWorkout } from '@/types';
import { displayUnit } from '@/utils/weight';

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, Filler);

const props = withDefaults(
  defineProps<{
    volumeIndex?: any;
    workouts?: LoggedWorkout[];
    weightUnit: 'lbs' | 'kg';
    timeRange: string;
    aggregation?: 'weekly' | 'monthly';
  }>(),
  {
    aggregation: 'weekly'
  }
);

const selectedMetric = ref<'totalVolume' | 'workoutFrequency' | 'totalSets' | 'overloadRate'>('totalVolume');
const useMovingAverage = ref(false);

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
  const now = new Date();
  let cutoffDate: Date | null = null;

  if (props.timeRange === '12w') {
    cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() - (12 * 7));
  } else if (props.timeRange === '6m') {
    cutoffDate = new Date();
    cutoffDate.setMonth(now.getMonth() - 6);
  } else if (props.timeRange === '1y') {
    cutoffDate = new Date();
    cutoffDate.setFullYear(now.getFullYear() - 1);
  }

  const metricGroupData: Record<string, { volume: number; workoutsCount: number; setsCount: number; overloadHits: number; totalExercises: number }> = {};

  if (props.workouts && props.workouts.length > 0) {
    // Process directly from LoggedWorkout objects
    const filtered = props.workouts.filter(w => {
      const d = getObjDate(w.date);
      return d.getTime() > 0 && (!cutoffDate || d >= cutoffDate);
    });

    filtered.forEach(w => {
      const d = getObjDate(w.date);
      let label = '';
      if (props.aggregation === 'monthly') {
        const year = d.getFullYear();
        const monthNum = d.getMonth() + 1;
        label = `${year}-${monthNum.toString().padStart(2, '0')}`;
      } else {
        const year = d.getFullYear();
        const onejan = new Date(year, 0, 1);
        const millis = d.getTime() - onejan.getTime();
        const week = Math.ceil((((millis / 86400000) + onejan.getDay() + 1) / 7));
        label = `${year}-W${week.toString().padStart(2, '0')}`;
      }

      if (!metricGroupData[label]) {
        metricGroupData[label] = { volume: 0, workoutsCount: 0, setsCount: 0, overloadHits: 0, totalExercises: 0 };
      }

      metricGroupData[label].workoutsCount += 1;

      if (w.performedExercises) {
        w.performedExercises.forEach(ex => {
          const isEligible = ex.enableProgression !== false && 
                             !(ex.sets && Array.isArray(ex.sets) && ex.sets.every((s: any) => s.isTimed === true));

          if (isEligible) {
            metricGroupData[label].totalExercises += 1;
            if (ex.isPR) {
              metricGroupData[label].overloadHits += 1;
            }
          }

          if (!ex.sets) return;
          const validSets = ex.sets.filter(s => s && s.status !== 'failed');
          metricGroupData[label].setsCount += validSets.length;

          validSets.forEach(s => {
            if (typeof s.actualWeight === 'number' && typeof s.actualReps === 'number') {
              metricGroupData[label].volume += (s.actualWeight * s.actualReps);
            }
          });
        });
      }
    });
  } else if (props.volumeIndex) {
    // Fallback to CalendarIndex
    const validDateKeys = Object.keys(props.volumeIndex).filter(k => k !== 'lastUpdated' && k !== 'version');
    let sortedKeys = validDateKeys.sort((a, b) => getObjDate(a).getTime() - getObjDate(b).getTime());

    if (cutoffDate) {
      sortedKeys = sortedKeys.filter(k => getObjDate(k) >= cutoffDate!);
    }

    sortedKeys.forEach(key => {
      const entry = props.volumeIndex[key];
      if (!entry || !entry.hasWorkout) return;

      const d = getObjDate(key);
      if (d.getTime() === 0) return;

      let label = '';
      if (props.aggregation === 'monthly') {
        const year = d.getFullYear();
        const monthNum = d.getMonth() + 1;
        label = `${year}-${monthNum.toString().padStart(2, '0')}`;
      } else {
        const year = d.getFullYear();
        const onejan = new Date(year, 0, 1);
        const millis = d.getTime() - onejan.getTime();
        const week = Math.ceil((((millis / 86400000) + onejan.getDay() + 1) / 7));
        label = `${year}-W${week.toString().padStart(2, '0')}`;
      }

      if (!metricGroupData[label]) {
        metricGroupData[label] = { volume: 0, workoutsCount: 0, setsCount: 0, overloadHits: 0, totalExercises: 0 };
      }

      metricGroupData[label].volume += entry.totalVolume || 0;
      metricGroupData[label].workoutsCount += 1;
      metricGroupData[label].setsCount += entry.totalSets || 0;
    });
  }

  const rawKeys = Object.keys(metricGroupData).sort();

  const displayLabels = rawKeys.map(l => {
    if (props.aggregation === 'monthly') {
      const [year, monthStr] = l.split('-');
      const monthIdx = parseInt(monthStr) - 1;
      const date = new Date(parseInt(year), monthIdx, 1);
      return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
    }
    return l;
  });

  const rawValues = rawKeys.map(key => {
    const item = metricGroupData[key];
    if (selectedMetric.value === 'workoutFrequency') return item.workoutsCount;
    if (selectedMetric.value === 'totalSets') return item.setsCount;
    if (selectedMetric.value === 'overloadRate') {
      return item.totalExercises > 0 ? Math.round((item.overloadHits / item.totalExercises) * 100) : 0;
    }
    return Math.round(item.volume);
  });

  // Calculate 3-Period Moving Average if enabled
  let finalValues = rawValues;
  if (useMovingAverage.value && rawValues.length > 0) {
    finalValues = rawValues.map((val, idx, arr) => {
      const start = Math.max(0, idx - 2);
      const window = arr.slice(start, idx + 1);
      const avg = window.reduce((sum, v) => sum + v, 0) / window.length;
      return Math.round(avg * 10) / 10;
    });
  }

  const metricLabel = getMetricLabel();

  return {
    labels: displayLabels,
    datasets: [
      {
        label: metricLabel,
        data: finalValues,
        borderColor: '#10b981',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0.01)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointRadius: 4,
        pointHoverRadius: 7
      }
    ]
  };
});

function getMetricLabel(): string {
  if (selectedMetric.value === 'workoutFrequency') return 'Workouts / Period';
  if (selectedMetric.value === 'totalSets') return 'Total Sets';
  if (selectedMetric.value === 'overloadRate') return 'Overload Rate (%)';
  return `Total Volume (${displayUnit(props.weightUnit)})`;
}

const chartOptions = computed<ChartOptions<'line'>>(() => {
  return {
    responsive: true,
    maintainAspectRatio: false,
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
            return ` ${context.parsed.y} ${getMetricLabel()}`;
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
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.08)'
        },
        ticks: {
          color: '#a0aec0',
          font: { size: 11, weight: 'bold' }
        },
        beginAtZero: true
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
  background-color: #10b981;
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

.canvas-wrapper {
  height: 280px;
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
