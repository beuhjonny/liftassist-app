<template>
  <div id="app-container">
    <nav class="app-nav">
   
        <router-link to="/" data-emoji="🏠">Home</router-link>


      <template v-if="user">
  <router-link to="/history" data-emoji="🕰️">History</router-link>
  <router-link to="/routines" data-emoji="📋">Routines</router-link>
  <router-link to="/profile" data-emoji="👤">Profile</router-link>
        
        </template>

      <template v-if="!user">
        <router-link to="/login">Login</router-link>
      </template>
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
// No need for useRouter import { computed } from 'vue';
import { useRoute } from 'vue-router';
import useAuth from './composables/useAuth';
import useSettings from './composables/useSettings'; // Make sure this path is correct

const { user } = useAuth();
// Init settings (will auto-load when user is set due to watcher in composable)
useSettings();

const route = useRoute();

const envLabel = import.meta.env.VITE_APP_ENV_LABEL;
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

<style>
/* Styles for App.vue navigation */

/* This container might set a base font and color for the whole app.
   If your body in base.css already handles this, you might not need to redefine color here. */
#app-container {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* color: #2c3e50; /* Default text color, consider if this should be var(--color-text) */
}

.app-nav {
  padding: 15px 0;      /* Adjusted padding */
  text-align: center;     /* Fallback if flex not supported, overridden by flex */
  border-bottom: 1px solid var(--color-border); /* Theme-aware border */
  margin-bottom: 20px;
  width: 100%;

  display: flex;          /* Use flexbox for layout */
  justify-content: center;  /* Center nav items horizontally */
  align-items: center;    /* Align items vertically */
  flex-wrap: nowrap;      /* CRITICAL: Prevents items from wrapping to new line */
  overflow-x: hidden;     /* Hide any accidental overflow; items might get clipped on tiny screens if not scaled down enough */
}

.app-nav a {
  font-weight: bold;
  color: var(--color-text); /* Theme-aware: dark text on light bg, light text on dark bg */
  margin: 0 12px;          /* Spacing between links, adjusted in media queries */
  padding: 5px 2px;        /* Vertical padding for touch area, minimal horizontal */
  text-decoration: none;
  white-space: nowrap;     /* Ensure text within each link doesn't wrap */
  display: inline-flex;    /* Align emoji and text nicely */
  align-items: center;
  transition: color 0.3s ease, transform 0.2s ease; /* Smooth hover/active effects */
}

/* Styling for the emoji */
.app-nav a::before {
  content: attr(data-emoji); /* Display the emoji from the data-attribute */
  margin-right: 0.4em;       /* Space between emoji and text */
  font-size: 1.1em;          /* Make emoji slightly larger than text */
  /* Ensuring emojis don't get distorted if font-size of 'a' changes drastically */
  line-height: 1;
}

.app-nav a.router-link-exact-active {
  color: hsla(160, 100%, 37%, 1); /* Vue green, or use a CSS variable like var(--vt-c-green) if defined */
  /* transform: scale(1.05); /* Optional: slightly enlarge active link */
}

/* Hover effect for non-active links */
@media (hover: hover) {
  .app-nav a:not(.router-link-exact-active):hover {
    color: var(--color-heading); /* Brighten text on hover (becomes lighter in light mode, potentially brighter white in dark) */
    /* Or use a specific hover color, e.g., a lighter shade of the active green */
    /* color: hsla(160, 100%, 37%, 0.7); */
  }
}

/* --- Responsive adjustments to prevent wrapping --- */

/* Adjust these breakpoints based on when your layout starts to feel crowded */
@media (max-width: 480px) { /* Smaller screens */
  .app-nav a {
    font-size: 0.9rem; /* Reduce font size */
    margin: 0 8px;    /* Reduce horizontal margins */
  }
  .app-nav a::before {
    font-size: 1em;     /* Adjust emoji size relative to new font size */
    margin-right: 0.3em;
  }
}

@media (max-width: 400px) { /* Even smaller screens */
  .app-nav a {
    font-size: 0.8rem;
    margin: 0 6px;
  }
  .app-nav a::before {
    font-size: 0.9em;
    margin-right: 0.25em;
    /* Consider hiding emojis if absolutely necessary for space, but try to keep them */
    /* Example: display: none; */
  }
}

@media (max-width: 350px) { /* Very narrow screens */
  .app-nav a {
    font-size: 0.75rem; /* Approaching minimum readable size for some */
    margin: 0 4px;
  }
  .app-nav a::before {
    /* On extremely small screens, you might choose to hide the emoji to save space */
    /* display: none; */
    /* Or make it very minimal */
    font-size: 0.85em;
    margin-right: 0.2em;
  }
}

/* Fallback for .main-content if it was styled here, ensure it still works */
.main-content {
  padding: 0 20px; /* This was in your original, assuming it's for content below nav */
  /* text-align: center; /* This might be better handled by specific page layouts */
  width: 100%;
  /* display: block; /* Default for divs, often not needed explicitly */
}
</style>