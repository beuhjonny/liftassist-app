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
  flex-wrap: wrap;
  gap: 6px; 
}
.progress-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--color-background-mute);
  display: inline-block;
  cursor: pointer; 
  position: relative; 
  transition: all 0.2s ease;
}

/* Connected Dots Logic (Supersets) */
.connected-dot {
    margin-right: -2px; /* Pull them closer */
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    width: 12px; /* Slightly oblong to look like a pill segment */
}
.connected-dot + .progress-dot {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
}
/* Ensure the last one in a chain keeps its right radius if it was just a dot */
.connected-dot + .progress-dot:not(.connected-dot) {
    border-radius: 0 50% 50% 0; /* Cap key */
    width: 12px;
    margin-left: -2px;
}
/* If a dot is connected, but the previous one wasn't (start of chain) */
/* This is hard to select with CSS alone without complex logic, 
   but the class logic in JS handles 'isConnectedToNext' on the left element. 
   So .connected-dot affects ITSELF. 
   The logic we implemented: 'isConnectedToNext' is true for A in A->B. 
   So A gets .connected-dot. B does not (unless B->C).
   
   Refined CSS for visual linking:
*/
.progress-dot.connected-dot {
    margin-right: -4px; /* Stronger overlap */
    z-index: 1;
}

.progress-dot:hover {
  transform: scale(1.2);
}
.progress-dot.completed-done {
  background-color: #4CAF50; 
}
.progress-dot.completed-failed {
  background-color: #F44336; 
}
.progress-dot.active {
  background-color: #2196F3; 
  transform: scale(1.3);
  box-shadow: 0 0 8px rgba(33, 150, 243, 0.6);
  z-index: 2;
}

/* Specific styling for active tooltip to show user touch feedback */
.progress-dot.tooltip-active {
    outline: 2px solid var(--color-text);
    outline-offset: 2px;
}

.progress-separator {
  width: 1px;
  height: 12px;
  background-color: var(--color-border);
  margin: 0 4px;
  opacity: 0.5;
}

.mobile-progress-tooltip {
    margin-top: 8px;
    padding: 6px 12px;
    background-color: var(--color-background-soft);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-size: 0.9em;
    color: var(--color-text);
    display: inline-block;
    animation: fadeIn 0.2s ease-out;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
