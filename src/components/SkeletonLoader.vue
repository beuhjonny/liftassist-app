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
  background-color: #e0e0e0; /* Base color */
  background-image: linear-gradient(
    90deg,
    #e0e0e0 0px,
    #f0f0f0 40px,
    #e0e0e0 80px
  );
  background-size: 600px; /* Large enough to slide across */
  animation: skeleton-shimmer 1.6s infinite linear;
  display: inline-block;
  /* Ensure it takes up space even if empty */
}

/* Dark mode support if applicable, or generic card bg contrast */
@media (prefers-color-scheme: dark) {
    .skeleton-loader {
        background-color: #2a2a2a;
        background-image: linear-gradient(
            90deg,
            #2a2a2a 0px,
            #3a3a3a 40px,
            #2a2a2a 80px
        );
    }
}

/* If app controls theme via class on body/html */
:global(.dark-mode) .skeleton-loader {
    background-color: #2a2a2a;
    background-image: linear-gradient(
        90deg,
        #2a2a2a 0px,
        #3a3a3a 40px,
        #2a2a2a 80px
    );
}

@keyframes skeleton-shimmer {
  0% {
    background-position: -100px;
  }
  100% {
    background-position: 140px; /* Move past the width */
    /* Note: for 100% width elements this might need to be larger or percentage based */
    background-position: calc(100% + 100px); 
  }
}

.type-text {
  margin-bottom: 0.5em; /* Spacing like text lines */
}
</style>
