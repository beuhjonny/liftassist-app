/**
 * LiftLogic Cloud Functions
 * Backend bridge for Garmin Watch integration.
 */

import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
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
