import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync('c:/Users/jonny_havenstudios/antigravity/liftassist-app/lib/target-sa.json', 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function findJoel() {
    try {
        const usersRef = db.collection('users');
        const snapshot = await usersRef.get();

        if (snapshot.empty) {
            console.log('No matching documents.');
            return;
        }

        console.log('Listing users:');
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`- Name: ${data.displayName || 'N/A'}, Email: ${data.email}, UID: ${doc.id}`);
        });

    } catch (error) {
        console.error('Error finding users:', error);
    }
}

findJoel();
