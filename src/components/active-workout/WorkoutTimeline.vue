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
          :title="formatSetInfo(set, index)"
          @click="toggleTooltip(index, set)"
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
import { displayUnit } from '@/utils/weight';

const props = defineProps<{
  timelineData: TimelineSetInfo[];
  workoutLog: LoggedSetData[];
  weightUnit?: 'lbs' | 'kg';
}>();

const activeTooltipIndex = ref<number | null>(null);
const tooltipText = ref('');

const completedSetsCount = props.workoutLog.length;

const getSetStatus = (index: number) => {
    if (index < props.workoutLog.length) {
        return props.workoutLog[index].status;
    }
    return null;
};

const formatSetInfo = (set: TimelineSetInfo, index: number): string => {
  const unit = displayUnit(props.weightUnit || 'lbs');
  const loggedSet = props.workoutLog[index];
  
  let setDetail = '';
  if (loggedSet) {
    const statusText = loggedSet.status === 'done' ? '✓ Logged' : '⚠️ Skipped';
    setDetail = `: ${loggedSet.actualReps} ${loggedSet.isTimed ? 'sec' : 'reps'} @ ${loggedSet.actualWeight} ${unit} (${statusText})`;
  } else if (typeof set.prescribedReps === 'number') {
    setDetail = `: ${set.prescribedReps} ${set.isTimed ? 'sec' : 'reps'} @ ${set.prescribedWeight ?? 0} ${unit}`;
  }

  const setTotal = set.targetSets ? ` of ${set.targetSets}` : '';
  return `${set.exerciseName} - Set ${set.setNumberWithinExercise}${setTotal}${setDetail}`;
};

const toggleTooltip = (index: number, set: TimelineSetInfo) => {
  if (activeTooltipIndex.value === index) {
    activeTooltipIndex.value = null;
    tooltipText.value = '';
  } else {
    activeTooltipIndex.value = index;
    tooltipText.value = formatSetInfo(set, index);
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
