<template>
  <div class="home-view">
    <div v-if="!user" class="unauthenticated-view card">
      <div class="cta-container top-cta">
        <h1 class="welcome-title">
          <span class="brand-lift">LIFT</span> <span class="brand-logic">LOGIC</span>
        </h1>
        <p class="welcome-subtitle">Get Stronger Progressively.</p>
        <router-link to="/login" class="button-primary button-large">Sign In to Continue</router-link>
      </div>
      <ManifestoComponent />
      <div class="cta-container bottom-cta">
        <router-link to="/login" class="button-primary button-large">Sign In to Continue</router-link>
      </div>
    </div>

    <div v-if="user && activeProgram.id" class="authenticated-view">
      <AppHeader>
        <template #title><span class="brand-lift">LIFT</span> <span class="brand-logic">LOGIC</span></template>
      </AppHeader>

      <div class="home-body">
        <BaseModal :open="showDiscardDraftModal" title="Discard draft?" @close="cancelDiscardDraft">
          <p>Delete this unfinished workout? This cannot be undone.</p>
          <template #footer>
            <BaseButton variant="secondary" @click="cancelDiscardDraft">Cancel</BaseButton>
            <BaseButton variant="danger" @click="handleDiscardDraft">Delete forever</BaseButton>
          </template>
        </BaseModal>

        <div v-if="isProgramLoading" class="hero-skeleton card">
          <SkeletonLoader width="35%" height="0.9em" />
          <SkeletonLoader width="70%" height="2em" />
          <SkeletonLoader width="55%" height="0.9em" />
          <SkeletonLoader width="100%" height="52px" borderRadius="12px" />
        </div>

        <div v-else-if="programLoadingError" class="load-error" role="alert">Error loading program: {{ programLoadingError }}</div>

        <template v-else>
          <section v-if="activeDraft" class="next-hero is-draft">
            <div class="hero-rail" aria-hidden="true"></div>
            <span class="hero-eyebrow warn"><AlertTriangle :size="14" /> UNFINISHED WORKOUT</span>
            <h1 class="hero-day">{{ activeDraft.dayName }}</h1>
            <p class="hero-meta">{{ activeDraft.setsCount }} set{{ activeDraft.setsCount === 1 ? '' : 's' }} logged - pick up where you left off</p>
            <BaseButton class="hero-cta" size="lg" block @click="resumeDraftWorkout">
              Resume {{ activeDraft.dayName }}<template #trailing><ArrowRight :size="18" /></template>
            </BaseButton>
            <button type="button" class="hero-discard" @click="confirmDiscardDraft"><Trash2 :size="14" /> Discard draft</button>
          </section>

          <section v-else-if="heroDay" class="next-hero">
            <div class="hero-rail" aria-hidden="true"></div>
            <div class="hero-eyebrow-row">
              <span class="hero-eyebrow">{{ heroDay.lastCompletedThisDayDate ? 'NEXT WORKOUT' : 'START HERE' }}</span>
              <BaseBadge tone="neutral">{{ activeProgram.programName }}</BaseBadge>
            </div>
            <h1 class="hero-day">{{ heroDay.dayName }}</h1>
            <p class="hero-meta">
              <Dumbbell :size="14" /> {{ exerciseCount(heroDay) }} exercise{{ exerciseCount(heroDay) === 1 ? '' : 's' }}
              <template v-if="heroDay.lastCompletedThisDayDate"><span class="meta-dot">&middot;</span><History :size="14" /> last {{ formatDate(heroDay.lastCompletedThisDayDate) }}</template>
            </p>
            <BaseButton class="hero-cta" size="lg" block @click="startWorkout(heroDay)" :aria-label="`Start ${heroDay.dayName} workout`">
              Start {{ heroDay.dayName }}<template #trailing><ArrowRight :size="18" /></template>
            </BaseButton>
          </section>

          <ReadinessCard v-if="readiness" :readiness="readiness" />

          <section v-if="consistencyStats" class="consistency card">
            <div class="strip-head">
              <span class="strip-eyebrow"><Flame :size="14" /> THIS WEEK</span>
              <span v-if="consistencyStats.restPassArmed" class="rest-pass-chip" title="Earned by hitting last week. If a week slips, it covers you - automatically.">
                Rest pass ready
              </span>
            </div>
            <div class="strip-row">
              <div class="stat">
                <span class="stat-value">{{ consistencyStats.weeklyStreak }}</span>
                <span class="stat-label">week streak</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ consistencyStats.workoutsThisWeek }}/{{ consistencyStats.targetPerWeek }}</span>
                <span class="stat-label">sessions</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ consistencyStats.overloadRate }}%</span>
                <span class="stat-label">overload {{ consistencyStats.timeframeDays }}d</span>
              </div>
            </div>
            <!-- Settled rule: the strip earns its place only by ending in a verdict. -->
            <p class="strip-verdict" :class="weekVerdict.tone">{{ weekVerdict.line }}</p>
          </section>

          <section v-if="otherDays.length" class="day-list">
            <h2 class="list-eyebrow">{{ activeDraft ? 'CHOOSE ANOTHER DAY' : 'OTHER DAYS' }}</h2>
            <button v-for="day in otherDays" :key="day.id" type="button" class="day-row" @click="startWorkout(day)">
              <span class="day-dot" :style="{ background: colorForDay(day.order, day.color) }" aria-hidden="true"></span>
              <span class="day-info">
                <span class="day-name">{{ day.dayName }}</span>
                <span class="day-sub">{{ exerciseCount(day) }} exercises<template v-if="day.lastCompletedThisDayDate"> &middot; last {{ formatDate(day.lastCompletedThisDayDate) }}</template></span>
              </span>
              <BaseBadge v-if="day.isNextRecommended && !day.isLastDoneOverall" tone="accent">Next</BaseBadge>
              <BaseBadge v-else-if="day.isLastDoneOverall" tone="neutral"><Check :size="12" /> Done</BaseBadge>
              <BaseBadge v-else-if="settings?.enableSkipTracker !== false && day.skipIndicatorCount > 0" tone="warning"><AlertTriangle :size="12" /> {{ day.skipIndicatorCount }}</BaseBadge>
              <ChevronRight :size="18" class="day-chevron" />
            </button>
          </section>

          <p v-if="enhancedWorkoutDays.length === 0 && sortedWorkoutDays.length === 0" class="no-items-message">
            This routine has no workout days yet. <router-link :to="{ name: 'Routines' }">Add them in Routines.</router-link>
          </p>
        </template>
      </div>
    </div>

    <!-- Dedicated Cardio Box on Home (When enabled in settings) -->
    <CardioSectionCard v-if="user && settings?.showCardioOnHome === true" />

    <div v-if="!activeProgram.id && !isProgramLoading && !programLoadingError && user" class="no-program-message card setup-nudge">
      <h2 style="text-align: center;">Welcome, {{ user.displayName || 'Fitness Enthusiast' }}! 🏋️</h2>
      <div class="cta-container top-cta" style="margin-top: 20px;">
        <router-link to="/routines" class="button-primary button-large">✨ GET STARTED WITH A ROUTINE</router-link>
      </div>
      
      <ManifestoComponent />

      <div class="cta-container bottom-cta">
        <router-link to="/routines" class="button-primary button-large">CREATE A ROUTINE</router-link>
      </div>
    </div>

    <!-- About / Manifesto Modal Button (Reusable) -->
    <div v-if="user" class="about-section-wrapper">
        <AboutModal />
    </div>

    <div v-if="user && !activeProgram.id && isProgramLoading" class="loading-message">
        <p>Loading your program details...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import useAuth from '../composables/useAuth';
import useSettings from '../composables/useSettings';
import useTrainingProgram from '../composables/useTrainingProgram';
import useLoggedWorkouts from '../composables/useLoggedWorkouts';
import useExternalActivities from '../composables/useExternalActivities';
import { useRouter, useRoute } from 'vue-router';
import ManifestoComponent from '@/components/ManifestoComponent.vue';
import SkeletonLoader from '@/components/SkeletonLoader.vue';
import AboutModal from '@/components/AboutModal.vue';
import CardioSectionCard from '@/components/CardioSectionCard.vue';
import BaseButton from '@/components/base/BaseButton.vue';
import BaseBadge from '@/components/base/BaseBadge.vue';
import BaseModal from '@/components/base/BaseModal.vue';
import AppHeader from '@/components/base/AppHeader.vue';
import ReadinessCard from '@/components/ReadinessCard.vue';
import { colorForDay } from '@/design/dayPalette';
import { computeReadiness } from '@/utils/readiness';
import { computeRecentFailRate, computeWeeklyVolumeTrend } from '@/utils/trainingSignals';
import { detectDeload } from '@/utils/deload';
import { Dumbbell, History, ChevronRight, ArrowRight, AlertTriangle, Trash2, Check, Flame } from 'lucide-vue-next';
import type { WorkoutDay, EnhancedWorkoutDay, LoggedWorkout } from '@/types';

const { user } = useAuth();
const { settings } = useSettings();
const router = useRouter();
const route = useRoute();

const {
  isProgramLoading,
  programLoadingError,
  activeProgram,
  programWorkoutsHistory,
  isLoadingHistory,
  historyError,
  activeDraft,
  enhancedWorkoutDays,
  lastDoneDayOverallDisplay,
  nextRecommendedDayObject,
  nextRecommendedDayNameDisplay,
  sortedWorkoutDays,
  formatDate,
  deleteDraftWorkout
} = useTrainingProgram();

const { loggedWorkouts: allLoggedWorkouts } = useLoggedWorkouts();
const { externalActivities } = useExternalActivities();

// The hero centerpiece is the recommended next day (or the first day). The
// day list below demotes everything else and excludes the hero to avoid a
// duplicate CTA.
const heroDay = computed<EnhancedWorkoutDay | null>(() => {
  if (nextRecommendedDayObject.value) return nextRecommendedDayObject.value as EnhancedWorkoutDay;
  return (enhancedWorkoutDays.value[0] as EnhancedWorkoutDay) || null;
});
const otherDays = computed<EnhancedWorkoutDay[]>(() =>
  enhancedWorkoutDays.value.filter((d) => d.id !== heroDay.value?.id),
);
const exerciseCount = (day: EnhancedWorkoutDay | null): number => day?.exercises?.length ?? 0;

// Flagship: compose the readiness verdict from signals we already track.
const toDateSafe = (raw: unknown): Date => {
  const r = raw as { toDate?: () => Date; seconds?: number } | Date | string | number | null;
  if (!r) return new Date(0);
  if (r instanceof Date) return r;
  if (typeof (r as { toDate?: () => Date }).toDate === 'function') return (r as { toDate: () => Date }).toDate();
  if (typeof (r as { seconds?: number }).seconds === 'number') return new Date((r as { seconds: number }).seconds * 1000);
  const d = new Date(r as string | number);
  return isNaN(d.getTime()) ? new Date(0) : d;
};

// Flatten logged workouts into the pure-signal shape (date + set statuses).
const signalWorkouts = computed(() => {
  const list = (allLoggedWorkouts as unknown as LoggedWorkout[]) || [];
  return list.map((lw) => ({
    date: toDateSafe(lw.date),
    sets: (lw.performedExercises || []).flatMap((ex) => ex.sets || []),
  }));
});

// Deload check across every lift in the active program (streaks stamped by
// hydrateProgramWithProgress).
const deloadVerdict = computed(() =>
  detectDeload(
    activeProgram.workoutDays.flatMap((d) =>
      (d.exercises || []).map((ex) => ({
        exerciseName: ex.exerciseName,
        consecutiveFailedWorkoutsAtCurrentWeightAndReps: ex.currentFailStreak,
      })),
    ),
  ),
);

const readiness = computed(() => {
  const cs = consistencyStats.value;
  if (!cs) return null;
  const lastDate = lastDoneDayOverallDisplay.value?.date ?? null;
  const days = lastDate ? Math.floor((Date.now() - lastDate.getTime()) / 86400000) : null;
  return computeReadiness({
    daysSinceLastWorkout: days,
    weeklyStreak: cs.weeklyStreak,
    workoutsThisWeek: cs.workoutsThisWeek,
    targetPerWeek: cs.targetPerWeek,
    overloadRate: cs.overloadRate,
    recentFailRate: computeRecentFailRate(signalWorkouts.value),
    weeklyVolumeTrend: computeWeeklyVolumeTrend(signalWorkouts.value),
    deloadLine: deloadVerdict.value.line,
  });
});

// The week strip must end in a verdict (settled rule): on plan / target met /
// tight, judged against the sessions still possible this ISO week (Mon start).
const weekVerdict = computed(() => {
  const cs = consistencyStats.value;
  if (!cs) return { line: '', tone: 'ok' };
  const done = cs.workoutsThisWeek;
  const target = cs.targetPerWeek;
  if (target <= 0) return { line: `${done} session${done === 1 ? '' : 's'} this week.`, tone: 'ok' };
  if (done >= target) return { line: `${done} of ${target} - target met.`, tone: 'ok' };
  const day = new Date().getDay();
  const isoDay = day === 0 ? 7 : day;
  const slotsLeft = 7 - isoDay + 1; // today still counts
  const need = target - done;
  return need <= slotsLeft
    ? { line: `${done} of ${target} - on plan.`, tone: 'ok' }
    : { line: `${done} of ${target} - ${need} to go, week is tight.`, tone: 'warn' };
});

const consistencyStats = computed(() => {
  const historyList: LoggedWorkout[] = (allLoggedWorkouts && (allLoggedWorkouts as any).length > 0)
    ? (allLoggedWorkouts as LoggedWorkout[])
    : (Array.isArray(programWorkoutsHistory) ? (programWorkoutsHistory as LoggedWorkout[]) : ((programWorkoutsHistory as any)?.value || []));

  const minWorkoutsTarget = settings.value.streakMinWorkoutsPerWeek ?? 2;
  const includeCardio = settings.value.streakIncludeCardio === true;
  const timeframeDays = settings.value.overloadTimeframeDays ?? 14;

  if ((!historyList || historyList.length === 0) && (!includeCardio || !externalActivities || externalActivities.length === 0)) {
    return null;
  }

  const now = new Date();
  const getWeekStart = (d: Date) => {
    const dt = new Date(d);
    const day = dt.getDay();
    const diff = dt.getDate() - day + (day === 0 ? -6 : 1);
    dt.setDate(diff);
    dt.setHours(0, 0, 0, 0);
    return dt.getTime();
  };

  const currentWeekStart = getWeekStart(now);
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const timeframeMs = now.getTime() - (timeframeDays * 24 * 60 * 60 * 1000);

  const eventsByWeek = new Map<number, number>();
  let workoutsThisWeek = 0;
  let overloadHits = 0;
  let overloadTotalExercises = 0;

  const isExerciseEligibleForOverload = (ex: any): boolean => {
    if (!ex) return false;
    if (ex.enableProgression === false) return false;
    if (ex.sets && Array.isArray(ex.sets) && ex.sets.length > 0) {
      if (ex.sets.every((s: any) => s.isTimed === true)) return false;
    }
    if (activeProgram && activeProgram.workoutDays) {
      for (const day of activeProgram.workoutDays) {
        if (day.exercises) {
          const config = day.exercises.find(
            e => e.exerciseName && e.exerciseName.trim().toLowerCase() === ex.exerciseName?.trim().toLowerCase()
          );
          if (config) {
            if (config.enableProgression === false || config.isToFailure === true) return false;
          }
        }
      }
    }
    return true;
  };

  // Sort history ascending to accurately track exercise baselines
  const sortedHistory = [...historyList].sort((a: LoggedWorkout, b: LoggedWorkout) => {
    const parseD = (raw: any): number => {
      if (raw instanceof Date) return raw.getTime();
      if (raw && typeof raw.toDate === 'function') return raw.toDate().getTime();
      return new Date(raw || 0).getTime();
    };
    return parseD(a.date) - parseD(b.date);
  });

  const seenExercises = new Set<string>();

  // Process Lifting Workouts
  sortedHistory.forEach((w: LoggedWorkout) => {
    if (w.date) {
      const rawDate = w.date;
      const wDate: Date = rawDate instanceof Date 
        ? rawDate 
        : (rawDate && typeof (rawDate as any).toDate === 'function') 
          ? (rawDate as any).toDate() 
          : new Date(rawDate as any);

      const wTime = wDate.getTime();
      const weekStart = getWeekStart(wDate);
      eventsByWeek.set(weekStart, (eventsByWeek.get(weekStart) || 0) + 1);

      if (weekStart === currentWeekStart) {
        workoutsThisWeek++;
      }

      w.performedExercises?.forEach((ex: any) => {
        if (wTime >= timeframeMs && isExerciseEligibleForOverload(ex)) {
          overloadTotalExercises++;
          if (ex.isPR) {
            overloadHits++;
          }
        }
      });
    }
  });

  // Process Cardio Activities if enabled
  if (includeCardio && externalActivities && externalActivities.length > 0) {
    externalActivities.forEach((act: any) => {
      if (act.date) {
        const rawDate = act.date;
        const cDate: Date = rawDate instanceof Date 
          ? rawDate 
          : (rawDate && typeof (rawDate as any).toDate === 'function') 
            ? (rawDate as any).toDate() 
            : new Date(rawDate as any);
        const weekStart = getWeekStart(cDate);
        eventsByWeek.set(weekStart, (eventsByWeek.get(weekStart) || 0) + 1);

        if (weekStart === currentWeekStart) {
          workoutsThisWeek++;
        }
      }
    });
  }

  // Calculate Active Weekly Streak - with the REST PASS (streak-freeze,
  // masterplan 2.6). A single missed week does not break the streak when the
  // week before it met target: that met week banked one pass (cap 1 held),
  // and the pass covers the miss automatically. Two misses in a row still
  // break. Honest forgiveness, not a loophole.
  let streak = 0;
  let restPassUsed = false;
  if ((eventsByWeek.get(currentWeekStart) || 0) >= minWorkoutsTarget) {
    streak++;
  }

  let checkWeek = currentWeekStart - oneWeekMs;
  let justCovered = false;
  while (true) {
    const met = (eventsByWeek.get(checkWeek) || 0) >= minWorkoutsTarget;
    if (met) {
      streak++;
      justCovered = false;
      checkWeek -= oneWeekMs;
      continue;
    }
    const olderWeekMet = (eventsByWeek.get(checkWeek - oneWeekMs) || 0) >= minWorkoutsTarget;
    if (olderWeekMet && !justCovered) {
      // Pass consumes the miss; earned by the adjacent older met week.
      restPassUsed = true;
      justCovered = true;
      checkWeek -= oneWeekMs;
      continue;
    }
    break;
  }

  // A pass is banked ("armed") when the last completed week met its target.
  const restPassArmed = (eventsByWeek.get(currentWeekStart - oneWeekMs) || 0) >= minWorkoutsTarget;

  const overloadRate = overloadTotalExercises > 0 
    ? Math.round((overloadHits / overloadTotalExercises) * 100) 
    : 0;

  return {
    weeklyStreak: streak,
    workoutsThisWeek,
    targetPerWeek: minWorkoutsTarget,
    overloadHits,
    overloadTotalExercises,
    overloadRate,
    timeframeDays,
    restPassArmed,
    restPassUsed
  };
});

const showManifestoModal = ref(false);
const showDiscardDraftModal = ref(false);

const confirmDiscardDraft = () => {
    showDiscardDraftModal.value = true;
};

const cancelDiscardDraft = () => {
    showDiscardDraftModal.value = false;
};

const handleDiscardDraft = async () => {
    try {
      await deleteDraftWorkout();
      showDiscardDraftModal.value = false;
    } catch (e) {
      alert("Failed to delete draft: " + e);
    }
};

const resumeDraftWorkout = () => {
  if (!activeDraft.value) return;
  router.push({ 
    name: 'WorkoutActive', 
    params: { 
      programId: activeDraft.value.programId, 
      dayId: activeDraft.value.dayId 
    } 
  });
};

const startWorkout = (day: WorkoutDay | EnhancedWorkoutDay) => {
  if (!activeProgram.id || !day.id) {
    // We can't set programLoadingError from here directly as it's readonly from composable usually,
    // but ref is mutable.
    // Ideally we'd use a setter or just log it/alert.
    console.error("Cannot start workout: Program or Day ID is missing.");
    return;
  }
  router.push({ name: 'WorkoutActive', params: { programId: activeProgram.id, dayId: day.id } });
};

// PWA icon shortcut: /?action=start deep-links into the recommended session
// as soon as the program has loaded (one tap from the Home Screen to a live set).
const pendingShortcutStart = ref(route.query.action === 'start');
watch(
  [heroDay, pendingShortcutStart],
  ([day, pending]) => {
    if (pending && day && activeProgram.id) {
      pendingShortcutStart.value = false;
      router.replace({ query: {} });
      startWorkout(day);
    }
  },
  { immediate: false },
);

</script>

<style scoped>
/* Main layout and structure */
.home-view {
  padding: 10px;
  max-width: 700px;
  margin: 20px auto;
}
.card {
  background-color: var(--color-card-bg); padding: 20px 25px;
  border-radius: 8px;
  margin-bottom: 25px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  text-align: left;
  border: 1px solid var(--color-card-border);
  color: var(--color-card-text);
}

/* Unauthenticated View */
.unauthenticated-view.card {
  text-align: center; padding: 30px 25px;
}

@media (max-width: 600px) {
  .home-view {
    padding: 5px; /* Reduced from 10px */
    margin: 10px auto; /* Reduced margin */
  }
  .card {
    padding: 15px 15px; /* Reduced from 20px 25px */
    margin-bottom: 15px;
  }
  .unauthenticated-view.card {
    padding: 20px 15px;
  }
}
.welcome-title { 
  font-family: 'Montserrat', sans-serif;
  font-size: 2.8em; /* Slightly larger for impact */
  color: var(--color-card-heading); 
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: -1px;
}
.brand-lift {
  font-weight: 900; /* Extra Bold */
}
.brand-logic {
  font-weight: 400; /* Regular */
}
.welcome-subtitle { font-size: 1.1em; color: var(--color-card-text); margin-bottom: 25px; }
.cta-container { margin: 25px 0; text-align: center; }
.cta-container.top-cta { margin-bottom: 30px; }
.cta-container.bottom-cta { margin-top: 30px; }
.button-large { padding: 15px 30px; font-size: 1.1em; font-weight: bold; }

/* Authenticated View */
.authenticated-view h1 { text-align: center; margin-bottom: 20px; color: var(--color-heading); font-family: 'Montserrat', sans-serif; font-weight: 400; }
.active-program-display h2 {
  margin-top: 0; color: var(--color-card-heading); font-size: 1.8em; margin-bottom: 8px;
}
.routine-description {
  margin-top: 0; margin-bottom: 20px; color: var(--color-card-text); font-style: italic;
}

/* Program Insights Section - REFINED STYLES */
.program-insights {
  background-color: var(--color-card-mute);
  padding: 10px 15px; /* Reduced padding */
  border-radius: 6px;
  margin-bottom: 15px; /* Reduced space before H3 */
  border: 1px solid var(--color-card-border);
  text-align: left;
}
.insight-item {
  margin: 4px 0; /* Reduced vertical margin */
  font-size: 0.95em; /* Slightly smaller font */
  line-height: 1.5; /* Adjusted line height */
  color: var(--color-card-text);
}
.insight-label {
  font-weight: 600; /* Can be 'bold' if preferred */
  color: var(--color-card-text);
  margin-right: 5px;
}
.insight-value {
  color: inherit; /* Solves empty ruleset, inherits color unless overridden */
}
.insight-value.next-up-highlight {
  font-weight: bold;
  color: #007bff;
}
.insight-date {
  font-size: 0.9em; /* Relative to .insight-item */
  color: var(--color-card-text);
  opacity: 0.8;
  margin-left: 3px;
}
.clickable-next-up-text {
  background: none; border: none; padding: 0; margin: 0;
  display: inline; cursor: pointer; font-family: inherit;
  font-size: inherit; line-height: inherit;
  text-decoration: none; vertical-align: baseline;
  /* color and font-weight inherited from .insight-value.next-up-highlight */
}
.clickable-next-up-text:hover,
.clickable-next-up-text:focus {
  text-decoration: underline;
  color: #0056b3;
  outline: none;
}

/* Workout Day Selection */
.active-program-display h3 { /* "Choose a Workout to Start:" */
  margin-top: 15px; /* Reduced from 25px */
  margin-bottom: 15px;
  color: var(--color-card-text);
  font-size: 1.4em;
}
.workout-day-selection { display: flex; flex-direction: column; gap: 15px; }
.button-workout-day {
  padding: 15px 20px; background-color: #007bff; color: white;
  border: none; border-radius: 6px; cursor: pointer; font-size: 1.1em;
  text-align: center; transition: background-color 0.2s ease-in-out, transform 0.1s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1); position: relative;
  display: flex; justify-content: center; align-items: center; gap: 10px;
}
.button-workout-day:hover { background-color: #0056b3; transform: translateY(-2px); }
.button-workout-day:active { transform: translateY(0px); }

.button-workout-day.is-recommended {
  border: 2px solid #28a745; background-color: #e9f5ec; color: #155724;
}
.button-workout-day.is-recommended:hover { background-color: #d4edda; }
.button-workout-day.is-last-done {
  background-color: #6c757d; color: white; opacity: 0.85;
}
.button-workout-day.is-last-done:hover { background-color: #5a6268; }

.status-badge {
  font-size: 0.75em; padding: 3px 7px; border-radius: 10px;
  font-weight: bold; line-height: 1; vertical-align: middle; white-space: nowrap;
}
.recommended-badge { background-color: #28a745; color: white;}
.last-done-badge { background-color: #adb5bd; color: #212529; }
.skipped-badge { background-color: #ffc107; color: #333; }

/* General Messages & Buttons */
.no-program-message { padding: 40px 30px; text-align: center; }
.no-program-message h2 { margin-top:0; margin-bottom: 20px; color: var(--color-card-heading); }
.no-program-message p { margin-bottom: 30px; font-size: 1.1em; opacity: 0.9; }
.setup-actions { margin-top: 20px; }
.button-primary {
  padding: 12px 20px; background-color: #007bff; color: white;
  border: none; border-radius: 4px; cursor: pointer; font-size: 1rem;
  text-decoration: none; display: inline-block; transition: background-color 0.2s, transform 0.1s;
}
.button-primary:hover:not(:disabled) { background-color: #0056b3; transform: translateY(-1px); }
.button-primary:active { transform: translateY(0px); }
.loading-message { color: var(--color-card-text); padding: 20px; text-align: center; }
.loading-message.small-loading p { font-size: 0.9em; padding: 10px 0 0 0; }
.no-items-message { color: var(--color-card-text); padding: 20px; text-align: center; }
.error-message {
  color: #dc3545; background-color: #f8d7da; border: 1px solid #f5c6cb;
  padding: 10px 15px; border-radius: 4px; margin-top: 15px; margin-bottom: 15px;
  text-align: left;
}

/* About/Manifesto */
.about-section-logged-in { text-align: center; margin-top: 30px; padding-bottom: 10px; }
.button-about {
  background-color: transparent; color: #007bff; border: 1px solid transparent;
  padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 0.95em;
  text-decoration: none; display: inline-flex; align-items: center; gap: 6px;
  transition: color 0.2s, background-color 0.2s;
}
.button-about:hover { color: #0056b3; text-decoration: underline; }
.info-icon { font-size: 1.2em; font-weight: bold; }
.manifesto-modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.6); display: flex; justify-content: center;
  align-items: center; z-index: 1000; padding: 20px; box-sizing: border-box;
}
.manifesto-modal-content.card {
  max-width: 700px; width: 100%; max-height: 85vh; overflow-y: auto;
  position: relative; padding: 25px; padding-top: 45px; text-align: left;
  background-color: var(--color-card-bg);
  color: var(--color-card-text);
}
.modal-close-button {
  position: absolute; top: 10px; right: 15px; background: none; border: none;
  font-size: 2em; color: var(--color-card-text); opacity: 0.6; cursor: pointer; line-height: 1; padding: 5px;
}
.modal-close-button:hover { color: var(--color-card-text); opacity: 1; }


.skeleton-text-gap {
  margin-bottom: 25px;
}
.skeleton-button {
  height: 56px; /* Match approximate height of real buttons */
  width: 100%;
}
</style>
<style scoped>
/* ---- Redesigned authenticated Home (design system) ---- */
.home-body {
  max-width: 640px;
  margin-inline: auto;
  padding: var(--space-5) var(--space-4) var(--space-7);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}
@media (max-width: 600px) { .home-body { padding-inline: var(--space-3); } }

.next-hero {
  position: relative;
  overflow: hidden;
  background: var(--surface-raised);
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-2), var(--edge-highlight);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.hero-rail {
  position: absolute;
  top: 0; left: 0; bottom: 0;
  width: 3px;
  background: var(--color-accent);
}
.is-draft .hero-rail { background: var(--color-warning-fg); }

.hero-eyebrow-row { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); }
.hero-eyebrow {
  display: inline-flex; align-items: center; gap: var(--space-1);
  font-size: var(--text-xs); font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-wider); text-transform: uppercase;
  color: var(--text-tertiary);
}
.hero-eyebrow.warn { color: var(--color-warning-fg); }

.hero-day {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: var(--weight-black);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  /* Card-scoped heading: page-level --color-heading is LIGHT in the 'original'
     theme and rendered the day name invisible on the white card. */
  color: var(--color-card-heading);
  margin: 0;
}
.hero-meta {
  display: flex; align-items: center; gap: var(--space-2);
  flex-wrap: wrap;
  font-size: var(--text-sm);
  color: var(--color-card-text);
  margin: 0;
}
.hero-meta svg { opacity: 0.7; }
.meta-dot { opacity: 0.5; }
.hero-cta { margin-top: var(--space-2); }
.hero-discard {
  align-self: flex-end;
  display: inline-flex; align-items: center; gap: var(--space-1);
  min-height: var(--tap-min);
  background: none; border: none; cursor: pointer;
  color: var(--color-danger-fg); font-size: var(--text-sm); font-weight: var(--weight-medium);
}

/* Consistency strip */
.consistency {
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-1), var(--edge-highlight);
  padding: var(--space-4);
  display: flex; flex-direction: column; gap: var(--space-3);
}
.strip-eyebrow {
  display: inline-flex; align-items: center; gap: var(--space-1);
  font-size: var(--text-xs); font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-wider); text-transform: uppercase;
  color: var(--text-tertiary);
}
.strip-row { display: flex; align-items: stretch; }
.stat {
  flex: 1; display: flex; flex-direction: column; gap: 2px;
  padding-inline: var(--space-3);
}
.stat + .stat { border-left: 1px solid var(--color-hairline); }
.stat:first-child { padding-left: 0; }
.stat-value {
  font-size: var(--text-xl); font-weight: var(--weight-bold);
  color: var(--color-heading); font-variant-numeric: tabular-nums; line-height: 1;
}
.stat-label { font-size: var(--text-xs); color: var(--text-tertiary); }
.strip-verdict {
  margin: var(--space-3) 0 0;
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--color-card-text);
}
.strip-verdict.warn { color: var(--color-warning-fg); }
.strip-head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); }
.rest-pass-chip {
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
  background: var(--color-success-bg);
  border: 1px solid var(--color-success-line);
  color: var(--color-success-fg);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  white-space: nowrap;
}

/* Day list */
.day-list { display: flex; flex-direction: column; gap: var(--space-2); }
.list-eyebrow {
  font-size: var(--text-xs); font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-wider); text-transform: uppercase;
  color: var(--text-tertiary); margin: 0 0 var(--space-1);
}
.day-row {
  display: flex; align-items: center; gap: var(--space-3);
  width: 100%; text-align: left;
  min-height: 56px; padding: var(--space-3) var(--space-4);
  background: var(--surface-sunken);
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: border-color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard);
}
.day-row:active { transform: scale(0.995); }
@media (hover: hover) { .day-row:hover { border-color: var(--color-accent-line); } }
.day-dot { width: 12px; height: 12px; border-radius: var(--radius-full); flex-shrink: 0; }
.day-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.day-name { font-size: var(--text-base); font-weight: var(--weight-semibold); color: var(--color-card-heading); }
.day-sub { font-size: var(--text-xs); color: var(--text-tertiary); }
.day-chevron { color: var(--text-tertiary); flex-shrink: 0; }

.hero-skeleton {
  display: flex; flex-direction: column; gap: var(--space-3);
  padding: var(--space-5); border-radius: var(--radius-lg);
}
.load-error {
  background: var(--color-danger-bg); color: var(--color-danger-fg);
  border: 1px solid var(--color-danger-line);
  padding: var(--space-3) var(--space-4); border-radius: var(--radius-md);
  font-size: var(--text-sm);
}
.no-items-message { color: var(--text-secondary); font-size: var(--text-sm); }
</style>
