<template>
  <div class="about-modal-container">
    <button @click="openModal" class="button-about">
      <span class="info-icon" aria-hidden="true">ⓘ</span> About <span style="font-family: 'Montserrat', sans-serif; margin-left:4px;"><span class="brand-lift">LIFT</span> <span class="brand-logic">LOGIC</span></span>
    </button>

    <div v-if="isOpen" class="manifesto-modal-overlay" @click.self="closeModal">
      <div class="manifesto-modal-content card">
        <button @click="closeModal" class="modal-close-button" aria-label="Close manifesto">&times;</button>
        <div style="text-align: center; margin-bottom: 20px;">
             <h1 class="welcome-title" style="font-size: 2.2em; margin-top: 0; margin-bottom: 5px; display: flex; justify-content: center; align-items: center;">
               <span class="brand-lift">LIFT</span> <span class="brand-logic">LOGIC</span>
             </h1>
             <p class="welcome-subtitle" style="margin-bottom: 15px;">Get Stronger Progressively.</p>
        </div>
        <ManifestoComponent />
        <div class="modal-footer-links" style="text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px dashed var(--color-card-border); font-size: 0.85em; display: flex; justify-content: center; gap: 15px;">
          <router-link to="/privacy" @click="closeModal" style="color: #007bff; text-decoration: underline; padding: 0;">Privacy Policy</router-link>
          <span style="opacity: 0.5;">|</span>
          <router-link to="/terms" @click="closeModal" style="color: #007bff; text-decoration: underline; padding: 0;">Terms of Service</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ManifestoComponent from './ManifestoComponent.vue';

const isOpen = ref(false);

const openModal = () => {
  isOpen.value = true;
};

const closeModal = () => {
  isOpen.value = false;
};
</script>

<style scoped>
.about-modal-container {
    text-align: center;
    margin-top: 30px;
    margin-bottom: 20px;
}

.button-about {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-size: 0.9em;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.button-about:hover {
  opacity: 1;
  text-decoration: underline;
}

.info-icon {
  margin-right: 5px;
  font-size: 1.1em;
}

.brand-lift {
  font-weight: 900;
}
.brand-logic {
  font-weight: 400;
}

/* Modal Styles - Duplicated/Adapted from Home.vue */
.manifesto-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 20px;
  backdrop-filter: blur(5px);
}

.manifesto-modal-content {
  background-color: var(--color-card-bg); /* Use theme color */
  padding: 30px;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
  border: 1px solid var(--color-card-border);
  color: var(--color-card-text);
}

.modal-close-button {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 30px;
  color: var(--color-card-text);
  cursor: pointer;
  line-height: 1;
  padding: 0;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.modal-close-button:hover {
  opacity: 1;
}

.welcome-title {
    color: var(--color-card-heading);
}
.welcome-subtitle {
    color: var(--color-card-text);
    opacity: 0.8;
}
</style>
