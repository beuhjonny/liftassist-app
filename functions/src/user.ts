import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const db = getFirestore();

/**
 * Account Deletion (GDPR Right-to-Erasure)
 */
export const deleteAccount = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be authenticated to delete their account.");
    }

    const userId = request.auth.uid;
    logger.info(`Starting account deletion for user: ${userId}`);

    try {
        const userRef = db.collection("users").doc(userId);
        await db.recursiveDelete(userRef);
        logger.info(`Deleted all Firestore documents under users/${userId}`);

        const pairingDocs = await db.collection("pairing_codes").where("userId", "==", userId).get();
        const batch = db.batch();
        pairingDocs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();

        const authTokens = await db.collection("auth_tokens").where("userId", "==", userId).get();
        const tokenBatch = db.batch();
        authTokens.forEach((doc) => tokenBatch.delete(doc.ref));
        await tokenBatch.commit();

        await getAuth().deleteUser(userId);
        logger.info(`Deleted Firebase Auth user: ${userId}`);

        return { success: true, message: "Account and associated data deleted successfully." };
    } catch (error: any) {
        logger.error(`Error deleting account for user ${userId}:`, error);
        throw new HttpsError("internal", "Failed to complete account deletion.");
    }
});
