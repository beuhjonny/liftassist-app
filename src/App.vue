<template>
  <div id="app-container">
    <nav class="app-nav">
        <span class="nav-brand"><span class="brand-lift">LIFT</span> <span class="brand-logic">LOGIC</span></span>
        <div class="nav-links">
          <router-link to="/" data-emoji="🎛️">Home</router-link>


      <template v-if="user">
  <router-link to="/history" data-emoji="📈">Progress</router-link>
  <router-link to="/routines" data-emoji="📋">Routines</router-link>
  <router-link to="/profile" data-emoji="👤">Profile</router-link>
        
        </template>

      <template v-if="!user">
        <router-link to="/login">Login</router-link>
      </template>
      </div>
    </nav>

    <main class="main-content">
      <router-view />
    </main>

    <div v-if="envLabel" class="env-banner">
      {{ envLabel }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import useAuth from './composables/useAuth';
import useSettings from './composables/useSettings'; // Make sure this path is correct

const { user } = useAuth();
// Init settings (will auto-load when user is set due to watcher in composable)
useSettings();

const route = useRoute();

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
  bottom: 0;
  right: 0;
  background-color: #ff9800;
  color: #fff;
  padding: 5px 10px;
  font-size: 0.8rem;
  font-weight: bold;
  border-top-left-radius: 8px;
  z-index: 9999;
  opacity: 0.8;
  pointer-events: none; /* Let clicks pass through */
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

/* This container might set a base font and color for the whole app. */
#app-container {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
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
  color: #007bff;
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