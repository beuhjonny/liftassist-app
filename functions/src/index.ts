/**
 * LiftLogic Cloud Functions
 * Backend bridge for Garmin Watch integration.
 */

import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Initialize Admin SDK once
initializeApp();
const db = getFirestore();

/**
 * 1. Generate Pairing Code (Called by Watch)
 * Returns a short 6-character code for the user to enter in the PWA.
 */
export const generatePairingCode = onRequest({ cors: true }, async (request, response) => {
    try {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded similar chars (I,1,O,0)
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Create the pairing document
        // We use the code as the document ID for easy lookup and uniqueness check (overwrite if exists is rare but acceptable for this scale)
        await db.collection("pairing_codes").doc(code).set({
            code,
            status: "pending",
            createdAt: FieldValue.serverTimestamp(),
            // In a real app, you'd having a TTL request or scheduled cleanup
        });

        logger.info("Generated pairing code", { code });
        response.json({ code });
    } catch (error) {
        logger.error("Error generating code", error);
        response.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * 2. Check Pairing Status (Called by Watch)
 * Watch polls this to see if the user has claimed the code.
 * If claimed, returns an accessToken for future requests.
 */
export const checkPairingCode = onRequest({ cors: true }, async (request, response) => {
    const code = request.query.code as string;
    if (!code) {
        response.status(400).json({ error: "Missing code parameter" });
        return;
    }

    try {
        const docRef = db.collection("pairing_codes").doc(code);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            response.status(404).json({ error: "Code not found" });
            return;
        }

        const data = docSnap.data();

        // Check if claimed
        if (data?.status === "claimed" && data?.userId && data?.accessToken) {
            response.json({
                status: "claimed",
                userId: data.userId,
                token: data.accessToken
            });
        } else {
            response.json({ status: "pending" });
        }
    } catch (error) {
        logger.error("Error checking code", error);
        response.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * 3. Claim Pairing Code (Called by PWA)
 * User enters the code in the web app. This links the code to their User ID.
 */
export const claimPairingCode = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be logged in to claim code.");
    }

    const code = request.data.code;
    if (!code || typeof code !== 'string') {
        throw new HttpsError("invalid-argument", "Missing or invalid code.");
    }

    // Upper case just in case
    const normalizedCode = code.toUpperCase();
    const docRef = db.collection("pairing_codes").doc(normalizedCode);

    // generated a simple random token for the watch to use as a persistent API key
    // Using simple random string for now (Node crypto)
    const crypto = await import("crypto");
    const accessToken = crypto.randomUUID();

    try {
        // Transaction to ensure we don't double-claim
        await db.runTransaction(async (transaction) => {
            const docSnap = await transaction.get(docRef);
            if (!docSnap.exists) {
                throw new HttpsError("not-found", "Invalid pairing code.");
            }

            const data = docSnap.data();
            if (data?.status === "claimed") {
                throw new HttpsError("already-exists", "This code has already been claimed.");
            }

            transaction.update(docRef, {
                status: "claimed",
                userId: request.auth!.uid, // assert auth because of check above
                claimedAt: FieldValue.serverTimestamp(),
                accessToken: accessToken
            });
        });

        return { success: true };
    } catch (error: any) {
        logger.error("Claim failed", error);
        // Rethrow HttpsErrors, wrap others
        if (error.code && error.details) throw error;
        throw new HttpsError("internal", "Failed to claim code.");
    }
});

/**
 * 4. Get Workout Session (Called by Watch)
 * Returns the current active training program for the user.
 * Requires ?token=ACCESS_TOKEN
 */
export const getWorkoutSession = onRequest({ cors: true }, async (request, response) => {
    const token = request.query.token as string;

    if (!token) {
        response.status(401).json({ error: "Unauthorized: Missing token" });
        return;
    }

    try {
        const pairingSnap = await db.collection("pairing_codes").where("accessToken", "==", token).limit(1).get();

        if (pairingSnap.empty) {
            response.status(401).json({ error: "Unauthorized: Invalid token" });
            return;
        }

        const pairingData = pairingSnap.docs[0].data();
        const userId = pairingData.userId;

        // 1. Get User Settings for activeProgramId
        const settingsSnap = await db.collection("users").doc(userId).collection("settings").doc("preferences").get();
        if (!settingsSnap.exists) {
            response.status(404).json({ error: "User settings not found" });
            return;
        }
        const settings = settingsSnap.data();
        const activeProgramId = settings?.activeProgramId;

        if (!activeProgramId) {
            response.status(404).json({ error: "No active program set" });
            return;
        }

        // 2. Get the Program
        const programSnap = await db.collection("users").doc(userId).collection("trainingPrograms").doc(activeProgramId).get();
        if (!programSnap.exists) {
            response.status(404).json({ error: "Active program not found" });
            return;
        }
        const programData = programSnap.data() as any;

        // 3. Get Last Logged Workout to find next day
        const lastWorkoutSnap = await db.collection("users").doc(userId).collection("loggedWorkouts")
            .orderBy("date", "desc")
            .limit(5)
            .get();

        let lastDayId = null;
        if (!lastWorkoutSnap.empty) {
            const match = lastWorkoutSnap.docs.find(doc => doc.data().trainingProgramIdUsed === activeProgramId);
            if (match) {
                lastDayId = match.data().workoutDayIdUsed;
            }
        }

        const workoutDays = (programData?.workoutDays || []) as any[];
        let lastDayIndex = -1;
        if (lastDayId) {
            for (let i = 0; i < workoutDays.length; i++) {
                if (workoutDays[i].id === lastDayId) {
                    lastDayIndex = i;
                    break;
                }
            }
        }
        const recommendedDayIndex = (lastDayIndex + 1) % (workoutDays.length || 1);

        // 4. Hydrate with Progression Data
        const hydratedDays = await Promise.all(workoutDays.map(async (day: any, index: number) => {
            const hydratedExercises = await Promise.all(day.exercises.map(async (ex: any) => {
                const progressKey = ex.exerciseName.toLowerCase().replace(/\s+/g, '_');
                const progressSnap = await db.collection("users").doc(userId).collection("exerciseProgress").doc(progressKey).get();

                let currentWeight = ex.prescribedWeight || 0;
                let currentReps = ex.prescribedReps || 0;

                if (progressSnap.exists) {
                    const progData = progressSnap.data();
                    currentWeight = progData?.currentWeightToAttempt ?? currentWeight;
                    currentReps = progData?.repsToAttemptNext ?? currentReps;
                }

                return {
                    ...ex,
                    prescribedWeight: currentWeight,
                    prescribedReps: currentReps
                };
            }));
            return {
                ...day,
                exercises: hydratedExercises,
                isRecommended: index === recommendedDayIndex
            };
        }));

        response.json({
            programId: activeProgramId,
            programName: programData?.programName,
            workoutDays: hydratedDays
        });

    } catch (error) {
        logger.error("Error in getWorkoutSession", error);
        response.status(500).json({ error: "Internal Server Error" });
    }
});

export const submitWorkoutSession = onRequest({ cors: true }, async (request, response) => {
    const token = request.query.token as string || request.body.token;
    const workoutData = request.body.workout;

    if (!token || !workoutData) {
        response.status(400).json({ error: "Missing token or workout data" });
        return;
    }

    try {
        const pairingSnap = await db.collection("pairing_codes").where("accessToken", "==", token).limit(1).get();
        if (pairingSnap.empty) {
            response.status(401).json({ error: "Unauthorized: Invalid token" });
            return;
        }

        const pairingData = pairingSnap.docs[0].data();
        const userId = pairingData.userId;

        // 1. Save Logged Workout
        const loggedWorkoutRef = db.collection("users").doc(userId).collection("loggedWorkouts").doc();
        const serverTs = FieldValue.serverTimestamp();

        const durationMinutes = workoutData.endTime && workoutData.startTime ?
            Math.floor((new Date(workoutData.endTime).getTime() - new Date(workoutData.startTime).getTime()) / 60000) : 0;

        const loggedWorkout = {
            id: loggedWorkoutRef.id,
            userId: userId,
            date: serverTs,
            trainingProgramIdUsed: workoutData.programId || "",
            trainingProgramNameUsed: workoutData.programName || "Unknown Program",
            workoutDayNameUsed: workoutData.dayName || "Unknown Day",
            workoutDayIdUsed: workoutData.dayId || "",
            performedExercises: (workoutData.performedExercises || []).map((ex: any) => ({
                ...ex,
                exerciseId: ex.exerciseId || "",
                exerciseName: ex.exerciseName || "Unnamed Exercise",
                sets: (ex.sets || []).map((s: any) => ({
                    ...s,
                    status: s.status || "done"
                }))
            })),
            overallSessionNotes: workoutData.notes || "",
            startTime: workoutData.startTime ? new Date(workoutData.startTime) : serverTs,
            endTime: workoutData.endTime ? new Date(workoutData.endTime) : serverTs,
            durationMinutes: durationMinutes
        };

        const batch = db.batch();
        batch.set(loggedWorkoutRef, loggedWorkout);

        // 2. Progression Logic
        for (const performedEx of workoutData.performedExercises) {
            const progressKey = performedEx.exerciseName.toLowerCase().replace(/\s+/g, '_');
            const progressRef = db.collection("users").doc(userId).collection("exerciseProgress").doc(progressKey);
            const progressSnap = await progressRef.get();

            if (!progressSnap.exists) continue;
            const currentProgress = progressSnap.data()!;

            // We need the config from the program to know targetSets, maxReps, etc.
            // This is a bit inefficient to fetch program again, but let's assume it's passed or fetch it.
            // For now, let's assume the watch sends the 'config' or we fetch the program.
            // Let's fetch the program to be safe and accurate.
            const programSnap = await db.collection("users").doc(userId).collection("trainingPrograms").doc(workoutData.programId).get();
            const programData = programSnap.data();
            const dayData = programData?.workoutDays?.find((d: any) => d.id === workoutData.dayId);
            const exConfig = dayData?.exercises.find((e: any) => e.id === performedEx.exerciseId);

            if (!exConfig || exConfig.enableProgression === false) continue;

            let criteriaMet = false;
            let allSetsDone = true;
            const performedSets = performedEx.sets || [];

            if (performedSets.length < exConfig.targetSets) {
                allSetsDone = false;
            } else {
                for (const set of performedSets) {
                    if (exConfig.isToFailure) {
                        // Failure logic: handled below by threshold
                    } else {
                        if (set.status !== 'done') { allSetsDone = false; break; }
                    }
                }
            }

            if (exConfig.isToFailure) {
                const threshold = exConfig.maxReps;
                let allExceeded = (performedSets.length >= exConfig.targetSets);
                for (const set of performedSets) {
                    if ((set.actualReps || 0) <= threshold) {
                        allExceeded = false;
                        break;
                    }
                }
                if (allExceeded) criteriaMet = true;
            } else {
                if (allSetsDone && currentProgress.repsToAttemptNext >= exConfig.maxReps) {
                    criteriaMet = true;
                }
            }

            const update: any = { lastPerformedDate: serverTs };
            if (criteriaMet) {
                update.consecutiveFailedWorkoutsAtCurrentWeightAndReps = 0;
                update.lastWorkoutAllSetsSuccessfulAtCurrentWeight = true;
                update.currentWeightToAttempt = (currentProgress.currentWeightToAttempt || 0) + (exConfig.weightIncrement || 5);
                update.repsToAttemptNext = exConfig.minReps || 1;
            } else {
                if (!exConfig.isToFailure) {
                    if (allSetsDone) {
                        update.lastWorkoutAllSetsSuccessfulAtCurrentWeight = true;
                        update.repsToAttemptNext = Math.min((currentProgress.repsToAttemptNext || 0) + (exConfig.repOverloadStep || 1), exConfig.maxReps);
                        update.consecutiveFailedWorkoutsAtCurrentWeightAndReps = 0;
                    } else {
                        update.lastWorkoutAllSetsSuccessfulAtCurrentWeight = false;
                        update.consecutiveFailedWorkoutsAtCurrentWeightAndReps = (currentProgress.consecutiveFailedWorkoutsAtCurrentWeightAndReps || 0) + 1;
                    }
                } else {
                    update.lastWorkoutAllSetsSuccessfulAtCurrentWeight = false;
                    if (performedSets.length >= exConfig.targetSets) {
                        update.consecutiveFailedWorkoutsAtCurrentWeightAndReps = 0;
                    }
                }
            }
            batch.update(progressRef, update);
        }

        await batch.commit();
        response.json({ success: true });

    } catch (error) {
        logger.error("Error in submitWorkoutSession", error);
        response.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * ------------------------------------------------------------
 * Strava Sync Integration Functions
 * ------------------------------------------------------------
 */

const fetch = (globalThis as any).fetch;

/**
 * 5. Exchange Strava Authorization Code (Called by PWA)
 * Exchanges a temporary authorization code for access and refresh tokens.
 */
export const exchangeStravaCode = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be logged in.");
    }
    const uid = request.auth.uid;
    const code = request.data.code;
    if (!code || typeof code !== 'string') {
        throw new HttpsError("invalid-argument", "Missing or invalid authorization code.");
    }

    try {
        // 1. Use the centralized Strava Client ID and Secret from environment variables
        const clientId = process.env.STRAVA_CLIENT_ID;
        const clientSecret = process.env.STRAVA_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
            throw new HttpsError("failed-precondition", "Centralized Strava credentials not configured on the backend.");
        }

        // 2. Post to Strava OAuth token endpoint
        const response = await fetch("https://www.strava.com/oauth/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code: code,
                grant_type: "authorization_code"
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            logger.error("Strava token exchange failed", errText);
            throw new HttpsError("internal", "Failed to exchange token with Strava API.");
        }

        const data = await response.json() as any;

        // 3. Save athlete tokens securely in the user's private document
        const athleteName = `${data.athlete?.firstname || ""} ${data.athlete?.lastname || ""}`.trim() || "Athlete";
        const authData = {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: data.expires_at, // Epoch seconds
            athleteId: data.athlete?.id || null,
            athleteName,
            connectedAt: FieldValue.serverTimestamp()
        };

        await db.collection("users").doc(uid).collection("strava").doc("auth").set(authData);

        return { success: true, athleteName };
    } catch (error: any) {
        logger.error("exchangeStravaCode error", error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", error.message || "Failed to exchange authorization code.");
    }
});

/**
 * 6. Sync Strava Activities (Called by PWA - Manual or Auto)
 * Fetches last 30 days of activities, filters for cardio (runs/rides/walks), and saves to Firestore.
 */
export const syncStravaActivities = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be logged in.");
    }
    const uid = request.auth.uid;
    const fullSync = request.data?.fullSync === true;

    try {
        const authRef = db.collection("users").doc(uid).collection("strava").doc("auth");
        const authSnap = await authRef.get();
        if (!authSnap.exists) {
            throw new HttpsError("failed-precondition", "Strava account not connected.");
        }

        const clientId = process.env.STRAVA_CLIENT_ID;
        const clientSecret = process.env.STRAVA_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
            throw new HttpsError("failed-precondition", "Centralized Strava credentials not configured on the backend.");
        }

        const configRef = db.collection("users").doc(uid).collection("strava").doc("config");
        const configSnap = await configRef.get();
        const configData = configSnap.exists ? configSnap.data() : null;

        const authData = authSnap.data()!;

        // Check pull preference
        if (configData && configData.enablePullFromStrava === false) {
            logger.info("Strava pull disabled for user", uid);
            return { success: true, count: 0 };
        }

        let accessToken = authData.accessToken;
        let expiresAt = authData.expiresAt;
        let refreshToken = authData.refreshToken;

        const currentTimeSec = Math.floor(Date.now() / 1000);
        // Refresh token if expired (5 minutes buffer)
        if (currentTimeSec >= (expiresAt - 300)) {
            logger.info("Refreshing Strava token for user", uid);
            const refreshResponse = await fetch("https://www.strava.com/oauth/token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    client_id: clientId,
                    client_secret: clientSecret,
                    grant_type: "refresh_token",
                    refresh_token: refreshToken
                })
            });

            if (!refreshResponse.ok) {
                const errText = await refreshResponse.text();
                logger.error("Strava token refresh failed", errText);
                throw new HttpsError("internal", "Failed to refresh expired Strava access token.");
            }

            const refreshData = await refreshResponse.json() as any;
            accessToken = refreshData.access_token;
            refreshToken = refreshData.refresh_token || refreshToken;
            expiresAt = refreshData.expires_at;

            await authRef.update({
                accessToken,
                refreshToken,
                expiresAt
            });
        }

        let activities: any[] = [];

        if (fullSync) {
            logger.info("Performing full Strava history sync for user", uid);
            let page = 1;
            const perPage = 100;
            // Limit to 10 pages (1000 activities) to stay safely within rate limits and execution time
            while (page <= 10) {
                const pageResponse = await fetch(
                    `https://www.strava.com/api/v3/athlete/activities?page=${page}&per_page=${perPage}`,
                    {
                        headers: {
                            "Authorization": `Bearer ${accessToken}`
                        }
                    }
                );

                if (!pageResponse.ok) {
                    const errText = await pageResponse.text();
                    logger.error(`Failed to fetch Strava page ${page}`, errText);
                    break;
                }

                const pageData = await pageResponse.json() as any[];
                if (!pageData || pageData.length === 0) {
                    break;
                }

                activities = activities.concat(pageData);
                if (pageData.length < perPage) {
                    break; // No more activities on subsequent pages
                }
                page++;
            }
        } else {
            // Fetch activities from Strava for last 30 days
            const thirtyDaysAgoSec = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
            const activitiesResponse = await fetch(
                `https://www.strava.com/api/v3/athlete/activities?after=${thirtyDaysAgoSec}&per_page=100`,
                {
                    headers: {
                        "Authorization": `Bearer ${accessToken}`
                    }
                }
            );

            if (!activitiesResponse.ok) {
                const errText = await activitiesResponse.text();
                logger.error("Failed to fetch Strava activities", errText);
                throw new HttpsError("internal", "Failed to fetch athlete activities from Strava API.");
            }

            activities = await activitiesResponse.json() as any[];
        }
        
        // Filter out weight training (we only pull runs and general cardio)
        // Strava activity types: Run, Ride, Walk, Hike, Swim, etc.
        const cardioActivities = activities.filter(act => act.sport_type !== "WeightTraining" && act.type !== "WeightTraining");

        const batch = db.batch();
        for (const act of cardioActivities) {
            const actDocId = `strava_${act.id}`;
            const actRef = db.collection("users").doc(uid).collection("externalActivities").doc(actDocId);

            // Parse start date safely
            const startDate = act.start_date ? new Date(act.start_date) : new Date();

            const actData = {
                id: actDocId,
                source: "strava",
                externalId: act.id,
                name: act.name || `${act.type} Activity`,
                type: act.type || "Run",
                date: startDate,
                durationMinutes: Math.round((act.moving_time || act.elapsed_time || 0) / 60),
                distanceMiles: act.distance ? Math.round((act.distance / 1609.344) * 100) / 100 : 0,
                elapsedTime: act.elapsed_time || 0,
                movingTime: act.moving_time || 0,
                averageSpeed: act.average_speed || 0,
                syncedAt: FieldValue.serverTimestamp()
            };

            batch.set(actRef, actData, { merge: true });
        }

        if (cardioActivities.length > 0) {
            await batch.commit();
        }

        logger.info(`Synced ${cardioActivities.length} cardio activities for user ${uid} (fullSync: ${fullSync})`);
        return { success: true, count: cardioActivities.length };

    } catch (error: any) {
        logger.error("syncStravaActivities error", error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", error.message || "Failed to synchronize Strava activities.");
    }
});

/**
 * 7. Background Trigger: Upload Workout to Strava
 * Automatically runs whenever a new logged workout is created.
 */
export const onWorkoutLogged = onDocumentCreated("users/{userId}/loggedWorkouts/{workoutId}", async (event) => {
    const params = event.params;
    const userId = params.userId;
    const workoutId = params.workoutId;

    try {
        // 1. Check connection
        const authRef = db.collection("users").doc(userId).collection("strava").doc("auth");
        const authSnap = await authRef.get();
        if (!authSnap.exists) {
            logger.info(`Strava connection not active for user ${userId}. Skipping upload.`);
            return;
        }

        const clientId = process.env.STRAVA_CLIENT_ID;
        const clientSecret = process.env.STRAVA_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
            logger.info(`Centralized Strava credentials not configured on backend. Skipping upload.`);
            return;
        }

        const configRef = db.collection("users").doc(userId).collection("strava").doc("config");
        const configSnap = await configRef.get();
        const configData = configSnap.exists ? configSnap.data() : null;

        const authData = authSnap.data()!;

        // Verify user preference
        if (configData && configData.enablePushToStrava === false) {
            logger.info(`Strava push disabled by user preferences for user ${userId}. Skipping upload.`);
            return;
        }

        // 2. Fetch the created workout
        const workoutRef = db.collection("users").doc(userId).collection("loggedWorkouts").doc(workoutId);
        const workoutSnap = await workoutRef.get();
        if (!workoutSnap.exists) {
            logger.error(`Workout document ${workoutId} not found in database.`);
            return;
        }
        const workoutData = workoutSnap.data()!;

        // Prevent double uploading
        if (workoutData.stravaActivityId) {
            logger.info(`Workout ${workoutId} already contains a Strava ID. Skipping upload.`);
            return;
        }

        let accessToken = authData.accessToken;
        let expiresAt = authData.expiresAt;
        let refreshToken = authData.refreshToken;

        const currentTimeSec = Math.floor(Date.now() / 1000);
        // Refresh token if expired (5 minutes buffer)
        if (currentTimeSec >= (expiresAt - 300)) {
            logger.info(`Refreshing Strava token for user ${userId} inside Firestore trigger.`);
            const refreshResponse = await fetch("https://www.strava.com/oauth/token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    client_id: clientId,
                    client_secret: clientSecret,
                    grant_type: "refresh_token",
                    refresh_token: refreshToken
                })
            });

            if (!refreshResponse.ok) {
                logger.error(`Failed to refresh token inside background trigger for user ${userId}.`);
                return;
            }

            const refreshData = await refreshResponse.json() as any;
            accessToken = refreshData.access_token;
            refreshToken = refreshData.refresh_token || refreshToken;
            expiresAt = refreshData.expires_at;

            await authRef.update({
                accessToken,
                refreshToken,
                expiresAt
            });
        }

        // 3. Format description and title
        const dayName = workoutData.workoutDayNameUsed || "Workout Session";
        const programName = workoutData.trainingProgramNameUsed || "";
        const title = `LiftLogic: ${dayName}${programName ? ` (${programName})` : ""}`;

        const getExerciseEmoji = (name: string): string => {
            const lower = name.toLowerCase();
            if (lower.includes("bench")) return "🎯";
            if (lower.includes("squat")) return "🏋️‍♂️";
            if (lower.includes("deadlift")) return "🚀";
            if (lower.includes("press")) return "💪";
            if (lower.includes("curl")) return "🦾";
            if (lower.includes("row") || lower.includes("pull")) return "🚣";
            if (lower.includes("run") || lower.includes("treadmill")) return "🏃‍♂️";
            if (lower.includes("bike") || lower.includes("cycle")) return "🚴";
            if (lower.includes("plank")) return "🧘";
            return "⚡";
        };

        let description = "💪 LiftLogic Weight Training Session Completed!\n\n";

        let totalVolume = 0;
        let totalSets = 0;
        let doneSets = 0;
        let failedSets = 0;
        const prsCompleted: string[] = [];

        if (workoutData.performedExercises && Array.isArray(workoutData.performedExercises)) {
            workoutData.performedExercises.forEach((ex: any) => {
                if (ex.isPR) {
                    prsCompleted.push(ex.exerciseName);
                }
                if (ex.sets && Array.isArray(ex.sets)) {
                    ex.sets.forEach((set: any) => {
                        totalSets++;
                        if (set.status === "failed") {
                            failedSets++;
                        } else {
                            doneSets++;
                        }
                        if (typeof set.actualWeight === "number" && typeof set.actualReps === "number" && set.actualReps > 0) {
                            totalVolume += (set.actualWeight * set.actualReps);
                        }
                    });
                }
            });
        }

        const duration = workoutData.durationMinutes || 0;
        const durationStr = duration > 0 ? `${duration} mins` : "N/A";
        const unit = workoutData.weightUnit || "lbs";

        description += "📊 WORKOUT STATS:\n";
        description += `🕒 Duration: ${durationStr}\n`;
        description += `🏋️‍♂️ Total Volume: ${totalVolume.toLocaleString()} ${unit}\n`;
        description += `🔢 Sets Logged: ${totalSets} (Done: ${doneSets}, Failed: ${failedSets})\n`;
        if (prsCompleted.length > 0) {
            description += `🏅 Personal Records: ${prsCompleted.length} (${prsCompleted.join(", ")}) 🌟\n`;
        }
        description += "\n";

        if (workoutData.overallSessionNotes) {
            description += `📝 Session Notes:\n"${workoutData.overallSessionNotes}"\n\n`;
        }

        if (workoutData.performedExercises && Array.isArray(workoutData.performedExercises)) {
            description += "🛠️ EXERCISE BREAKDOWN:\n";
            workoutData.performedExercises.forEach((ex: any) => {
                const prSuffix = ex.isPR ? " 🏅 (PR!)" : "";
                const emoji = getExerciseEmoji(ex.exerciseName);
                description += `\n${emoji} ${ex.exerciseName}${prSuffix}\n`;
                if (ex.sets && Array.isArray(ex.sets)) {
                    ex.sets.forEach((set: any, idx: number) => {
                        const statusIndicator = set.status === "failed" ? "❌ (failed)" : "✅";
                        const weight = set.actualWeight;
                        const reps = set.actualReps;
                        const setUnit = set.weightUnit || unit;
                        const isTimed = set.isTimed || false;
                        description += `  Set ${idx + 1}: ${reps}${isTimed ? " sec" : " reps"} @ ${weight} ${setUnit} ${statusIndicator}\n`;
                    });
                }
            });
        }
        description += "\nLogged via LiftLogic.";

        // Parse start date safely
        const startRaw = workoutData.startTime || workoutData.date || new Date();
        let startDateObj: Date;
        if (startRaw.seconds) {
            startDateObj = new Date(startRaw.seconds * 1000);
        } else if (startRaw.toDate && typeof startRaw.toDate === "function") {
            startDateObj = startRaw.toDate();
        } else {
            startDateObj = new Date(startRaw);
        }

        const elapsedSeconds = (workoutData.durationMinutes || 0) * 60 || 1800; // default 30 mins

        const toLocalISOString = (date: Date): string => {
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, "0");
            const dd = String(date.getDate()).padStart(2, "0");
            const hh = String(date.getHours()).padStart(2, "0");
            const min = String(date.getMinutes()).padStart(2, "0");
            const ss = String(date.getSeconds()).padStart(2, "0");
            return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}Z`;
        };

        // 4. Submit to Strava endpoint
        const uploadResponse = await fetch("https://www.strava.com/api/v3/activities", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                name: title,
                sport_type: "WeightTraining",
                start_date: startDateObj.toISOString(),
                start_date_local: toLocalISOString(startDateObj),
                elapsed_time: elapsedSeconds,
                description: description
            })
        });

        if (!uploadResponse.ok) {
            const errText = await uploadResponse.text();
            logger.error(`Failed to create Strava activity for workout ${workoutId}`, errText);
            return;
        }

        const resData = await uploadResponse.json() as any;
        const stravaId = resData.id;

        // 5. Save Strava Activity ID in workout doc
        await workoutRef.update({
            stravaActivityId: stravaId
        });

        logger.info(`Successfully pushed workout ${workoutId} to Strava. Activity ID: ${stravaId}`);

    } catch (err) {
        logger.error("onWorkoutLogged trigger failed", err);
    }
});
