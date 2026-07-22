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
        const firstname = data.athlete?.firstname || '';
        const lastname = data.athlete?.lastname || '';
        const athleteName = `${firstname} ${lastname}`.trim() || `Athlete #${athleteId}`;

        // Save OAuth Tokens
        await db.collection("users").doc(request.auth.uid).collection("strava").doc("tokens").set({
            athleteId,
            accessToken,
            refreshToken,
            expiresAt,
            updatedAt: FieldValue.serverTimestamp(),
        });

        // Save Public Auth Status for Client App
        await db.collection("users").doc(request.auth.uid).collection("strava").doc("auth").set({
            athleteId,
            athleteName,
            connectedAt: FieldValue.serverTimestamp(),
        });

        // Save Default Preferences
        await db.collection("users").doc(request.auth.uid).collection("strava").doc("config").set({
            enablePushToStrava: true,
            enablePullFromStrava: true,
            updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });

        return { success: true, athleteId, athleteName };
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

    const isFullSync = request.data?.fullSync === true;
    const after = isFullSync ? 0 : Math.floor(Date.now() / 1000) - (60 * 24 * 60 * 60); // Default last 60 days
    const activitiesUrl = `https://www.strava.com/api/v3/athlete/activities?${after > 0 ? `after=${after}&` : ''}per_page=200`;

    const activitiesRes = await fetch(activitiesUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!activitiesRes.ok) {
        throw new HttpsError("internal", "Failed to fetch activities from Strava.");
    }

    const activities = await activitiesRes.json();
    let syncedCount = 0;

    if (Array.isArray(activities)) {
        const extRef = db.collection("users").doc(uid).collection("externalActivities");
        const batch = db.batch();

        for (const act of activities) {
            const docId = `strava_${act.id}`;
            const docRef = extRef.doc(docId);

            // Convert distance in meters to miles (1 meter = 0.000621371 miles)
            const distanceMiles = act.distance ? (act.distance * 0.000621371) : 0;
            // Convert duration in seconds to minutes
            const durationMinutes = act.moving_time ? Math.round(act.moving_time / 60) : Math.round((act.elapsed_time || 0) / 60);

            batch.set(docRef, {
                name: act.name || act.type || 'Cardio',
                type: act.type || 'Cardio',
                date: act.start_date || new Date().toISOString(),
                durationMinutes,
                distanceMiles: Math.round(distanceMiles * 100) / 100,
                source: 'strava',
                stravaActivityId: String(act.id),
                notes: act.description || '',
                updatedAt: FieldValue.serverTimestamp()
            }, { merge: true });

            syncedCount++;
        }

        if (syncedCount > 0) {
            await batch.commit();
        }
    }

    return { success: true, count: syncedCount };
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
    const description = `Completed ${workout.performedExercises?.length || 0} exercises in ${workout.durationMinutes || 0} mins.\n\nTracked with LiftLogic 🏋️‍♂️\nhttps://lift-logic-app.web.app`;
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

/**
 * 4. Auto-push manual cardio activities to Strava
 */
export const onCardioLogged = onDocumentCreated("users/{userId}/externalActivities/{activityId}", async (event) => {
    const snap = event.data;
    if (!snap) return;

    const activity = snap.data();
    const userId = event.params.userId;

    // Only push manually created cardio sessions (avoid re-pushing Strava imports back to Strava!)
    if (activity.source !== "manual") return;

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

    const stravaTypeMap: Record<string, string> = {
        Run: "Run",
        Ride: "Ride",
        Swim: "Swim",
        Walk: "Walk",
        Hike: "Hike",
        Rowing: "Rowing",
        Cardio: "Workout"
    };

    const stravaType = stravaTypeMap[activity.type] || "Workout";
    const name = activity.name || `${activity.type || "Cardio"} Session`;
    const description = activity.notes ? `${activity.notes}\n\nLogged via LiftLogic` : "Logged via LiftLogic";
    const startDate = activity.date?.toDate ? activity.date.toDate().toISOString() : new Date().toISOString();
    const elapsedTime = (activity.durationMinutes || 30) * 60;
    const distanceMeters = (activity.distanceMiles || 0) * 1609.34;

    try {
        await fetch("https://www.strava.com/api/v3/activities", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name,
                type: stravaType,
                start_date_local: startDate,
                elapsed_time: elapsedTime,
                distance: distanceMeters,
                description,
            }),
        });
        logger.info(`Successfully pushed manual cardio ${event.params.activityId} to Strava for user ${userId}`);
    } catch (err) {
        logger.error("Error auto-pushing manual cardio to Strava", err);
    }
});
