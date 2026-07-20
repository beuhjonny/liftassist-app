<template>
  <div v-if="show && workout" class="modal-overlay share-workout-modal-overlay" @click.self="$emit('close')">
    <div class="modal-content share-workout-modal card">
      <button @click="$emit('close')" class="modal-close-button" title="Close">&times;</button>
      
      <div class="modal-header">
        <h2>📤 Share Workout</h2>
        <p class="header-subtitle">Download your graphic workout card or share a public link.</p>
      </div>

      <!-- Loading State -->
      <div v-if="isGenerating" class="generating-container card-inset">
        <div class="spinner"></div>
        <p>Generating graphic workout card...</p>
      </div>

      <div v-else-if="imageError" class="error-container card-inset">
        <p>Failed to generate image preview.</p>
      </div>

      <!-- Preview Image Frame -->
      <div v-else-if="imagePreviewUrl" class="image-preview-container card-inset">
        <img :src="imagePreviewUrl" alt="Workout Summary Card" class="preview-img" />
      </div>

      <!-- Action Controls -->
      <div class="share-actions-section">
        <!-- 1. Native Share / Download Image -->
        <button 
          @click="handleShareOrDownloadImage" 
          class="button-primary full-width action-btn"
          :disabled="isGenerating || !imageBlob"
        >
          📱 Share / Download Image
        </button>

        <!-- 2. Copy Public Share Link -->
        <button 
          @click="handleCopyLink" 
          class="button-secondary full-width action-btn"
          :disabled="isCreatingLink"
        >
          <span v-if="isCreatingLink">Generating Link...</span>
          <span v-else-if="linkCopied">✅ Copied Link to Clipboard!</span>
          <span v-else>🔗 Copy Public Share Link</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import type { LoggedWorkout } from '@/types';
import useSettings from '@/composables/useSettings';
import usePublicShare from '@/composables/usePublicShare';
import { generateWorkoutCardBlob } from '@/utils/workoutCardCanvas';

const props = defineProps<{
  show: boolean;
  workout: LoggedWorkout | null;
}>();

defineEmits<{
  (e: 'close'): void;
}>();

const { settings } = useSettings();
const { createPublicWorkoutShare, isLoading: isCreatingLink } = usePublicShare();

const isGenerating = ref(false);
const imageError = ref(false);
const imageBlob = ref<Blob | null>(null);
const imagePreviewUrl = ref<string | null>(null);
const publicShareUrl = ref<string | null>(null);
const linkCopied = ref(false);

watch(() => [props.show, props.workout], async () => {
  cleanUp();
  if (props.show && props.workout) {
    isGenerating.value = true;
    imageError.value = false;
    try {
      const weightUnit = settings.value?.weightUnit || 'lbs';
      const blob = await generateWorkoutCardBlob(props.workout, weightUnit);
      imageBlob.value = blob;
      imagePreviewUrl.value = URL.createObjectURL(blob);
    } catch (e) {
      console.error('Failed to generate workout card image:', e);
      imageError.value = true;
    } finally {
      isGenerating.value = false;
    }
  }
}, { immediate: true });

function cleanUp() {
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value);
    imagePreviewUrl.value = null;
  }
  imageBlob.value = null;
  publicShareUrl.value = null;
  linkCopied.value = false;
}

async function handleShareOrDownloadImage() {
  if (!imageBlob.value || !props.workout) return;

  const fileName = `liftlogic-workout-${Date.now()}.png`;
  const file = new File([imageBlob.value], fileName, { type: 'image/png' });

  // 1. Try Native Web Share API first (Mobile iOS/Android)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: props.workout.workoutDayNameUsed || 'Workout Session',
        text: 'Check out my workout session on LiftLogic! 🏋️‍♂️',
        files: [file]
      });
      return;
    } catch (e: any) {
      // If user cancelled, return quietly
      if (e.name === 'AbortError') return;
      console.warn('Native share failed, falling back to download:', e);
    }
  }

  // 2. Fallback to Direct File Download (Desktop Web)
  const a = document.createElement('a');
  a.href = URL.createObjectURL(imageBlob.value);
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function handleCopyLink() {
  if (!props.workout) return;

  try {
    if (!publicShareUrl.value) {
      publicShareUrl.value = await createPublicWorkoutShare(props.workout);
    }

    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(publicShareUrl.value);
    } else {
      // Fallback for non-HTTPS or legacy browsers
      const input = document.createElement('input');
      input.value = publicShareUrl.value;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }

    linkCopied.value = true;
    setTimeout(() => {
      linkCopied.value = false;
    }, 3000);
  } catch (e: any) {
    alert('Failed to generate public share link: ' + e.message);
  }
}

onUnmounted(() => {
  cleanUp();
});
</script>

<style scoped>
.share-workout-modal-overlay {
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(6px);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.share-workout-modal {
  max-width: 440px;
  width: 92%;
  padding: 24px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  text-align: center;
  position: relative;
  overflow-y: auto;
}

.modal-header h2 {
  font-size: 1.4em;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: var(--color-card-heading);
}

.header-subtitle {
  font-size: 0.85em;
  color: var(--color-card-text);
  opacity: 0.8;
  margin: 0 0 16px 0;
}

.generating-container,
.error-container {
  padding: 30px 16px;
  border-radius: 12px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #007bff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.image-preview-container {
  padding: 10px;
  border-radius: 12px;
  margin-bottom: 18px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #0d0f12;
  border: 1px solid var(--color-card-border);
}

.preview-img {
  width: 100%;
  max-height: 380px;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.share-actions-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.action-btn {
  padding: 12px;
  font-size: 0.95em;
  font-weight: 700;
}

.full-width {
  width: 100%;
  box-sizing: border-box;
}
</style>
