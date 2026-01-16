import { createRouter, createWebHistory } from 'vue-router';
// import Home from '../views/Home.vue';
// import Routines from '../views/Routines.vue';
// import WorkoutActive from '../views/WorkoutActive.vue'; // Make sure this is the component for the active workout screen
// import WorkoutHistory from '../views/WorkoutHistory.vue'; // Or 'History.vue' if that's the name
// import Profile from '../views/Profile.vue';
// import Login from '../views/Login.vue';

// Firebase auth imports remain the same
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { app } from '../firebase.js';

let auth;
try {
  if (app) {
    auth = getAuth(app);
  } else {
    console.warn('⚠️ Firebase Auth not available - app will work in demo mode');
    auth = null;
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Auth:', error);
  auth = null;
}

// Helper function to get current user state asynchronously
// This is useful because onAuthStateChanged is the most reliable way,
// but router.beforeEach might run before the initial onAuthStateChanged in useAuth.ts fires
// or if the page is refreshed.
const getCurrentUser = (): Promise<User | null> => {
  if (!auth) {
    // If Firebase isn't initialized, return null (no user)
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    try {
      // onAuthStateChanged returns an unsubscribe function,
      // so we call it once we have the initial user state.
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          unsubscribe(); // Unsubscribe to avoid memory leaks if called multiple times
          resolve(user);
        },
        (error) => {
          console.warn('⚠️ Auth state check failed:', error);
          resolve(null); // Resolve with null instead of rejecting
        }
      );
    } catch (error) {
      console.warn('⚠️ Failed to check auth state:', error);
      resolve(null); // Resolve with null instead of rejecting
    }
  });
};

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue') // Dynamic import
  },
  {
    path: '/routines',
    name: 'Routines',
    component: () => import('../views/Routines.vue'), // Dynamic import
    meta: { requiresAuth: true }
  },
  {
    path: '/workout-active/:programId/:dayId',
    name: 'WorkoutActive',
    component: () => import('../views/WorkoutActive.vue'), // Dynamic import
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('../views/WorkoutHistory.vue'), // Dynamic import
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'), // Dynamic import
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue') // Dynamic import
  }
];


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const user = await getCurrentUser(); // Make sure this function is robust

  console.log('Navigation Guard:');
  console.log('  To:', to.path);
  console.log('  Requires Auth:', requiresAuth);
  console.log('  User authenticated:', !!user);

  if (requiresAuth && !user) {
    console.log('  Redirecting to /login');
    next({ name: 'Login' });
  } else if (to.name === 'Login' && user) {
    console.log('  User logged in, redirecting from Login to /');
    next({ name: 'Home' });
  } else if (user && to.name === 'Home') {
    try {
      // Check for the known active program ID
      const { db } = await import('../firebase.js');
      const { doc, getDoc } = await import('firebase/firestore');
      const activeProgramRef = doc(db, 'users', user.uid, 'trainingPrograms', 'user_active_main_program');
      const activeProgramSnap = await getDoc(activeProgramRef);

      if (!activeProgramSnap.exists() && (from.name === null || from.name === 'Login')) {
        console.log('  New user detected (initial or login), auto-redirecting to /routines for setup');
        next({ name: 'Routines' });
        return;
      }
    } catch (e) {
      console.warn('  Failed active program check:', e);
    }
    next();
  } else {
    console.log('  Allowing navigation.');
    next();
  }
});

export default router;