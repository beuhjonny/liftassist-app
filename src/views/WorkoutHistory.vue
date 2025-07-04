<template>
  <div class="history-view">
    <h1>Workout History</h1>

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
                'workout-day-presence': day.isWorkoutDay && !day.isFuture, // Class to indicate presence, not for bg color
                'future-day': day.isFuture,
                'placeholder-day': day.isPlaceholder,
                'today': day.date.toDateString() === new Date().toDateString() && !day.isFuture && !day.isPlaceholder
              }"
              :style="day.isWorkoutDay && day.workoutDayColor ? { backgroundColor: day.workoutDayColor } : {}"
              @click.stop="handleDayCellClick(day, $event)"
            >
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTooltip"
           class="calendar-tooltip"
           :style="{ top: (activeTooltip.event.clientY + 10) + 'px', left: (activeTooltip.event.clientX + 10) + 'px' }">
        {{ activeTooltip.text }} - {{ activeTooltip.date }}
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
      <div v-for="workout in loggedWorkouts" :key="workout.id" class="history-item-card">
        <div class="history-item-header">
          <h2>{{ workout.workoutDayNameUsed || 'Workout Session' }}</h2>
          <p class="workout-date">
            {{ formatWorkoutDate(workout.date) }}
          </p>
          <p v-if="workout.trainingProgramNameUsed" class="program-name">
            Routine: {{ workout.trainingProgramNameUsed }}
          </p>
        </div>

        <div class="workout-summary card-inset">
          <h4>Session Summary:</h4>
          <p><strong>Workout Time:</strong> {{ formatDuration(workout.durationMinutes) }}</p>
          <p><strong>Total Volume:</strong> {{ calculateTotalVolume(workout.performedExercises).toLocaleString() }} lbs</p>
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
                  Set {{ set.setNumber }}: {{ set.actualWeight }} lbs x {{ set.actualReps }} reps ({{set.status}})
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
    </div>

    <div v-if="!user && !isLoading" class="login-prompt">
      <p>Please <router-link to="/login">log in</router-link> to view your history.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch, computed } from 'vue';
import { collection, query, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase.js'; 
import useAuth from '../composables/useAuth';

// --- Interfaces ---
interface LoggedSetData {
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  prescribedWeight: number;
  prescribedReps: number;
  actualWeight: number;
  actualReps: number;
  status: 'done' | 'failed';
  timestamp: any; 
}

interface PerformedExerciseInLog {
  exerciseId: string;
  exerciseName: string;
  sets: LoggedSetData[];
  isPR?: boolean;
}

interface LoggedWorkout {
  id: string;
  userId: string;
  date: Timestamp;
  trainingProgramIdUsed: string;
  workoutDayNameUsed: string;
  workoutDayIdUsed: string;
  performedExercises: PerformedExerciseInLog[];
  trainingProgramNameUsed?: string;
  overallSessionNotes?: string;
  startTime?: any; 
  endTime?: any; 
  durationMinutes?: number;
}

interface CalendarDay {
  date: Date;
  isWorkoutDay: boolean;
  workoutNameTooltip: string | null;
  isFuture: boolean;
  isPlaceholder: boolean;
  dayOfMonth: number;
  workoutDayColor?: string | null; // For dynamic coloring
}

const { user } = useAuth();
const isLoading = ref(true);
const error = ref<string | null>(null);
const loggedWorkouts = reactive<LoggedWorkout[]>([]);
const allDetailsExpandedForWorkout = reactive<Record<string, boolean>>({});

const activeTooltip = ref<{ date: string; text: string; event: MouseEvent } | null>(null);
const calendarRef = ref<HTMLElement | null>(null);

// Palette for workout day sequence (up to 6 days, then default)
const daySequenceColorPalette = [
  '#EF9A9A', // Light Red - Day 1 type
  '#A5D6A7', // Light Green - Day 2 type
  '#90CAF9', // Light Blue - Day 3 type
  '#FFF59D', // Light Yellow - Day 4 type
  '#CE93D8', // Light Purple - Day 5 type
  '#FFCC80', // Light Orange - Day 6 type
];
const defaultWorkoutColor = 'hsla(160, 100%, 37%, 0.8)'; // Default (e.g., Vue green)

const calendarWeeks = computed<CalendarDay[][]>(() => {
  return generateCalendarGridData(loggedWorkouts.slice(), 12); // Show last 12 weeks
});

const handleDayCellClick = (day: CalendarDay, event: MouseEvent) => {
  if (day.isPlaceholder || day.isFuture) {
    activeTooltip.value = null;
    return;
  }
  const tooltipDateStr = day.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  if (day.isWorkoutDay && day.workoutNameTooltip) {
    if (activeTooltip.value && activeTooltip.value.date === tooltipDateStr && activeTooltip.value.text === day.workoutNameTooltip) {
      activeTooltip.value = null; 
    } else {
      activeTooltip.value = { date: tooltipDateStr, text: day.workoutNameTooltip, event: event };
    }
  } else {
    if (activeTooltip.value && activeTooltip.value.date === tooltipDateStr && activeTooltip.value.text === "No workout") {
        activeTooltip.value = null;
    } else {
        activeTooltip.value = { date: tooltipDateStr, text: "No workout", event: event };
    }
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

const generateCalendarGridData = (
  rawLoggedWorkouts: LoggedWorkout[],
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
  
  // Sort workouts oldest to newest to establish encounter order for coloring
  const sortedWorkoutsForColorLogic = [...rawLoggedWorkouts].sort((a, b) => {
    const dateA = (a.date instanceof Timestamp) ? a.date.toMillis() : new Date(a.date).getTime();
    const dateB = (b.date instanceof Timestamp) ? b.date.toMillis() : new Date(b.date).getTime();
    return dateA - dateB;
  });

  const workoutsByDate: Record<string, { name: string; color: string }> = {};

  for (const workout of sortedWorkoutsForColorLogic) {
    const programId = workout.trainingProgramIdUsed || 'UNKNOWN_PROGRAM';
    const dayName = workout.workoutDayNameUsed || 'Unknown Day';
    const workoutDate = (workout.date instanceof Timestamp) ? workout.date.toDate() : new Date(workout.date);
    workoutDate.setHours(0,0,0,0);
    const dateString = workoutDate.toISOString().split('T')[0];

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
    let color = defaultWorkoutColor;
    if (assignedOrderIndex < daySequenceColorPalette.length) {
      color = daySequenceColorPalette[assignedOrderIndex];
    }

    // Store the latest workout's info for a given day if multiple exist (though coloring is program-day specific)
    workoutsByDate[dateString] = { name: dayName, color: color };
  }
  
  let currentDayIter = new Date(calendarStartDate);
  for (let w = 0; w < numWeeksToShow; w++) {
    const week: CalendarDay[] = [];
    for (let d = 0; d < 7; d++) {
      const normalizedCurrentDayIter = new Date(currentDayIter);
      normalizedCurrentDayIter.setHours(0,0,0,0);
      const dateString = normalizedCurrentDayIter.toISOString().split('T')[0];
      
      const workoutInfo = workoutsByDate[dateString];
      
      week.push({
        date: new Date(normalizedCurrentDayIter),
        isWorkoutDay: !!workoutInfo,
        workoutNameTooltip: workoutInfo ? workoutInfo.name : null,
        workoutDayColor: workoutInfo ? workoutInfo.color : null,
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


const fetchWorkoutHistory = async () => {
  if (!user.value || !user.value.uid) {
    error.value = "User not available.";
    isLoading.value = false;
    loggedWorkouts.length = 0;
    return;
  }
  error.value = null;
  
  try {
    const historyCollectionRef = collection(db, 'users', user.value.uid, 'loggedWorkouts');
    const q = query(historyCollectionRef, orderBy('date', 'desc')); // Fetch newest first for display list

    const querySnapshot = await getDocs(q);
    const newWorkouts: LoggedWorkout[] = [];
    querySnapshot.forEach((docSnap) => {
      newWorkouts.push({ id: docSnap.id, ...docSnap.data() } as LoggedWorkout);
    });
    loggedWorkouts.splice(0, loggedWorkouts.length, ...newWorkouts);

  } catch (e: any) {
    console.error("Error fetching workout history:", e);
    error.value = "Failed to load workout history. " + e.message;
  } finally {
    isLoading.value = false;
  }
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
  return performedExercises.reduce((totalVolume, ex) => {
    const exerciseVolume = ex.sets.reduce((vol, set) => {
      if (typeof set.actualWeight === 'number' && typeof set.actualReps === 'number' && set.actualReps > 0) {
        return vol + (set.actualWeight * set.actualReps);
      }
      return vol;
    }, 0);
    return totalVolume + exerciseVolume;
  }, 0);
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
    return `${representativeSet.actualWeight} lbs x ${representativeSet.actualReps} reps`;
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
onMounted(() => {
  isLoading.value = true; 
  userWatcherUnsubscribe = watch(user, (currentUser, previousUser) => {
    if (currentUser && currentUser.uid) {
      if (!previousUser || currentUser.uid !== previousUser.uid || (loggedWorkouts.length === 0 && !error.value)) {
        isLoading.value = true;
        fetchWorkoutHistory();
      } else {
        isLoading.value = false; 
      }
    } else {
      isLoading.value = false;
      loggedWorkouts.length = 0;
      for (const key in allDetailsExpandedForWorkout) {
        delete allDetailsExpandedForWorkout[key];
      }
    }
  }, { immediate: true });

  document.addEventListener('click', handleClickOutsideTooltip);
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
  padding-top: 20px;
  padding-bottom: 20px;
  max-width: 800px;
  margin: 0 auto;
}
.history-view h1 {
  text-align: center;
  margin-bottom: 30px;
  color: var(--color-heading);
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
  border: 1px solid transparent; 
}

.calendar-day-cell:hover:not(.future-day):not(.placeholder-day) {
  border-color: var(--color-text); 

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
  border: 1px solid var(--color-heading); 
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
  background-color: #fff;
  padding: 20px 25px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  text-align: left;
  color: #333; 
}

.history-item-card {
  background-color: #fff; 
  padding: 20px 25px;
  border-radius: 8px;
  margin-bottom: 25px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  text-align: left;
  border: 1px solid var(--color-border);
  color: #333; 
}

.history-item-header {
  border-bottom: 1px solid #e0e0e0; 
  padding-bottom: 15px;
  margin-bottom: 15px;
}
.history-item-header h2 {
  margin-top: 0;
  margin-bottom: 5px;
  color: #333;
  font-size: 1.5em;
}
.workout-date {
  font-size: 0.9em;
  color: #6c757d;
  margin-bottom: 5px;
}
.program-name {
  font-size: 0.9em;
  color: #555;
  font-style: italic;
}

.workout-summary { 
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 6px;
  margin-top: 20px;
  border: 1px solid #e0e0e0;
  color: #333; 
}

.workout-summary h4 { 
  font-size: 1.2em;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 15px;
}
.workout-summary p { 
  margin: 8px 0 8px 15px; 
  font-size: 0.95em;
  line-height: 1.5;
}
.workout-summary p strong {
  font-weight: 500; 
}

.exercise-breakdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #d0d0d0; 
}

.workout-summary h5 { 
  font-size: 1.15em;
  font-weight: 600;
  color: #333;
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
  border-bottom: 1px dashed #e0e0e0; 
}
.exercise-summary-list li:last-child {
  border-bottom: none;
}
.exercise-summary-list li strong { 
  font-weight: 500;
}

.set-details-list {
  list-style-type: none; 
  padding-left: 20px; 
  margin-top: 8px;
  font-size: 0.9em; 
  color: #555;
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
  border-top: 1px solid #d0d0d0; 
}
.session-notes-history strong {
  display: block;
  margin-bottom: 8px; 
  font-weight: 600;
}
.session-notes-history p {
  white-space: pre-wrap;
  font-size: 0.9em;
  color: #444;
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

.loading-message, .no-history, .login-prompt {
  color: var(--color-text); 
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

</style>