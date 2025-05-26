<template>
  <div id="app-container">
    <nav class="app-nav">
      <router-link to="/">Home</router-link> |

      <template v-if="user">
        <router-link to="/history">History</router-link> |
        <router-link to="/routines">Routines</router-link> |
        <router-link to="/profile">Profile</router-link>
        
        </template>

      <template v-if="!user">
        <router-link to="/login">Login</router-link>
      </template>
    </nav>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
// No need for useRouter or logout function here anymore
import useAuth from './composables/useAuth'; // Make sure this path is correct

const { user } = useAuth(); // We only need 'user' here for conditional rendering
                            // 'logout' function will be called from Profile.vue
</script>

<style>
/* Keep all your existing styles from App.vue */
/* ... your existing styles ... */
#app-container {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.app-nav {
  padding: 20px 0;
  text-align: center;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
  width: 100%;
  display: block;
}

.app-nav a { /* Style for router-links */
  font-weight: bold;
  color: #2c3e50;
  margin: 0 15px;
  text-decoration: none;
  vertical-align: middle;
}

.app-nav a.router-link-exact-active {
  color: #42b983;
}

/* .nav-button-link style can be removed if not used elsewhere,
   or kept if you plan to use styled buttons in the nav later */

.main-content {
  padding: 0 20px;
  text-align: center;
  width: 100%;
  display: block;
}
</style>