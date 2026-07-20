import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const db = getFirestore();

/**
 * 1. OAuth Code Exchange for Strava
 */
export const exchangeStravaCode = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be logged in.");
    }
    const code = request.data.code;
    if (!code) {
        throw new HttpsError("invalid-argument", "Missing authorization code.");
    }

    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        logger.error("Strava client credentials missing in server config.");
        throw new HttpsError("failed-precondition", "Strava integration is not fully configured on server.");
    }

    try {
        const response = await fetch("https://www.strava.com/oauth/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code: code,
                grant_type: "authorization_code",
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            logger.error("Strava OAuth failed", data);
            throw new HttpsError("internal", data.message || "Failed to exchange token with Strava.");
        }

        const athleteId = data.athlete?.id;
        const accessToken = data.access_token;
        const refreshToken = data.refresh_token;
        const expiresAt = data.expires_at;

        await db.collection("users").doc(request.auth.uid).collection("strava").doc("tokens").set({
            athleteId,
            accessToken,
            refreshToken,
            expiresAt,
            updatedAt: FieldValue.serverTimestamp(),
        });

        return { success: true, athleteId };
    } catch (err: any) {
        logger.error("Error exchanging Strava code", err);
        if (err instanceof HttpsError) throw err;
        throw new HttpsError("internal", "An unexpected error occurred during Strava auth.");
    }
});

/**
 * 2. Sync Strava Activities
 */
export const syncStravaActivities = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be logged in.");
    }

    const uid = request.auth.uid;
    const tokenDocRef = db.collection("users").doc(uid).collection("strava").doc("tokens");
    const tokenDoc = await tokenDocRef.get();

    if (!tokenDoc.exists) {
        throw new HttpsError("not-found", "Strava not connected.");
    }

    let { accessToken, refreshToken, expiresAt } = tokenDoc.data()!;
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;

    if (Date.now() / 1000 > expiresAt - 300) {
        if (!clientId || !clientSecret) {
            throw new HttpsError("failed-precondition", "Missing Strava credentials on server.");
        }

        const refreshRes = await fetch("https://www.strava.com/oauth/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
                grant_type: "refresh_token",
            }),
        });

        const refreshData = await refreshRes.json();
        if (!refreshRes.ok) {
            throw new HttpsError("internal", "Failed to refresh Strava token.");
        }

        accessToken = refreshData.access_token;
        refreshToken = refreshData.refresh_token;
        expiresAt = refreshData.expires_at;

        await tokenDocRef.update({
            accessToken,
            refreshToken,
            expiresAt,
            updatedAt: FieldValue.serverTimestamp(),
        });
    }

    const after = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
    const activitiesRes = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=100`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!activitiesRes.ok) {
        throw new HttpsError("internal", "Failed to fetch activities from Strava.");
    }

    const activities = await activitiesRes.json();
    return { success: true, count: activities.length, activities };
});

/**
 * 3. Auto-push to Strava on Workout Logged
 */
export const onWorkoutLogged = onDocumentCreated("users/{userId}/loggedWorkouts/{workoutId}", async (event) => {
    const snap = event.data;
    if (!snap) return;

    const workout = snap.data();
    const userId = event.params.userId;

    const tokenDocRef = db.collection("users").doc(userId).collection("strava").doc("tokens");
    const tokenDoc = await tokenDocRef.get();

    if (!tokenDoc.exists) return;

    let { accessToken, refreshToken, expiresAt } = tokenDoc.data()!;
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;

    if (Date.now() / 1000 > expiresAt - 300) {
        if (!clientId || !clientSecret) return;

        const refreshRes = await fetch("https://www.strava.com/oauth/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
                grant_type: "refresh_token",
            }),
        });

        if (!refreshRes.ok) return;

        const refreshData = await refreshRes.json();
        accessToken = refreshData.access_token;
        refreshToken = refreshData.refresh_token;
        expiresAt = refreshData.expires_at;

        await tokenDocRef.update({
            accessToken,
            refreshToken,
            expiresAt,
            updatedAt: FieldValue.serverTimestamp(),
        });
    }

    const name = `LiftLogic: ${workout.workoutDayNameUsed || "Weight Training"}`;
    const description = `Completed ${workout.performedExercises?.length || 0} exercises in ${workout.durationMinutes || 0} mins.`;
    const startDate = workout.startTime ? new Date(workout.startTime).toISOString() : new Date().toISOString();
    const elapsedTime = (workout.durationMinutes || 30) * 60;

    try {
        await fetch("https://www.strava.com/api/v3/activities", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name,
                type: "WeightTraining",
                start_date_local: startDate,
                elapsed_time: elapsedTime,
                description,
            }),
        });
        logger.info(`Successfully pushed workout ${event.params.workoutId} to Strava for user ${userId}`);
    } catch (err) {
        logger.error("Error auto-pushing activity to Strava", err);
    }
});
