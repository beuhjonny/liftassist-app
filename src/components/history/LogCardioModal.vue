<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="log-cardio-card card">
      <div class="modal-header">
        <h2>🏃 Log Cardio Session</h2>
        <button @click="$emit('close')" class="modal-close-btn">&times;</button>
      </div>

      <form @submit.prevent="handleSave" class="cardio-form">
        <!-- Activity Type Selector -->
        <div class="form-group">
          <label class="form-label">Activity Type</label>
          <div class="type-grid">
            <button 
              type="button"
              v-for="typeObj in activityTypes" 
              :key="typeObj.value"
              @click="selectType(typeObj.value)"
              class="type-btn"
              :class="{ active: form.type === typeObj.value }"
            >
              <span class="type-icon">{{ typeObj.icon }}</span>
              <span class="type-label">{{ typeObj.label }}</span>
            </button>
          </div>
        </div>

        <!-- Activity Title / Name -->
        <div class="form-group">
          <label class="form-label">Session Name</label>
          <input 
            type="text" 
            v-model="form.name" 
            placeholder="e.g. Morning Trail Run, 10mi Bike Ride"
            required
            class="form-input"
          />
        </div>

        <!-- Duration & Distance Row -->
        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">Duration (min)</label>
            <input 
              type="number" 
              v-model.number="form.durationMinutes" 
              min="1" 
              step="1"
              required
              class="form-input"
            />
          </div>

          <div class="form-group flex-1">
            <label class="form-label">Distance ({{ distanceUnitLabel }})</label>
            <input 
              type="number" 
              v-model.number="form.distance" 
              min="0" 
              step="0.01"
              placeholder="0.0"
              class="form-input"
            />
          </div>
        </div>

        <!-- Date & Time -->
        <div class="form-group">
          <label class="form-label">Date & Time</label>
          <input 
            type="datetime-local" 
            v-model="form.dateStr" 
            required
            class="form-input"
          />
        </div>

        <!-- Notes -->
        <div class="form-group">
          <label class="form-label">Notes (Optional)</label>
          <textarea 
            v-model="form.notes" 
            rows="2"
            placeholder="How did the session feel? Pace, heart rate, or route notes..."
            class="form-input"
          ></textarea>
        </div>

        <div v-if="error" class="error-text">
          ⚠️ {{ error }}
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button type="button" @click="$emit('close')" class="button-secondary" :disabled="isSaving">
            Cancel
          </button>
          <button type="submit" class="button-primary" :disabled="isSaving">
            {{ isSaving ? 'Saving...' : 'Save Cardio Session' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import useSettings from '@/composables/useSettings';
import useExternalActivities from '@/composables/useExternalActivities';

const emit = defineEmits(['close', 'saved']);
const { settings } = useSettings();
const { logCardioSession } = useExternalActivities();

const isSaving = ref(false);
const error = ref<string | null>(null);

const distanceUnitLabel = computed(() => settings.value.cardioDistanceUnit === 'km' ? 'km' : 'mi');

const activityTypes = [
  { value: 'Run', label: 'Run', icon: '🏃' },
  { value: 'Ride', label: 'Cycle', icon: '🚴' },
  { value: 'Swim', label: 'Swim', icon: '🏊' },
  { value: 'Walk', label: 'Walk', icon: '🥾' },
  { value: 'Hike', label: 'Hike', icon: '🏔️' },
  { value: 'Rowing', label: 'Row', icon: '🚣' },
  { value: 'Cardio', label: 'Cardio', icon: '⚡' }
];

const now = new Date();
const localIsoDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

const form = reactive({
  type: 'Run',
  name: 'Run',
  durationMinutes: 30,
  distance: 3.0,
  dateStr: localIsoDate,
  notes: ''
});

function selectType(typeVal: string) {
  form.type = typeVal;
  if (!form.name || activityTypes.some(t => t.label === form.name || t.value === form.name)) {
    const match = activityTypes.find(t => t.value === typeVal);
    form.name = match ? match.label : typeVal;
  }
}

async function handleSave() {
  if (!form.name.trim()) {
    error.value = 'Please enter a name for the activity.';
    return;
  }

  isSaving.value = true;
  error.value = null;

  try {
    const selectedDate = new Date(form.dateStr);

    // Convert distance if user is in km mode
    let distanceInMiles = form.distance || 0;
    if (settings.value.cardioDistanceUnit === 'km' && distanceInMiles > 0) {
      distanceInMiles = distanceInMiles * 0.621371; // Store miles internally for consistency
    }

    await logCardioSession({
      name: form.name.trim(),
      type: form.type,
      date: selectedDate,
      durationMinutes: form.durationMinutes || 0,
      distanceMiles: distanceInMiles,
      source: 'manual',
      notes: form.notes.trim()
    });

    emit('saved');
    emit('close');
  } catch (e: any) {
    error.value = e.message || 'Failed to save cardio session.';
  } finally {
    isSaving.value = false;
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 16px;
}

.log-cardio-card {
  width: 100%;
  max-width: 500px;
  padding: 24px;
  border-radius: 16px;
  text-align: left;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.35em;
  font-weight: 800;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 1.5em;
  color: var(--color-card-text);
  cursor: pointer;
  opacity: 0.7;
}

.cardio-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.flex-1 {
  flex: 1;
}

.form-label {
  font-size: 0.8em;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-card-text);
  opacity: 0.75;
}

.form-input {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--color-card-border);
  background-color: var(--color-card-mute, #1a1a1a);
  color: var(--color-card-text, #ffffff);
  font-size: 0.95em;
}

.type-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.type-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--color-card-border);
  background-color: var(--color-card-mute, #1a1a1a);
  color: var(--color-card-text);
  font-size: 0.85em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0.75;
}

.type-btn.active {
  background-color: #10b981;
  border-color: #10b981;
  color: #ffffff;
  opacity: 1;
}

.error-text {
  color: #ff4d4d;
  font-size: 0.85em;
  font-weight: 600;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}
</style>
