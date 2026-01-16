<template>
  <div class="chart-container">
    <Line v-if="chartData.labels.length > 0" :data="chartData" :options="chartOptions" />
    <div v-else class="no-data">Not enough data for chart</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale } from 'chart.js';
import type { LoggedWorkout } from '@/types';

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale);

const props = defineProps<{
  workouts: LoggedWorkout[];
  weightUnit: 'lbs' | 'kg';
  timeRange: string;
}>();

const chartData = computed(() => {
  const volumeByWeek: Record<string, number> = {};
  
  // Robust Date Parsing
  const getObjDate = (dateVal: any): Date => {
      if (dateVal && typeof dateVal.toDate === 'function') {
          return dateVal.toDate(); 
      }
      return new Date(dateVal);
  };

  let sorted = [...props.workouts].sort((a,b) => getObjDate(a.date).getTime() - getObjDate(b.date).getTime());

  // Filter by Time Range
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

  if (cutoffDate) {
      sorted = sorted.filter(w => getObjDate(w.date) >= cutoffDate);
  }

  sorted.forEach(w => {
    const d = getObjDate(w.date);
    if (isNaN(d.getTime())) return;

    const year = d.getFullYear();
    const onejan = new Date(year, 0, 1);
    const millis = d.getTime() - onejan.getTime();
    const week = Math.ceil((((millis / 86400000) + onejan.getDay() + 1) / 7));
    const label = `${year}-W${week.toString().padStart(2, '0')}`;

    let totalVol = 0;
    if (w.performedExercises) {
       w.performedExercises.forEach(ex => {
         ex.sets.forEach(s => {
            if (s.status === 'done' && s.actualWeight && s.actualReps) {
                totalVol += (s.actualWeight * s.actualReps);
            }
         });
       });
    }

    volumeByWeek[label] = (volumeByWeek[label] || 0) + totalVol;
  });

  const labels = Object.keys(volumeByWeek).sort();

  return {
    labels: labels,
    datasets: [
      {
        label: `Weekly Volume (${props.weightUnit})`,
        borderColor: '#007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
        data: labels.map(l => volumeByWeek[l]),
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
       callbacks: {
          label: (context: any) => `${parseInt(context.raw).toLocaleString()} ${props.weightUnit}`
       }
    }
  },
  layout: {
      padding: {
          bottom: 0,
          left: 10,
          right: 10
      }
  },
  scales: {
      y: {
          beginAtZero: true,
          grid: {
              color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: { color: '#888' }
      },
      x: {
          grid: { display: false }, 
          ticks: { 
              color: '#888',
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 8
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
  display: flex;
  flex-direction: column;
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
