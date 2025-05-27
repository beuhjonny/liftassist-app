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

const app = initializeApp(firebaseConfig);

// 2. Initialize Firestore with persistence settings
//    Replace `const db = getFirestore(app);` and the `enableIndexedDbPersistence(db)` call
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ cacheSizeBytes: CACHE_SIZE_UNLIMITED }) // Using unlimited cache size as an example
  // You can also configure cache size explicitly, e.g., { cacheSizeBytes: 100 * 1024 * 1024 } for 100MB
});

// Note: With initializeFirestore, the .then() and .catch() for persistence enabling
// are handled differently. Firestore will attempt to enable persistence and will log
// its own messages to the console regarding success or fallback (e.g., if browser
// doesn't support it or multiple tabs are open).

export { db, app };