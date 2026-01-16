<template>
  <div class="chart-container">
    <div class="chart-controls">
         <select v-model="selectedMetric" class="metric-select">
             <option value="est1rm">Est. 1RM (Strength)</option>
             <option value="maxVolume">Max Volume (Work)</option>
             <option value="maxWeight">Top Weight</option>
         </select>
    </div>
    <Line v-if="chartData.labels.length > 0" :data="chartData" :options="chartOptions" />
    <div v-else class="no-data">Select an exercise to view stats</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, TimeScale } from 'chart.js';
import type { LoggedWorkout } from '@/types';

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, TimeScale);

const props = defineProps<{
  exerciseName: string;
  workouts: LoggedWorkout[];
  weightUnit: 'lbs' | 'kg';
}>();

const selectedMetric = ref<'est1rm' | 'maxVolume' | 'maxWeight'>('est1rm');

const calculate1RM = (weight: number, reps: number) => {
    // Brzycki Formula
    if (reps === 0) return 0;
    if (reps === 1) return weight;
    return weight * (36 / (37 - reps));
};

const chartData = computed(() => {
  if (!props.exerciseName) return { labels: [], datasets: [] };

  const dataPoints: { date: string, value: number }[] = [];

  // Robust Date Parsing
  const getObjDate = (dateVal: any): Date => {
      if (dateVal && typeof dateVal.toDate === 'function') {
          return dateVal.toDate(); 
      }
      return new Date(dateVal);
  };

  // Sort workouts
  const sorted = [...props.workouts].sort((a,b) => getObjDate(a.date).getTime() - getObjDate(b.date).getTime());

  sorted.forEach(w => {
      if (!w.performedExercises) return;
      const ex = w.performedExercises.find(e => e.exerciseName === props.exerciseName);
      if (ex) {
          let dayBestValue = 0;
          
          ex.sets.forEach(s => {
             if (s.status !== 'done' || !s.actualWeight || !s.actualReps) return;
             
             let val = 0;
             if (selectedMetric.value === 'est1rm') {
                 val = calculate1RM(s.actualWeight, s.actualReps);
             } else if (selectedMetric.value === 'maxVolume') {
                 val = s.actualWeight * s.actualReps; 
             } else if (selectedMetric.value === 'maxWeight') {
                 val = s.actualWeight;
             }

             if (selectedMetric.value !== 'maxVolume') {
                if (val > dayBestValue) dayBestValue = val;
             }
          });

          if (selectedMetric.value === 'maxVolume') {
             // Calculate total session volume for this exercise
             dayBestValue = ex.sets.reduce((sum, s) => {
                 if (s.status === 'done' && s.actualWeight && s.actualReps) return sum + (s.actualWeight * s.actualReps);
                 return sum;
             }, 0);
          }

          if (dayBestValue > 0) {
              const d = getObjDate(w.date);
              dataPoints.push({
                  date: d.toLocaleDateString(),
                  value: Math.round(dayBestValue)
              });
          }
      }
  });

  return {
      labels: dataPoints.map(d => d.date),
      datasets: [
          {
              label: props.exerciseName,
              borderColor: '#007bff',
              backgroundColor: 'rgba(0, 123, 255, 0.1)',
              data: dataPoints.map(d => d.value),
              tension: 0.3,
              fill: true
          }
      ]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  layout: {
      padding: {
          bottom: 20,
          left: 10,
          right: 10
      }
  },
  scales: {
      y: {
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: { color: '#888' }
      },
      x: {
          grid: { display: false },
          ticks: { 
              color: '#888',
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 6
          }
      }
  }
};
</script>

<style scoped>
.chart-container {
  height: 300px;
  width: 100%;
  position: relative;
}
.chart-controls {
    margin-bottom: 10px;
    text-align: right;
}
.metric-select {
    background: var(--color-background-soft);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    padding: 5px;
    border-radius: 4px;
}
.no-data {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: var(--color-text);
    opacity: 0.6;
}
</style>
