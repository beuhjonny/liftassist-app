import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const db = getFirestore();

/**
 * 1. Generate Pairing Code (Called by Watch)
 */
export const generatePairingCode = onRequest({ cors: true }, async (request, response) => {
    try {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        await db.collection("pairing_codes").doc(code).set({
            code,
            status: "pending",
            createdAt: FieldValue.serverTimestamp(),
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
 */
export const claimPairingCode = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be logged in to claim code.");
    }

    const code = request.data.code;
    if (!code || typeof code !== 'string') {
        throw new HttpsError("invalid-argument", "Missing or invalid code.");
    }

    const normalizedCode = code.toUpperCase();
    const docRef = db.collection("pairing_codes").doc(normalizedCode);

    const crypto = await import("crypto");
    const accessToken = crypto.randomUUID();

    try {
        await db.runTransaction(async (transaction) => {
            const docSnap = await transaction.get(docRef);
            if (!docSnap.exists) {
                throw new HttpsError("not-found", "Invalid pairing code.");
            }

            const data = docSnap.data();
            if (data?.status === "claimed") {
                throw new HttpsError("already-exists", "This code has already been claimed.");
            }

            const createdAt = data?.createdAt;
            if (createdAt && typeof createdAt.toDate === 'function') {
                const createdTimeMs = createdAt.toDate().getTime();
                const tenMinutesMs = 10 * 60 * 1000;
                if (Date.now() - createdTimeMs > tenMinutesMs) {
                    throw new HttpsError("failed-precondition", "This pairing code has expired. Please generate a new one on your watch.");
                }
            }

            transaction.update(docRef, {
                status: "claimed",
                userId: request.auth!.uid,
                claimedAt: FieldValue.serverTimestamp(),
                accessToken: accessToken
            });

            transaction.set(db.collection("auth_tokens").doc(accessToken), {
                userId: request.auth!.uid,
                createdAt: FieldValue.serverTimestamp()
            });
        });

        return { success: true };
    } catch (error: any) {
        logger.error("Claim failed", error);
        if (error.code && error.details) throw error;
        throw new HttpsError("internal", "Failed to claim code.");
    }
});

/**
 * Helper to verify watch access token and retrieve userId in O(1) time.
 */
async function verifyTokenAndGetUserId(token: string): Promise<string | null> {
    if (!token) return null;

    const tokenDoc = await db.collection("auth_tokens").doc(token).get();
    if (tokenDoc.exists) {
        return tokenDoc.data()?.userId || null;
    }

    const pairingSnap = await db.collection("pairing_codes")
        .where("accessToken", "==", token)
        .limit(1)
        .get();

    if (!pairingSnap.empty) {
        const doc = pairingSnap.docs[0];
        const data = doc.data();
        const userId = data.userId;

        if (userId) {
            await db.collection("auth_tokens").doc(token).set({
                userId: userId,
                createdAt: data.claimedAt || FieldValue.serverTimestamp()
            });
            logger.info("Migrated legacy watch token to auth_tokens", { token, userId });
            return userId;
        }
    }

    return null;
}

/**
 * 4. Get Workout Session (Called by Watch)
 */
export const getWorkoutSession = onRequest({ cors: true }, async (request, response) => {
    const token = request.query.token as string;

    if (!token) {
        response.status(401).json({ error: "Unauthorized: Missing token" });
        return;
    }

    try {
        const userId = await verifyTokenAndGetUserId(token);
        if (!userId) {
            response.status(401).json({ error: "Unauthorized: Invalid token" });
            return;
        }

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

        const programSnap = await db.collection("users").doc(userId).collection("trainingPrograms").doc(activeProgramId).get();
        if (!programSnap.exists) {
            response.status(404).json({ error: "Active program not found" });
            return;
        }
        const programData = programSnap.data() as any;

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

        const targetDayIndex = (lastDayIndex + 1) % workoutDays.length;
        const targetDay = workoutDays[targetDayIndex];

        if (!targetDay) {
            response.status(404).json({ error: "No workout days found in active program" });
            return;
        }

        const hydratedExercises: any[] = [];
        for (const ex of targetDay.exercises || []) {
            let weightToAttempt = ex.startingWeight || 0;
            let repsToAttempt = ex.minReps || 8;

            if (ex.enableProgression !== false) {
                const progressKey = ex.exerciseName.toLowerCase().replace(/\s+/g, '_');
                const progressSnap = await db.collection("users").doc(userId).collection("exerciseProgress").doc(progressKey).get();
                if (progressSnap.exists) {
                    const progData = progressSnap.data()!;
                    weightToAttempt = progData.currentWeightToAttempt ?? weightToAttempt;
                    repsToAttempt = progData.repsToAttemptNext ?? repsToAttempt;
                }
            }

            hydratedExercises.push({
                ...ex,
                prescribedWeight: weightToAttempt,
                prescribedReps: repsToAttempt
            });
        }

        const hydratedDays = workoutDays.map((day, idx) => {
            if (idx === targetDayIndex) {
                return { ...day, exercises: hydratedExercises };
            }
            return day;
        });

        response.json({
            programId: activeProgramId,
            programName: programData.programName,
            targetDayId: targetDay.id,
            targetDayName: targetDay.dayName,
            workoutDays: hydratedDays
        });

    } catch (error) {
        logger.error("Error in getWorkoutSession", error);
        response.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * 5. Submit Workout Session (Called by Watch)
 */
export const submitWorkoutSession = onRequest({ cors: true }, async (request, response) => {
    const token = request.query.token as string || request.body.token;
    const workoutData = request.body.workout;

    if (!token || !workoutData) {
        response.status(400).json({ error: "Missing token or workout data" });
        return;
    }

    try {
        const userId = await verifyTokenAndGetUserId(token);
        if (!userId) {
            response.status(401).json({ error: "Unauthorized: Invalid token" });
            return;
        }

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

        for (const performedEx of workoutData.performedExercises) {
            const progressKey = performedEx.exerciseName.toLowerCase().replace(/\s+/g, '_');
            const progressRef = db.collection("users").doc(userId).collection("exerciseProgress").doc(progressKey);
            const progressSnap = await progressRef.get();

            if (!progressSnap.exists) continue;
            const currentProgress = progressSnap.data()!;

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
                    if (!exConfig.isToFailure && set.status !== 'done') {
                        allSetsDone = false;
                        break;
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
                update.repsToAttemptNext = exConfig.minReps || 8;
            } else {
                if (!exConfig.isToFailure) {
                    if (allSetsDone) {
                        update.lastWorkoutAllSetsSuccessfulAtCurrentWeight = true;
                        update.repsToAttemptNext = Math.min((currentProgress.repsToAttemptNext || 0) + (exConfig.repOverloadStep || 2), exConfig.maxReps || 12);
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
