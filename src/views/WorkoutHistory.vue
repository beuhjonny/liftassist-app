<template>
  <div class="history-view">
    <h1>Training Progress</h1>

    <div class="calendar-heatmap-container" v-if="calendarWeeks.length > 0" @click.self="hideTooltip" ref="calendarRef">
      <div class="calendar-grid">
        <div class="day-labels">
          <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
        </div>
        <div class="calendar-main-area">
          <div class="calendar-week" v-for="(week, weekIndex) in calendarWeeks" :key="weekIndex">
            <div
              class="calendar-day-cell"
              v-for="(day, dayIndex) in week"
              :key="dayIndex"
              :class="{
                'workout-day-presence': day.isWorkoutDay && !day.isFuture,
                'external-activity-presence': day.isExternalActivity && !day.isFuture,
                'future-day': day.isFuture,
                'placeholder-day': day.isPlaceholder,
                'today': day.date.toDateString() === new Date().toDateString() && !day.isFuture && !day.isPlaceholder
              }"
              :style="getDayCellStyle(day)"
              @click.stop="handleDayCellClick(day, $event)"
            >
            </div>
          </div>
        </div>
      </div>

      <!-- Heatmap Legend -->
      <div class="calendar-legend">
        <!-- Render each workout day in the active program -->
        <template v-if="activeProgram.workoutDays && activeProgram.workoutDays.length > 0">
          <div class="legend-item" v-for="day in activeProgram.workoutDays" :key="day.id">
            <span class="legend-color-box" :style="{ backgroundColor: day.color || daySequenceColorPalette[(day.order - 1) % daySequenceColorPalette.length] || '#10B981' }"></span>
            <span>{{ day.dayName }}</span>
          </div>
        </template>
        <!-- Fallback if no active program is set up yet -->
        <template v-else>
          <div class="legend-item">
            <span class="legend-color-box weights"></span>
            <span>Weights</span>
          </div>
        </template>

        <!-- Cardio (Strava) -->
        <div class="legend-item">
          <span class="legend-color-box cardio"></span>
          <span>Cardio</span>
        </div>
      </div>

      <div v-if="activeTooltip"
           class="calendar-tooltip"
           :style="tooltipStyle">
        {{ activeTooltip.text }} - {{ activeTooltip.date }}
      </div>
      </div>


    <!-- Analytics Section -->
    <div v-if="!isLoading && loggedWorkouts.length > 0" class="analytics-dashboard">
        
        <div class="chart-section card">
            <div class="chart-header-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; flex-wrap: wrap; gap: 10px;">
                <h3 style="margin:0; line-height:1.2;">Volume Trend</h3>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <select v-model="volumeAggregation" class="history-select" style="max-width: 100px;">
                         <option value="weekly">Weekly</option>
                         <option value="monthly">Monthly</option>
                    </select>
                    <select v-model="weeklyVolumeTimeRange" class="history-select" style="max-width: 120px;">
                         <option value="12w">Last 12 Weeks</option>
                         <option value="6m">Last 6 Months</option>
                         <option value="1y">Last Year</option>
                         <option value="all">All Time</option>
                    </select>
                </div>
            </div>
            <WeeklyVolumeChart 
                :volumeIndex="calendarIndex" 
                :weightUnit="settings?.weightUnit || 'lbs'" 
                :timeRange="weeklyVolumeTimeRange" 
                :aggregation="volumeAggregation"
            />
        </div>

        <div class="chart-section card">
             <div class="chart-header-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                 <h3 style="margin:0;">Exercise Trends</h3>
                 <select v-model="selectedExerciseForGraph" class="history-select" style="max-width: 200px; min-width: 150px;">
                     <option value="">Select Exercise</option>
                     <option v-for="ex in uniqueExercises" :key="ex" :value="ex">{{ ex }}</option>
                 </select>
             </div>
             <ExerciseProgressChart 
                 v-if="selectedExerciseForGraph" 
                 :exerciseName="selectedExerciseForGraph" 
                 :workouts="loggedWorkouts" 
                 :weightUnit="settings?.weightUnit || 'lbs'"
             />
             <div v-else class="placeholder-text" style="text-align:center; padding: 40px; color: var(--color-card-text); opacity: 0.6;">
                 Select an exercise to view 1RM & Volume trends.
             </div>
        </div>
    </div>

    <div v-if="isLoading && loggedWorkouts.length === 0" class="loading-message">
      <p>Loading workout history...</p>
    </div>
    <div v-if="error && !isLoading" class="error-message card">
      <p>Error: {{ error }}</p>
    </div>

    <div v-if="!isLoading && !error && user && loggedWorkouts.length === 0" class="no-history card">
      <p>No workouts logged yet. Go crush a session!</p>
      <router-link to="/" class="button-primary">Start a Workout</router-link>
    </div>

    <div v-if="!isLoading && !error && user && loggedWorkouts.length > 0" class="history-list">
      <h3 style="margin: 30px 0 20px 0; font-size: 1.5em; border-bottom: 1px solid var(--color-border); padding-bottom: 10px; color: var(--color-heading);">Recent Logs</h3>
      <div v-for="workout in loggedWorkouts" :key="workout.id" class="history-item-card">
        <div class="history-item-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h2>{{ workout.workoutDayNameUsed || 'Workout Session' }}</h2>
            <p class="workout-date">
              {{ formatWorkoutDate(workout.date) }}
            </p>
            <p v-if="workout.trainingProgramNameUsed" class="program-name">
              Routine: {{ workout.trainingProgramNameUsed }}
            </p>
          </div>
          <button @click.stop.prevent="openEditModal(workout)" class="icon-button edit-btn" title="Edit Workout" style="background: none; border: none; font-size: 1.2em; cursor: pointer; padding: 4px; border-radius: 6px;">✏️</button>
        </div>

        <div class="workout-summary card-inset">
          <h4>Session Summary:</h4>
          <p><strong>Workout Time:</strong> {{ formatDuration(workout.durationMinutes) }}</p>
          <p><strong>Total Volume:</strong> {{ calculateTotalVolume(workout.performedExercises).toLocaleString() }} {{ displayUnit(settings.weightUnit) }}</p>
          <p><strong>Total Sets:</strong> {{ getConsolidatedSetsInfo(workout.performedExercises) }}</p>

          <div class="exercise-breakdown-header" v-if="workout.performedExercises && workout.performedExercises.length > 0">
            <h5>Exercise Breakdown:</h5>
            <button @click="toggleAllDetailsForWorkout(workout.id)" class="button-link">
              {{ allDetailsExpandedForWorkout[workout.id] ? 'Hide Set Details' : 'Show Set Details' }}
            </button>
          </div>

          <ul class="exercise-summary-list" v-if="workout.performedExercises && workout.performedExercises.length > 0">
            <li v-for="ex in workout.performedExercises" :key="ex.exerciseId || ex.exerciseName">
              <strong>{{ ex.exerciseName }}</strong>
              <span v-if="ex.isPR" title="Personal Record!"> 🏅</span>
              <span>: {{ getExerciseStatusForHistory(ex) }}{{ getExerciseLineSuffix(ex) }}</span>
              
              <ul v-if="allDetailsExpandedForWorkout[workout.id] && ex.sets && ex.sets.length > 0" class="set-details-list">
                <li v-for="(set, setIndex) in ex.sets" :key="setIndex">
                  Set {{ set.setNumber }}: {{ toDisplay(set.actualWeight, settings.weightUnit) }} {{ displayUnit(settings.weightUnit) }} x {{ set.actualReps }} {{ set.isTimed ? 'sec' : 'reps' }} ({{set.status}})
                </li>
              </ul>
            </li>
          </ul>

          <div v-if="workout.overallSessionNotes" class="session-notes-history">
            <strong>Overall Session Notes:</strong>
            <p>{{ workout.overallSessionNotes }}</p>
          </div>
        </div>
      </div>

      
      <button v-if="hasMoreDocs" @click="fetchMoreWorkouts" class="button-secondary full-width" style="margin-top: 10px;">
        <span v-if="isLoading">Loading...</span>
        <span v-else>Load Older Workouts</span>
      </button>

      <div class="maintenance-actions" style="margin-top: 40px; padding: 20px; text-align: center; opacity: 0.7; font-size: 0.85em; border-top: 1px dashed var(--color-border);">
        <p>Missing workouts in the calendar? 
          <button @click="fetchCalendarIndex(true)" class="button-link" :disabled="isIndexLoading" style="font-size: 1em; text-decoration: underline;">
            {{ isIndexLoading ? 'Rebuilding...' : 'Repair Calendar Index' }}
          </button>
        </p>
      </div>
    </div>

    <div v-if="!user && !isLoading" class="login-prompt">
      <p>Please <router-link to="/login">log in</router-link> to view your history.</p>
    </div>

    <!-- Edit Logged Workout Modal -->
    <EditLoggedWorkoutModal 
      :show="showEditModal" 
      :workout="editingWorkout" 
      @close="showEditModal = false" 
      @save="handleSaveEditedWorkout" 
      @delete="handleDeleteWorkout" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch, computed } from 'vue';
import { collection, query, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase.js'; 
import useAuth from '../composables/useAuth';
import useSettings from '../composables/useSettings';
import useLoggedWorkouts from '../composables/useLoggedWorkouts';
import useHistoryIndex, { type CalendarIndexData } from '../composables/useHistoryIndex';
import useStrava from '../composables/useStrava';
import useTrainingProgram from '../composables/useTrainingProgram';
import { toDisplay, displayUnit } from '../utils/weight';
import type { LoggedWorkout, PerformedExerciseInLog, LoggedSetData } from '@/types';

import WeeklyVolumeChart from '../components/WeeklyVolumeChart.vue';
import ExerciseProgressChart from '../components/ExerciseProgressChart.vue';
import EditLoggedWorkoutModal from '../components/history/EditLoggedWorkoutModal.vue';

interface CalendarDay {
  date: Date;
  isWorkoutDay: boolean;
  workoutNameTooltip: string | null;
  isFuture: boolean;
  isPlaceholder: boolean;
  dayOfMonth: number;
  workoutDayColor?: string | null; // For dynamic coloring
  isExternalActivity?: boolean;
  externalActivities?: any[];
}

const { user } = useAuth();
const { settings } = useSettings();
const { loggedWorkouts, isLoading, error, fetchLoggedWorkouts, fetchMoreWorkouts, updateLoggedWorkout, deleteLoggedWorkout, hasMoreDocs } = useLoggedWorkouts();
const { calendarIndex, fetchCalendarIndex, isIndexLoading } = useHistoryIndex();

const showEditModal = ref(false);
const editingWorkout = ref<LoggedWorkout | null>(null);

function openEditModal(workout: LoggedWorkout) {
  console.log('Opening edit modal for workout:', workout);
  editingWorkout.value = workout;
  showEditModal.value = true;
}

async function handleSaveEditedWorkout(updatedWk: LoggedWorkout) {
  if (!updatedWk.id) return;
  try {
    await updateLoggedWorkout(updatedWk.id, updatedWk);
    showEditModal.value = false;
    editingWorkout.value = null;
    fetchCalendarIndex(true);
  } catch (e: any) {
    alert("Failed to save workout updates: " + e.message);
  }
}

async function handleDeleteWorkout(workoutId: string) {
  try {
    await deleteLoggedWorkout(workoutId);
    showEditModal.value = false;
    editingWorkout.value = null;
    fetchCalendarIndex(true);
  } catch (e: any) {
    alert("Failed to delete workout: " + e.message);
  }
}
const { activeProgram } = useTrainingProgram();
const allDetailsExpandedForWorkout = reactive<Record<string, boolean>>({});

// Chart & Analytics State
const selectedExerciseForGraph = ref<string>('');
const weeklyVolumeTimeRange = ref('12w');
const volumeAggregation = ref<'weekly' | 'monthly'>('weekly');
const uniqueExercises = computed(() => {
    const exercises = new Set<string>();
    loggedWorkouts.forEach(w => {
        if(w.performedExercises) {
            w.performedExercises.forEach(ex => exercises.add(ex.exerciseName));
        }
    });
    return Array.from(exercises).sort();
});

// Pagination State
// Handled by useLoggedWorkouts composable


const activeTooltip = ref<{ date: string; text: string; event: MouseEvent } | null>(null);
const calendarRef = ref<HTMLElement | null>(null);

const tooltipStyle = computed(() => {
  if (!activeTooltip.value) return {};
  const { event } = activeTooltip.value;
  const x = event.clientX;
  const y = event.clientY;
  const isRightHalf = x > window.innerWidth / 2;
  
  return {
    top: (y + 10) + 'px',
    left: isRightHalf ? 'auto' : (x + 10) + 'px',
    right: isRightHalf ? (window.innerWidth - x + 10) + 'px' : 'auto',
  };
});

// Palette for workout day sequence (up to 6 days, then default) - Vibrant, saturated colors
const daySequenceColorPalette = [
  '#FF5252', // Vibrant Red - Day 1 type
  '#2ECC71', // Vibrant Green - Day 2 type
  '#2979FF', // Vibrant Blue - Day 3 type
  '#FFD600', // Vibrant Gold/Yellow - Day 4 type
  '#9C27B0', // Vibrant Purple - Day 5 type
  '#FF9100', // Vibrant Orange - Day 6 type
];
const defaultWorkoutColor = '#10B981'; // Vibrant Vue/emerald green

const calendarWeeks = computed<CalendarDay[][]>(() => {
  return generateCalendarGridData(calendarIndex, 52); // Show last 52 weeks (1 year)
});

const handleDayCellClick = (day: CalendarDay, event: MouseEvent) => {
  if (day.isPlaceholder || day.isFuture) {
    activeTooltip.value = null;
    return;
  }
  const tooltipDateStr = day.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  
  let tooltipText = '';
  if (day.isWorkoutDay && day.workoutNameTooltip) {
    tooltipText += `Workout: ${day.workoutNameTooltip}`;
  }
  
  if (day.isExternalActivity && day.externalActivities && day.externalActivities.length > 0) {
    if (tooltipText) tooltipText += ' + ';
    const extTexts = day.externalActivities.map(act => {
      let distStr = '';
      if (act.distanceMiles) {
        if (settings.value?.cardioDistanceUnit === 'km') {
          const distKm = (act.distanceMiles * 1.60934).toFixed(1);
          distStr = ` (${distKm} km)`;
        } else {
          distStr = ` (${act.distanceMiles} mi)`;
        }
      }
      return `${act.type}: ${act.name}${distStr}`;
    }).join(', ');
    tooltipText += extTexts;
  }
  
  if (!tooltipText) {
    tooltipText = 'No activity';
  }

  if (activeTooltip.value && activeTooltip.value.date === tooltipDateStr && activeTooltip.value.text === tooltipText) {
    activeTooltip.value = null; 
  } else {
    activeTooltip.value = { date: tooltipDateStr, text: tooltipText, event: event };
  }
};

const hideTooltip = () => {
  activeTooltip.value = null;
};

const handleClickOutsideTooltip = (event: MouseEvent) => {
  if (activeTooltip.value) {
    const targetIsDayCell = (event.target as HTMLElement)?.closest('.calendar-day-cell');
    if(!targetIsDayCell) hideTooltip();
  }
};

const getDayCellStyle = (day: CalendarDay) => {
  if (day.isPlaceholder) return {};
  if (day.isFuture) return {};

  const styles: Record<string, string> = {};

  if (day.isWorkoutDay && day.isExternalActivity) {
    const workoutColor = day.workoutDayColor || defaultWorkoutColor;
    const runColor = '#FC4C02'; // Strava Orange
    styles.background = `linear-gradient(135deg, ${workoutColor} 50%, ${runColor} 50%)`;
  } else if (day.isWorkoutDay) {
    styles.backgroundColor = day.workoutDayColor || defaultWorkoutColor;
  } else if (day.isExternalActivity) {
    styles.backgroundColor = 'transparent';
    styles.background = 'linear-gradient(135deg, transparent 50%, #FC4C02 50%)';
  }

  return styles;
};

const generateCalendarGridData = (
  idxData: CalendarIndexData, // Now takes the index map
  numWeeksToShow: number
): CalendarDay[][] => {
  const weeksData: CalendarDay[][] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const calendarEndDate = new Date(today);
  calendarEndDate.setDate(today.getDate() + (6 - today.getDay())); // End week on Saturday

  const calendarStartDate = new Date(calendarEndDate);
  calendarStartDate.setDate(calendarEndDate.getDate() - (numWeeksToShow * 7) + 1);
  
  const programDayTypeEncounterOrder: Record<string, Record<string, number>> = {};
  const programNextAvailableColorIndex: Record<string, number> = {};
  
  // Convert index map to array for sorting to establish color order
  const sortedDateKeys = Object.keys(idxData).sort().filter(k => k !== 'lastUpdated');

  const activitiesByDate: Record<string, {
    isWorkoutDay: boolean;
    workoutName?: string;
    workoutColor?: string;
    isExternalActivity: boolean;
    externalActivities: any[];
  }> = {};

  for (const dateKey of sortedDateKeys) {
    const entry = idxData[dateKey];
    if (!entry) continue;

    let workoutInfo = null;
    if (entry.hasWorkout) {
      const programId = entry.programId || 'UNKNOWN_PROGRAM';
      const dayName = entry.dayName || 'Unknown Day';
      
      let color = entry.workoutColor;
      if (!color) {
        // Logic to assign color based on first encounter of (Program + DayName)
        if (!programDayTypeEncounterOrder[programId]) {
          programDayTypeEncounterOrder[programId] = {};
          programNextAvailableColorIndex[programId] = 0;
        }

        if (programDayTypeEncounterOrder[programId][dayName] === undefined) {
          const colorIndex = programNextAvailableColorIndex[programId];
          programDayTypeEncounterOrder[programId][dayName] = colorIndex;
          if (colorIndex < daySequenceColorPalette.length) { // Only increment if we used a palette color
              programNextAvailableColorIndex[programId]++;
          }
        }
        
        const assignedOrderIndex = programDayTypeEncounterOrder[programId][dayName];
        color = defaultWorkoutColor;
        if (assignedOrderIndex < daySequenceColorPalette.length) {
          color = daySequenceColorPalette[assignedOrderIndex];
        }
      }
      workoutInfo = { name: dayName, color: color };
    }

    activitiesByDate[dateKey] = {
      isWorkoutDay: !!entry.hasWorkout,
      workoutName: workoutInfo?.name,
      workoutColor: workoutInfo?.color,
      isExternalActivity: !!entry.hasExternalActivity,
      externalActivities: entry.externalActivities || []
    };
  }
  
  const currentDayIter = new Date(calendarStartDate);
  for (let w = 0; w < numWeeksToShow; w++) {
    const week: CalendarDay[] = [];
    for (let d = 0; d < 7; d++) {
      const normalizedCurrentDayIter = new Date(currentDayIter);
      normalizedCurrentDayIter.setHours(0,0,0,0);
      const year = normalizedCurrentDayIter.getFullYear();
      const month = String(normalizedCurrentDayIter.getMonth() + 1).padStart(2, '0');
      const day = String(normalizedCurrentDayIter.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      const dayInfo = activitiesByDate[dateString];
      
      week.push({
        date: new Date(normalizedCurrentDayIter),
        isWorkoutDay: !!(dayInfo && dayInfo.isWorkoutDay),
        workoutNameTooltip: dayInfo?.workoutName || null,
        workoutDayColor: dayInfo?.workoutColor || null,
        isExternalActivity: !!(dayInfo && dayInfo.isExternalActivity),
        externalActivities: dayInfo?.externalActivities || [],
        isFuture: normalizedCurrentDayIter > today,
        isPlaceholder: false, 
        dayOfMonth: normalizedCurrentDayIter.getDate(),
      });
      currentDayIter.setDate(currentDayIter.getDate() + 1);
    }
    weeksData.push(week);
  }
  return weeksData;
};




const formatWorkoutDate = (timestamp: Timestamp | Date | undefined): string => {
  if (!timestamp) return 'Date not available';
  const date = (timestamp instanceof Timestamp) ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatDuration = (minutes: number | undefined): string => {
  if (minutes === undefined || minutes === null || isNaN(minutes) || minutes < 0) return 'N/A';
  if (minutes === 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  let formatted = '';
  if (h > 0) formatted += `${h}h `;
  if (m > 0 || h === 0) formatted += `${m}m`;
  return formatted.trim();
};

const calculateTotalVolume = (performedExercises: PerformedExerciseInLog[] | undefined): number => {
  if (!performedExercises) return 0;
  const volLbs = performedExercises.reduce((totalVolume, ex) => {
    const exerciseVolume = ex.sets.reduce((vol, set) => {
      if (typeof set.actualWeight === 'number' && typeof set.actualReps === 'number' && set.actualReps > 0) {
        return vol + (set.actualWeight * set.actualReps);
      }
      return vol;
    }, 0);
    return totalVolume + exerciseVolume;
  }, 0);
  return toDisplay(volLbs, settings.value.weightUnit);
};

const getTotalSetsLogged = (performedExercises: PerformedExerciseInLog[] | undefined): number => {
  if (!performedExercises) return 0;
  return performedExercises.reduce((count, ex) => count + ex.sets.length, 0);
};

const getSetsByStatus = (performedExercises: PerformedExerciseInLog[] | undefined, status: 'done' | 'failed'): number => {
  if (!performedExercises) return 0;
  return performedExercises.reduce((count, ex) => {
    return count + ex.sets.filter(set => set.status === status).length;
  }, 0);
};

const getConsolidatedSetsInfo = (performedExercises: PerformedExerciseInLog[] | undefined): string => {
  if (!performedExercises) return 'N/A';
  const total = getTotalSetsLogged(performedExercises);
  const done = getSetsByStatus(performedExercises, 'done');
  const failed = getSetsByStatus(performedExercises, 'failed');
  return `${total} (Done: ${done}, Failed: ${failed})`;
};

const getRepresentativeSetInfo = (sets: LoggedSetData[]): string => {
  if (!sets || sets.length === 0) return '';
  let representativeSet: LoggedSetData | null = null;
  let maxWeight = -1;

  for (const set of sets) {
    if (set.status === 'done' && set.actualReps > 0 && typeof set.actualWeight === 'number' && set.actualWeight >= 0) {
      if (set.actualWeight > maxWeight) {
        maxWeight = set.actualWeight;
        representativeSet = set;
      } else if (set.actualWeight === maxWeight && representativeSet && set.actualReps > representativeSet.actualReps) {
        representativeSet = set;
      }
    }
  }
  
  if (!representativeSet) {
    representativeSet = sets.find(s => s.actualReps > 0 && typeof s.actualWeight === 'number' && s.actualWeight >=0) || (sets.length > 0 ? sets[0] : null);
  }

  if (representativeSet && typeof representativeSet.actualWeight === 'number' && typeof representativeSet.actualReps === 'number') {
    return `${toDisplay(representativeSet.actualWeight, settings.value.weightUnit)} ${displayUnit(settings.value.weightUnit)} x ${representativeSet.actualReps} ${representativeSet.isTimed ? 'sec' : 'reps'}`;
  }
  return '';
};

const getExerciseStatusForHistory = (exercise: PerformedExerciseInLog): string => {
  const doneSets = exercise.sets.filter(s => s.status === 'done').length;
  const totalPerformed = exercise.sets.length;
  if (totalPerformed === 0) return "No sets recorded";
  return `${doneSets}/${totalPerformed} sets done`;
};

const getExerciseLineSuffix = (performedExercise: PerformedExerciseInLog): string => {
  if (!performedExercise.sets || performedExercise.sets.length === 0) return '';
  const repInfo = getRepresentativeSetInfo(performedExercise.sets);
  if (repInfo) {
    return `, ${repInfo}`; 
  }
  return '';
};

const toggleAllDetailsForWorkout = (workoutId: string) => {
  allDetailsExpandedForWorkout[workoutId] = !allDetailsExpandedForWorkout[workoutId];
};

let userWatcherUnsubscribe: (() => void) | null = null;

const { isConnected: isStravaConnected, syncNow: stravaSyncNow } = useStrava();

onMounted(() => {
  fetchLoggedWorkouts(); 
  fetchCalendarIndex();

  // Watch connection state to run auto-sync on load
  watch(isStravaConnected, (connected) => {
     if (connected) {
         const lastSyncTimeStr = localStorage.getItem('last_strava_sync_time');
         const oneHour = 60 * 60 * 1000;
         const now = Date.now();
         if (!lastSyncTimeStr || (now - parseInt(lastSyncTimeStr)) > oneHour) {
             console.log("Auto-syncing Strava activities...");
             stravaSyncNow().then(() => {
                 localStorage.setItem('last_strava_sync_time', now.toString());
             }).catch((err) => {
                 console.warn("Strava auto-sync failed:", err);
             });
         }
     }
  }, { immediate: true });
  
  userWatcherUnsubscribe = watch(user, (currentUser) => {
    if (currentUser?.uid) {
        fetchLoggedWorkouts();
        fetchCalendarIndex();
    } else {
      // User logged out, clear data
      loggedWorkouts.length = 0;
      for (const key in allDetailsExpandedForWorkout) {
        delete allDetailsExpandedForWorkout[key];
      }
    }
  }, { immediate: true });

  document.addEventListener('click', handleClickOutsideTooltip);

  // Scroll calendar to end (latest dates)
  setTimeout(() => {
    if (calendarRef.value) {
        const scrollArea = calendarRef.value.querySelector('.calendar-main-area');
        if (scrollArea) {
            scrollArea.scrollLeft = scrollArea.scrollWidth;
        }
    }
  }, 200);
});

onUnmounted(() => {
  if (userWatcherUnsubscribe) {
    userWatcherUnsubscribe();
  }
  document.removeEventListener('click', handleClickOutsideTooltip);
});
</script>

<style scoped>
.history-view {
  padding: 10px;
  max-width: 700px;
  margin: 20px auto;
}
.history-view h1 {
  text-align: center;
  margin-bottom: 20px;
  color: var(--color-heading);
  font-family: 'Montserrat', sans-serif;
  font-weight: 400;
}

/* Calendar Heatmap Styles */
.calendar-heatmap-container {
  margin-bottom: 30px;
  padding: 15px;
  background-color: var(--color-background-soft);
  border-radius: 8px;
  border: 1px solid var(--color-border);
  position: relative; 
  color: var(--color-text);
}

/* Month headers removed */

.calendar-grid {
  display: flex;
  gap: 5px;
}

.day-labels {
  display: flex;
  flex-direction: column;
  gap: 2px; 
  font-size: 0.65em;
  color: var(--color-text);
  flex-shrink: 0;
  padding-top: 2px;
}
.day-labels span {
  height: 15px; 
  width: 15px; 
  display: flex;
  align-items: center;
  justify-content: center;
}

.calendar-main-area {
  display: flex;
  gap: 2px; 
  overflow-x: auto; 
  padding-bottom: 5px;
  scrollbar-width: none;  /* Firefox */
  -ms-overflow-style: none;  /* IE 10+ */
}
.calendar-main-area::-webkit-scrollbar { 
    display: none;  /* Chrome/Safari */
}

.calendar-week {
  display: flex;
  flex-direction: column; 
  gap: 2px; 
}

.calendar-day-cell {
  width: 15px; 
  height: 15px;
  background-color: var(--color-background-mute); 
  border-radius: 3px;
  cursor: pointer;
  transition: transform 0.1s ease-out, background-color 0.2s;
}

.calendar-day-cell:hover:not(.future-day):not(.placeholder-day) {
  outline: 1px solid var(--color-text);
  outline-offset: -1px;
}

.calendar-day-cell.future-day {
  background-color: var(--color-background); 
  opacity: 0.5;
  cursor: default;
}

.calendar-day-cell.placeholder-day {
  background-color: transparent; 
  cursor: default;
}

.calendar-day-cell.today {
  outline: 1px solid var(--color-heading);
  outline-offset: -1px;
}

/* Heatmap Legend */
.calendar-legend {
  display: flex;
  gap: 15px;
  justify-content: center;
  align-items: center;
  margin-top: 15px;
  font-size: 0.8em;
  opacity: 0.85;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text);
}

.legend-color-box {
  width: 12px;
  height: 12px;
  border-radius: 2.5px;
  border: 1px solid var(--color-card-border);
  flex-shrink: 0;
}

.legend-color-box.weights {
  background: linear-gradient(90deg, #FF5252, #2ECC71, #2979FF);
}

.legend-color-box.cardio {
  background: linear-gradient(135deg, transparent 50%, #FC4C02 50%);
}

.legend-color-box.combined {
  background: linear-gradient(135deg, #2ECC71 50%, #FC4C02 50%);
}

.calendar-tooltip {
  position: fixed; 
  background-color: #282828; 
  color: white;
  padding: 6px 12px; 
  border-radius: 5px;
  font-size: 0.9em; 
  z-index: 1000; 
  pointer-events: none; 
  box-shadow: 0 3px 8px rgba(0,0,0,0.3);
  white-space: nowrap;
}

/* General card style for loading/error/no-history messages */
.card {
  background-color: var(--color-card-bg);
  padding: 20px 25px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  text-align: left;
  color: var(--color-card-text);
  border: 1px solid var(--color-card-border);
}

.history-item-card {
  background-color: var(--color-card-bg);
  padding: 20px 25px;
  border-radius: 8px;
  margin-bottom: 25px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  text-align: left;
  border: 1px solid var(--color-card-border);
  color: var(--color-card-text); 
}

.history-item-header {
  border-bottom: 1px solid var(--color-card-border); 
  padding-bottom: 15px;
  margin-bottom: 15px;
}
.history-item-header h2 {
  margin-top: 0;
  margin-bottom: 5px;
  color: var(--color-card-heading);
  font-size: 1.5em;
}
.workout-date {
  font-size: 0.9em;
  color: var(--color-card-text);
  opacity: 0.8;
  margin-bottom: 5px;
}
.program-name {
  font-size: 0.9em;
  color: var(--color-card-text);
  opacity: 0.8;
  font-style: italic;
}

.workout-summary { 
  background-color: var(--color-card-mute);
  padding: 20px;
  border-radius: 6px;
  margin-top: 20px;
  border: 1px solid var(--color-card-border);
  color: var(--color-card-text); 
}

.workout-summary h4 { 
  font-size: 1.2em;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 15px;
  color: var(--color-card-heading);
}
.workout-summary p { 
  margin: 8px 0 8px 15px; 
  font-size: 0.95em;
  line-height: 1.5;
  color: var(--color-card-text);
}
.workout-summary p strong {
  font-weight: 500; 
  color: var(--color-card-heading);
}

.exercise-breakdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid var(--color-card-border); 
}

.workout-summary h5 { 
  font-size: 1.15em;
  font-weight: 600;
  color: var(--color-card-heading);
  margin-top: 0;
  margin-bottom: 15px;
}
.exercise-breakdown-header .button-link {
  font-size: 0.85em;
  font-weight: normal;
}

.exercise-summary-list {
  list-style-type: none;
  padding-left: 0;
}
.exercise-summary-list li {
  font-size: 0.95em;
  padding: 10px 0 10px 15px; 
  margin-bottom: 0;
  border-bottom: 1px dashed var(--color-card-border); 
  color: var(--color-card-text);
}
.exercise-summary-list li:last-child {
  border-bottom: none;
}
.exercise-summary-list li strong { 
  font-weight: 500;
  color: var(--color-card-heading);
}

.set-details-list {
  list-style-type: none; 
  padding-left: 20px; 
  margin-top: 8px;
  font-size: 0.9em; 
  color: var(--color-card-text);
  opacity: 0.9;
}
.set-details-list li {
  padding: 3px 0;
  border-bottom: none;
}

.button-link {
  background: none;
  border: none;
  color: #007bff;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  font-size: inherit; 
}
.button-link:hover {
  color: #0056b3;
}

.session-notes-history {
  margin-top: 20px; 
  padding-top: 15px;
  border-top: 1px solid var(--color-card-border); 
}
.session-notes-history strong {
  display: block;
  margin-bottom: 8px; 
  font-weight: 600;
  color: var(--color-card-heading);
}
.session-notes-history p {
  white-space: pre-wrap;
  font-size: 0.9em;
  color: var(--color-card-text);
  line-height: 1.6;
}

.button-primary {
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  text-decoration: none;
  display: inline-block;
  transition: background-color 0.2s;
}
.button-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.history-select {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--color-card-border);
  background-color: var(--color-card-bg);
  color: var(--color-card-text);
  font-size: 0.9em;
  font-family: inherit;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s, background-color 0.2s;
}
.history-select:hover {
  border-color: var(--color-heading);
}

.button-secondary {
  padding: 10px 15px;
  background-color: var(--color-background-soft);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
  display: inline-block;
  text-align: center;
}
.button-secondary:hover:not(:disabled) {
  background-color: var(--color-background-mute);
  border-color: var(--color-heading);
}
.full-width {
  width: 100%;
  display: block;
}

.loading-message, .no-history, .login-prompt {
  color: var(--color-card-text); 
  text-align: center;
  padding: 20px;
}
.no-history {
  padding: 30px; 
}
.error-message { 
  color: #721c24; 
  background-color: #f8d7da; 
  border: 1px solid #f5c6cb; 
}
.login-prompt a {
    color: #007bff; 
}

@media (max-width: 600px) {
  .history-view {
    padding: 5px;
    margin: 10px auto;
    padding-bottom: 30px; /* Extra bottom space for nav */
  }
  .card, .history-item-card {
    padding: 15px 15px;
    margin-bottom: 15px;
  }
  .history-item-header h2 {
    font-size: 1.3em;
  }
  .workout-summary {
    padding: 15px;
    margin-top: 15px;
  }
}
</style>