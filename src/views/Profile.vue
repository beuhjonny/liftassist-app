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



             <div class="setting-item">
                <label>Embiggen Buttons</label>
                <div style="display: flex; align-items: center;">
                    <label class="switch" style="position: relative; display: inline-block; width: 40px; height: 24px;">
                        <input type="checkbox" :checked="settings.embiggenButtons" @change="toggleEmbiggen" style="opacity: 0; width: 0; height: 0;">
                        <span class="slider round" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 34px;"></span>
                        <span class="slider-before" :style="{ position: 'absolute', content: '\'\'', height: '16px', width: '16px', left: '4px', bottom: '4px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%', transform: settings.embiggenButtons ? 'translateX(16px)' : 'translateX(0)' }"></span>
                    </label>
                    <span style="margin-left: 10px; font-size: 0.9em; opacity: 0.8;">{{ settings.embiggenButtons ? 'On' : 'Off' }}</span>
                </div>
            </div>

            <div class="setting-item device-pairing-section">
                <label>Connect Device</label>
                <div class="pairing-control">
                    <input 
                        v-model="pairingCodeInput"
                        placeholder="Garmin Code" 
                        maxlength="6"
                        class="pairing-input"
                        :disabled="isPairing"
                        @keyup.enter="handlePairing"
                    />
                    <button @click="handlePairing" class="button-primary small" :disabled="!pairingCodeInput || isPairing">
                        {{ isPairing ? '...' : 'Link' }}
                    </button>
                    <!-- Status Icons -->
                    <span v-if="pairingStatus === 'success'" class="pairing-result success">✅</span>
                    <span v-if="pairingStatus === 'error'" class="pairing-result error">❌</span>
                </div>
            </div>
            <p v-if="pairingMessage" :class="pairingStatus === 'success' ? 'success-text' : 'error-text'" style="font-size: 0.85em; margin-top: -15px; text-align: right;">{{ pairingMessage }}</p>

            <!-- Strava Integration Setting Item -->
            <div class="setting-item strava-section-item" style="border-top: 1px dashed var(--color-card-border); padding-top: 15px; margin-top: 15px;">
                <label>Strava Sync</label>
                <div class="strava-control">
                    <template v-if="isConnected">
                        <span class="strava-status connected">Connected as <strong>{{ athleteName }}</strong></span>
                        <div class="strava-actions" style="display: flex; gap: 8px; margin-top: 5px; flex-wrap: wrap;">
                            <button @click="handleStravaSync(false)" class="button-primary small" :disabled="isStravaLoading">
                                {{ isStravaLoading ? 'Syncing...' : 'Sync Runs' }}
                            </button>
                            <button @click="handleStravaSync(true)" class="button-secondary small" :disabled="isStravaLoading" title="Sync entire history of runs (up to 1000 activities)">
                                Full History Sync
                            </button>
                            <button @click="handleStravaDisconnect" class="button-secondary small" :disabled="isStravaLoading">
                                Disconnect
                            </button>
                        </div>
                    </template>
                    <template v-else-if="isConfigured">
                        <span class="strava-status configured">API Configured. Ready.</span>
                        <div class="strava-actions" style="display: flex; gap: 8px; margin-top: 5px;">
                            <button @click="handleStravaConnect" class="button-primary small" :disabled="isStravaLoading">
                                Connect Strava
                            </button>
                            <button @click="handleStravaDisconnect" class="button-secondary small" :disabled="isStravaLoading">
                                Reset
                            </button>
                        </div>
                    </template>
                    <template v-else>
                        <button @click="showStravaConfigForm = !showStravaConfigForm" class="button-secondary small">
                            {{ showStravaConfigForm ? 'Hide Config' : 'Configure Strava' }}
                        </button>
                    </template>
                </div>
            </div>

            <!-- Strava Config Form -->
            <div v-if="showStravaConfigForm && !isConnected && !isConfigured" class="strava-config-form card-inset" style="margin-top: 10px; padding: 15px; background: var(--color-card-mute); border-radius: 8px; font-size: 0.9em; display: flex; flex-direction: column; gap: 10px; border: 1px solid var(--color-card-border);">
                <p style="margin: 0; opacity: 0.8; line-height: 1.4;">
                    Create a developer app at <a href="https://www.strava.com/settings/api" target="_blank" style="color: var(--color-primary); text-decoration: underline;">strava.com/settings/api</a>.
                    Set authorization callback domain to <code>localhost</code> (local) or <code>lift-logic-app.web.app</code> (prod).
                </p>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    <label style="font-weight: bold;">Client ID</label>
                    <input v-model="stravaClientIdField" placeholder="e.g. 258025" style="padding: 8px; border-radius: 6px; border: 1px solid var(--color-card-border); background: var(--color-card-bg); color: var(--color-card-text);" />
                </div>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    <label style="font-weight: bold;">Client Secret</label>
                    <input v-model="stravaClientSecretField" type="password" placeholder="Client Secret" style="padding: 8px; border-radius: 6px; border: 1px solid var(--color-card-border); background: var(--color-card-bg); color: var(--color-card-text);" />
                </div>
                <button @click="handleStravaConnect" class="button-primary small" :disabled="!stravaClientIdField || !stravaClientSecretField" style="width: 100%; margin-top: 5px;">
                    Save & Connect
                </button>
            </div>

            <!-- Strava Preferences Toggles when Connected -->
            <div v-if="isConnected" class="strava-preferences card-inset" style="margin-top: 10px; padding: 15px; background: var(--color-card-mute); border-radius: 8px; font-size: 0.9em; display: flex; flex-direction: column; gap: 10px; border: 1px solid var(--color-card-border);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <label style="font-weight: 500;">Upload lifts to Strava</label>
                    <label class="switch" style="position: relative; display: inline-block; width: 40px; height: 24px;">
                        <input type="checkbox" v-model="enablePushToStrava" @change="handlePrefChange" style="opacity: 0; width: 0; height: 0;">
                        <span class="slider round" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 34px;"></span>
                        <span class="slider-before" :style="{ position: 'absolute', content: '\'\'', height: '16px', width: '16px', left: '4px', bottom: '4px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%', transform: enablePushToStrava ? 'translateX(16px)' : 'translateX(0)' }"></span>
                    </label>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <label style="font-weight: 500;">Fetch runs from Strava</label>
                    <label class="switch" style="position: relative; display: inline-block; width: 40px; height: 24px;">
                        <input type="checkbox" v-model="enablePullFromStrava" @change="handlePrefChange" style="opacity: 0; width: 0; height: 0;">
                        <span class="slider round" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 34px;"></span>
                        <span class="slider-before" :style="{ position: 'absolute', content: '\'\'', height: '16px', width: '16px', left: '4px', bottom: '4px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%', transform: enablePullFromStrava ? 'translateX(16px)' : 'translateX(0)' }"></span>
                    </label>
                </div>
            </div>

            <!-- Strava Status Messages -->
            <p v-if="stravaMessage" :class="stravaStatusType === 'success' ? 'success-text' : 'error-text'" style="font-size: 0.85em; margin-top: 5px; text-align: right; font-weight: 500;">{{ stravaMessage }}</p>

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
          
          <li :class="{ 'stat-highlight': lifetimeStats.weeklyStreak > 1 }">
            <span class="stat-icon">🔥</span>
            <span class="stat-label">Weekly Streak (2+):</span>
            <span class="stat-value">{{ lifetimeStats.weeklyStreak }} {{ lifetimeStats.weeklyStreak === 1 ? 'Week' : 'Weeks' }}</span>
          </li>

          <li>
            <span class="stat-icon">⏱️</span>
            <span class="stat-label">Total Training Time:</span>
            <span class="stat-value">{{ formatLifetimeDuration(lifetimeStats.totalTimeMinutes) }}</span>
          </li>
          <li>
            <span class="stat-icon">📈</span>
            <span class="stat-label">Overloads Triggered:</span>
            <span class="stat-value">{{ lifetimeStats.totalOverloads }}</span>
          </li>
          <li>
            <span class="stat-icon">🦍</span>
            <span class="stat-label">Heaviest Lift Ever:</span>
            <span class="stat-value">{{ lifetimeStats.heaviestLift.toLocaleString() }} {{ displayUnit(settings.weightUnit) }}</span>
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

      <!-- About Modal properly placed INSIDE the container, below other cards -->
      <div class="about-section-profile" style="text-align: center; margin-top: 20px;">
          <AboutModal />
      </div>

    </div>
    
    <!-- Loading State for User (v-else for v-if="user") -->
    <div v-else class="loading-message card">
      <p>Loading user information or not logged in...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { collection, query, getDocs, orderBy, Timestamp, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebase'; // Adjust path if needed
import useAuth from '../composables/useAuth'; // Adjust path if needed
import useSettings, { type ThemeOption, type TimerSoundOption, type WeightUnitOption } from '../composables/useSettings'; 
import { playTone } from '../utils/audio';
import { toDisplay, displayUnit } from '../utils/weight';
import AboutModal from '@/components/AboutModal.vue';
import useStrava from '../composables/useStrava';

import type { LoggedWorkout, PerformedExerciseInLog, LoggedSetData } from '@/types';

interface LifetimeStats {
  totalVolume: number;
  totalWorkouts: number;
  totalTimeMinutes: number;
  totalOverloads: number;
  firstWorkoutDate: Date | null;
  weeklyStreak: number;
  heaviestLift: number;
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

const getWeekStart = (date: Date): number => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
};

const lifetimeStats = computed<LifetimeStats>(() => {
  let volume = 0;
  let workoutsCount = 0;
  let timeMinutes = 0;
  let overloadsCount = 0;
  let maxWeight = 0;
  let firstDate: Date | null = null;
  
  // Streak Calculation
  const workoutsByWeek = new Map<number, number>();

  if (loggedWorkouts.value.length > 0) {
    workoutsCount = loggedWorkouts.value.length;

    // History is fetched sorted by date ascending, so the first item is the earliest
    if (loggedWorkouts.value[0]?.date) {
        firstDate = ensureDateObject(loggedWorkouts.value[0].date);
    }

    loggedWorkouts.value.forEach(workout => {
        // Group by week for streak
        if (workout.date) {
            const dateObj = ensureDateObject(workout.date);
            const weekStart = getWeekStart(dateObj);
            workoutsByWeek.set(weekStart, (workoutsByWeek.get(weekStart) || 0) + 1);
        }

      workout.performedExercises?.forEach(ex => {
        ex.sets.forEach(set => {
          if (typeof set.actualWeight === 'number' && typeof set.actualReps === 'number' && set.actualReps > 0) {
            volume += set.actualWeight * set.actualReps;
            
            // Allow 0 reps? No, valid lift needs reps.
            if (set.status === 'done' && set.actualWeight > maxWeight) {
                maxWeight = set.actualWeight;
            }
          }
        });
        if (ex.isPR) {
          overloadsCount++;
        }
      });

      if (typeof workout.durationMinutes === 'number' && workout.durationMinutes > 0) {
        timeMinutes += workout.durationMinutes;
      }
    });
  }

  // Calculate Streak
  let streak = 0;
  const currentWeekStart = getWeekStart(new Date());
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

  // Check current week
  if ((workoutsByWeek.get(currentWeekStart) || 0) >= 2) {
      streak++;
  }

  // Check past weeks consecutively
  let checkWeek = currentWeekStart - oneWeekMs;
  while (true) {
      if ((workoutsByWeek.get(checkWeek) || 0) >= 2) {
          streak++;
          checkWeek -= oneWeekMs;
      } else {
          break;
      }
  }

  return {
    totalVolume: toDisplay(volume, settings.value.weightUnit),
    totalWorkouts: workoutsCount,
    totalTimeMinutes: timeMinutes,
    totalOverloads: overloadsCount,
    firstWorkoutDate: firstDate,
    weeklyStreak: streak,
    heaviestLift: toDisplay(maxWeight, settings.value.weightUnit)
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

const route = useRoute();

const {
  isConfigured,
  isConnected,
  athleteName,
  enablePushToStrava,
  enablePullFromStrava,
  clientId,
  clientSecret,
  isLoading: isStravaLoading,
  connect: stravaConnect,
  disconnect: stravaDisconnect,
  exchangeCode: stravaExchangeCode,
  syncNow: stravaSyncNow,
  updatePreferences: stravaUpdatePreferences
} = useStrava();

const showStravaConfigForm = ref(false);
const stravaClientIdField = ref('');
const stravaClientSecretField = ref('');
const stravaStatusType = ref<'success' | 'error' | 'info'>('info');
const stravaMessage = ref('');

// Prepopulate config fields if client credentials exist
watch([clientId, clientSecret], ([newId, newSec]) => {
  if (newId) stravaClientIdField.value = newId;
  if (newSec) stravaClientSecretField.value = newSec;
}, { immediate: true });

onMounted(async () => {
  if (user.value) {
    fetchAllWorkoutHistoryForStats();
  }

  // Handle Strava OAuth callback redirects
  const code = route.query.code as string;
  if (code) {
    stravaStatusType.value = 'info';
    stravaMessage.value = 'Exchanging authorization code with Strava...';
    try {
      await stravaExchangeCode(code);
      stravaStatusType.value = 'success';
      stravaMessage.value = 'Strava connected successfully!';
      // Clear query parameters from URL
      router.replace({ query: {} });
      setTimeout(() => { stravaMessage.value = ''; }, 4000);
    } catch (e: any) {
      stravaStatusType.value = 'error';
      stravaMessage.value = e.message || 'Failed to authorize with Strava.';
    }
  }
});

const handleStravaConnect = async () => {
  stravaStatusType.value = 'info';
  stravaMessage.value = 'Redirecting to Strava...';
  
  const cId = stravaClientIdField.value || clientId.value;
  const cSec = stravaClientSecretField.value || clientSecret.value;

  if (!cId || !cSec) {
    stravaStatusType.value = 'error';
    stravaMessage.value = 'Client ID and Client Secret are required.';
    return;
  }

  await stravaConnect(cId, cSec);
};

const handleStravaDisconnect = async () => {
  await stravaDisconnect();
  showStravaConfigForm.value = false;
  stravaClientIdField.value = '';
  stravaClientSecretField.value = '';
  stravaStatusType.value = 'success';
  stravaMessage.value = 'Strava connection disconnected.';
  setTimeout(() => { stravaMessage.value = ''; }, 3000);
};

const handleStravaSync = async (fullSync = false) => {
  stravaStatusType.value = 'info';
  stravaMessage.value = fullSync ? 'Performing a full history sync from Strava (this may take a few seconds)...' : 'Syncing activities from Strava...';
  try {
    const count = await stravaSyncNow(fullSync);
    stravaStatusType.value = 'success';
    stravaMessage.value = `Sync complete! Synced ${count} runs/cardio activities.`;
    setTimeout(() => { stravaMessage.value = ''; }, 4000);
  } catch (e: any) {
    stravaStatusType.value = 'error';
    stravaMessage.value = e.message || 'Sync failed.';
  }
};

const handlePrefChange = async () => {
  await stravaUpdatePreferences(enablePushToStrava.value, enablePullFromStrava.value);
};

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

const toggleEmbiggen = (event: Event) => {
    const isChecked = (event.target as HTMLInputElement).checked;
    saveSettings({ embiggenButtons: isChecked });
};

// Device Pairing Logic
const pairingCodeInput = ref('');
const isPairing = ref(false);
const pairingStatus = ref<'idle' | 'success' | 'error'>('idle');
const pairingMessage = ref('');

const handlePairing = async () => {
    if (!pairingCodeInput.value || pairingCodeInput.value.length < 6) return;
    
    isPairing.value = true;
    pairingStatus.value = 'idle';
    pairingMessage.value = '';

    try {
        const functions = getFunctions();
        const claimFunc = httpsCallable(functions, 'claimPairingCode');
        
        await claimFunc({ code: pairingCodeInput.value });
        
        pairingStatus.value = 'success';
        pairingMessage.value = 'Device linked successfully!';
        pairingCodeInput.value = ''; // Clear input
        
        // Clear message after 3s
        setTimeout(() => { pairingStatus.value = 'idle'; pairingMessage.value = ''; }, 3000);

    } catch (e: any) {
        console.error("Pairing failed:", e);
        pairingStatus.value = 'error';
        pairingMessage.value = e.message || "Failed to link device.";
    } finally {
        isPairing.value = false;
    }
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
      flex-wrap: wrap; /* Allow wrapping on very small screens */
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

/* Toggle Switch Styles */
.switch input:checked + .slider {
  background-color: #2196F3;
}

.switch input:focus + .slider {
  box-shadow: 0 0 1px #2196F3;
}

.stat-highlight {
    background-color: rgba(255, 193, 7, 0.1); /* Subtle Gold BG */
    border-radius: 4px;
}

/* Pairing Styles */
.pairing-control {
    display: flex;
    align-items: center;
    gap: 10px;
}

.pairing-input {
    padding: 8px;
    border-radius: 6px;
    border: 1px solid var(--color-card-border);
    background: var(--color-card-bg);
    color: var(--color-card-text);
    width: 80px;
    text-align: center;
    text-transform: uppercase;
    font-family: monospace;
    font-size: 1.1em;
}

.button-primary.small {
    padding: 8px 12px;
    font-size: 0.9em;
}

.pairing-result {
    font-size: 1.2em;
}

/* Strava Styles */
.strava-status {
    font-size: 0.9em;
    display: block;
    line-height: 1.4;
}
.strava-status.connected {
    color: var(--color-success, #28a745);
}
.strava-status.configured {
    color: var(--color-primary, #007bff);
}
.strava-control {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 5px;
}
@media (max-width: 600px) {
  .strava-control {
      align-items: flex-start;
      width: 100%;
  }
}
</style>