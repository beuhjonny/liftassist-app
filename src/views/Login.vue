<template>
  <div class="login-view">
    <h1>{{ isSignUp ? 'Sign Up' : 'Login' }}</h1>
    <p v-if="!user" class="intro-text">Please sign in to continue.</p>
    
    <div v-if="!user" class="auth-options">
      <!-- Google Sign In Section -->
      <div class="auth-section google-section">
        <h2 class="section-title">Sign in with Google</h2>
        <p class="section-description">Use your Google account to sign in</p>
        <button @click="handleSignInWithGoogle" class="google-signin-button">
          <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google G Logo" />
          <span>Continue with Google</span>
        </button>
      </div>

      <!-- Divider -->
      <div class="divider">
        <span>OR</span>
      </div>

      <!-- Email/Password Form Section -->
      <div class="auth-section email-section">
        <h2 class="section-title">Sign in with Email</h2>
        <p class="section-description">Use your email and password to sign in</p>
        <div class="auth-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="your@email.com"
              class="form-input"
              @keyup.enter="handleEmailAuth"
            />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Enter your password"
              class="form-input"
              @keyup.enter="handleEmailAuth"
            />
          </div>
          <button
            @click="handleEmailAuth"
            class="email-auth-button"
            :disabled="isLoading || !email || !password"
          >
            {{ isLoading ? 'Please wait...' : (isSignUp ? 'Sign Up with Email' : 'Sign In with Email') }}
          </button>
          <button
            @click="toggleSignUp"
            class="toggle-auth-button"
            type="button"
          >
            {{ isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up" }}
          </button>
        </div>
      </div>
    </div>
    
    <p v-if="user" class="already-logged-in-message">You are already logged in. Redirecting...</p>
    <p v-if="authError" class="error-message">{{ authError }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'; // Added watch
import useAuth from '../composables/useAuth';
import { useRouter } from 'vue-router';

const { user, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
const router = useRouter();
const authError = ref<string | null>(null);
const isLoading = ref(false);
const isSignUp = ref(false);
const email = ref('');
const password = ref('');

const toggleSignUp = () => {
  isSignUp.value = !isSignUp.value;
  authError.value = null;
  password.value = ''; // Clear password when switching
};

const handleEmailAuth = async () => {
  if (!email.value || !password.value) {
    authError.value = 'Please enter both email and password.';
    return;
  }

  try {
    isLoading.value = true;
    authError.value = null;
    
    if (isSignUp.value) {
      await signUpWithEmail(email.value, password.value);
    } else {
      await signInWithEmail(email.value, password.value);
    }
    // onAuthStateChanged in useAuth will update the 'user' ref.
    // The route guard will then redirect away from /login if successful.
  } catch (error: any) {
    console.error('Login page error:', error);
    authError.value = error.message || `Failed to ${isSignUp.value ? 'sign up' : 'sign in'}. Please try again.`;
  } finally {
    isLoading.value = false;
  }
};

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
.login-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  max-width: 500px;
  margin: 0 auto;
}

.intro-text {
  margin-bottom: 30px;
  color: #666;
}

.auth-options {
  width: 100%;
}

.auth-section {
  background-color: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 25px;
  margin-bottom: 20px;
}

.google-section {
  border-color: #4285F4;
  background-color: #f0f7ff;
}

.email-section {
  border-color: #007bff;
  background-color: #f0f7ff;
}

.section-title {
  font-size: 1.2em;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #333;
  text-align: center;
}

.section-description {
  font-size: 0.9em;
  color: #666;
  margin: 0 0 20px 0;
  text-align: center;
}

.auth-form {
  width: 100%;
}

.form-group {
  margin-bottom: 15px;
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #4285F4;
}

.email-auth-button {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 15px;
  font-weight: 500;
}

.email-auth-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.email-auth-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.toggle-auth-button {
  width: 100%;
  padding: 8px;
  font-size: 14px;
  background-color: transparent;
  color: #007bff;
  border: none;
  cursor: pointer;
  margin-top: 10px;
  text-decoration: underline;
}

.toggle-auth-button:hover {
  color: #0056b3;
}

.divider {
  display: flex;
  align-items: center;
  width: 100%;
  margin: 25px 0;
  color: #666;
  font-weight: 600;
  font-size: 0.9em;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 2px solid #ddd;
}

.divider span {
  padding: 0 20px;
  background-color: #fff;
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
  margin-top: 10px;
  width: 100%;
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
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 10px 15px;
  border-radius: 4px;
  margin-top: 15px;
  width: 100%;
  text-align: left;
}

.already-logged-in-message {
  margin-top: 15px;
  color: #333;
}
</style>