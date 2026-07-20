import { ref, computed, onUnmounted } from 'vue';

export function useActiveWorkout() {
  const workoutPhase = ref<'overview' | 'activeSet' | 'resting' | 'complete'>('overview');
  
  // Timers
  const restCountdown = ref(0);
  const totalRestDuration = ref(90);
  const activeWorkoutSeconds = ref(0);
  const activeSetSeconds = ref(0);
  const holdSeconds = ref(0);
  const isHoldTimerRunning = ref(false);

  let restTimerId: any = null;
  let workoutTimerId: any = null;
  let activeSetTimerId: any = null;
  let holdTimerId: any = null;

  // Formatted timer displays
  const formattedRestTime = computed(() => {
    const mins = Math.floor(restCountdown.value / 60);
    const secs = restCountdown.value % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  });

  const activeWorkoutDuration = computed(() => {
    const hours = Math.floor(activeWorkoutSeconds.value / 3600);
    const mins = Math.floor((activeWorkoutSeconds.value % 3600) / 60);
    const secs = activeWorkoutSeconds.value % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  });

  const formattedActiveSetTime = computed(() => {
    const mins = Math.floor(activeSetSeconds.value / 60);
    const secs = activeSetSeconds.value % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  });

  const formattedHoldTime = computed(() => {
    return `${holdSeconds.value}s`;
  });

  const timerProgressPercentage = computed(() => {
    if (totalRestDuration.value <= 0) return 0;
    const elapsed = totalRestDuration.value - restCountdown.value;
    return Math.min(100, Math.max(0, (elapsed / totalRestDuration.value) * 100));
  });

  // Controls
  const startWorkoutTimer = () => {
    stopWorkoutTimer();
    workoutTimerId = setInterval(() => {
      activeWorkoutSeconds.value++;
    }, 1000);
  };

  const stopWorkoutTimer = () => {
    if (workoutTimerId) {
      clearInterval(workoutTimerId);
      workoutTimerId = null;
    }
  };

  const startRestTimer = (durationSeconds: number, onComplete?: () => void) => {
    stopRestTimer();
    totalRestDuration.value = durationSeconds;
    restCountdown.value = durationSeconds;
    workoutPhase.value = 'resting';

    restTimerId = setInterval(() => {
      if (restCountdown.value > 0) {
        restCountdown.value--;
      } else {
        stopRestTimer();
        if (onComplete) onComplete();
      }
    }, 1000);
  };

  const addRestTime = (seconds: number) => {
    restCountdown.value += seconds;
    totalRestDuration.value += seconds;
  };

  const stopRestTimer = () => {
    if (restTimerId) {
      clearInterval(restTimerId);
      restTimerId = null;
    }
  };

  const startActivitySetTimer = () => {
    stopActivitySetTimer();
    activeSetSeconds.value = 0;
    activeSetTimerId = setInterval(() => {
      activeSetSeconds.value++;
    }, 1000);
  };

  const stopActivitySetTimer = () => {
    if (activeSetTimerId) {
      clearInterval(activeSetTimerId);
      activeSetTimerId = null;
    }
  };

  const startHoldTimer = () => {
    stopHoldTimer();
    holdSeconds.value = 0;
    isHoldTimerRunning.value = true;
    holdTimerId = setInterval(() => {
      holdSeconds.value++;
    }, 1000);
  };

  const stopHoldTimer = () => {
    if (holdTimerId) {
      clearInterval(holdTimerId);
      holdTimerId = null;
    }
    isHoldTimerRunning.value = false;
  };

  onUnmounted(() => {
    stopWorkoutTimer();
    stopRestTimer();
    stopActivitySetTimer();
    stopHoldTimer();
  });

  return {
    workoutPhase,
    restCountdown,
    totalRestDuration,
    activeWorkoutSeconds,
    activeSetSeconds,
    holdSeconds,
    isHoldTimerRunning,
    formattedRestTime,
    activeWorkoutDuration,
    formattedActiveSetTime,
    formattedHoldTime,
    timerProgressPercentage,
    startWorkoutTimer,
    stopWorkoutTimer,
    startRestTimer,
    addRestTime,
    stopRestTimer,
    startActivitySetTimer,
    stopActivitySetTimer,
    startHoldTimer,
    stopHoldTimer,
  };
}
