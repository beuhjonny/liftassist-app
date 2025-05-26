// src/composables/useAuth.ts
import { ref } from 'vue'; // Removed onUnmounted from here
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import { app } from '../firebase.js';

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const user = ref<User | null>(null);

const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    // user.value will be updated by onAuthStateChanged
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

const logout = async () => {
  try {
    await signOut(auth);
    // user.value will be updated by onAuthStateChanged
  } catch (error) {
    console.error('Error signing out:', error);
  }
};

// This listener is set up ONCE when the module loads and stays active
const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
  user.value = firebaseUser;
  // The log "Auth state changed. Current user: Proxy(_UserImpl)" is from here,
  // and "Signed in user: UserImpl" would be from the signInWithGoogle success.
  // These indicate auth IS working.
});

// Removed the onUnmounted(() => { unsubscribe(); }); block

export default function useAuth() {
  return {
    user,
    signInWithGoogle,
    logout,
  };
}