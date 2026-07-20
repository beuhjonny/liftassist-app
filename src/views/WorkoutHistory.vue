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

        <!-- Cardio (Strava / Manual) -->
        <div v-if="hasAnyCardioActivities" class="legend-item">
          <span class="legend-color-box cardio" style="background-color: #FC4C02;"></span>
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
        
        <!-- 1. Overall Training Trends -->
        <div class="chart-section card">
            <div class="chart-header-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; flex-wrap: wrap; gap: 10px;">
                <h3 style="margin:0; line-height:1.2;">📈 Overall Training Trends</h3>
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
                :workouts="loggedWorkouts"
                :weightUnit="settings?.weightUnit || 'lbs'" 
                :timeRange="weeklyVolumeTimeRange" 
                :aggregation="volumeAggregation"
            />
        </div>

        <!-- 2. Weekly Sets per Muscle Group (Direct vs. Indirect) -->
        <div class="chart-section card">
            <div class="chart-header-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3 style="margin:0;">💪 Muscle Group Sets per Week</h3>
            </div>
            <MuscleGroupVolumeChart 
                :workouts="loggedWorkouts" 
                :weightUnit="settings?.weightUnit || 'lbs'"
            />
        </div>

        <!-- 3. Exercise Strength & 1RM Progress -->
        <div class="chart-section card">
             <div class="chart-header-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                 <h3 style="margin:0;">🎯 Exercise Strength & 1RM Progress</h3>
                 <select v-model="selectedExerciseForGraph" class="history-select" style="max-width: 220px; min-width: 150px;">
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
             <div v-else class="placeholder-text card-inset" style="text-align:center; padding: 40px; color: var(--color-card-text); opacity: 0.75; border-radius: 12px;">
                 Select an exercise above to analyze 1RM strength, top weight, and volume progress.
             </div>
        </div>
    </div>

    <div v-if="isLoading && loggedWorkouts.length === 0" class="loading-message">
      <p>Loading workout history...</p>
    </div>
    <div v-if="error && !isLoading" class="error-message card">
      <p>Error: {{ error }}</p>
    </div>

    <div v-if="!isLoading && !error && user && combinedHistoryItems.length === 0" class="no-history card">
      <p>No workouts or cardio sessions logged yet. Go crush a session!</p>
      <div style="display: flex; gap: 10px; justify-content: center; margin-top: 15px;">
        <router-link to="/" class="button-primary">Start a Workout</router-link>
        <button @click="showLogCardioModal = true" class="button-secondary">🏃 Log Cardio</button>
      </div>
    </div>

    <div v-if="!isLoading && !error && user && combinedHistoryItems.length > 0" class="history-list">
      <div style="display: flex; justify-content: space-between; align-items: center; margin: 30px 0 20px 0; border-bottom: 1px solid var(--color-border); padding-bottom: 10px;">
        <h3 style="margin: 0; font-size: 1.5em; color: var(--color-heading);">Recent Activity</h3>
        <button @click="showLogCardioModal = true" class="button-secondary small" style="display: flex; align-items: center; gap: 6px;">
          🏃 Log Cardio
        </button>
      </div>

      <div v-for="item in combinedHistoryItems" :key="item.id">
        <!-- STRENGTH WORKOUT CARD -->
        <div v-if="!item.isCardio && item.workout" class="history-item-card">
          <div class="history-item-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h2>{{ item.workout.workoutDayNameUsed || 'Workout Session' }}</h2>
              <p class="workout-date">
                {{ formatWorkoutDate(item.workout.date) }}
              </p>
              <p v-if="item.workout.trainingProgramNameUsed" class="program-name">
                Routine: {{ item.workout.trainingProgramNameUsed }}
              </p>
            </div>
            <div style="display: flex; gap: 4px; align-items: center;">
              <button @click.stop.prevent="openShareModal(item.workout)" class="icon-button share-btn" title="Share Workout" style="background: none; border: none; font-size: 1.2em; cursor: pointer; padding: 4px; border-radius: 6px;">📤</button>
              <button @click.stop.prevent="openEditModal(item.workout)" class="icon-button edit-btn" title="Edit Workout" style="background: none; border: none; font-size: 1.2em; cursor: pointer; padding: 4px; border-radius: 6px;">✏️</button>
            </div>
          </div>

          <div class="workout-summary card-inset">
            <h4>Session Summary:</h4>
            <p><strong>Workout Time:</strong> {{ formatDuration(item.workout.durationMinutes) }}</p>
            <p><strong>Total Volume:</strong> {{ calculateTotalVolume(item.workout.performedExercises).toLocaleString() }} {{ displayUnit(settings.weightUnit) }}</p>
            <p><strong>Total Sets:</strong> {{ getConsolidatedSetsInfo(item.workout.performedExercises) }}</p>

            <div class="exercise-breakdown-header" v-if="item.workout.performedExercises && item.workout.performedExercises.length > 0">
              <h5>Exercise Breakdown:</h5>
              <button @click="toggleAllDetailsForWorkout(item.workout.id)" class="button-link">
                {{ allDetailsExpandedForWorkout[item.workout.id] ? 'Hide Set Details' : 'Show Set Details' }}
              </button>
            </div>

            <ul class="exercise-summary-list" v-if="item.workout.performedExercises && item.workout.performedExercises.length > 0">
              <li v-for="ex in item.workout.performedExercises" :key="ex.exerciseId || ex.exerciseName">
                <strong>{{ ex.exerciseName }}</strong>
                <span v-if="ex.isPR" title="Personal Record!"> 🏅</span>
                <span>: {{ getExerciseStatusForHistory(ex) }}{{ getExerciseLineSuffix(ex) }}</span>
                
                <ul v-if="allDetailsExpandedForWorkout[item.workout.id] && ex.sets && ex.sets.length > 0" class="set-details-list">
                  <li v-for="(set, setIndex) in ex.sets" :key="setIndex">
                    Set {{ set.setNumber }}: {{ toDisplay(set.actualWeight, settings.weightUnit) }} {{ displayUnit(settings.weightUnit) }} x {{ set.actualReps }} {{ set.isTimed ? 'sec' : 'reps' }} ({{set.status}})
                  </li>
                </ul>
              </li>
            </ul>

            <div v-if="item.workout.overallSessionNotes" class="session-notes-history">
              <strong>Overall Session Notes:</strong>
              <p>{{ item.workout.overallSessionNotes }}</p>
            </div>
          </div>
        </div>

        <!-- CARDIO EVENT CARD -->
        <div v-else-if="item.isCardio && item.cardio" class="history-item-card cardio-item-card" :style="{ borderLeft: item.cardio.source === 'strava' ? '4px solid #FC4C02' : '4px solid #10b981' }">
          <div class="history-item-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <h2 style="margin: 0; font-size: 1.3em;">{{ getCardioIcon(item.cardio.type) }} {{ item.cardio.name || item.cardio.type }}</h2>
                <span v-if="item.cardio.source === 'strava'" style="background: rgba(252, 76, 2, 0.15); color: #FC4C02; border: 1px solid rgba(252, 76, 2, 0.3); padding: 2px 8px; border-radius: 6px; font-size: 0.75em; font-weight: 700; text-transform: uppercase;">
                  Strava
                </span>
                <span v-else style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); padding: 2px 8px; border-radius: 6px; font-size: 0.75em; font-weight: 700; text-transform: uppercase;">
                  Cardio
                </span>
              </div>
              <p class="workout-date" style="margin-top: 4px;">
                {{ formatWorkoutDate(item.cardio.date) }}
              </p>
            </div>

            <div style="display: flex; gap: 4px; align-items: center;">
              <button v-if="item.cardio.source === 'manual'" @click.stop.prevent="handleDeleteCardioSession(item.cardio.id)" class="icon-button delete-btn" title="Delete Cardio Log" style="background: none; border: none; font-size: 1.1em; cursor: pointer; padding: 4px; border-radius: 6px; opacity: 0.7;">🗑️</button>
            </div>
          </div>

          <div class="workout-summary card-inset" style="margin-top: 12px; padding: 14px 18px; background-color: var(--color-card-mute); border: 1px solid var(--color-card-border);">
            <div style="display: flex; gap: 24px; flex-wrap: wrap;">
              <div>
                <span style="font-size: 0.75em; font-weight: 700; text-transform: uppercase; color: var(--color-card-text); opacity: 0.65; display: block; margin-bottom: 2px;">Duration</span>
                <span style="font-size: 1.2em; font-weight: 800; color: var(--color-card-text);">{{ formatDuration(item.cardio.durationMinutes) }}</span>
              </div>

              <div v-if="item.cardio.distanceMiles > 0">
                <span style="font-size: 0.75em; font-weight: 700; text-transform: uppercase; color: var(--color-card-text); opacity: 0.65; display: block; margin-bottom: 2px;">Distance</span>
                <span style="font-size: 1.2em; font-weight: 800; color: var(--color-card-text);">{{ formatCardioDistance(item.cardio.distanceMiles) }}</span>
              </div>

              <div v-if="item.cardio.distanceMiles > 0 && item.cardio.durationMinutes > 0">
                <span style="font-size: 0.75em; font-weight: 700; text-transform: uppercase; color: var(--color-card-text); opacity: 0.65; display: block; margin-bottom: 2px;">Avg Pace</span>
                <span style="font-size: 1.2em; font-weight: 800; color: var(--color-card-text);">{{ calculatePace(item.cardio.durationMinutes, item.cardio.distanceMiles) }}</span>
              </div>
            </div>

            <p v-if="item.cardio.notes" style="margin-top: 12px; font-size: 0.9em; font-style: italic; color: var(--color-card-text); opacity: 0.85; border-top: 1px dashed var(--color-card-border); padding-top: 8px;">
              "{{ item.cardio.notes }}"
            </p>
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

    <!-- Manual Cardio Log Modal -->
    <LogCardioModal 
      v-if="showLogCardioModal" 
      @close="showLogCardioModal = false" 
    />

    <!-- Edit Logged Workout Modal -->
    <EditLoggedWorkoutModal 
      :show="showEditModal" 
      :workout="editingWorkout" 
      @close="showEditModal = false" 
      @save="handleSaveEditedWorkout" 
      @delete="handleDeleteWorkout" 
    />

    <!-- Share Workout Modal -->
    <ShareWorkoutModal 
      :show="showShareModal" 
      :workout="sharingWorkout" 
      @close="showShareModal = false" 
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
import useExternalActivities, { type ExternalActivity } from '../composables/useExternalActivities';
import useHistoryIndex, { type CalendarIndexData } from '../composables/useHistoryIndex';
import useStrava from '../composables/useStrava';
import useTrainingProgram from '../composables/useTrainingProgram';
import { toDisplay, displayUnit } from '../utils/weight';
import type { LoggedWorkout, PerformedExerciseInLog, LoggedSetData } from '@/types';

import WeeklyVolumeChart from '../components/WeeklyVolumeChart.vue';
import ExerciseProgressChart from '../components/ExerciseProgressChart.vue';
import MuscleGroupVolumeChart from '../components/MuscleGroupVolumeChart.vue';
import EditLoggedWorkoutModal from '../components/history/EditLoggedWorkoutModal.vue';
import ShareWorkoutModal from '../components/history/ShareWorkoutModal.vue';
import LogCardioModal from '../components/history/LogCardioModal.vue';

interface CalendarDay {
  date: Date;
  isWorkoutDay: boolean;
  workoutNameTooltip: string | null;
  isFuture: boolean;
  isPlaceholder: boolean;
  dayOfMonth: number;
  workoutDayColor?: string | null; // For dynamic coloring
  workoutDayColors?: string[];
  isExternalActivity?: boolean;
  externalActivities?: any[];
}

const { user } = useAuth();
const { settings } = useSettings();
const { loggedWorkouts, isLoading, error, fetchLoggedWorkouts, fetchMoreWorkouts, updateLoggedWorkout, deleteLoggedWorkout, hasMoreDocs } = useLoggedWorkouts();
const { externalActivities, fetchExternalActivities, deleteExternalActivity } = useExternalActivities();
const { calendarIndex, fetchCalendarIndex, isIndexLoading } = useHistoryIndex();

const showEditModal = ref(false);
const editingWorkout = ref<LoggedWorkout | null>(null);

const showShareModal = ref(false);
const sharingWorkout = ref<LoggedWorkout | null>(null);

const showLogCardioModal = ref(false);

interface HistoryTimelineItem {
  id: string;
  isCardio: boolean;
  dateObj: Date;
  workout?: LoggedWorkout;
  cardio?: ExternalActivity;
}

const getObjDate = (dateVal: any): Date => {
  if (!dateVal) return new Date(0);
  if (typeof dateVal.toDate === 'function') return dateVal.toDate();
  if (typeof dateVal.seconds === 'number') return new Date(dateVal.seconds * 1000);
  if (dateVal instanceof Date) return dateVal;
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? new Date(0) : d;
};

const combinedHistoryItems = computed<HistoryTimelineItem[]>(() => {
  const items: HistoryTimelineItem[] = [];

  loggedWorkouts.forEach(w => {
    const d = getObjDate(w.date);
    items.push({
      id: w.id || `strength_${d.getTime()}`,
      isCardio: false,
      dateObj: d,
      workout: w
    });
  });

  externalActivities.forEach(c => {
    const d = getObjDate(c.date);
    items.push({
      id: c.id || `cardio_${d.getTime()}`,
      isCardio: true,
      dateObj: d,
      cardio: c
    });
  });

  items.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  return items;
});

function getCardioIcon(type: string = ''): string {
  const t = type.toLowerCase();
  if (t.includes('run')) return '🏃';
  if (t.includes('ride') || t.includes('cycle') || t.includes('bike')) return '🚴';
  if (t.includes('swim')) return '🏊';
  if (t.includes('walk')) return '🥾';
  if (t.includes('hike')) return '🏔️';
  if (t.includes('row')) return '🚣';
  return '⚡';
}

function formatCardioDistance(miles: number = 0): string {
  if (settings.value.cardioDistanceUnit === 'km') {
    const km = miles * 1.60934;
    return `${km.toFixed(2)} km`;
  }
  return `${miles.toFixed(2)} mi`;
}

function calculatePace(durationMinutes: number = 0, miles: number = 0): string {
  if (!miles || miles <= 0 || !durationMinutes || durationMinutes <= 0) return '-';
  if (settings.value.cardioDistanceUnit === 'km') {
    const km = miles * 1.60934;
    const paceMin = durationMinutes / km;
    const mins = Math.floor(paceMin);
    const secs = Math.round((paceMin - mins) * 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs} /km`;
  } else {
    const paceMin = durationMinutes / miles;
    const mins = Math.floor(paceMin);
    const secs = Math.round((paceMin - mins) * 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs} /mi`;
  }
}

async function handleDeleteCardioSession(cardioId?: string) {
  if (!cardioId) return;
  if (confirm('Are you sure you want to delete this cardio log?')) {
    try {
      await deleteExternalActivity(cardioId);
      fetchCalendarIndex(true);
    } catch (e: any) {
      alert('Failed to delete cardio session: ' + e.message);
    }
  }
}

function openEditModal(workout: LoggedWorkout) {
  console.log('Opening edit modal for workout:', workout);
  editingWorkout.value = workout;
  showEditModal.value = true;
}

function openShareModal(workout: LoggedWorkout) {
  sharingWorkout.value = workout;
  showShareModal.value = true;
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

const hasAnyCardioActivities = computed(() => {
  if (externalActivities.length > 0) return true;
  return Object.values(calendarIndex).some(entry => entry && entry.hasExternalActivity);
});

const getDayCellStyle = (day: CalendarDay) => {
  if (day.isPlaceholder || day.isFuture) return {};

  const styles: Record<string, string> = {};
  const workoutColors = day.workoutDayColors && day.workoutDayColors.length > 0 
    ? day.workoutDayColors 
    : (day.workoutDayColor ? [day.workoutDayColor] : []);

  const hasWorkouts = day.isWorkoutDay || workoutColors.length > 0;
  const hasCardio = day.isExternalActivity;
  const stravaOrange = '#FC4C02';

  if (hasWorkouts && hasCardio) {
    if (workoutColors.length >= 2) {
      styles.background = `linear-gradient(45deg, ${workoutColors[0]} 33.3%, ${workoutColors[1]} 33.3% 66.6%, ${stravaOrange} 66.6%)`;
    } else {
      styles.background = `linear-gradient(135deg, ${workoutColors[0]} 50%, ${stravaOrange} 50%)`;
    }
  } else if (hasWorkouts) {
    if (workoutColors.length >= 2) {
      styles.background = `linear-gradient(90deg, ${workoutColors[0]} 50%, ${workoutColors[1]} 50%)`;
    } else {
      styles.backgroundColor = workoutColors[0];
    }
  } else if (hasCardio) {
    styles.background = `linear-gradient(135deg, transparent 50%, ${stravaOrange} 50%)`;
  }

  return styles;
};

const getLocalDateKeyFromDate = (dateObj: Date): string => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const generateCalendarGridData = (
  idxData: CalendarIndexData, 
  numWeeksToShow: number
): CalendarDay[][] => {
  const weeksData: CalendarDay[][] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const calendarEndDate = new Date(today);
  calendarEndDate.setDate(today.getDate() + (6 - today.getDay())); 

  const calendarStartDate = new Date(calendarEndDate);
  calendarStartDate.setDate(calendarEndDate.getDate() - (numWeeksToShow * 7) + 1);
  
  const programDayTypeEncounterOrder: Record<string, Record<string, number>> = {};
  const programNextAvailableColorIndex: Record<string, number> = {};
  
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
        if (!programDayTypeEncounterOrder[programId]) {
          programDayTypeEncounterOrder[programId] = {};
          programNextAvailableColorIndex[programId] = 0;
        }

        if (programDayTypeEncounterOrder[programId][dayName] === undefined) {
          const colorIndex = programNextAvailableColorIndex[programId];
          programDayTypeEncounterOrder[programId][dayName] = colorIndex;
          if (colorIndex < daySequenceColorPalette.length) {
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

  const loggedWorkoutsByDateKey: Record<string, LoggedWorkout[]> = {};
  loggedWorkouts.forEach(wk => {
    const key = getLocalDateKeyFromDate(getObjDate(wk.date));
    if (key) {
      if (!loggedWorkoutsByDateKey[key]) loggedWorkoutsByDateKey[key] = [];
      loggedWorkoutsByDateKey[key].push(wk);
    }
  });
  
  const currentDayIter = new Date(calendarStartDate);
  for (let w = 0; w < numWeeksToShow; w++) {
    const week: CalendarDay[] = [];
    for (let d = 0; d < 7; d++) {
      const normalizedCurrentDayIter = new Date(currentDayIter);
      normalizedCurrentDayIter.setHours(0,0,0,0);
      const dateString = getLocalDateKeyFromDate(normalizedCurrentDayIter);
      
      const dayInfo = activitiesByDate[dateString];
      const workoutsForDate = loggedWorkoutsByDateKey[dateString] || [];

      const workoutColorsForDate: string[] = [];
      const workoutNamesForDate: string[] = [];

      if (workoutsForDate.length > 0) {
        workoutsForDate.forEach(wk => {
          const programId = wk.trainingProgramIdUsed || 'UNKNOWN_PROGRAM';
          const dayName = wk.workoutDayNameUsed || 'Workout';
          workoutNamesForDate.push(dayName);

          if (!programDayTypeEncounterOrder[programId]) {
            programDayTypeEncounterOrder[programId] = {};
            programNextAvailableColorIndex[programId] = 0;
          }
          if (programDayTypeEncounterOrder[programId][dayName] === undefined) {
            const colorIndex = programNextAvailableColorIndex[programId];
            programDayTypeEncounterOrder[programId][dayName] = colorIndex;
            if (colorIndex < daySequenceColorPalette.length) {
              programNextAvailableColorIndex[programId]++;
            }
          }
          const assignedIndex = programDayTypeEncounterOrder[programId][dayName];
          const color = assignedIndex < daySequenceColorPalette.length ? daySequenceColorPalette[assignedIndex] : defaultWorkoutColor;
          workoutColorsForDate.push(color);
        });
      } else if (dayInfo && dayInfo.isWorkoutDay) {
        workoutColorsForDate.push(dayInfo.workoutColor || defaultWorkoutColor);
        if (dayInfo.workoutName) workoutNamesForDate.push(dayInfo.workoutName);
      }
      
      week.push({
        date: new Date(normalizedCurrentDayIter),
        isWorkoutDay: workoutColorsForDate.length > 0 || !!(dayInfo && dayInfo.isWorkoutDay),
        workoutNameTooltip: workoutNamesForDate.join(' + ') || dayInfo?.workoutName || null,
        workoutDayColor: workoutColorsForDate[0] || dayInfo?.workoutColor || null,
        workoutDayColors: workoutColorsForDate,
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
  fetchExternalActivities();
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