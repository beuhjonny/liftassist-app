<template>
  <div class="profile-view">
    <h1>Profile</h1>
    <div v-if="user" class="user-details-container">
      <div class="user-details card">
        <img v-if="user.photoURL" :src="user.photoURL" alt="User Photo" class="user-photo" />
        <p><strong>Name:</strong> {{ user.displayName || 'N/A' }}</p>
        <p><strong>Email:</strong> {{ user.email || 'N/A' }}</p>
        <button @click="handleLogout" class="logout-button">Logout</button>
      </div>

      <div v-if="isLoadingStats" class="loading-message card">
        <p>Loading your stats...</p>
      </div>
      <div v-else-if="statsError" class="error-message card">
        <p>Could not load stats: {{ statsError }}</p>
      </div>
      <div v-else-if="loggedWorkouts.length > 0" class="lifetime-stats-card card">
        <h2>Lifetime Stats 💪</h2>
        <ul>
          <li>
            <span class="stat-icon">🏋️</span>
            <span class="stat-label">Total Volume Lifted:</span>
            <span class="stat-value">{{ lifetimeStats.totalVolume.toLocaleString() }} lbs</span>
          </li>
          <li>
            <span class="stat-icon">🗓️</span>
            <span class="stat-label">Workouts Completed:</span>
            <span class="stat-value">{{ lifetimeStats.totalWorkouts }}</span>
          </li>
          <li>
            <span class="stat-icon">⏱️</span>
            <span class="stat-label">Total Training Time:</span>
            <span class="stat-value">{{ formatLifetimeDuration(lifetimeStats.totalTimeMinutes) }}</span>
          </li>
          <li>
            <span class="stat-icon">🏆</span>
            <span class="stat-label">Personal Records Smashed:</span>
            <span class="stat-value">{{ lifetimeStats.totalPRs }}</span>
          </li>
          <li v-if="lifetimeStats.firstWorkoutDate">
            <span class="stat-icon">🚀</span>
            <span class="stat-label">Lifting Since:</span>
            <span class="stat-value">{{ formatDateForDisplay(lifetimeStats.firstWorkoutDate) }}</span>
          </li>
        </ul>
      </div>
      <div v-else class="no-stats card">
          <p>Log some workouts to see your lifetime stats here!</p>
      </div>

    </div>
    <div v-else class="loading-message card">
      <p>Loading user information or not logged in...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { collection, query, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust path if needed
import useAuth from '../composables/useAuth'; // Adjust path if needed

// --- START Interface Definitions (Consider moving to a shared types.ts file) ---
interface LoggedSetData {
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  prescribedWeight: number;
  prescribedReps: number;
  actualWeight: number;
  actualReps: number;
  status: 'done' | 'failed';
  timestamp: any; // Can be Timestamp from Firestore or Date object after conversion
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
  date: Timestamp | Date; // Data from Firestore is Timestamp, can be converted to Date
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
// --- END Interface Definitions ---

interface LifetimeStats {
  totalVolume: number;
  totalWorkouts: number;
  totalTimeMinutes: number;
  totalPRs: number;
  firstWorkoutDate: Date | null;
}

const { user, logout } = useAuth();
const router = useRouter();

const loggedWorkouts = ref<LoggedWorkout[]>([]);
const isLoadingStats = ref(true);
const statsError = ref<string | null>(null);

const ensureDateObject = (dateInput: Timestamp | Date): Date => {
  if (dateInput instanceof Timestamp) {
    return dateInput.toDate();
  }
  return new Date(dateInput.getTime()); // Create a new Date instance from milliseconds
};

const lifetimeStats = computed<LifetimeStats>(() => {
  let volume = 0;
  let workoutsCount = 0;
  let timeMinutes = 0;
  let prsCount = 0;
  let firstDate: Date | null = null;

  if (loggedWorkouts.value.length > 0) {
    workoutsCount = loggedWorkouts.value.length;

    // History is fetched sorted by date ascending, so the first item is the earliest
    if (loggedWorkouts.value[0]?.date) {
        firstDate = ensureDateObject(loggedWorkouts.value[0].date);
    }

    loggedWorkouts.value.forEach(workout => {
      workout.performedExercises?.forEach(ex => {
        ex.sets.forEach(set => {
          if (typeof set.actualWeight === 'number' && typeof set.actualReps === 'number' && set.actualReps > 0) {
            volume += set.actualWeight * set.actualReps;
          }
        });
        if (ex.isPR) {
          prsCount++;
        }
      });

      if (typeof workout.durationMinutes === 'number' && workout.durationMinutes > 0) {
        timeMinutes += workout.durationMinutes;
      }
    });
  }

  return {
    totalVolume: volume,
    totalWorkouts: workoutsCount,
    totalTimeMinutes: timeMinutes,
    totalPRs: prsCount,
    firstWorkoutDate: firstDate,
  };
});

const fetchAllWorkoutHistoryForStats = async () => {
  if (!user.value || !user.value.uid) {
    statsError.value = "User not available for stats.";
    isLoadingStats.value = false;
    loggedWorkouts.value = [];
    return;
  }
  isLoadingStats.value = true;
  statsError.value = null;
  const history: LoggedWorkout[] = [];
  try {
    const historyCollectionRef = collection(db, 'users', user.value.uid, 'loggedWorkouts');
    const q = query(historyCollectionRef, orderBy('date', 'asc')); // Oldest first

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((docSnap) => {
      history.push({ id: docSnap.id, ...docSnap.data() } as LoggedWorkout);
    });
    loggedWorkouts.value = history;
  } catch (e: any) {
    console.error("Error fetching workout history for stats:", e);
    statsError.value = "Failed to load workout stats. " + e.message;
    loggedWorkouts.value = [];
  } finally {
    isLoadingStats.value = false;
  }
};

const formatLifetimeDuration = (totalMinutes: number): string => {
  if (totalMinutes === 0 && loggedWorkouts.value.length > 0) return '0 minutes';
  if (!totalMinutes || totalMinutes <= 0) return 'N/A';

  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = Math.floor(totalMinutes % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (minutes > 0 || parts.length === 0) {
    parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  }
  
  return parts.length > 0 ? parts.join(', ') : (loggedWorkouts.value.length > 0 ? '0 minutes' : 'N/A');
};

const formatDateForDisplay = (date: Date | null): string => {
    if (!date) return 'N/A';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

const handleLogout = async () => {
  try {
    await logout();
    router.push('/');
  } catch (error) {
    console.error('Error during profile logout:', error);
    // Optionally, show an error message to the user
  }
};

onMounted(() => {
  if (user.value) {
    fetchAllWorkoutHistoryForStats();
  }
});

watch(user, (newUser) => {
  if (newUser && newUser.uid) { // Ensure newUser has uid before fetching
    fetchAllWorkoutHistoryForStats();
  } else {
    loggedWorkouts.value = [];
    isLoadingStats.value = true; // Reset for next potential login
    statsError.value = null;
  }
}, { immediate: true }); // immediate:true will call it on component setup if user is already available

</script>

<style scoped>
.profile-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  max-width: 1200px; /* Max width for the profile content */
  margin: 20px auto;
}

.profile-view h1 {
    margin-bottom: 20px;
    color: #333;
}

.user-details-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 25px; /* Space between cards */
}

.card { /* General card styling */
  background-color: #fff;
  padding: 20px 25px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  text-align: left;
  width: 100%; /* Make cards take full width of container */
  box-sizing: border-box;
}

.user-details {
  /* user-details specific styles if any, inherits from .card */
}

.user-details p {
  margin: 12px 0;
  font-size: 1.05em;
  color: #333;
}
.user-details p strong {
    color: #555;
    min-width: 70px; /* Align values a bit */
    display: inline-block;
}

.user-photo {
  display: block;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin: 0 auto 20px auto;
  border: 3px solid #007bff; /* Primary color border */
  object-fit: cover;
}

.logout-button {
  display: block;
  margin: 25px auto 10px auto;
  padding: 12px 25px;
  font-size: 1em;
  font-weight: bold;
  background-color: #DB4437;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}

.logout-button:hover {
  background-color: #c23327;
}

/* Lifetime Stats Card */
.lifetime-stats-card h2 {
  text-align: center;
  margin-top: 0;
  margin-bottom: 25px;
  color: #333;
  font-size: 1.6em;
}

.lifetime-stats-card ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.lifetime-stats-card li {
  display: flex;
  align-items: center;
  font-size: 1em;
  color: #454545;
  padding: 12px 5px; /* Added some horizontal padding */
  border-bottom: 1px solid #f0f0f0;
}

.lifetime-stats-card li:last-child {
  border-bottom: none;
}

.stat-icon {
  font-size: 1.6em;
  margin-right: 15px;
  min-width: 25px; /* Ensure alignment even if icon is small */
  text-align: center;
  color: #007bff; /* Primary color for icons */
}

.stat-label {
  font-weight: 500;
  margin-right: 8px;
  color: #333;
  flex-shrink: 0; /* Prevent label from shrinking if value is long */
}

.stat-value {
  font-weight: bold;
  color: #28a745; /* Green for positive stats */
  margin-left: auto;
  text-align: right;
  white-space: nowrap; /* Prevent wrapping for consistency */
}

.no-stats,
.loading-message.card, /* Style loading message if it's also a card */
.error-message.card {  /* Style error message if it's also a card */
  text-align: center;
  color: #6c757d;
  padding: 30px 20px;
}
.error-message.card {
    color: #dc3545;
    background-color: #f8d7da;
    border: 1px solid #f5c6cb; /* Add border if it's a card */
}
.loading-message:not(.card) { /* Style for non-card loading messages */
  text-align: center;
  padding: 20px;
  color: #6c757d;
}

</style>