<template>
  <div class="profile-view">
    <h1>Profile</h1>
    <div v-if="user" class="user-details-container">
      
      <!-- Account Card -->
      <div class="user-details card">
        <h2>Account 👤</h2>
        <div class="account-info">
          <img v-if="user.photoURL" :src="user.photoURL" alt="User Photo" class="user-photo" />
          <div class="account-details">
            <p><strong>Name:</strong> {{ user.displayName || 'N/A' }}</p>
            <p><strong>Email:</strong> {{ user.email || 'N/A' }}</p>
          </div>
        </div>
        <button @click="handleLogout" class="logout-button">Logout</button>
      </div>

      <!-- Delete Account Confirmation Modal -->
      <div v-if="showDeleteConfirm" class="delete-modal-overlay" @click.self="showDeleteConfirm = false">
        <div class="delete-modal-content card">
          <button @click="showDeleteConfirm = false" class="modal-close-button" aria-label="Close delete modal">&times;</button>
          <h2 style="color: var(--color-danger, #dc3545);">Delete Account Permanently? ⚠️</h2>
          <p style="margin-bottom: 20px; line-height: 1.5; color: var(--color-card-text); text-align: left;">
            This action is irreversible. All your routines, settings, workout history, and third-party pairings (Strava/Garmin) will be permanently erased.
          </p>
          <div v-if="deleteAccountError" class="error-text" style="margin-bottom: 15px; font-weight: 600; text-align: left;">
            {{ deleteAccountError }}
          </div>
          <div class="modal-actions" style="display: flex; gap: 10px; justify-content: flex-end; width: 100%;">
            <button @click="showDeleteConfirm = false" class="button-secondary" :disabled="isDeletingAccount" style="padding: 10px 18px;">Cancel</button>
            <button @click="handleDeleteAccount" class="button-danger" :disabled="isDeletingAccount" style="padding: 10px 18px;">
              {{ isDeletingAccount ? 'Deleting...' : 'Delete permanently' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Settings Card -->
      <div class="settings-card card">
        <h2>Settings ⚙️</h2>
        
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

         <div class="setting-item" style="border-bottom: 1px dashed var(--color-card-border); padding-bottom: 10px; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <label style="display: flex; align-items: center; gap: 6px; font-weight: 500;">
                    Exercise Form Demos ℹ️
                    <span style="font-size: 0.85em; cursor: help; opacity: 0.7;" title="Puts an info ℹ️ icon next to exercise names during active workouts and routine editing to watch video demos & form tips.">ℹ️</span>
                </label>
                <div style="display: flex; align-items: center;">
                    <label class="switch" style="position: relative; display: inline-block; width: 40px; height: 24px;">
                        <input type="checkbox" :checked="settings.enableVideoDemos !== false" @change="toggleVideoDemos" style="opacity: 0; width: 0; height: 0;">
                        <span class="slider round" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 34px;"></span>
                        <span class="slider-before" :style="{ position: 'absolute', content: '\'\'', height: '16px', width: '16px', left: '4px', bottom: '4px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%', transform: settings.enableVideoDemos !== false ? 'translateX(16px)' : 'translateX(0)' }"></span>
                    </label>
                    <span style="margin-left: 10px; font-size: 0.9em; opacity: 0.8;">{{ settings.enableVideoDemos !== false ? 'On' : 'Off' }}</span>
                </div>
            </div>
        </div>

        <div class="setting-item">
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <label style="display: flex; align-items: center; gap: 6px; font-weight: 500;">
                    Workout Skip Tracker ⚠️
                    <span style="font-size: 0.85em; cursor: help; opacity: 0.7;" title="Shows warning badges (e.g. ⚠️ 1) on routine days when workouts are completed out of order (like skipping leg day). Turn off to hide skip shaming.">ℹ️</span>
                </label>
                <div style="display: flex; align-items: center;">
                    <label class="switch" style="position: relative; display: inline-block; width: 40px; height: 24px;">
                        <input type="checkbox" :checked="settings.enableSkipTracker !== false" @change="toggleSkipTracker" style="opacity: 0; width: 0; height: 0;">
                        <span class="slider round" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 34px;"></span>
                        <span class="slider-before" :style="{ position: 'absolute', content: '\'\'', height: '16px', width: '16px', left: '4px', bottom: '4px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%', transform: settings.enableSkipTracker !== false ? 'translateX(16px)' : 'translateX(0)' }"></span>
                    </label>
                    <span style="margin-left: 10px; font-size: 0.9em; opacity: 0.8;">{{ settings.enableSkipTracker !== false ? 'On' : 'Off' }}</span>
                </div>
            </div>
        </div>
      </div>

      <!-- Connections Card -->
      <div class="connections-card card">
        <h2>Connections 🔗</h2>
        
        <!-- Garmin Pairing Section -->
        <div class="setting-item device-pairing-section">
            <label>Garmin Link</label>
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
        <p v-if="pairingMessage" :class="pairingStatus === 'success' ? 'success-text' : 'error-text'" style="font-size: 0.85em; margin-top: -10px; text-align: right; margin-bottom: 15px;">{{ pairingMessage }}</p>

        <!-- Strava Integration Setting Item -->
        <div class="setting-item strava-section-item" style="border-top: 1px dashed var(--color-card-border); padding-top: 15px; margin-top: 15px;">
            <label>Strava Sync</label>
            <div class="strava-control">
                <template v-if="isConnected">
                    <div style="display: flex; align-items: center; gap: 10px; justify-content: flex-end; width: 100%;">
                        <span class="strava-status connected">Connected as <strong>{{ athleteName }}</strong></span>
                        <button @click="showStravaManagement = !showStravaManagement" class="button-secondary small" style="padding: 4px 8px; font-size: 0.85em;">
                            {{ showStravaManagement ? 'Hide ⚙️' : 'Manage ⚙️' }}
                        </button>
                    </div>
                </template>
                <template v-else>
                    <div style="display: flex; align-items: center; gap: 10px; justify-content: flex-end; width: 100%;">
                        <button @click="handleStravaConnect" class="button-primary small" :disabled="isStravaLoading || !isConfigured" style="background-color: #FC4C02; border-color: #FC4C02; color: white; display: inline-flex; align-items: center; gap: 5px;">
                            Connect with Strava 🏃
                        </button>
                    </div>
                </template>
            </div>
        </div>
        <p v-if="!isConfigured && !isConnected" class="error-text" style="font-size: 0.85em; margin-top: 5px; text-align: right;">
            Strava integration client ID is not configured.
        </p>

        <!-- Strava Preferences Toggles when Connected (Collapsible) -->
        <div v-if="isConnected && showStravaManagement" class="strava-preferences card-inset" style="margin-top: 10px; padding: 15px; background: var(--color-card-mute); border-radius: 8px; font-size: 0.9em; display: flex; flex-direction: column; gap: 10px; border: 1px solid var(--color-card-border);">
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
            
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--color-card-border); padding-top: 10px; margin-top: 5px;">
                <label style="font-weight: 500;">Cardio Distance Unit</label>
                <div class="segmented-control" style="max-width: 120px; margin: 0;">
                    <button :class="{ active: settings.cardioDistanceUnit !== 'km' }" @click="updateCardioUnit('mi')" style="padding: 4px 10px; font-size: 0.85em;">mi</button>
                    <button :class="{ active: settings.cardioDistanceUnit === 'km' }" @click="updateCardioUnit('km')" style="padding: 4px 10px; font-size: 0.85em;">km</button>
                </div>
            </div>
            
            <!-- Actions Group inside Settings -->
            <div class="strava-actions" style="display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; justify-content: flex-end; border-top: 1px solid var(--color-card-border); padding-top: 10px;">
                <button @click="handleStravaSync(false)" class="button-primary small" :disabled="isStravaLoading" style="flex-grow: 1; min-width: 100px;">
                    {{ isStravaLoading ? 'Syncing...' : 'Sync Runs' }}
                </button>
                <button @click="handleStravaSync(true)" class="button-secondary small" :disabled="isStravaLoading" style="flex-grow: 1; min-width: 100px;" title="Sync entire history of runs (up to 1000 activities)">
                    Full Sync
                </button>
                <button @click="handleStravaDisconnect" class="button-danger small" :disabled="isStravaLoading" style="flex-grow: 1; min-width: 100px;">
                    Disconnect
                </button>
            </div>
        </div>

        <!-- Strava Status Messages -->
        <p v-if="stravaMessage" :class="stravaStatusType === 'success' ? 'success-text' : 'error-text'" style="font-size: 0.85em; margin-top: 5px; text-align: right; font-weight: 500;">{{ stravaMessage }}</p>

      </div>

      <!-- Backup & Account Card -->
      <div class="backup-card card" style="margin-bottom: 20px;">
        <div @click="isBackupCardExpanded = !isBackupCardExpanded" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none;">
            <h2 style="margin: 0;">Backup, Restore & Account 💾</h2>
            <span style="font-size: 1.2em; transition: transform 0.2s;" :style="{ transform: isBackupCardExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }">▼</span>
        </div>

        <div v-show="isBackupCardExpanded" style="margin-top: 15px; border-top: 1px solid var(--color-card-border); padding-top: 15px;">
            <p class="subtitle" style="font-size: 0.9em; opacity: 0.8; margin-bottom: 15px; text-align: left;">
              Export your routines, progress, workout history, and settings to an offline file, restore from a backup, or manage account deletion.
            </p>

            <!-- Export Section -->
            <div class="setting-item" style="border-bottom: 1px dashed var(--color-card-border); padding-bottom: 15px; margin-bottom: 15px; display: flex; flex-direction: column; align-items: flex-start; gap: 10px;">
                <label style="font-weight: 500;">Export Data</label>
                <div style="display: flex; gap: 10px; width: 100%; flex-wrap: wrap;">
                    <button @click="handleExportBackup" class="button-primary small" :disabled="isExporting" style="padding: 6px 12px; border-radius: 4px; border: none; background-color: var(--color-primary); color: white; cursor: pointer; flex-grow: 1; min-width: 140px;">
                        {{ isExporting ? 'Exporting...' : 'Export JSON Backup' }}
                    </button>
                    <button @click="handleExportBackupSQLite" class="button-secondary small" :disabled="isExporting" style="padding: 6px 12px; border-radius: 4px; border: 1px solid var(--color-card-border); background-color: var(--color-card-mute); color: var(--color-card-text); cursor: pointer; flex-grow: 1; min-width: 140px;">
                        {{ isExporting ? 'Exporting...' : 'Export FitNotes (.fitnotes)' }}
                    </button>
                </div>
            </div>

            <!-- Import Section -->
            <div class="import-backup-section" style="text-align: left;">
                <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <label style="font-weight: 500;">Restore Backup</label>
                    <input type="file" accept=".json,.fitnotes,.db" @change="handleBackupFile" class="backup-file-input" style="font-size: 0.9em; max-width: 200px; padding: 4px; border: 1px solid var(--color-card-border); border-radius: 4px; background: var(--color-card-bg); color: var(--color-card-text);" />
                </div>

                <div v-if="backupFile" class="backup-options card-inset" style="margin-top: 15px; padding: 15px; background: var(--color-card-mute); border-radius: 8px; font-size: 0.9em; border: 1px solid var(--color-card-border); display: flex; flex-direction: column; gap: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <label style="font-weight: 500;">Restore Mode</label>
                        <div class="segmented-control" style="margin: 0; display: flex; border: 1px solid var(--color-card-border); border-radius: 6px; overflow: hidden; background: var(--color-card-bg);">
                            <button type="button" :class="{ active: restoreMode === 'merge' }" @click="restoreMode = 'merge'" style="padding: 6px 14px; border: none; background: none; color: var(--color-card-text); cursor: pointer; font-size: 0.9em;">Merge</button>
                            <button type="button" :class="{ active: restoreMode === 'overwrite' }" @click="restoreMode = 'overwrite'" style="padding: 6px 14px; border: none; background: none; color: var(--color-card-text); cursor: pointer; font-size: 0.9em;">Overwrite</button>
                        </div>
                    </div>

                    <p v-if="restoreMode === 'overwrite'" class="warning-text" style="color: var(--color-danger); font-size: 0.85em; font-weight: 600; line-height: 1.4; margin: 0;">
                        ⚠️ WARNING: Overwrite mode will erase all your current routines, settings, and workout history before restoring!
                    </p>

                    <button @click="handleImportBackup" class="button-primary full-width" :class="{ 'button-danger': restoreMode === 'overwrite' }" :disabled="isImportingBackup" style="padding: 10px; border-radius: 6px; border: none; background-color: var(--color-primary); color: white; cursor: pointer; font-weight: 600; width: 100%;">
                        {{ isImportingBackup ? 'Restoring...' : 'Confirm Restore' }}
                    </button>
                </div>
            </div>

            <!-- Rollback Section -->
            <div class="setting-item" style="border-top: 1px dashed var(--color-card-border); padding-top: 15px; margin-top: 15px; display: flex; flex-direction: column; align-items: flex-start; gap: 10px; text-align: left;">
                <label style="font-weight: 600; color: var(--color-danger);">Emergency Rollback 🚨</label>
                <p style="font-size: 0.85em; opacity: 0.8; margin: 0; line-height: 1.4;">
                    Accidentally imported into the wrong account? Click below to delete all routines and history imported within the last hour, and fully rehydrate your progress metrics from your original history.
                </p>
                <button @click="handleRollback" class="button-danger small" :disabled="isImportingBackup" style="padding: 8px 14px; border-radius: 4px; border: none; background-color: var(--color-danger); color: white; cursor: pointer; font-weight: 600; align-self: flex-end; margin-top: 5px;">
                    {{ isImportingBackup ? 'Rolling back...' : 'Rollback last hour imports' }}
                </button>
            </div>

            <p v-if="backupSuccess" class="success-text" style="font-size: 0.9em; margin-top: 15px; font-weight: 600; color: var(--color-success);">{{ backupSuccess }}</p>
            <p v-if="backupError" class="error-text" style="font-size: 0.9em; margin-top: 15px; font-weight: 600; color: var(--color-danger);">{{ backupError }}</p>

            <!-- Danger Zone / Delete Account -->
            <div style="margin-top: 20px; border-top: 1px solid var(--color-card-border); padding-top: 15px; text-align: left;">
                <h4 style="margin: 0 0 6px 0; color: var(--color-danger, #dc3545);">Delete Account ⚠️</h4>
                <p style="font-size: 0.85em; opacity: 0.8; margin-bottom: 12px; line-height: 1.4;">
                  Permanently erase your account, logged workouts, routines, and third-party links.
                </p>
                <button @click="showDeleteConfirm = true" class="delete-account-button" style="margin-top: 0; background-color: rgba(220, 53, 69, 0.15); border: 1px solid #dc3545; color: #ff4d4d; padding: 8px 16px;">
                  Delete Account Permanently
                </button>
            </div>
        </div>
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
          
          <template v-if="isConnected">
            <li style="border-top: 1px dashed var(--color-card-border); font-weight: 600; color: #FC4C02; justify-content: center; padding-top: 18px; margin-top: 5px;">
              <span class="stat-icon" style="color: #FC4C02;">🏃</span>
              <span class="stat-label" style="color: #FC4C02; margin-right: 0;">Strava Cardio Stats</span>
            </li>
            <li>
              <span class="stat-icon" style="color: #FC4C02;">👟</span>
              <span class="stat-label">Total Runs:</span>
              <span class="stat-value" style="color: var(--color-card-text);">{{ lifetimeCardioStats.runsCount }}</span>
            </li>
            <li>
              <span class="stat-icon" style="color: #FC4C02;">🗺️</span>
              <span class="stat-label">Lifetime Cardio Distance:</span>
              <span class="stat-value" style="color: var(--color-card-text);">{{ lifetimeCardioStats.formattedDistance }}</span>
            </li>
          </template>
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
import { collection, query, getDoc, getDocs, orderBy, Timestamp, setDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebase'; // Adjust path if needed
import useAuth from '../composables/useAuth'; // Adjust path if needed
import useSettings, { type ThemeOption, type TimerSoundOption, type WeightUnitOption } from '../composables/useSettings'; 
import { playTone } from '../utils/audio';
import { toDisplay, displayUnit } from '../utils/weight';
import AboutModal from '@/components/AboutModal.vue';
import useStrava from '../composables/useStrava';
import useHistoryIndex from '../composables/useHistoryIndex';
import useLoggedWorkouts from '../composables/useLoggedWorkouts';

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

const { fetchCalendarIndex: rebuildCalendarIndex } = useHistoryIndex();
const { invalidateCache: invalidateWorkoutCache } = useLoggedWorkouts();

const loggedWorkouts = ref<LoggedWorkout[]>([]);
const isLoadingStats = ref(true);
const statsError = ref<string | null>(null);

// --- Backup & Restore State ---
const isBackupCardExpanded = ref(false);
const isExporting = ref(false);
const isImportingBackup = ref(false);
const backupFile = ref<File | null>(null);
const backupError = ref<string | null>(null);
const backupSuccess = ref<string | null>(null);
const restoreMode = ref<'merge' | 'overwrite'>('merge');

const serializeForExport = (val: any): any => {
  if (val === null || val === undefined) return val;
  if (val instanceof Timestamp) {
    return { __type: 'FirebaseTimestamp', seconds: val.seconds, nanoseconds: val.nanoseconds };
  }
  if (val instanceof Date) {
    return { __type: 'Date', value: val.toISOString() };
  }
  if (Array.isArray(val)) {
    return val.map(serializeForExport);
  }
  if (typeof val === 'object') {
    const res: any = {};
    for (const key in val) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        res[key] = serializeForExport(val[key]);
      }
    }
    return res;
  }
  return val;
};

const deserializeForImport = (val: any): any => {
  if (val === null || val === undefined) return val;
  if (typeof val === 'object') {
    if (val.__type === 'FirebaseTimestamp') {
      return new Timestamp(val.seconds, val.nanoseconds);
    }
    if (val.__type === 'Date') {
      return new Date(val.value);
    }
    if (Array.isArray(val)) {
      return val.map(deserializeForImport);
    }
    const res: any = {};
    for (const key in val) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        res[key] = deserializeForImport(val[key]);
      }
    }
    return res;
  }
  return val;
};

const handleBackupFile = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    backupFile.value = target.files[0];
    backupError.value = null;
    backupSuccess.value = null;
  }
};

const loadSqlJs = async (): Promise<any> => {
  if ((window as any).initSqlJs) return (window as any).initSqlJs;
  
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js';
    script.onload = () => {
      resolve((window as any).initSqlJs);
    };
    script.onerror = (e) => reject(new Error("Failed to load sql.js from CDN. Please check your internet connection."));
    document.head.appendChild(script);
  });
};

const handleExportBackupSQLite = async () => {
  if (!user.value || !user.value.uid) return;
  isExporting.value = true;
  backupError.value = null;
  backupSuccess.value = null;
  
  try {
    const uid = user.value.uid;
    const initSqlJs = await loadSqlJs();
    const initSql = await initSqlJs({
      locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
    });
    
    // Create new blank DB
    const dbObj = new initSql.Database();
    
    // Create tables
    dbObj.run(`
      CREATE TABLE Category (_id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, colour TEXT);
      CREATE TABLE exercise (_id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, category_id INTEGER, notes TEXT, weight_increment REAL, default_rest_time INTEGER);
      CREATE TABLE training_log (_id INTEGER PRIMARY KEY AUTOINCREMENT, exercise_id INTEGER, date TEXT, metric_weight REAL, reps INTEGER, unit INTEGER, is_personal_record INTEGER, distance REAL, duration_seconds INTEGER);
      CREATE TABLE Routine (_id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, notes TEXT);
      CREATE TABLE RoutineSection (_id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, routine_id INTEGER, sort_order INTEGER);
      CREATE TABLE RoutineSectionExercise (_id INTEGER PRIMARY KEY AUTOINCREMENT, routine_section_id INTEGER, exercise_id INTEGER, sort_order INTEGER);
      CREATE TABLE RoutineSectionExerciseSet (_id INTEGER PRIMARY KEY AUTOINCREMENT, routine_section_exercise_id INTEGER, metric_weight REAL, reps INTEGER, sort_order INTEGER, unit INTEGER);
      CREATE TABLE WorkoutTime (_id INTEGER PRIMARY KEY AUTOINCREMENT, workout_date TEXT, start_date_time TEXT, end_date_time TEXT);
    `);
    
    // Fetch Settings to know preference unit
    let settingsData = null;
    const settingsSnap = await getDoc(doc(db, 'users', uid, 'settings', 'preferences'));
    if (settingsSnap.exists()) {
      settingsData = settingsSnap.data();
    }
    const userUnitPref = settingsData?.weightUnit === 'kg' ? 1 : 2; // FitNotes: 1 = kg, 2 = lbs
    
    // Populate Categories
    const categoriesMap = new Map<string, number>();
    const standardCategories = [
      { name: 'Chest', colour: '#FF5252' },
      { name: 'Back', colour: '#4CAF50' },
      { name: 'Legs', colour: '#FFEB3B' },
      { name: 'Shoulders', colour: '#FF9800' },
      { name: 'Arms', colour: '#9C27B0' },
      { name: 'Abs', colour: '#E91E63' },
      { name: 'Cardio', colour: '#00BCD4' }
    ];
    
    standardCategories.forEach((cat, idx) => {
      dbObj.run("INSERT INTO Category (name, colour) VALUES (?, ?)", [cat.name, cat.colour]);
      categoriesMap.set(cat.name, idx + 1);
    });
    
    // Fetch all logs to identify all exercises that exist
    const workoutsSnap = await getDocs(collection(db, 'users', uid, 'loggedWorkouts'));
    const loggedWorkoutsData = workoutsSnap.docs.map(d => d.data() as LoggedWorkout);
    
    // Identify all unique exercise names
    const exerciseNames = new Set<string>();
    
    // Add from current programs (routines)
    const programsSnap = await getDocs(collection(db, 'users', uid, 'trainingPrograms'));
    const trainingPrograms = programsSnap.docs.map(d => ({ id: d.id, ...d.data() }) as any);
    
    trainingPrograms.forEach((prog: any) => {
      if (prog.workoutDays) {
        prog.workoutDays.forEach((day: any) => {
          if (day.exercises) {
            day.exercises.forEach((ex: any) => {
              if (ex.exerciseName) exerciseNames.add(ex.exerciseName);
            });
          }
        });
      }
    });
    
    // Add from logs
    loggedWorkoutsData.forEach(w => {
      if (w.performedExercises) {
        w.performedExercises.forEach(pe => {
          if (pe.exerciseName) exerciseNames.add(pe.exerciseName);
        });
      }
    });
    
    const guessCategory = (name: string): string => {
      const n = name.toLowerCase();
      if (n.includes('press') || n.includes('fly') || n.includes('dip') || n.includes('chest')) {
        if (n.includes('shoulder') || n.includes('overhead')) return 'Shoulders';
        return 'Chest';
      }
      if (n.includes('row') || n.includes('pull') || n.includes('deadlift') || n.includes('chin') || n.includes('back')) return 'Back';
      if (n.includes('squat') || n.includes('lung') || n.includes('leg') || n.includes('calf') || n.includes('quad') || n.includes('hamstring') || n.includes('glute')) return 'Legs';
      if (n.includes('shoulder') || n.includes('raise') || n.includes('delt')) return 'Shoulders';
      if (n.includes('curl') || n.includes('extension') || n.includes('pushdown') || n.includes('tricep') || n.includes('bicep')) return 'Arms';
      if (n.includes('crunch') || n.includes('plank') || n.includes('situp') || n.includes('abdominal')) return 'Abs';
      if (n.includes('run') || n.includes('walk') || n.includes('cardio') || n.includes('cycle') || n.includes('treadmill')) return 'Cardio';
      return 'Chest'; // Default
    };
    
    // Insert into exercise table
    const exerciseIdMap = new Map<string, number>();
    let exIdCounter = 1;
    exerciseNames.forEach(exName => {
      const cat = guessCategory(exName);
      const catId = categoriesMap.get(cat) || 1;
      dbObj.run("INSERT INTO exercise (name, category_id, notes, weight_increment, default_rest_time) VALUES (?, ?, ?, ?, ?)", [
        exName,
        catId,
        '',
        5.0,
        90
      ]);
      exerciseIdMap.set(exName, exIdCounter);
      exIdCounter++;
    });
    
    // Populate logs and WorkoutTime
    loggedWorkoutsData.forEach(w => {
      const dateObj = w.date instanceof Timestamp ? w.date.toDate() : new Date(w.date);
      const dateStr = dateObj.toISOString().slice(0, 10);
      
      const startTime = w.startTime instanceof Timestamp ? w.startTime.toDate() : (w.startTime ? new Date(w.startTime) : null);
      const endTime = w.endTime instanceof Timestamp ? w.endTime.toDate() : (w.endTime ? new Date(w.endTime) : null);
      
      if (startTime && endTime) {
        dbObj.run("INSERT INTO WorkoutTime (workout_date, start_date_time, end_date_time) VALUES (?, ?, ?)", [
          dateStr,
          startTime.toISOString(),
          endTime.toISOString()
        ]);
      }
      
      if (w.performedExercises) {
        w.performedExercises.forEach(pe => {
          const exId = exerciseIdMap.get(pe.exerciseName);
          if (!exId) return;
          
          if (pe.sets) {
            pe.sets.forEach(s => {
              // Convert LBS (internal store) to KG (fitnotes standard)
              const metricWeight = s.actualWeight / 2.20462262;
              
              dbObj.run("INSERT INTO training_log (exercise_id, date, metric_weight, reps, unit, is_personal_record, distance, duration_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
                exId,
                dateStr,
                metricWeight,
                s.actualReps,
                userUnitPref,
                0, // FitNotes calculates PRs dynamically, keep 0
                0.0,
                0
              ]);
            });
          }
        });
      }
    });
    
    // Populate routines
    let routineIdCounter = 1;
    let sectionIdCounter = 1;
    let routineExerciseIdCounter = 1;
    
    trainingPrograms.forEach((prog: any) => {
      dbObj.run("INSERT INTO Routine (name, notes) VALUES (?, ?)", [prog.programName, prog.description || '']);
      const routineId = routineIdCounter;
      routineIdCounter++;
      
      if (prog.workoutDays) {
        prog.workoutDays.forEach((day: any, dIdx: number) => {
          dbObj.run("INSERT INTO RoutineSection (name, routine_id, sort_order) VALUES (?, ?, ?)", [
            day.dayName,
            routineId,
            dIdx
          ]);
          const sectionId = sectionIdCounter;
          sectionIdCounter++;
          
          if (day.exercises) {
            day.exercises.forEach((ex: any, eIdx: number) => {
              const exId = exerciseIdMap.get(ex.exerciseName);
              if (!exId) return;
              
              dbObj.run("INSERT INTO RoutineSectionExercise (routine_section_id, exercise_id, sort_order) VALUES (?, ?, ?)", [
                sectionId,
                exId,
                eIdx
              ]);
              const rseId = routineExerciseIdCounter;
              routineExerciseIdCounter++;
              
              const targetSets = ex.targetSets || 3;
              const minReps = ex.minReps || 8;
              const startingWeight = 45 / 2.20462262; // kg
              
              for (let sIdx = 0; sIdx < targetSets; sIdx++) {
                dbObj.run("INSERT INTO RoutineSectionExerciseSet (routine_section_exercise_id, metric_weight, reps, sort_order, unit) VALUES (?, ?, ?, ?, ?)", [
                  rseId,
                  startingWeight,
                  minReps,
                  sIdx,
                  userUnitPref
                ]);
              }
            });
          }
        });
      }
    });
    
    // Export DB as binary array
    const binaryDb = dbObj.export();
    const blob = new Blob([binaryDb], { type: "application/x-sqlite3" });
    const downloadUrl = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", downloadUrl);
    
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadAnchor.setAttribute("download", `liftlogic_backup_${dateStr}.fitnotes`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(downloadUrl);
    
    dbObj.close();
    backupSuccess.value = "FitNotes backup database (.fitnotes) exported successfully!";
  } catch (e: any) {
    console.error("Export SQLite failed:", e);
    backupError.value = "Export SQLite failed: " + e.message;
  } finally {
    isExporting.value = false;
  }
};

const handleExportBackup = async () => {
  if (!user.value || !user.value.uid) return;
  isExporting.value = true;
  backupError.value = null;
  backupSuccess.value = null;
  try {
    const uid = user.value.uid;
    
    // Fetch Settings
    let settingsData = null;
    const settingsSnap = await getDoc(doc(db, 'users', uid, 'settings', 'preferences'));
    if (settingsSnap.exists()) {
      settingsData = settingsSnap.data();
    }
    
    // Fetch Training Programs
    const programsSnap = await getDocs(collection(db, 'users', uid, 'trainingPrograms'));
    const trainingPrograms = programsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Fetch Exercise Progress
    const progressSnap = await getDocs(collection(db, 'users', uid, 'exerciseProgress'));
    const exerciseProgress = progressSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Fetch Logged Workouts
    const workoutsSnap = await getDocs(collection(db, 'users', uid, 'loggedWorkouts'));
    const loggedWorkoutsData = workoutsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Fetch External Activities
    const externalSnap = await getDocs(collection(db, 'users', uid, 'externalActivities'));
    const externalActivitiesData = externalSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    const backupObj = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: settingsData,
      trainingPrograms,
      exerciseProgress,
      loggedWorkouts: loggedWorkoutsData,
      externalActivities: externalActivitiesData
    };
    
    const serialized = serializeForExport(backupObj);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(serialized));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadAnchor.setAttribute("download", `liftlogic_backup_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    
    backupSuccess.value = "Backup exported successfully!";
  } catch (e: any) {
    console.error("Export backup failed:", e);
    backupError.value = "Export backup failed: " + e.message;
  } finally {
    isExporting.value = false;
  }
};

const getWords = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
const jaccardSimilarity = (s1: string, s2: string): number => {
  const w1 = new Set(getWords(s1));
  const w2 = new Set(getWords(s2));
  const intersection = new Set([...w1].filter(x => w2.has(x)));
  const union = new Set([...w1, ...w2]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
};

const importFromFitNotesFile = async (file: File) => {
  isImportingBackup.value = true;
  backupError.value = null;
  backupSuccess.value = null;
  
  try {
    const uid = user.value!.uid;
    const initSqlJs = await loadSqlJs();
    const initSql = await initSqlJs({
      locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
    });
    
    const arrayBuffer = await file.arrayBuffer();
    const u8Array = new Uint8Array(arrayBuffer);
    const dbObj = new initSql.Database(u8Array);
    
    // 1. Fetch exercises, categories, and logs
    const exerciseQuery = dbObj.exec(`
      SELECT e._id, e.name, c.name as category_name 
      FROM exercise e
      JOIN Category c ON e.category_id = c._id
    `);
    
    const exerciseMap = new Map<number, { name: string, category: string }>();
    if (exerciseQuery.length > 0 && exerciseQuery[0].values) {
      exerciseQuery[0].values.forEach((row: any) => {
        exerciseMap.set(row[0], { name: row[1], category: row[2] });
      });
    }
    
    const logsQuery = dbObj.exec(`
      SELECT t.date, t.exercise_id, t.metric_weight, t.reps, t.unit, t.is_personal_record, t.distance, t.duration_seconds, wt.start_date_time, wt.end_date_time
      FROM training_log t
      LEFT JOIN WorkoutTime wt ON t.date = wt.workout_date
      ORDER BY t.date ASC, t._id ASC
    `);
    
    interface FitNotesSqlRow {
      dateStr: string;
      exerciseId: number;
      weightLbs: number;
      reps: number;
      isPR: boolean;
      distance: number;
      durationSeconds: number;
      startTimeStr?: string;
      endTimeStr?: string;
    }
    
    const rawLogs: FitNotesSqlRow[] = [];
    if (logsQuery.length > 0 && logsQuery[0].values && logsQuery[0].values.length > 0) {
      logsQuery[0].values.forEach((row: any) => {
        const dateStr = row[0];
        const exerciseId = row[1];
        const metricWeight = row[2];
        const reps = row[3];
        const unit = row[4];
        const isPR = row[5] === 1;
        const distance = row[6] || 0;
        const durationSeconds = row[7] || 0;
        const startTimeStr = row[8] || undefined;
        const endTimeStr = row[9] || undefined;
        
        const weightLbs = Math.round(metricWeight * 2.20462262 * 100) / 100;
        
        rawLogs.push({
          dateStr,
          exerciseId,
          weightLbs,
          reps,
          isPR,
          distance,
          durationSeconds,
          startTimeStr,
          endTimeStr
        });
      });
    }
    
    const logsByDate = new Map<string, FitNotesSqlRow[]>();
    rawLogs.forEach(row => {
      if (!logsByDate.has(row.dateStr)) {
        logsByDate.set(row.dateStr, []);
      }
      logsByDate.get(row.dateStr)!.push(row);
    });
    
    const datesSorted = Array.from(logsByDate.keys()).sort();
    
    // 2. Fetch routines
    const routinesQuery = dbObj.exec("SELECT _id, name, notes FROM Routine");
    const importedRoutines: any[] = [];
    const workoutDaysToSaveList: { programId: string, days: any[] }[] = [];
    
    if (routinesQuery.length > 0 && routinesQuery[0].values && routinesQuery[0].values.length > 0) {
      for (const rRow of routinesQuery[0].values) {
        const routineId = rRow[0];
        const routineName = rRow[1];
        const routineNotes = rRow[2] || '';
        
        const sectionsQuery = dbObj.exec(`
          SELECT _id, name, sort_order 
          FROM RoutineSection 
          WHERE routine_id = ${routineId}
          ORDER BY sort_order ASC
        `);
        
        const workoutDays: any[] = [];
        const daySequenceColorPalette = ['#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444'];
        
        if (sectionsQuery.length > 0 && sectionsQuery[0].values && sectionsQuery[0].values.length > 0) {
          for (const sRow of sectionsQuery[0].values) {
            const sectionId = sRow[0];
            const sectionName = sRow[1];
            const sectionOrder = sRow[2];
            
            const rseQuery = dbObj.exec(`
              SELECT rse._id, rse.exercise_id, rse.sort_order
              FROM RoutineSectionExercise rse
              WHERE rse.routine_section_id = ${sectionId}
              ORDER BY rse.sort_order ASC
            `);
            
            const exercises: any[] = [];
            if (rseQuery.length > 0 && rseQuery[0].values && rseQuery[0].values.length > 0) {
              for (const rseRow of rseQuery[0].values) {
                const rseId = rseRow[0];
                const exerciseId = rseRow[1];
                const exDetails = exerciseMap.get(exerciseId);
                if (!exDetails) continue;
                
                const hasLogs = rawLogs.some(l => l.exerciseId === exerciseId);
                let chosenExerciseName = exDetails.name;
                
                if (!hasLogs) {
                  let bestMatchName = exDetails.name;
                  let maxSimilarity = 0;
                  
                  exerciseMap.forEach((otherExDetails, otherExId) => {
                    const otherHasLogs = rawLogs.some(l => l.exerciseId === otherExId);
                    if (otherHasLogs) {
                      const sim = jaccardSimilarity(exDetails.name, otherExDetails.name);
                      if (sim > maxSimilarity) {
                        maxSimilarity = sim;
                        bestMatchName = otherExDetails.name;
                      }
                    }
                  });
                  
                  if (maxSimilarity >= 0.50) {
                    chosenExerciseName = bestMatchName;
                  }
                }
                
                const setsQuery = dbObj.exec(`
                  SELECT metric_weight, reps, sort_order, unit
                  FROM RoutineSectionExerciseSet
                  WHERE routine_section_exercise_id = ${rseId}
                  ORDER BY sort_order ASC
                `);
                
                let targetSets = 3;
                let avgReps = 10;
                let startingWeight = 45;
                
                if (setsQuery.length > 0 && setsQuery[0].values && setsQuery[0].values.length > 0) {
                  targetSets = setsQuery[0].values.length;
                  const repsList = setsQuery[0].values.map((s: any) => s[1]);
                  avgReps = Math.round(repsList.reduce((a: number, b: number) => a + b, 0) / repsList.length) || 10;
                  
                  const weightsLbs = setsQuery[0].values.map((s: any) => s[0] * 2.20462262);
                  startingWeight = weightsLbs.length > 0 ? Math.round(weightsLbs[0] * 10) / 10 : 45;
                }
                
                let minReps = 8;
                let maxReps = 12;
                if (avgReps <= 5) { minReps = 5; maxReps = 5; }
                else if (avgReps <= 8) { minReps = 6; maxReps = 8; }
                else if (avgReps <= 10) { minReps = 8; maxReps = 10; }
                else if (avgReps <= 12) { minReps = 8; maxReps = 12; }
                else { minReps = 10; maxReps = 15; }
                
                const newExId = doc(collection(db, '_')).id;
                exercises.push({
                  id: newExId,
                  exerciseName: chosenExerciseName,
                  targetSets,
                  minReps,
                  maxReps,
                  repOverloadStep: 2,
                  weightIncrement: 5,
                  customRestSeconds: null,
                  notesForExercise: null,
                  enableProgression: true,
                  isTimed: false,
                  startingWeight
                });
              }
            }
            
            workoutDays.push({
              id: doc(collection(db, '_')).id,
              dayName: sectionName,
              order: sectionOrder + 1,
              color: daySequenceColorPalette[workoutDays.length % daySequenceColorPalette.length],
              exercises
            });
          }
        }
        
        const newProgramId = doc(collection(db, '_')).id;
        importedRoutines.push({
          id: newProgramId,
          programName: routineName,
          description: routineNotes,
          workoutDays: workoutDays.map(d => ({
            ...d,
            exercises: d.exercises.map((ex: any) => {
              const { currentPrescribedReps, currentPrescribedWeight, startingWeight, ...config } = ex;
              return config;
            })
          })),
          createdAt: serverTimestamp()
        });
        
        workoutDaysToSaveList.push({ programId: newProgramId, days: workoutDays });
      }
    }
    
    // 3. OVERWRITE mode logic: delete everything first!
    if (restoreMode.value === 'overwrite') {
      // Clear programs
      const pSnap = await getDocs(collection(db, 'users', uid, 'trainingPrograms'));
      const pBatch = writeBatch(db);
      pSnap.forEach(d => pBatch.delete(d.ref));
      await pBatch.commit();
      
      // Clear workouts
      const wSnap = await getDocs(collection(db, 'users', uid, 'loggedWorkouts'));
      for (let i = 0; i < wSnap.docs.length; i += 400) {
        const batch = writeBatch(db);
        wSnap.docs.slice(i, i + 400).forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
      
      // Clear settings
      await setDoc(doc(db, 'users', uid, 'settings', 'preferences'), {});
    }
    
    // 4. Save imported routines
    const progBatch = writeBatch(db);
    importedRoutines.forEach(prog => {
      progBatch.set(doc(db, 'users', uid, 'trainingPrograms', prog.id), prog);
    });
    await progBatch.commit();
    
    // Set active program if overwriting and we have routines
    if (restoreMode.value === 'overwrite' && importedRoutines.length > 0) {
      await saveSettings({ activeProgramId: importedRoutines[0].id });
    }
    
    // 5. Build and save logged workouts
    const loggedWorkoutsToSave: any[] = [];
    const exerciseConfigsMap = new Map<string, any>();
    workoutDaysToSaveList.forEach(item => {
      item.days.forEach(day => {
        day.exercises.forEach((ex: any) => {
          if (!exerciseConfigsMap.has(ex.exerciseName)) {
            exerciseConfigsMap.set(ex.exerciseName, ex);
          }
        });
      });
    });
    
    const mainProgram = importedRoutines.length > 0 ? importedRoutines[0] : null;
    
    datesSorted.forEach(dateStr => {
      const logs = logsByDate.get(dateStr) || [];
      if (logs.length === 0) return;
      
      const firstRow = logs[0];
      const dateObj = new Date(dateStr + "T12:00:00Z");
      const startTime = firstRow.startTimeStr ? new Date(firstRow.startTimeStr) : dateObj;
      const endTime = firstRow.endTimeStr ? new Date(firstRow.endTimeStr) : new Date(startTime.getTime() + 45 * 60 * 1000);
      
      const performedExercises: any[] = [];
      const logsByExId = new Map<number, FitNotesSqlRow[]>();
      
      logs.forEach(l => {
        if (!logsByExId.has(l.exerciseId)) {
          logsByExId.set(l.exerciseId, []);
        }
        logsByExId.get(l.exerciseId)!.push(l);
      });
      
      logsByExId.forEach((exLogs, exerciseId) => {
        const exDetails = exerciseMap.get(exerciseId);
        if (!exDetails) return;
        
        const sets = exLogs.map(l => ({
          status: 'done' as const,
          targetReps: l.reps,
          actualReps: l.reps,
          actualWeight: l.weightLbs,
          isPersonalRecord: l.isPR
        }));
        
        performedExercises.push({
          exerciseName: exDetails.name,
          sets
        });
      });
      
      loggedWorkoutsToSave.push({
        id: doc(collection(db, '_')).id,
        userId: uid,
        date: dateObj,
        trainingProgramIdUsed: mainProgram ? mainProgram.id : 'fitnotes_imported',
        trainingProgramNameUsed: mainProgram ? mainProgram.programName : 'Imported Routine',
        startTime,
        endTime,
        overallNotes: '',
        performedExercises
      });
    });
    
    for (let i = 0; i < loggedWorkoutsToSave.length; i += 400) {
      const batch = writeBatch(db);
      loggedWorkoutsToSave.slice(i, i + 400).forEach(w => {
        batch.set(doc(db, 'users', uid, 'loggedWorkouts', w.id), w);
      });
      await batch.commit();
    }
    
    // 6. Build and save exerciseProgress
    const progressDocsToSet: { ref: any, data: any }[] = [];
    exerciseMap.forEach((exDetails, exerciseId) => {
      const exLogs = rawLogs.filter(l => l.exerciseId === exerciseId);
      if (exLogs.length === 0) return;
      
      const lastDate = exLogs[exLogs.length - 1].dateStr;
      const lastExLogs = exLogs.filter(l => l.dateStr === lastDate);
      
      let maxWeight = 0;
      let setsAtMaxWeight: FitNotesSqlRow[] = [];
      lastExLogs.forEach(l => {
        if (l.weightLbs > maxWeight) {
          maxWeight = l.weightLbs;
          setsAtMaxWeight = [l];
        } else if (l.weightLbs === maxWeight) {
          setsAtMaxWeight.push(l);
        }
      });
      
      let minRepsAtMaxWeight = 0;
      if (setsAtMaxWeight.length > 0) {
        minRepsAtMaxWeight = Math.min(...setsAtMaxWeight.map(l => l.reps));
      }
      
      const config = exerciseConfigsMap.get(exDetails.name) || { minReps: 8, maxReps: 12, weightIncrement: 5, repOverloadStep: 2 };
      const configMinReps = config.minReps || 8;
      const configMaxReps = config.maxReps || 12;
      const configWeightIncr = config.weightIncrement || 5;
      const configRepStep = config.repOverloadStep || 2;
      
      let currentWeightToAttempt = maxWeight;
      let repsToAttemptNext = configMinReps;
      let lastWorkoutAllSetsSuccessfulAtCurrentWeight = false;
      
      if (minRepsAtMaxWeight >= configMaxReps) {
        currentWeightToAttempt = maxWeight + configWeightIncr;
        repsToAttemptNext = configMinReps;
        lastWorkoutAllSetsSuccessfulAtCurrentWeight = true;
      } else if (minRepsAtMaxWeight < configMinReps) {
        currentWeightToAttempt = maxWeight;
        repsToAttemptNext = configMinReps;
      } else {
        currentWeightToAttempt = maxWeight;
        repsToAttemptNext = Math.min(minRepsAtMaxWeight + configRepStep, configMaxReps);
        lastWorkoutAllSetsSuccessfulAtCurrentWeight = true;
      }
      
      const exerciseProgressKey = exDetails.name.toLowerCase().replace(/\s+/g, '_');
      const progressRef = doc(db, 'users', uid, 'exerciseProgress', exerciseProgressKey);
      
      progressDocsToSet.push({
        ref: progressRef,
        data: {
          exerciseName: exDetails.name,
          currentWeightToAttempt,
          repsToAttemptNext,
          lastWorkoutAllSetsSuccessfulAtCurrentWeight,
          consecutiveFailedWorkoutsAtCurrentWeightAndReps: 0,
          lastPerformedDate: new Date(lastDate + "T12:00:00Z")
        }
      });
    });
    
    // Clear and overwrite progress docs if in overwrite mode
    if (restoreMode.value === 'overwrite') {
      const pSnap = await getDocs(collection(db, 'users', uid, 'exerciseProgress'));
      for (let i = 0; i < pSnap.docs.length; i += 400) {
        const batch = writeBatch(db);
        pSnap.docs.slice(i, i + 400).forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    }
    
    for (let i = 0; i < progressDocsToSet.length; i += 400) {
      const batch = writeBatch(db);
      progressDocsToSet.slice(i, i + 400).forEach(item => {
        batch.set(item.ref, item.data);
      });
      await batch.commit();
    }
    
    invalidateWorkoutCache();
    await rebuildCalendarIndex(true);
    
    dbObj.close();
    backupSuccess.value = "FitNotes backup database (.fitnotes) restored successfully! Reloading page in 2 seconds...";
    backupFile.value = null;
    
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
  } catch (e: any) {
    console.error("FitNotes restore failed:", e);
    backupError.value = "FitNotes restore failed: " + e.message;
  } finally {
    isImportingBackup.value = false;
  }
};

const handleImportBackup = async () => {
  if (!user.value || !user.value.uid || !backupFile.value) {
    backupError.value = "Please select a backup file first.";
    return;
  }
  
  const file = backupFile.value;
  if (file.name.endsWith('.fitnotes') || file.name.endsWith('.db') || !file.name.endsWith('.json')) {
    await importFromFitNotesFile(file);
    return;
  }
  
  isImportingBackup.value = true;
  backupError.value = null;
  backupSuccess.value = null;
  
  try {
    const reader = new FileReader();
    const fileContent = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(backupFile.value!);
    });
    
    const rawBackup = JSON.parse(fileContent);
    const backupObj = deserializeForImport(rawBackup);
    
    if (backupObj.version !== 1 || !backupObj.exportedAt) {
      throw new Error("Invalid backup file format. Version mismatch or missing metadata.");
    }
    
    const uid = user.value.uid;
    
    // Prepare list of write operations
    const operations: { ref: any, data: any, type: 'set' | 'delete' }[] = [];
    
    // Add Settings
    if (backupObj.settings) {
      operations.push({
        ref: doc(db, 'users', uid, 'settings', 'preferences'),
        data: backupObj.settings,
        type: 'set'
      });
    }
    
    // Add Training Programs
    if (Array.isArray(backupObj.trainingPrograms)) {
      backupObj.trainingPrograms.forEach((p: any) => {
        const { id, ...data } = p;
        operations.push({
          ref: doc(db, 'users', uid, 'trainingPrograms', id),
          data,
          type: 'set'
        });
      });
    }
    
    // Add Exercise Progress
    if (Array.isArray(backupObj.exerciseProgress)) {
      backupObj.exerciseProgress.forEach((p: any) => {
        const { id, ...data } = p;
        operations.push({
          ref: doc(db, 'users', uid, 'exerciseProgress', id),
          data,
          type: 'set'
        });
      });
    }
    
    // Add Logged Workouts
    if (Array.isArray(backupObj.loggedWorkouts)) {
      backupObj.loggedWorkouts.forEach((w: any) => {
        const { id, ...data } = w;
        operations.push({
          ref: doc(db, 'users', uid, 'loggedWorkouts', id),
          data,
          type: 'set'
        });
      });
    }
    
    // Add External Activities
    if (Array.isArray(backupObj.externalActivities)) {
      backupObj.externalActivities.forEach((act: any) => {
        const { id, ...data } = act;
        operations.push({
          ref: doc(db, 'users', uid, 'externalActivities', id),
          data,
          type: 'set'
        });
      });
    }
    
    // Execute all operations in batches of 400
    if (restoreMode.value === 'overwrite') {
      const deleteOps: { ref: any, type: 'delete' }[] = [];
      
      const existingProgramsSnap = await getDocs(collection(db, 'users', uid, 'trainingPrograms'));
      existingProgramsSnap.forEach(d => deleteOps.push({ ref: d.ref, type: 'delete' }));
      
      const existingProgressSnap = await getDocs(collection(db, 'users', uid, 'exerciseProgress'));
      existingProgressSnap.forEach(d => deleteOps.push({ ref: d.ref, type: 'delete' }));
      
      const existingWorkoutsSnap = await getDocs(collection(db, 'users', uid, 'loggedWorkouts'));
      existingWorkoutsSnap.forEach(d => deleteOps.push({ ref: d.ref, type: 'delete' }));
      
      const existingExternalSnap = await getDocs(collection(db, 'users', uid, 'externalActivities'));
      existingExternalSnap.forEach(d => deleteOps.push({ ref: d.ref, type: 'delete' }));
      
      // Run deletes chunked
      for (let i = 0; i < deleteOps.length; i += 400) {
        const chunk = deleteOps.slice(i, i + 400);
        const delBatch = writeBatch(db);
        chunk.forEach(op => delBatch.delete(op.ref));
        await delBatch.commit();
      }
    }
    
    // Run writes chunked
    for (let i = 0; i < operations.length; i += 400) {
      const chunk = operations.slice(i, i + 400);
      const writeBatchObj = writeBatch(db);
      chunk.forEach(op => {
        if (op.type === 'set') {
          writeBatchObj.set(op.ref, op.data);
        }
      });
      await writeBatchObj.commit();
    }
    
    backupSuccess.value = "Backup restored successfully! Reloading page in 2 seconds...";
    backupFile.value = null;
    
    // Invalidate workout caches & reload stats
    await fetchAllWorkoutHistoryForStats();
    
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
  } catch (e: any) {
    console.error("Restore backup failed:", e);
    backupError.value = "Restore backup failed: " + e.message;
  } finally {
    isImportingBackup.value = false;
  }
};

const handleRollback = async () => {
  if (!user.value || !user.value.uid) return;
  isImportingBackup.value = true;
  backupError.value = null;
  backupSuccess.value = null;
  
  try {
    const uid = user.value.uid;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // 1. Fetch training programs to check which ones to delete
    const programsSnap = await getDocs(collection(db, 'users', uid, 'trainingPrograms'));
    const programsToDelete: string[] = [];
    
    programsSnap.forEach(d => {
      const data = d.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : null;
      const matchesName = ["Low Volume", "Low Volume (4 Days)", "Imported from FitNotes"].includes(data.programName);
      const isNew = createdAt && createdAt > oneHourAgo;
      
      if (isNew || matchesName) {
        programsToDelete.push(d.id);
      }
    });
    
    // 2. Fetch logged workouts to delete and identify logs to keep
    const workoutsSnap = await getDocs(collection(db, 'users', uid, 'loggedWorkouts'));
    const workoutsToDelete: string[] = [];
    const workoutsToKeep: any[] = [];
    
    workoutsSnap.forEach(d => {
      const data = d.data();
      const isImported = data.trainingProgramIdUsed === 'fitnotes_imported' || 
                         programsToDelete.includes(data.trainingProgramIdUsed) ||
                         data.trainingProgramNameUsed === 'Imported Routine';
                         
      if (isImported) {
        workoutsToDelete.push(d.id);
      } else {
        workoutsToKeep.push({ id: d.id, ...data });
      }
    });
    
    // 3. Delete programs and workouts in batch
    for (let i = 0; i < workoutsToDelete.length; i += 400) {
      const delBatch = writeBatch(db);
      const chunk = workoutsToDelete.slice(i, i + 400);
      chunk.forEach(id => {
        delBatch.delete(doc(db, 'users', uid, 'loggedWorkouts', id));
      });
      await delBatch.commit();
    }
    
    if (programsToDelete.length > 0) {
      const progBatch = writeBatch(db);
      programsToDelete.forEach(id => {
        progBatch.delete(doc(db, 'users', uid, 'trainingPrograms', id));
      });
      await progBatch.commit();
    }
    
    // 4. Reset settings activeProgramId if it was deleted
    let newActiveProgramId = settings.value.activeProgramId;
    if (settings.value.activeProgramId && programsToDelete.includes(settings.value.activeProgramId)) {
      const remaining: string[] = [];
      programsSnap.forEach(d => {
        if (!programsToDelete.includes(d.id)) {
          remaining.push(d.id);
        }
      });
      newActiveProgramId = remaining.length > 0 ? remaining[0] : null;
      await saveSettings({ activeProgramId: newActiveProgramId });
    }
    
    // 5. Clear all exerciseProgress documents
    const progressSnap = await getDocs(collection(db, 'users', uid, 'exerciseProgress'));
    const progressToDelete: string[] = [];
    progressSnap.forEach(d => progressToDelete.push(d.id));
    
    for (let i = 0; i < progressToDelete.length; i += 400) {
      const delBatch = writeBatch(db);
      const chunk = progressToDelete.slice(i, i + 400);
      chunk.forEach(id => {
        delBatch.delete(doc(db, 'users', uid, 'exerciseProgress', id));
      });
      await delBatch.commit();
    }
    
    // 6. Rebuild exerciseProgress documents from the remaining history (workoutsToKeep)
    workoutsToKeep.sort((a, b) => {
      const d1 = a.date.toDate ? a.date.toDate() : new Date(a.date);
      const d2 = b.date.toDate ? b.date.toDate() : new Date(b.date);
      return d1.getTime() - d2.getTime();
    });
    
    const progressBuilder = new Map<string, {
      exerciseName: string;
      maxWeight: number;
      minRepsAtMaxWeight: number;
      lastPerformedDate: any;
    }>();
    
    workoutsToKeep.forEach(workout => {
      if (workout.performedExercises) {
        workout.performedExercises.forEach((perfEx: any) => {
          if (!perfEx.sets || perfEx.sets.length === 0) return;
          
          let maxWeight = 0;
          let minRepsAtMaxWeight = 999;
          
          perfEx.sets.forEach((set: any) => {
            if (set.status === 'done') {
              if (set.actualWeight > maxWeight) {
                maxWeight = set.actualWeight;
                minRepsAtMaxWeight = set.actualReps;
              } else if (set.actualWeight === maxWeight) {
                minRepsAtMaxWeight = Math.min(minRepsAtMaxWeight, set.actualReps);
              }
            }
          });
          
          if (maxWeight > 0) {
            progressBuilder.set(perfEx.exerciseName.toLowerCase().replace(/\s+/g, '_'), {
              exerciseName: perfEx.exerciseName,
              maxWeight,
              minRepsAtMaxWeight,
              lastPerformedDate: workout.date
            });
          }
        });
      }
    });
    
    let activeProgramDoc = null;
    if (newActiveProgramId) {
      const activeSnap = await getDoc(doc(db, 'users', uid, 'trainingPrograms', newActiveProgramId));
      if (activeSnap.exists()) activeProgramDoc = activeSnap.data();
    }
    
    const exerciseConfigsMap = new Map<string, any>();
    if (activeProgramDoc && activeProgramDoc.workoutDays) {
      activeProgramDoc.workoutDays.forEach((day: any) => {
        if (day.exercises) {
          day.exercises.forEach((ex: any) => {
            exerciseConfigsMap.set(ex.exerciseName.toLowerCase().replace(/\s+/g, '_'), ex);
          });
        }
      });
    }
    
    // Write new progress documents
    const progressBatch = writeBatch(db);
    progressBuilder.forEach((val, key) => {
      const config = exerciseConfigsMap.get(key) || { minReps: 8, maxReps: 12, weightIncrement: 5, repOverloadStep: 2 };
      
      const configMinReps = config.minReps || 8;
      const configMaxReps = config.maxReps || 12;
      const configWeightIncr = config.weightIncrement || 5;
      const configRepStep = config.repOverloadStep || 2;
      
      let currentWeightToAttempt = val.maxWeight;
      let repsToAttemptNext = configMinReps;
      let lastWorkoutAllSetsSuccessfulAtCurrentWeight = false;
      
      if (val.minRepsAtMaxWeight >= configMaxReps) {
        currentWeightToAttempt = val.maxWeight + configWeightIncr;
        repsToAttemptNext = configMinReps;
        lastWorkoutAllSetsSuccessfulAtCurrentWeight = true;
      } else if (val.minRepsAtMaxWeight < configMinReps) {
        currentWeightToAttempt = val.maxWeight;
        repsToAttemptNext = configMinReps;
      } else {
        currentWeightToAttempt = val.maxWeight;
        repsToAttemptNext = Math.min(val.minRepsAtMaxWeight + configRepStep, configMaxReps);
        lastWorkoutAllSetsSuccessfulAtCurrentWeight = true;
      }
      
      const progressRef = doc(db, 'users', uid, 'exerciseProgress', key);
      progressBatch.set(progressRef, {
        exerciseName: val.exerciseName,
        currentWeightToAttempt,
        repsToAttemptNext,
        lastWorkoutAllSetsSuccessfulAtCurrentWeight,
        consecutiveFailedWorkoutsAtCurrentWeightAndReps: 0,
        lastPerformedDate: val.lastPerformedDate
      });
    });
    
    await progressBatch.commit();
    
    // Invalidate caches & rebuild index
    invalidateWorkoutCache();
    await rebuildCalendarIndex(true);
    
    backupSuccess.value = "Rollback successful! Reloading page...";
    
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
  } catch (e: any) {
    console.error("Rollback failed:", e);
    backupError.value = "Rollback failed: " + e.message;
  } finally {
    isImportingBackup.value = false;
  }
};

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
  isLoading: isStravaLoading,
  connect: stravaConnect,
  disconnect: stravaDisconnect,
  exchangeCode: stravaExchangeCode,
  syncNow: stravaSyncNow,
  updatePreferences: stravaUpdatePreferences
} = useStrava();

const showStravaManagement = ref(false);
const stravaStatusType = ref<'success' | 'error' | 'info'>('info');
const stravaMessage = ref('');

const externalActivities = ref<any[]>([]);

const fetchAllExternalActivitiesForStats = async () => {
  if (!user.value || !user.value.uid) return;
  try {
    const extCollectionRef = collection(db, 'users', user.value.uid, 'externalActivities');
    const snap = await getDocs(extCollectionRef);
    const list: any[] = [];
    snap.forEach(docSnap => {
      list.push(docSnap.data());
    });
    externalActivities.value = list;
  } catch (e) {
    console.warn("Could not load external activities for profile stats:", e);
  }
};

const lifetimeCardioStats = computed(() => {
  let runsCount = 0;
  let totalDistanceMiles = 0;

  externalActivities.value.forEach(act => {
    if (act.type?.toLowerCase() === 'run') {
      runsCount++;
    }
    if (act.distanceMiles) {
      totalDistanceMiles += act.distanceMiles;
    }
  });

  const distanceUnit = settings.value.cardioDistanceUnit || 'mi';
  let formattedDistance = '';
  if (distanceUnit === 'km') {
    const distanceKm = totalDistanceMiles * 1.60934;
    formattedDistance = `${distanceKm.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`;
  } else {
    formattedDistance = `${totalDistanceMiles.toLocaleString(undefined, { maximumFractionDigits: 1 })} mi`;
  }

  return {
    runsCount,
    formattedDistance
  };
});

watch(isConnected, async (connected) => {
  if (connected) {
    await fetchAllExternalActivitiesForStats();
  } else {
    externalActivities.value = [];
  }
});

onMounted(async () => {
  if (user.value) {
    fetchAllWorkoutHistoryForStats();
    if (isConnected.value) {
      fetchAllExternalActivitiesForStats();
    }
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
  
  await stravaConnect();
};

const handleStravaDisconnect = async () => {
  await stravaDisconnect();
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
    if (isConnected.value) {
      fetchAllExternalActivitiesForStats();
    }
  } else {
    loggedWorkouts.value = [];
    externalActivities.value = [];
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

const updateCardioUnit = (unit: 'mi' | 'km') => {
    saveSettings({ cardioDistanceUnit: unit });
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

const toggleEmbiggen = () => {
  saveSettings({ embiggenButtons: !settings.value.embiggenButtons });
};

const toggleVideoDemos = (e: Event) => {
  const checked = (e.target as HTMLInputElement).checked;
  saveSettings({ enableVideoDemos: checked });
};

const toggleSkipTracker = (e: Event) => {
  const checked = (e.target as HTMLInputElement).checked;
  saveSettings({ enableSkipTracker: checked });
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

// Account Deletion Flow
const showDeleteConfirm = ref(false);
const isDeletingAccount = ref(false);
const deleteAccountError = ref<string | null>(null);

const handleDeleteAccount = async () => {
    isDeletingAccount.value = true;
    deleteAccountError.value = null;
    try {
        const functionsInstance = getFunctions();
        const deleteFunc = httpsCallable(functionsInstance, 'deleteAccount');
        await deleteFunc();
        
        // Log out locally and redirect
        await logout();
        router.push('/');
    } catch (e: any) {
        console.error("Account deletion failed:", e);
        deleteAccountError.value = e.message || "Failed to delete account.";
    } finally {
        isDeletingAccount.value = false;
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

.card h2 {
  text-align: center;
  margin-top: 0;
  margin-bottom: 25px;
  color: var(--color-card-heading);
  font-size: 1.6em;
  font-family: 'Montserrat', sans-serif;
  font-weight: 400;
}

/* Account Card Layout */
.account-info {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 15px;
}

.account-details p {
  margin: 5px 0;
  font-size: 1.1em;
  color: var(--color-card-text);
}

.account-details p strong {
  color: var(--color-card-heading);
  min-width: 70px;
  display: inline-block;
}

.user-photo {
  display: block;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin: 0;
  border: 2px solid var(--color-card-border);
  object-fit: cover;
}

/* Button Styles to match the rest of the app */
.button-primary {
  background-color: var(--color-primary, #007bff);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 600;
  font-family: inherit;
  font-size: 0.95rem;
  transition: background-color 0.2s, transform 0.1s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.button-primary:hover:not(:disabled) {
  background-color: var(--color-primary-dark, #0056b3);
}

.button-primary:active:not(:disabled) {
  transform: scale(0.98);
}

.button-primary:disabled, .button-secondary:disabled, .button-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button-secondary {
  background-color: transparent;
  color: var(--color-card-text);
  border: 1px solid var(--color-card-border);
  border-radius: 6px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 500;
  font-family: inherit;
  font-size: 0.95rem;
  transition: background-color 0.2s, border-color 0.2s, transform 0.1s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.button-secondary:hover:not(:disabled) {
  background-color: var(--color-card-mute);
  border-color: var(--color-card-text);
}

.button-secondary:active:not(:disabled) {
  transform: scale(0.98);
}

.button-danger {
  background-color: var(--color-danger, #dc3545);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 600;
  font-family: inherit;
  font-size: 0.95rem;
  transition: background-color 0.2s, transform 0.1s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.button-danger:hover:not(:disabled) {
  background-color: #c82333;
}

.button-danger:active:not(:disabled) {
  transform: scale(0.98);
}

.button-primary.small, .button-secondary.small, .button-danger.small {
  padding: 6px 12px;
  font-size: 0.85rem;
  border-radius: 4px;
}

.logout-button {
  display: block;
  margin: 15px auto 0 auto;
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

/* Delete Account Button & Modal Styles */
.delete-account-button {
  display: block;
  margin: 15px auto 0 auto;
  padding: 10px 20px;
  font-size: 1.0em;
  font-weight: bold;
  background-color: transparent;
  color: #dc3545;
  border: 1px solid #dc3545;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
  width: 100%;
  text-align: center;
}

.delete-account-button:hover {
  background-color: #dc3545;
  color: white;
}

.delete-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 20px;
  backdrop-filter: blur(5px);
}

.delete-modal-content {
  background-color: var(--color-card-bg);
  padding: 30px;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  position: relative;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
  border: 1px solid var(--color-card-border);
  color: var(--color-card-text);
  text-align: center;
}
</style>