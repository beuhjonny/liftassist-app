<template>
  <div 
    class="routine-list-item"
    style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;"
  >
    <div class="routine-info">
      <span class="routine-name">{{ program.programName || 'Untitled' }}</span>
      <span v-if="isActive" class="active-badge-inline" style="margin-left: 8px; font-size: 0.8em; color: #ffc107; font-weight: bold;">★ Active</span>
    </div>
    
    <div class="routine-actions" style="display:flex; gap:10px;">
      <button 
        v-if="!isActive" 
        @click="$emit('setActive', program.id)" 
        class="button-secondary small"
      >
        Set Active
      </button>
      <button 
        @click="$emit('select', program.id)" 
        class="button-primary-outline small"
      >
        View/Edit
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  program: {
    id: string;
    programName?: string;
  };
  isActive: boolean;
}>();

defineEmits<{
  (e: 'setActive', id: string): void;
  (e: 'select', id: string): void;
}>();
</script>
