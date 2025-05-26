// firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAZCEIkoWKqMBG0h3rAiWN_wak2837PZ5w",
  authDomain: "lift-assist-progression-app.firebaseapp.com",
  projectId: "lift-assist-progression-app",
  storageBucket: "lift-assist-progression-app.firebasestorage.app",
  messagingSenderId: "573110456508",
  appId: "1:573110456508:web:691e2e62fde6cd17d640b9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, app };
