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

async function checkWeights() {
    try {
        const userEmail = 'j.dankoff@gmail.com';
        const userQuery = await db.collection('users').where('email', '==', userEmail).limit(1).get();

        if (userQuery.empty) {
            console.log('User not found');
            return;
        }

        const userDoc = userQuery.docs[0];
        console.log(`Checking data for user: ${userDoc.id} (${userEmail})`);

        // 1. Check Exercise Progress
        console.log('\n--- Exercise Progress ---');
        const progressRef = db.collection('users').doc(userDoc.id).collection('exerciseProgress');
        const progressSnaps = await progressRef.get();

        if (progressSnaps.empty) {
            console.log("No exercise progress documents found!");
        } else {
            progressSnaps.forEach(doc => {
                const data = doc.data();
                console.log(`Exercise: ${doc.id}`);
                console.log(`  - currentWeightToAttempt: ${data.currentWeightToAttempt}`);
                console.log(`  - repsToAttemptNext: ${data.repsToAttemptNext}`);
                // console.log(`  - Full Data:`, JSON.stringify(data));
            });
        }

        // 2. Check Active Program for starting weights
        console.log('\n--- Active Program Starting Weights ---');
        const programsRef = db.collection('users').doc(userDoc.id).collection('trainingPrograms');
        const programsSnaps = await programsRef.get();

        programsSnaps.forEach(progDoc => {
            const prog = progDoc.data();
            console.log(`Program: ${prog.programName} (${progDoc.id})`);
            if (prog.workoutDays) {
                prog.workoutDays.forEach(day => {
                    console.log(`  Day: ${day.dayName}`);
                    if (day.exercises) {
                        day.exercises.forEach(ex => {
                            console.log(`    - ${ex.exerciseName}: startingWeight=${ex.startingWeight}`);
                        });
                    }
                });
            }
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

checkWeights();
