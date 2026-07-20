<template>
  <div v-if="show" class="actual-reps-input-section card-inset warning-highlight" style="margin-bottom: 20px;">
    <h3 class="input-section-title">
      <span class="warning-icon">💪</span> Log Actual Reps
    </h3>

    <div 
      v-for="item in items" 
      :key="item.index" 
      class="rep-input-row-item" 
      :class="{ 'is-confirmed-row': confirmedMap[item.index] }"
    >
      <div class="rep-input-meta">
        <span class="exercise-name">{{ item.set.exerciseName }}</span>
        <span class="prescribed-details">
          Prescribed: Set {{ item.set.setNumber }} — {{ item.set.prescribedReps }} reps @ {{ item.set.prescribedWeight }} {{ weightUnit }}
          <span v-if="item.set.status === 'failed'" class="status-textfailed">(Failed Attempt)</span>
          <span v-else class="status-textfailure">(To Failure)</span>
        </span>
      </div>
      
      <div class="input-control-row">
        <button type="button" class="btn-adjust minus" @click="$emit('decrement', item.index)">−</button>
        <input 
          type="number" 
          :id="'reps-input-' + item.index" 
          :value="inputMap[item.index]" 
          min="0"
          placeholder="Reps"
          class="rep-number-input"
          @input="$emit('updateInput', item.index, Number(($event.target as HTMLInputElement).value))"
        />
        <button type="button" class="btn-adjust plus" @click="$emit('increment', item.index)">+</button>
        
        <button 
          type="button" 
          class="btn-confirm-reps" 
          :class="{ 'confirmed': confirmedMap[item.index] }"
          @click="$emit('confirm', item.index)"
        >
          <span v-if="confirmedMap[item.index]">Confirmed ✓</span>
          <span v-else>Confirm</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean;
  items: Array<{
    index: number;
    set: {
      exerciseName: string;
      setNumber: number;
      prescribedReps: number;
      prescribedWeight: number;
      status: string;
    };
  }>;
  inputMap: Record<number, number>;
  confirmedMap: Record<number, boolean>;
  weightUnit: string;
}>();

defineEmits<{
  (e: 'decrement', index: number): void;
  (e: 'increment', index: number): void;
  (e: 'updateInput', index: number, value: number): void;
  (e: 'confirm', index: number): void;
}>();
</script>

<style scoped>
.actual-reps-input-section {
  background-color: var(--color-card-bg);
  border: 1px solid var(--color-warning);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.1);
}

.warning-highlight {
  border-left: 5px solid var(--color-warning);
}

.input-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px 0;
  font-size: 1.15em;
  font-weight: 600;
  color: var(--color-warning);
}

.rep-input-row-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px dashed var(--color-card-border);
}

.rep-input-row-item:first-of-type {
  padding-top: 0;
}

.rep-input-row-item:last-child {
  border-bottom: none;
}

.rep-input-row-item.is-confirmed-row {
  opacity: 0.85;
}

.rep-input-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rep-input-meta .exercise-name {
  font-weight: 700;
  font-size: 1.05em;
  color: var(--color-card-heading);
}

.rep-input-meta .prescribed-details {
  font-size: 0.9em;
  color: var(--color-card-text);
  opacity: 0.9;
}

.status-textfailed {
  color: #dc3545;
  font-weight: 600;
  margin-left: 5px;
}

.status-textfailure {
  color: #ca8a04;
  font-weight: 600;
  margin-left: 5px;
}

.input-control-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.rep-number-input {
  width: 75px;
  height: 40px;
  text-align: center;
  font-size: 1.1em;
  font-weight: 600;
  border-radius: 6px;
  border: 1px solid var(--color-card-border);
  background-color: var(--color-background);
  color: var(--color-text);
  box-sizing: border-box;
}

.rep-number-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.btn-adjust {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 1px solid var(--color-card-border);
  background-color: var(--color-card-mute);
  color: var(--color-card-text);
  font-size: 1.2em;
  font-weight: bold;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s;
}

.btn-adjust:hover {
  background-color: var(--color-card-border);
}

.btn-confirm-reps {
  height: 40px;
  padding: 0 16px;
  border-radius: 6px;
  border: none;
  background-color: var(--color-primary);
  color: white;
  font-weight: 600;
  font-size: 0.95em;
  cursor: pointer;
  transition: all 0.2s;
  flex-grow: 1;
  max-width: 150px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-confirm-reps:hover {
  background-color: var(--color-primary-dark);
}

.btn-confirm-reps.confirmed {
  background-color: var(--color-success);
}
</style>
