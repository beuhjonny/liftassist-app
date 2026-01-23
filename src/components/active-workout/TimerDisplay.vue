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
  font-size: 3.5em;
  font-weight: bold;
  margin: 20px 0;
  color: var(--color-primary, #007bff);
  text-align: center;
}

.timer-bar-container {
  width: 80%;
  max-width: 400px;
  height: 20px;
  background-color: var(--color-card-border);
  border-radius: 10px;
  margin: 0 auto 20px auto;
  overflow: hidden;
}

.timer-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary, #007bff), var(--color-primary-dark, #0056b3));
  border-radius: 10px;
  transition: width 1s linear;
  width: 100%;
}
</style>
