<template>
  <div class="login-view">
    <!-- First screen a new user sees: the plate carries the promise, the
         controls sit below it on flat surface. -->
    <header class="login-crown">
      <Vista band="push" plate="canyon" />
      <div class="crown-copy">
        <p class="wordmark"><span class="brand-lift">LIFT</span> <span class="brand-logic">LOGIC</span></p>
        <p class="crown-line">The app decides the weight. You do the work.</p>
      </div>
    </header>

    <div v-if="!user" class="login-body">
      <h1 class="login-title">{{ isSignUp ? 'Create your account' : 'Sign in' }}</h1>

      <button @click="handleSignInWithGoogle" class="google-signin-button">
        <svg class="google-g" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        <span>Continue with Google</span>
      </button>

      <div class="divider"><span>or</span></div>

      <div class="auth-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
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
            :autocomplete="isSignUp ? 'new-password' : 'current-password'"
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
          {{ isLoading ? 'Please wait...' : (isSignUp ? 'Create account' : 'Sign in with email') }}
        </button>
        <button @click="toggleSignUp" class="toggle-auth-button" type="button">
          {{ isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up" }}
        </button>
      </div>

      <p v-if="authError" class="error-message" role="alert">{{ authError }}</p>

      <div class="legal-footer-links">
        <router-link to="/privacy">Privacy Policy</router-link>
        <span aria-hidden="true">&middot;</span>
        <router-link to="/terms">Terms of Service</router-link>
      </div>
    </div>

    <p v-if="user" class="already-logged-in-message">Signed in. Taking you through&hellip;</p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'; // Added watch
import useAuth from '../composables/useAuth';
import { useRouter } from 'vue-router';
import Vista from '@/components/Vista.vue';

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
    // Honor a ?redirect= set by the auth guard (e.g. a shared /import/share)
    // so the user lands where they were headed, not always Home.
    const redirect = router.currentRoute.value.query.redirect;
    router.push(typeof redirect === 'string' ? redirect : '/');
  }
}, { immediate: false }); // immediate: false to avoid redirect on initial load if already handled by guard

</script>

<style scoped>
/* This view was never migrated to the token system - it shipped light cards
   into a dark app. Everything below is tokenized; no raw colours except the
   Google mark, whose brand colours are fixed by their guidelines. */
.login-view {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--surface-base);
}

/* The plate: full-bleed, resolving into the surface the controls sit on. */
.login-crown {
  /* Copy starts around 68% here, far lower than the Home hero, so the scrim
     holds off until 58% and the canyon rim survives. */
  --vista-scrim-start: 58%;
  position: relative;
  min-height: 42dvh;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: var(--space-6) var(--space-5) var(--space-4);
  overflow: hidden;
}
.login-crown > *:not(.vista) { position: relative; z-index: 1; }

.wordmark {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
  margin: 0;
}
.brand-lift { font-weight: 900; }
.brand-logic { font-weight: 400; }

.crown-line {
  margin: var(--space-2) 0 0;
  font-size: var(--text-base);
  color: var(--text-secondary);
  max-width: 22ch;
}

.login-body {
  flex: 1;
  width: 100%;
  max-width: 30rem;
  margin: 0 auto;
  padding: var(--space-5) var(--space-5) var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.login-title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
  color: var(--text-primary);
  margin: 0 0 var(--space-1);
}

.google-signin-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  min-height: 48px;
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  background: var(--surface-raised);
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-standard);
}
.google-signin-button:hover { background: var(--surface-overlay, var(--color-card-mute)); }
.google-g { width: 18px; height: 18px; flex: none; }

.divider {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: var(--space-1) 0;
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--text-tertiary);
}
.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--color-hairline);
}

.auth-form { display: flex; flex-direction: column; gap: var(--space-3); }
.form-group { display: flex; flex-direction: column; gap: var(--space-1); }
.form-group label {
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.form-input {
  width: 100%;
  min-height: 48px;
  padding: var(--space-3);
  /* 16px minimum, or iOS Safari zooms the viewport on focus. */
  font-size: 16px;
  color: var(--text-primary);
  background: var(--surface-raised);
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-md);
  box-sizing: border-box;
  transition: border-color var(--duration-fast) var(--ease-standard);
}
.form-input::placeholder { color: var(--text-tertiary); }
/* Chrome paints autofilled fields #e8f0fe and ignores background-color, which
   left saved-credential users staring at two white boxes in a dark app. An
   inset shadow is the only thing that overrides it. */
.form-input:-webkit-autofill,
.form-input:-webkit-autofill:hover,
.form-input:-webkit-autofill:focus {
  -webkit-text-fill-color: var(--text-primary);
  -webkit-box-shadow: 0 0 0 1000px var(--surface-raised) inset;
  caret-color: var(--text-primary);
  /* Defers Chrome's own background transition past any realistic session. */
  transition: background-color 9999s ease-out 0s;
}
.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-soft, rgba(59, 130, 246, 0.25));
}

.email-auth-button {
  width: 100%;
  min-height: 48px;
  padding: var(--space-3);
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  color: var(--color-accent-fg, #fff);
  background: var(--color-accent);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: filter var(--duration-fast) var(--ease-standard);
}
.email-auth-button:hover:not(:disabled) { filter: brightness(1.08); }
.email-auth-button:disabled { opacity: 0.45; cursor: not-allowed; }

.toggle-auth-button {
  width: 100%;
  min-height: 44px;
  padding: var(--space-2);
  font-size: var(--text-sm);
  background: none;
  color: var(--text-secondary);
  border: none;
  cursor: pointer;
}
.toggle-auth-button:hover { color: var(--text-primary); }

.error-message {
  margin: 0;
  padding: var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-danger-fg);
  background: var(--color-danger-bg);
  border: 1px solid var(--color-danger-line);
  border-radius: var(--radius-md);
}

.legal-footer-links {
  display: flex;
  justify-content: center;
  gap: var(--space-2);
  margin-top: var(--space-4);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}
.legal-footer-links a { color: var(--text-tertiary); }
.legal-footer-links a:hover { color: var(--text-secondary); }

.already-logged-in-message {
  padding: var(--space-5);
  text-align: center;
  color: var(--text-secondary);
}

/* Desktop splits rather than stacks. Stacked, the crown becomes a ~5:1
   letterbox and object-fit: cover crops the plate to a squashed band with no
   composition left. A full-height left panel is close to the aspect the plate
   was actually cut for, so the canyon survives. */
/* 64rem matches where main.css raises #app's padding to --space-6, so the
   breakout below can use that same token instead of a magic number. */
@media (min-width: 64rem) {
  .login-view {
    flex-direction: row;
    /* Sign-in is the one full-bleed screen; escape the global app gutter so
       the plate reaches the viewport edge instead of floating in a margin. */
    margin: calc(var(--space-6) * -1);
    width: calc(100% + var(--space-6) * 2);
  }

  .login-crown {
    flex: 1 1 46%;
    min-height: 100dvh;
    padding: var(--space-8) clamp(2rem, 4vw, 4rem);
    /* Copy sits low in a tall panel, so the scrim holds off far longer. */
    --vista-scrim-start: 64%;
  }

  .login-body {
    flex: 1 1 54%;
    justify-content: center;
    max-width: 34rem;
    padding: var(--space-8) clamp(2rem, 5vw, 5rem);
  }

  .wordmark { font-size: clamp(2.6rem, 3.4vw, 3.4rem); }
  .crown-line { font-size: 1.15rem; max-width: 20ch; }
}

/* Past ~1760px a 46% panel is wide enough that cover crops the plate back into
   a letterbox band. Cap both panels and centre the pair instead of stretching. */
@media (min-width: 110rem) {
  .login-view { justify-content: center; }
  .login-crown { flex: 0 1 48rem; }
  .login-body { flex: 0 1 34rem; max-width: 34rem; }
}
</style>