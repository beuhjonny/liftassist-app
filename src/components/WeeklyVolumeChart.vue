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


ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale);

const props = withDefaults(
  defineProps<{
    volumeIndex: any; // CalendarIndexData loosely typed
    weightUnit: 'lbs' | 'kg';
    timeRange: string;
    aggregation?: 'weekly' | 'monthly';
  }>(),
  {
    aggregation: 'weekly'
  }
);

const chartData = computed(() => {
  const volumeByGroup: Record<string, number> = {};
  
  if (!props.volumeIndex) return { labels: [], datasets: [] };

  const validDateKeys = Object.keys(props.volumeIndex).filter(k => k !== 'lastUpdated' && k !== 'version');
  
  const getDateFromKey = (key: string): Date => {
      return new Date(key);
  };

  let sortedKeys = validDateKeys.sort((a,b) => getDateFromKey(a).getTime() - getDateFromKey(b).getTime());

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
      sortedKeys = sortedKeys.filter(k => getDateFromKey(k) >= cutoffDate!);
  }

  sortedKeys.forEach(key => {
    const entry = props.volumeIndex[key];
    if (!entry || !entry.hasWorkout) return;

    const d = getDateFromKey(key);
    if (isNaN(d.getTime())) return;

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

    const totalVol = entry.totalVolume || 0;
    volumeByGroup[label] = (volumeByGroup[label] || 0) + totalVol;
  });

  const rawLabels = Object.keys(volumeByGroup).sort();
  
  const displayLabels = rawLabels.map(l => {
    if (props.aggregation === 'monthly') {
      const [year, monthStr] = l.split('-');
      const monthIdx = parseInt(monthStr) - 1;
      const date = new Date(parseInt(year), monthIdx, 1);
      return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
    }
    return l;
  });

  return {
    labels: displayLabels,
    datasets: [
      {
        label: `${props.aggregation === 'monthly' ? 'Monthly' : 'Weekly'} Volume (${props.weightUnit})`,
        borderColor: '#007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
        data: rawLabels.map(l => volumeByGroup[l]),
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
