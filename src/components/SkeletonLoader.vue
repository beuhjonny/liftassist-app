<template>
  <div 
    class="skeleton-loader" 
    :class="[`type-${type}`]"
    :style="styleObject"
  ></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  width: {
    type: String,
    default: '100%'
  },
  height: {
    type: String,
    default: '1em'
  },
  borderRadius: {
    type: String,
    default: '4px'
  },
  type: {
    type: String as () => 'text' | 'rect' | 'circle',
    default: 'text'
  }
});

const styleObject = computed(() => {
  const styles: Record<string, string> = {
    width: props.width,
    height: props.height,
  };

  if (props.type === 'circle') {
    styles.borderRadius = '50%';
  } else {
    styles.borderRadius = props.borderRadius;
  }

  return styles;
});
</script>

<style scoped>
.skeleton-loader {
  background-color: var(--color-skeleton-base, #e0e0e0);
  background-image: linear-gradient(
    90deg,
    var(--color-skeleton-base, #e0e0e0) 0px,
    var(--color-skeleton-highlight, #f0f0f0) 40px,
    var(--color-skeleton-base, #e0e0e0) 80px
  );
  background-size: 600px;
  animation: skeleton-shimmer 1.6s infinite linear;
  display: inline-block;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: -100px;
  }
  100% {
    background-position: calc(100% + 100px); 
  }
}

.type-text {
  margin-bottom: 0.5em;
}
</style>
