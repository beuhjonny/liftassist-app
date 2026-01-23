<template>
  <div class="timer-display-container">
    <div class="timer-display">{{ timeText }}</div>
    <div class="timer-bar-container">
      <div class="timer-bar" :style="{ width: progress + '%' }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  timeText: string;
  progress: number;
}>();
</script>

<style scoped>
.timer-display {
  font-size: 3.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 10px 0;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
  letter-spacing: -1px;
}

.timer-bar-container {
  width: 100%;
  height: 12px;
  background-color: var(--color-background-mute);
  border-radius: 6px;
  overflow: hidden;
  margin-top: 10px;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
}

.timer-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  transition: width 1s linear;
}
</style>
