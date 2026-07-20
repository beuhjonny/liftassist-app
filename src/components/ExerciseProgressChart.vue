<template>
  <div class="chart-container">
    <div class="chart-controls-row">
      <div class="control-group">
        <label class="control-label">Metric</label>
        <select v-model="selectedMetric" class="chart-select">
          <option value="est1rm">Est. 1RM (Strength)</option>
          <option value="maxWeight">Top Weight Lifted</option>
          <option value="maxVolume">Session Volume</option>
          <option value="maxReps">Max Reps in Set</option>
        </select>
      </div>

      <div class="control-group">
        <label class="control-label">Time Range</label>
        <select v-model="timeRange" class="chart-select">
          <option value="1m">1 Month</option>
          <option value="3m">3 Months</option>
          <option value="6m">6 Months</option>
          <option value="1y">1 Year</option>
          <option value="all">All Time</option>
        </select>
      </div>
    </div>

    <div v-if="chartData.labels.length > 0" class="canvas-wrapper">
      <Line :data="chartData" :options="chartOptions" />
    </div>
    <div v-else class="no-data card-inset">
      <p>No logged data available for <strong>{{ exerciseName }}</strong> in selected timeframe.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
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
    exerciseName: string;
    workouts: LoggedWorkout[];
    weightUnit: 'lbs' | 'kg';
  }>(),
  {}
);

const selectedMetric = ref<'est1rm' | 'maxWeight' | 'maxVolume' | 'maxReps'>('est1rm');
const timeRange = ref<'1m' | '3m' | '6m' | '1y' | 'all'>('6m');

const calculate1RM = (weight: number, reps: number): number => {
  if (reps <= 0) return 0;
  if (reps === 1) return weight;
  // Brzycki Formula
  return weight * (36 / (37 - Math.min(reps, 30)));
};

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
  if (!props.exerciseName || !props.workouts) return { labels: [], datasets: [] };

  const now = new Date();
  let cutoffDate: Date | null = null;

  if (timeRange.value === '1m') {
    cutoffDate = new Date();
    cutoffDate.setMonth(now.getMonth() - 1);
  } else if (timeRange.value === '3m') {
    cutoffDate = new Date();
    cutoffDate.setMonth(now.getMonth() - 3);
  } else if (timeRange.value === '6m') {
    cutoffDate = new Date();
    cutoffDate.setMonth(now.getMonth() - 6);
  } else if (timeRange.value === '1y') {
    cutoffDate = new Date();
    cutoffDate.setFullYear(now.getFullYear() - 1);
  }

  // Filter & sort workouts
  const filtered = props.workouts
    .filter(w => {
      const d = getObjDate(w.date);
      return d.getTime() > 0 && (!cutoffDate || d >= cutoffDate);
    })
    .sort((a, b) => getObjDate(a.date).getTime() - getObjDate(b.date).getTime());

  const dataPoints: { label: string; value: number }[] = [];

  filtered.forEach(w => {
    if (!w.performedExercises) return;
    const ex = w.performedExercises.find(e => e.exerciseName.toLowerCase().trim() === props.exerciseName.toLowerCase().trim());
    if (!ex || !ex.sets || ex.sets.length === 0) return;

    let dayValue = 0;

    if (selectedMetric.value === 'est1rm') {
      ex.sets.forEach(s => {
        if (s && s.status !== 'failed' && s.actualWeight && s.actualReps) {
          const rm = calculate1RM(s.actualWeight, s.actualReps);
          if (rm > dayValue) dayValue = rm;
        }
      });
    } else if (selectedMetric.value === 'maxWeight') {
      ex.sets.forEach(s => {
        if (s && s.status !== 'failed' && s.actualWeight) {
          if (s.actualWeight > dayValue) dayValue = s.actualWeight;
        }
      });
    } else if (selectedMetric.value === 'maxVolume') {
      dayValue = ex.sets.reduce((sum, s) => {
        if (s && s.status !== 'failed' && s.actualWeight && s.actualReps) {
          return sum + (s.actualWeight * s.actualReps);
        }
        return sum;
      }, 0);
    } else if (selectedMetric.value === 'maxReps') {
      ex.sets.forEach(s => {
        if (s && s.status !== 'failed' && s.actualReps) {
          if (s.actualReps > dayValue) dayValue = s.actualReps;
        }
      });
    }

    if (dayValue > 0) {
      const d = getObjDate(w.date);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dataPoints.push({
        label,
        value: Math.round(dayValue)
      });
    }
  });

  return {
    labels: dataPoints.map(d => d.label),
    datasets: [
      {
        label: `${props.exerciseName} (${getMetricUnitLabel()})`,
        data: dataPoints.map(d => d.value),
        borderColor: '#007bff',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(0, 123, 255, 0.35)');
          gradient.addColorStop(1, 'rgba(0, 123, 255, 0.01)');
          return gradient;
        },
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#007bff',
        pointBorderColor: '#ffffff',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#007bff',
        pointRadius: 4,
        pointHoverRadius: 7
      }
    ]
  };
});

function getMetricUnitLabel(): string {
  if (selectedMetric.value === 'maxReps') return 'reps';
  return displayUnit(props.weightUnit);
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
        bodyColor: '#007bff',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context) => {
            const unit = getMetricUnitLabel();
            return ` ${context.parsed.y} ${unit}`;
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
        beginAtZero: false
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
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
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
