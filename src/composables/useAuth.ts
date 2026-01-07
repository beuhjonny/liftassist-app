// src/composables/useAuth.ts
import { ref } from 'vue'; // Removed onUnmounted from here
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import { app } from '../firebase.js';

let auth;
let provider;
let unsubscribe: (() => void) | null = null;

try {
  if (app) {
    auth = getAuth(app);
    provider = new GoogleAuthProvider();
  } else {
    console.warn('⚠️ Firebase Auth not available - authentication features disabled');
    auth = null;
    provider = null;
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Auth:', error);
  auth = null;
  provider = null;
}

const user = ref<User | null>(null);

// This listener is set up ONCE when the module loads and stays active
if (auth) {
  try {
    unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      user.value = firebaseUser;
      // The log "Auth state changed. Current user: Proxy(_UserImpl)" is from here,
      // and "Signed in user: UserImpl" would be from the signInWithGoogle success.
      // These indicate auth IS working.
    });
  } catch (error) {
    console.error('❌ Failed to set up auth state listener:', error);
  }
}

const signInWithGoogle = async () => {
  if (!auth || !provider) {
    throw new Error('Firebase Auth is not configured. Please set up your .env file with Firebase credentials.');
  }
  try {
    const result = await signInWithPopup(auth, provider);
    // user.value will be updated by onAuthStateChanged
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

const signInWithEmail = async (email: string, password: string) => {
  if (!auth) {
    throw new Error('Firebase Auth is not configured. Please set up your .env file with Firebase credentials.');
  }
  try {
    await signInWithEmailAndPassword(auth, email, password);
    // user.value will be updated by onAuthStateChanged
  } catch (error: any) {
    console.error('Error signing in with email:', error);
    // Provide user-friendly error messages
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email address.');
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('Incorrect password.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address.');
    } else if (error.code === 'auth/invalid-credential') {
      throw new Error('Invalid email or password.');
    }
    throw error;
  }
};

const signUpWithEmail = async (email: string, password: string) => {
  if (!auth) {
    throw new Error('Firebase Auth is not configured. Please set up your .env file with Firebase credentials.');
  }
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    // user.value will be updated by onAuthStateChanged
  } catch (error: any) {
    console.error('Error signing up with email:', error);
    // Provide user-friendly error messages
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('An account with this email already exists. Try signing in instead.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please use at least 6 characters.');
    }
    throw error;
  }
};

const logout = async () => {
  if (!auth) {
    console.warn('⚠️ Cannot logout - Firebase Auth is not configured');
    user.value = null;
    return;
  }
  try {
    await signOut(auth);
    // user.value will be updated by onAuthStateChanged
  } catch (error) {
    console.error('Error signing out:', error);
  }
};

// Removed the onUnmounted(() => { unsubscribe(); }); block

export default function useAuth() {
  return {
    user,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
  };
}