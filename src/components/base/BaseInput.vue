<template>
  <label class="base-input-field">
    <span v-if="label" class="field-label">{{ label }}</span>
    <input
      class="field-input"
      :class="{ 'is-invalid': !!error }"
      :type="type"
      :inputmode="inputmode"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :aria-invalid="!!error || undefined"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <span v-if="error" class="field-error">{{ error }}</span>
  </label>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue?: string | number;
    label?: string;
    type?: 'text' | 'number' | 'email' | 'password';
    inputmode?: 'text' | 'numeric' | 'decimal' | 'email';
    placeholder?: string;
    disabled?: boolean;
    error?: string;
  }>(),
  { type: 'text' },
);
defineEmits<{ (e: 'update:modelValue', v: string): void }>();
</script>

<style scoped>
.base-input-field { display: flex; flex-direction: column; gap: var(--space-1); }
.field-label { font-size: var(--text-sm); font-weight: var(--weight-medium); color: var(--color-card-text); }
.field-input {
  min-height: var(--control-h-md); padding-inline: var(--space-3);
  border-radius: var(--radius-md); border: 1px solid var(--color-hairline);
  background: var(--surface-sunken); color: var(--color-card-text);
  font: inherit; font-size: max(16px, 1em);
  transition: border-color var(--duration-fast) var(--ease-standard);
}
.field-input:focus { outline: none; border-color: var(--color-accent); box-shadow: 0 0 0 2px var(--color-accent-quiet); }
.field-input.is-invalid { border-color: var(--color-danger-fg); }
.field-input:disabled { opacity: 0.5; }
.field-error { font-size: var(--text-xs); color: var(--color-danger-fg); }
</style>
