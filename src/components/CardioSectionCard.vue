<template>
  <div class="cardio-routines-section card" style="margin-top: 20px; text-align: left;">
    <div style="margin-bottom: 16px;">
      <h3 style="margin: 0; display: flex; align-items: center; gap: 8px; color: var(--color-card-heading);">
        🏃 Cardio
      </h3>
      <p style="margin: 4px 0 0 0; font-size: 0.85em; opacity: 0.8; color: var(--color-card-text);">
        Track runs, rides, swims, and cardio sessions.
      </p>
    </div>

    <div class="cardio-status-box card-inset" style="padding: 16px; background: var(--color-card-mute); border: 1px solid var(--color-card-border); border-radius: 10px; margin-bottom: 16px;">
      <!-- Cardio Streak Banner -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px dashed var(--color-card-border);">
        <span style="font-size: 0.88em; font-weight: 600; color: var(--color-card-heading); display: flex; align-items: center; gap: 6px;">
          🔥 Cardio Streak ({{ settings.cardioStreakMinPerWeek ?? 2 }}+/wk):
        </span>
        <span style="font-size: 0.9em; font-weight: 700; color: #FC4C02;">
          {{ cardioStreak.current }} {{ cardioStreak.current === 1 ? 'Week' : 'Weeks' }}
          <small style="opacity: 0.8; font-weight: normal; color: var(--color-card-text); margin-left: 4px;">(Best: {{ cardioStreak.best }} Wks)</small>
        </span>
      </div>

      <div style="font-size: 0.75em; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.7; color: var(--color-card-text); margin-bottom: 6px;">
        Last Cardio Session
      </div>
      <div v-if="lastCardioDisplay" style="font-size: 1.05em; font-weight: 600; color: var(--color-card-heading); display: flex; align-items: center; gap: 6px;">
        <span>{{ lastCardioDisplay.icon }}</span>
        <span>{{ lastCardioDisplay.text }}</span>
      </div>
      <div v-else style="font-size: 0.9em; opacity: 0.75; color: var(--color-card-text);">
        No recent cardio sessions logged yet.
      </div>
    </div>

    <button 
      @click="showLogCardioModal = true" 
      class="button-primary" 
      style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; font-weight: 600; font-size: 0.95em; width: 100%; box-sizing: border-box;"
    >
      🏃 Log Cardio Session
    </button>

    <!-- Manual Cardio Log Modal -->
    <LogCardioModal 
      v-if="showLogCardioModal" 
      @close="showLogCardioModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import useSettings from '@/composables/useSettings';
import useExternalActivities from '@/composables/useExternalActivities';
import LogCardioModal from '@/components/history/LogCardioModal.vue';

const { settings } = useSettings();
const { externalActivities } = useExternalActivities();
const showLogCardioModal = ref(false);

const cardioStreak = computed(() => {
  if (!externalActivities || externalActivities.length === 0) {
    return { current: 0, best: 0 };
  }

  const minCardioTarget = settings.value.cardioStreakMinPerWeek ?? 2;
  const activitiesByWeek = new Map<number, number>();

  const getWeekStart = (d: Date) => {
    const dt = new Date(d);
    const day = dt.getDay();
    const diff = dt.getDate() - day + (day === 0 ? -6 : 1);
    dt.setDate(diff);
    dt.setHours(0, 0, 0, 0);
    return dt.getTime();
  };

  externalActivities.forEach((act: any) => {
    if (act.date) {
      const rawDate = act.date;
      const cDate: Date = rawDate instanceof Date 
        ? rawDate 
        : (rawDate && typeof (rawDate as any).toDate === 'function') 
          ? (rawDate as any).toDate() 
          : new Date(rawDate as any);
      const weekStart = getWeekStart(cDate);
      activitiesByWeek.set(weekStart, (activitiesByWeek.get(weekStart) || 0) + 1);
    }
  });

  const now = new Date();
  const currentWeekStart = getWeekStart(now);
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

  // Active Streak
  let streak = 0;
  if ((activitiesByWeek.get(currentWeekStart) || 0) >= minCardioTarget) {
    streak++;
  }

  let checkWeek = currentWeekStart - oneWeekMs;
  while (true) {
    if ((activitiesByWeek.get(checkWeek) || 0) >= minCardioTarget) {
      streak++;
      checkWeek -= oneWeekMs;
    } else {
      break;
    }
  }

  // All-time Best Streak
  const weekTimestamps = Array.from(activitiesByWeek.keys()).sort((a, b) => a - b);
  let bestStreak = 0;
  let currentRun = 0;

  for (let i = 0; i < weekTimestamps.length; i++) {
    const week = weekTimestamps[i];
    const count = activitiesByWeek.get(week) || 0;
    if (count >= minCardioTarget) {
      if (i === 0 || week === weekTimestamps[i - 1] + oneWeekMs) {
        currentRun++;
      } else {
        currentRun = 1;
      }
      if (currentRun > bestStreak) bestStreak = currentRun;
    } else {
      currentRun = 0;
    }
  }

  return {
    current: streak,
    best: Math.max(streak, bestStreak)
  };
});

const lastCardioDisplay = computed(() => {
  if (!externalActivities || externalActivities.length === 0) return null;
  const last = externalActivities[0];
  if (!last) return null;

  const typeIcons: Record<string, string> = {
    Run: '🏃',
    Ride: '🚴',
    Swim: '🏊',
    Walk: '🚶',
    Hike: '🥾',
    Rowing: '🚣',
    Cardio: '⚡'
  };

  const icon = typeIcons[last.type] || '🏃';

  let distanceText = '';
  if (typeof last.distanceMiles === 'number' && last.distanceMiles > 0) {
    if (settings.value.cardioDistanceUnit === 'km') {
      const km = Math.round(last.distanceMiles * 1.60934 * 10) / 10;
      distanceText = `, ${km} km`;
    } else {
      const mi = Math.round(last.distanceMiles * 10) / 10;
      distanceText = `, ${mi} mi`;
    }
  }

  let durationText = '';
  if (typeof last.durationMinutes === 'number' && last.durationMinutes > 0) {
    durationText = `, ${last.durationMinutes} min`;
  }

  const name = last.name || last.type || 'Cardio';

  return {
    icon,
    text: `${name}${distanceText}${durationText}`
  };
});
</script>
