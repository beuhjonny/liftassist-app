// firebase.js
import { initializeApp } from 'firebase/app';
// 1. Import initializeFirestore and persistentLocalCache
import { initializeFirestore, persistentLocalCache, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if Firebase config is missing
const missingEnvVars = [];
if (!firebaseConfig.apiKey) missingEnvVars.push('VITE_FIREBASE_API_KEY');
if (!firebaseConfig.authDomain) missingEnvVars.push('VITE_FIREBASE_AUTH_DOMAIN');
if (!firebaseConfig.projectId) missingEnvVars.push('VITE_FIREBASE_PROJECT_ID');
if (!firebaseConfig.storageBucket) missingEnvVars.push('VITE_FIREBASE_STORAGE_BUCKET');
if (!firebaseConfig.messagingSenderId) missingEnvVars.push('VITE_FIREBASE_MESSAGING_SENDER_ID');
if (!firebaseConfig.appId) missingEnvVars.push('VITE_FIREBASE_APP_ID');

if (missingEnvVars.length > 0) {
  console.error('❌ Firebase configuration is missing!');
  console.error('Missing environment variables:', missingEnvVars.join(', '));
  console.error('Please create a .env file in the project root with your Firebase credentials.');
  console.error('The app will still load, but Firebase features will not work.');
}

let app;
let isFirebaseInitialized = false;
try {
  app = initializeApp(firebaseConfig);
  isFirebaseInitialized = true;
} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error);
  console.error('The app will continue to load, but Firebase features will not work.');
  // Create a dummy app object to prevent crashes
  app = null;
}

// 2. Initialize Firestore with persistence settings
//    Replace `const db = getFirestore(app);` and the `enableIndexedDbPersistence(db)` call
let db;
try {
  if (isFirebaseInitialized && app) {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ cacheSizeBytes: CACHE_SIZE_UNLIMITED }) // Using unlimited cache size as an example
      // You can also configure cache size explicitly, e.g., { cacheSizeBytes: 100 * 1024 * 1024 } for 100MB
    });
  } else {
    console.warn('⚠️ Firestore not initialized due to Firebase configuration error');
    db = null;
  }
} catch (error) {
  console.error('❌ Failed to initialize Firestore:', error);
  db = null;
}

// Note: With initializeFirestore, the .then() and .catch() for persistence enabling
// are handled differently. Firestore will attempt to enable persistence and will log
// its own messages to the console regarding success or fallback (e.g., if browser
// doesn't support it or multiple tabs are open).

export { db, app };