<template>
  <div id="app-container" :class="{ 'has-tab-bar': showTabBar }">
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <Transition name="route" mode="out-in">
          <component :is="Component" />
        </Transition>
      </router-view>
    </main>

    <div v-if="envLabel" class="env-banner" :class="{ 'above-tab-bar': showTabBar }">
      {{ envLabel }}
    </div>

    <AppTabBar v-if="showTabBar" />

    <ToastHost />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import useAuth from './composables/useAuth';
import useSettings from './composables/useSettings'; // Make sure this path is correct
import ToastHost from './components/base/ToastHost.vue';
import AppTabBar from './components/base/AppTabBar.vue';

const { user } = useAuth();
// Init settings (will auto-load when user is set due to watcher in composable)
useSettings();

const route = useRoute();

// Bottom tab bar shows for signed-in users on root screens, and is hidden in
// the full-focus workout session (meta.hideTabBar) and on chrome-less routes.
const showTabBar = computed(() => !!user.value && !route.meta.hideTabBar);

const envLabel = computed(() => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'LOCAL';
  }
  if (hostname.includes('web.app') && hostname.includes('--')) {
     // Firebase preview channels usually look like project--channel-id.web.app
     // While production is project.web.app
     return 'PREVIEW';
  }
  return null; // Production or unknown
});
</script>

<style>
/* Environment Banner */
.env-banner {
  position: fixed;
  bottom: var(--space-2);
  right: var(--space-2);
  background-color: var(--color-warning-bg);
  color: var(--color-warning-fg);
  border: 1px solid var(--color-warning-line);
  padding: 2px var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
  border-radius: var(--radius-full);
  z-index: 90; /* below the tab bar (z-nav) */
  opacity: 0.9;
  pointer-events: none;
}
/* Lift the badge above the fixed tab bar when it is present. */
.env-banner.above-tab-bar {
  bottom: calc(56px + var(--safe-bottom) + var(--space-2));
}

/* Global Branding Classes */
.nav-brand {
  font-family: 'Montserrat', sans-serif;
  margin-right: 15px;
  font-size: 1.4em;
  color: var(--color-heading);
  display: flex;
  align-items: center;
}
.brand-lift {
  font-weight: 900; 
}
.brand-logic {
  font-weight: 400; 
}

/* Styles for App.vue navigation */

/* Body font (Inter) and smoothing come from base.css; no per-container
   font override so the loaded pairing actually applies. */
#app-container {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Reserve space so fixed-bottom tab bar never overlaps scrollable content. */
#app-container.has-tab-bar .main-content {
  padding-bottom: calc(56px + var(--safe-bottom) + var(--space-2));
}

.app-nav {
  padding: 15px 0;
  text-align: center;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 20px;
  width: 100%;

  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap; /* Allow wrapping on small screens */
  overflow-x: hidden;
}

.nav-links {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
}

.app-nav a {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 12px;
  padding: 5px 2px;
  text-decoration: none;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  transition: color 0.3s ease, transform 0.2s ease;
}

/* Styling for the emoji */
.app-nav a::before {
  content: attr(data-emoji);
  margin-right: 0.4em;
  font-size: 1.1em;
  line-height: 1;
}

.app-nav a.router-link-exact-active {
  color: var(--color-accent-line);
}

/* Hover effect for non-active links */
@media (hover: hover) {
  .app-nav a:hover {
    background-color: rgba(93, 109, 126, 0.15);
    border-radius: 4px;
  }
  .app-nav a:not(.router-link-exact-active):hover {
    color: var(--color-heading);
  }
}

/* --- Responsive adjustments --- */

@media (max-width: 600px) {
  .app-nav {
    flex-direction: column; /* Stack vertically on mobile */
    gap: 10px; /* Add space between brand and links */
  }
  .nav-brand {
    margin-right: 0; /* Remove right margin when stacked */
  }
  .main-content {
    padding: 0 10px;
  }
}

@media (max-width: 500px) {
  .app-nav a {
    font-size: 0.8rem; /* Smaller font to fit "Progress" */
    margin: 0 4px;   /* Much tighter margins */
    padding: 6px 6px; /* Add some touch target padding, removed vertical margin */
  }
  .app-nav a::before {
    font-size: 1.1em;
    margin-right: 4px;
  }
  .nav-links {
    width: 100%;
    justify-content: center;
    flex-wrap: nowrap; /* Force single line if possible */
  }
}
</style>