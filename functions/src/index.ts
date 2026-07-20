/**
 * LiftLogic / LiftAssist Cloud Functions Suite
 * Domain Modules:
 *  - garmin.ts: Garmin Connect IQ Watch Pairing & Workout Session API
 *  - strava.ts: Strava OAuth Code Exchange & Activity Synchronization
 *  - user.ts: User Administration & GDPR Right-to-Erasure Account Deletion
 */

import { initializeApp } from "firebase-admin/app";
initializeApp();

// Export Garmin Connect IQ Functions
export {
    generatePairingCode,
    checkPairingCode,
    claimPairingCode,
    getWorkoutSession,
    submitWorkoutSession
} from "./garmin";

// Export Strava Integration Functions
export {
    exchangeStravaCode,
    syncStravaActivities,
    onWorkoutLogged
} from "./strava";

// Export User Account Functions
export {
    deleteAccount
} from "./user";
