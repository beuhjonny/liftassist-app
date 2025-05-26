import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Routines from '../views/Routines.vue';
import WorkoutActive from '../views/WorkoutActive.vue'; // Make sure this is the component for the active workout screen
import WorkoutHistory from '../views/WorkoutHistory.vue'; // Or 'History.vue' if that's the name
import Profile from '../views/Profile.vue';
import Login from '../views/Login.vue';

// Firebase auth imports remain the same
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { app } from '../firebase.js';


const auth = getAuth(app);

// Helper function to get current user state asynchronously
// This is useful because onAuthStateChanged is the most reliable way,
// but router.beforeEach might run before the initial onAuthStateChanged in useAuth.ts fires
// or if the page is refreshed.
const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve, reject) => {
    // onAuthStateChanged returns an unsubscribe function,
    // so we call it once we have the initial user state.
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe(); // Unsubscribe to avoid memory leaks if called multiple times
        resolve(user);
      },
      reject // If there's an error with onAuthStateChanged
    );
  });
};

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/routines',
    name: 'Routines',
    component: Routines,
    meta: { requiresAuth: true },
  },
  {
    path: '/workout-active/:programId/:dayId', // This is the one we want for active workouts
    name: 'WorkoutActive',
    component: WorkoutActive,
    meta: { requiresAuth: true },
    props: true // Allows route params to be passed as props
  },
  // Note: If you had an older '/workout' route without params, decide if you still need it or if
  // the one above replaces it. For now, I'm assuming the parameterized one is the target.
  {
    path: '/history',
    name: 'History', // Using 'History' as the consistent name
    component: WorkoutHistory, // Assuming WorkoutHistory is your component for this
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
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
  } else if (to.name === 'Login' && user) { // THIS IS THE KEY PART
    // User is logged in and trying to access Login page
    console.log('  User logged in, redirecting from Login to /');
    next({ name: 'Home' }); // Redirecting to Home
  } else {
    console.log('  Allowing navigation.');
    next();
  }
});

export default router;