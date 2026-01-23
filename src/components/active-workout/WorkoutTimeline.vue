<template>
  <div class="workout-progress-indicator">
    <div class="workout-progress-timeline">
      <template v-for="(set, index) in timelineData" :key="`progress-${index}`">
        <span
          class="progress-dot"
          :class="{
            'completed-done': index < completedSetsCount && getSetStatus(index) === 'done',
            'completed-failed': index < completedSetsCount && getSetStatus(index) === 'failed',
            'active': index === completedSetsCount, 
            'tooltip-active': activeTooltipIndex === index,
            'connected-dot': set.isConnectedToNext
          }"
          :title="`${set.exerciseName} - Set ${set.setNumberWithinExercise}`"
          @click="toggleTooltip(index, `${set.exerciseName} - Set ${set.setNumberWithinExercise}`)"
        ></span>
        <span
          v-if="index < timelineData.length - 1 && set.separatorGroupIndex !== timelineData[index + 1].separatorGroupIndex"
          class="progress-separator"
        ></span>
      </template>
    </div>
    <div v-if="activeTooltipIndex !== null" class="mobile-progress-tooltip">
      {{ tooltipText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { TimelineSetInfo, LoggedSetData } from '@/types';

const props = defineProps<{
  timelineData: TimelineSetInfo[];
  workoutLog: LoggedSetData[];
}>();

const activeTooltipIndex = ref<number | null>(null);
const tooltipText = ref('');

// Computed based on log length
const completedSetsCount = props.workoutLog.length; // Actually simpler, we can just use length directly in template but consistency is nice

const getSetStatus = (index: number) => {
    if (index < props.workoutLog.length) {
        return props.workoutLog[index].status;
    }
    return null;
}

const toggleTooltip = (index: number, text: string) => {
  if (activeTooltipIndex.value === index) {
    activeTooltipIndex.value = null;
    tooltipText.value = '';
  } else {
    activeTooltipIndex.value = index;
    tooltipText.value = text;
  }
};
</script>

<style scoped>
/* Scoped styles extracted from WorkoutActive.vue */

.workout-progress-indicator {
  margin-bottom: 20px;
  text-align: center;
}
.workout-progress-timeline {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px; /* Original gap */
  flex-wrap: wrap; 
  padding: 5px 0;
}

.progress-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--color-card-border); /* Correct original color */
  transition: background-color 0.3s ease, transform 0.2s ease;
  cursor: pointer;
  position: relative;
}

.progress-dot.completed-done {
  background-color: var(--color-success, #28a745); 
}
.progress-dot.completed-failed {
  background-color: var(--color-warning, #ffc107);
}
.progress-dot.active {
  background-color: var(--color-primary, #007bff);
  transform: scale(1.3);
  z-index: 2;
  box-shadow: none; /* Original didn't have shadow in active state, adding none to be safe or just omit */
}
.progress-dot.tooltip-active {
  outline: 2px solid var(--color-primary, #007bff);
  outline-offset: 1px;
  transform: scale(1.3);
}
.progress-dot[title]:hover {
  outline: 2px solid var(--color-primary, #007bff);
  transform: scale(1.2);
}

.progress-dot.connected-dot {
  margin-right: -2px;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  width: 12px;
}
.progress-dot.connected-dot + .progress-dot {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
.progress-dot.connected-dot + .progress-dot:not(.connected-dot) {
    border-radius: 0 50% 50% 0;
    width: 12px;
    margin-left: -2px;
}
.progress-dot.connected-dot {
    margin-right: -2px; 
    z-index: 1;
}

.progress-separator {
  width: 6px;
  height: 10px;
  background-color: #bbb;
  margin: 0 3px;
  border-radius: 2px;
  align-self: center;
}

.mobile-progress-tooltip {
  display: inline-block; 
  background-color: #333;
  color: white;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 0.85em;
  margin-top: 10px;
  max-width: 90%;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
