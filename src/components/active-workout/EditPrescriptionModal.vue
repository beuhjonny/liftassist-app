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
