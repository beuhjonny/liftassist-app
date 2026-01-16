<template>
  <div class="profile-view">
    <h1>Profile</h1>
    <div v-if="user" class="user-details-container">
      <div class="user-details card">
        <img v-if="user.photoURL" :src="user.photoURL" alt="User Photo" class="user-photo" />
        <p><strong>Name:</strong> {{ user.displayName || 'N/A' }}</p>
        <p><strong>Email:</strong> {{ user.email || 'N/A' }}</p>
        
        <div class="settings-section" style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
            <h3>Settings ⚙️</h3>
            
            <div class="setting-item">
                <label>Theme</label>
                <div class="segmented-control">
                    <button :class="{ active: settings.theme === 'original' }" @click="updateTheme('original')">Original</button>
                    <button :class="{ active: settings.theme === 'system' }" @click="updateTheme('system')">System</button>
                    <button :class="{ active: settings.theme === 'light' }" @click="updateTheme('light')">Light</button>
                    <button :class="{ active: settings.theme === 'dark' }" @click="updateTheme('dark')">Dark</button>
                </div>
            </div>

            <div class="setting-item timer-combined-row">
                <label>Timer</label>
                <div class="timer-controls">
                    <select :value="settings.timerSound" @change="updateTimerSound($event)" class="sound-select">
                        <option value="bell">🔔 Bell</option>
                        <option value="beep">🤖 Beep</option>
                        <option value="chime">✨ Chime</option>
                        <option value="ding">🛎️ Ding</option>
                        <option value="mute">🔕 Mute</option>
                    </select>
                    
                    <div class="volume-control" v-if="settings.timerSound !== 'mute'" title="Volume">
                        <span class="volume-icon">🔊</span>
                        <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.1" 
                            :value="settings.timerVolume" 
                            @input="updateVolume($event)" 
                            class="volume-slider"
                        />
                    </div>

                    <button v-if="settings.timerSound !== 'mute'" @click="previewSound" class="button-icon small" title="Preview Sound">▶️</button>
                </div>
            </div>

             <div class="setting-item">
                <label>Weight Unit</label>
                <div class="segmented-control">
                    <button :class="{ active: settings.weightUnit === 'lbs' }" @click="updateUnit('lbs')">lbs</button>
                    <button :class="{ active: settings.weightUnit === 'kg' }" @click="updateUnit('kg')">kg</button>
                </div>
            </div>

            <div class="setting-item">
                <label style="white-space: nowrap;">Default Rest (sec)</label>
                <div style="display: flex; align-items: center; justify-content: flex-end; width: 100%;">
                    <input 
                        type="number" 
                        min="0" 
                        step="5" 
                        :value="settings.defaultRestTimer" 
                        @change="updateRestTimer($event)"
                        style="padding: 8px; border-radius: 6px; border: 1px solid var(--color-card-border); background: var(--color-card-bg); color: var(--color-card-text); width: 80px; text-align: center;"
                    />
                </div>
            </div>

        </div>



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
            <span class="stat-value">{{ lifetimeStats.totalVolume.toLocaleString() }} {{ displayUnit(settings.weightUnit) }}</span>
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
import { collection, query, getDocs, orderBy, Timestamp, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust path if needed
import useAuth from '../composables/useAuth'; // Adjust path if needed
import useSettings, { type ThemeOption, type TimerSoundOption, type WeightUnitOption } from '../composables/useSettings'; 
import { playTone } from '../utils/audio';
import { toDisplay, displayUnit } from '../utils/weight';

import type { LoggedWorkout, PerformedExerciseInLog, LoggedSetData } from '@/types';

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
    totalVolume: toDisplay(volume, settings.value.weightUnit),
    totalWorkouts: workoutsCount,
    totalTimeMinutes: timeMinutes,
    totalPRs: prsCount,
    firstWorkoutDate: firstDate
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

// Settings Logic
const { settings, saveSettings } = useSettings();

const updateTheme = (theme: ThemeOption) => {
    saveSettings({ theme });
};

const updateTimerSound = (event: Event) => {
    const val = (event.target as HTMLSelectElement).value as TimerSoundOption;
    saveSettings({ timerSound: val });
};

const updateVolume = (event: Event) => {
    const val = parseFloat((event.target as HTMLInputElement).value);
    saveSettings({ timerVolume: val });
};

const updateUnit = (unit: WeightUnitOption) => {
    saveSettings({ weightUnit: unit });
};

const updateRestTimer = (event: Event) => {
    const val = parseInt((event.target as HTMLInputElement).value);
    if (!isNaN(val) && val >= 0) {
        saveSettings({ defaultRestTimer: val });
    }
};

const previewSound = () => {
    playTone(settings.value.timerSound, settings.value.timerVolume);
};

</script>

<style scoped>
.profile-view {
  padding: 10px;
  max-width: 700px;
  margin: 20px auto;
}

.profile-view h1 {
  text-align: center;
  margin-bottom: 20px;
  margin-top: 0;
  color: var(--color-heading);
  font-family: 'Montserrat', sans-serif;
  font-weight: 400;
}

.user-details-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 25px; 
}

.card { /* General card styling */
  background-color: var(--color-card-bg);
  padding: 20px 25px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  text-align: left;
  width: 100%; /* Make cards take full width of .user-details-container */
  box-sizing: border-box;
  border: 1px solid var(--color-card-border);
}

.user-details {
  /* user-details specific styles if any, inherits from .card */
}

.user-details p {
  margin: 10px 0;
  font-size: 1.1em;
  color: var(--color-card-text);
}
.user-details p strong {
    color: var(--color-card-heading);
  min-width: 80px; /* Adjusted slightly */
  display: inline-block;

}

.user-photo {
  display: block;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin: 0 auto 15px auto;
  border: 2px solid var(--color-card-border);
  object-fit: cover;
}

.logout-button {
  display: block;
  margin: 25px auto 10px auto;
  padding: 10px 20px;
  font-size: 1em;
  font-weight: bold;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
  width: 100%;
}

.logout-button:hover {
  background-color: #c82333;
}

/* Lifetime Stats Card */
.lifetime-stats-card h2 {
  text-align: center;
  margin-top: 0;
  margin-bottom: 25px;
  color: var(--color-card-heading);
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
  color: var(--color-card-text);
  padding: 12px 5px;
  border-bottom: 1px solid var(--color-card-border);
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
  color: var(--color-card-heading);
  flex-shrink: 0; /* Prevent label from shrinking */
}


.stat-value {
font-weight: bold;
  color: #28a745; /* Or a CSS variable */
  margin-left: auto; /* Pushes value to the right */
  text-align: right;
  white-space: nowrap; /* Keep on one line */
  overflow: hidden;    /* Hide overflow */
  text-overflow: ellipsis; /* Show ... if too long */
  min-width: 0; /* Crucial for text-overflow to work reliably in flex children */
  /* max-width: 180px; /* Optional: if you need to cap it even if space is available */
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

/* Settings Styles */
.settings-section h3 {
    margin-bottom: 20px;
    color: var(--color-card-heading);
    border-bottom: 1px solid var(--color-card-border);
    padding-bottom: 10px;
}

.setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.setting-item label {
    font-weight: 500;
    color: var(--color-card-text);
}

.segmented-control {
    display: flex;
    background: var(--color-card-mute);
    padding: 3px;
    border-radius: 8px;
    border: 1px solid var(--color-card-border);
}

.segmented-control button {
    background: none;
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9em;
    color: var(--color-card-text);
    transition: all 0.2s;
}

.segmented-control button.active {
    background: #007bff;
    color: white;
    font-weight: bold;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

input[type="range"] {
    width: 120px;
    accent-color: #007bff;
}

select {
    padding: 8px;
    border-radius: 6px;
    border: 1px solid var(--color-card-border);
    background: var(--color-card-bg);
    color: var(--color-card-text);
}

/* Compact Timer Styles - Fixed Layout */
.timer-combined-row {
    display: flex;
    align-items: center;
    /* justify-content: space-between; -- existing setting-item handles this */
    flex-wrap: nowrap; /* Prevent wrapping */
    gap: 15px;
}

.timer-combined-row label {
    margin-bottom: 0;
    min-width: fit-content;
    white-space: nowrap;
}

.timer-controls {
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px; /* Slightly tighter gap */
    width: 100%; /* Ensure it spans available space */
}

/* Select */
.sound-select {
    padding: 6px;
    border-radius: 4px;
    border: 1px solid var(--color-card-border);
    background-color: var(--color-card-bg);
    color: var(--color-card-text);
    /* Remove fixed max-width/flex-grow to just fit content comfortably */
    width: auto;
    min-width: 100px;
    cursor: pointer;
}

/* Volume */
.volume-control {
    display: flex;
    align-items: center;
    gap: 4px;
    background-color: var(--color-card-mute);
    padding: 3px 6px;
    border-radius: 20px;
    border: 1px solid var(--color-card-border);
    flex-shrink: 0; /* Don't shrink volume control */
}

.volume-icon {
    font-size: 0.85em;
    line-height: 1;
}

.volume-slider {
    width: 70px; /* Slightly smaller */
    margin: 0;
    cursor: pointer;
    vertical-align: middle;
}

/* Button */
.button-icon.small {
    padding: 5px 8px; /* Compact padding */
    font-size: 1.1em;
    width: auto;
    background-color: var(--color-card-mute);
    border: 1px solid var(--color-card-border);
    border-radius: 4px;
    flex-shrink: 0; /* Keep button size */
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}
.button-icon.small:hover {
    background-color: var(--color-card-border);
}

.success-text { color: #28a745; }
.error-text { color: #dc3545; }

/* Mobile Adjustments */
@media (max-width: 600px) {
  .profile-view {
    padding: 5px; 
    margin: 10px auto;
  }
  .card {
    padding: 15px; /* Reduced padding on mobile */
  }
  
  /* Stack settings */
  .setting-item, .timer-combined-row {
     flex-direction: column;
     align-items: flex-start;
     gap: 8px;
  }
  
  .setting-item label, .timer-combined-row label {
      margin-bottom: 5px; 
  }
  
  .timer-controls {
      width: 100%;
      justify-content: space-between; 
  }
  
  .segmented-control {
      width: 100%;
      justify-content: center;
  }
  
  .volume-control {
      flex-grow: 1; 
      justify-content: center;
  }
  .volume-slider {
      width: 100%; 
      max-width: 120px;
  }
}
</style>