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
