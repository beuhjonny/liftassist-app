<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content edit-prescription-modal">
      <button @click="$emit('close')" class="modal-close-button" title="Close">&times;</button>
      <h3>Edit Weight & Reps</h3>
      <div class="form-group">
        <label for="editReps">{{ isTimed ? 'Hold Time (sec):' : 'Reps:' }}</label>
        <input 
          type="number" 
          id="editReps" 
          :value="reps" 
          @input="$emit('update:reps', ($event.target as HTMLInputElement).value === '' ? null : Number(($event.target as HTMLInputElement).value))" 
          min="1" 
          step="1" 
        />
      </div>
      <div class="form-group">
        <label for="editWeight">Weight (lbs):</label>
        <input 
          type="number" 
          id="editWeight" 
          :value="weight" 
          @input="$emit('update:weight', ($event.target as HTMLInputElement).value === '' ? null : Number(($event.target as HTMLInputElement).value))" 
          min="0" 
          step="0.1" 
        />
      </div>
      <div class="form-actions">
        <button @click="$emit('save')" class="button-primary">Save</button>
        <button @click="$emit('close')" class="button-secondary">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean;
  isTimed?: boolean;
  reps: number | null;
  weight: number | null;
}>();

defineEmits<{
  (e: 'close'): void;
  (e: 'save'): void;
  (e: 'update:reps', val: number | null): void;
  (e: 'update:weight', val: number | null): void;
}>();
</script>
<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  padding: 20px;
}

.modal-content.edit-prescription-modal {
  background-color: var(--color-card-bg, #ffffff);
  color: var(--color-card-text, #333333);
  border: 1px solid var(--color-card-border, #e0e0e0);
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 100%;
  position: relative;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
  text-align: left;
}

.modal-close-button {
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  color: var(--color-card-text);
  opacity: 0.6;
  cursor: pointer;
  padding: 4px;
  transition: opacity 0.2s;
}

.modal-close-button:hover {
  opacity: 1;
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 18px;
  font-size: 1.25em;
  font-weight: 700;
  color: var(--color-card-heading);
}

.form-group {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.9em;
  font-weight: 600;
  color: var(--color-card-text);
  opacity: 0.9;
}

.form-group input {
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid var(--color-card-border);
  background-color: var(--color-card-mute);
  color: var(--color-card-text);
  font-size: 1em;
  font-weight: 500;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 22px;
}

.button-primary {
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  background-color: var(--color-primary);
  color: #ffffff;
  font-weight: 600;
  font-size: 0.95em;
  cursor: pointer;
  transition: opacity 0.2s;
}

.button-primary:hover {
  opacity: 0.9;
}

.button-secondary {
  padding: 10px 20px;
  border-radius: 6px;
  border: 1px solid var(--color-card-border);
  background-color: var(--color-card-mute);
  color: var(--color-card-text);
  font-weight: 500;
  font-size: 0.95em;
  cursor: pointer;
  transition: background-color 0.2s;
}

.button-secondary:hover {
  background-color: var(--color-card-border);
}
</style>
