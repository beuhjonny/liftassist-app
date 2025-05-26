<template>
  <div class="login-view">
    <h1>Login</h1>
    <p v-if="!user">Please sign in to continue.</p>
    <button v-if="!user" @click="handleSignInWithGoogle" class="google-signin-button">
      <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google G Logo" />
      Sign in with Google
    </button>
    <p v-if="user" class="already-logged-in-message">You are already logged in. Redirecting...</p>
    <p v-if="authError" class="error-message">{{ authError }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'; // Added watch
import useAuth from '../composables/useAuth';
import { useRouter } from 'vue-router';

const { user, signInWithGoogle } = useAuth(); // logout function removed from here
const router = useRouter();
const authError = ref<string | null>(null);

const handleSignInWithGoogle = async () => {
  try {
    authError.value = null;
    await signInWithGoogle();
    // onAuthStateChanged in useAuth will update the 'user' ref.
    // The route guard will then redirect away from /login if successful.
  } catch (error: any) {
    console.error('Login page error:', error);
    authError.value = error.message || 'Failed to sign in with Google. Please try again.';
  }
};

// Optional: Watch for the user to become logged in while on this page
// and then redirect. The route guard handles this primarily, but this can
// provide a slightly smoother UX if the user somehow lands here while logged in
// before the guard fully redirects.
watch(user, (currentUser) => {
  if (currentUser && router.currentRoute.value.name === 'Login') {
    router.push('/'); // Redirect to home if user logs in while on login page
  }
}, { immediate: false }); // immediate: false to avoid redirect on initial load if already handled by guard

</script>

<style scoped>
/* Keep your existing scoped styles from the previous Login.vue version */
.login-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.google-signin-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  font-size: 16px;
  background-color: #4285F4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 20px;
  margin-bottom: 20px;
}

.google-signin-button:hover {
  background-color: #357ae8;
}

.google-signin-button img {
  width: 20px;
  height: 20px;
  margin-right: 10px;
  background-color: white;
  border-radius: 50%;
  padding: 2px;
}

.error-message {
  color: red;
  margin-top: 10px;
}

.already-logged-in-message {
  margin-top: 15px;
  color: #333;
}
</style>