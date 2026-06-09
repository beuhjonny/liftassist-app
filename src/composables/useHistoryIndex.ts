import { ref, reactive, computed } from 'vue';
import { doc, getDoc, setDoc, collection, getDocs, query, orderBy, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import useAuth from './useAuth';
import type { LoggedWorkout } from '@/types';

// The structure of our index document
export interface CalendarIndexData {
    [date: string]: {
        hasWorkout: boolean;
        programId?: string;
        dayName?: string;
        workoutId?: string;
        totalVolume?: number; // Added for Analytics
    } | any;
    lastUpdated?: any;
    version?: number; // For schema migrations
}

const calendarIndex = reactive<CalendarIndexData>({});
const isIndexLoaded = ref(false);
const isIndexLoading = ref(false);

const CURRENT_INDEX_VERSION = 3; // Maintenance rebuild to repair missing logs during index bug

export default function useHistoryIndex() {
    const { user } = useAuth();

    const getLocalDateKey = (val: any): string => {
        if (!val) return '';
        let dateObj: Date | null = null;
        if (val instanceof Timestamp) {
            dateObj = val.toDate();
        } else if (val instanceof Date && !isNaN(val.getTime())) {
            dateObj = val;
        } else if (typeof val.toDate === 'function') {
            dateObj = val.toDate();
        } else if (typeof val.seconds === 'number') {
            dateObj = new Date(val.seconds * 1000);
        } else {
            try {
                const parsed = new Date(val);
                if (!isNaN(parsed.getTime())) {
                    dateObj = parsed;
                }
            } catch (e) {}
        }
        
        if (dateObj) {
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        return '';
    };

    /**
     * Fetches the calendar index. 
     * If it doesn't exist OR is outdated (version mismatch), it refetches history.
     */
    const fetchCalendarIndex = async (forceRefresh = false) => {
        if (!user.value || !user.value.uid) return;
        if (isIndexLoaded.value && !forceRefresh) return;

        isIndexLoading.value = true;
        try {
            if (forceRefresh) {
                console.log("Repairing Calendar Index - Rebuilding from history...");
                await buildIndexFromScratch();
                return;
            }

            const indexRef = doc(db, 'users', user.value.uid, 'indexes', 'calendar');
            const indexSnap = await getDoc(indexRef);

            if (indexSnap.exists()) {
                // Load existing index
                const data = indexSnap.data() as CalendarIndexData;

                // Check version. If older than 2 (no volume), rebuild.
                if (!data.version || data.version < CURRENT_INDEX_VERSION) {
                    console.log("Calendar Index outdated (missing volume). Rebuilding...");
                    await buildIndexFromScratch();
                } else {
                    Object.assign(calendarIndex, data);
                    isIndexLoaded.value = true;
                }
            } else {
                // Index missing! Migration time.
                console.log("Calendar Index missing. Performing one-time migration...");
                await buildIndexFromScratch();
            }
        } catch (e) {
            console.error("Error fetching calendar index:", e);
        } finally {
            isIndexLoading.value = false;
        }
    };

    /**
     * Scans entire history to build the index file.
     * This is a heavy operation but only runs once.
     */
    const buildIndexFromScratch = async () => {
        if (!user.value || !user.value.uid) return;

        try {
            const historyCollectionRef = collection(db, 'users', user.value.uid, 'loggedWorkouts');
            const q = query(historyCollectionRef, orderBy('date', 'desc')); // Fetch ALL

            const snapshot = await getDocs(q);
            const newIndex: CalendarIndexData = {
                lastUpdated: serverTimestamp(),
                version: CURRENT_INDEX_VERSION
            };

            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                const dateKey = getLocalDateKey(data.date) || getLocalDateKey(data.startTime) || getLocalDateKey(data.endTime);

                // Calculate Volume safely
                let vol = 0;
                if (data.performedExercises && Array.isArray(data.performedExercises)) {
                    data.performedExercises.forEach((ex: any) => {
                        if (ex.sets && Array.isArray(ex.sets)) {
                            ex.sets.forEach((s: any) => {
                                if (s.status === 'done' && typeof s.actualWeight === 'number' && typeof s.actualReps === 'number') {
                                    vol += (s.actualWeight * s.actualReps);
                                }
                            });
                        }
                    });
                }

                if (dateKey) {
                    newIndex[dateKey] = {
                        hasWorkout: true,
                        programId: data.trainingProgramIdUsed,
                        dayName: data.workoutDayNameUsed,
                        workoutId: docSnap.id,
                        totalVolume: vol // Store it!
                    };
                }
            });

            // Save to Firestore
            const indexRef = doc(db, 'users', user.value.uid, 'indexes', 'calendar');
            await setDoc(indexRef, newIndex);

            // Update local state - clear first to ensure full replacement
            for (const key in calendarIndex) delete calendarIndex[key];
            Object.assign(calendarIndex, newIndex);
            isIndexLoaded.value = true;
            console.log("Calendar Index rebuilt successfully with Volume.");

        } catch (e) {
            console.error("Migration failed:", e);
        }
    };

    /**
     * Call this when saving a new workout to keep the index in sync
     */
    const updateCalendarIndex = async (workout: LoggedWorkout, computedVolume?: number) => {
        if (!user.value || !user.value.uid) return;

        const dateKey = getLocalDateKey(workout.date) || getLocalDateKey(workout.startTime) || getLocalDateKey(new Date());

        if (!dateKey) return;

        // If volume isn't pre-calculated, calculate it now
        let vol = 0;
        if (computedVolume !== undefined) {
            vol = computedVolume;
        } else if (workout.performedExercises) {
            workout.performedExercises.forEach((ex) => {
                ex.sets.forEach((s) => {
                    if (s.status === 'done' && typeof s.actualWeight === 'number' && typeof s.actualReps === 'number') {
                        vol += (s.actualWeight * s.actualReps);
                    }
                });
            });
        }

        const entry = {
            hasWorkout: true,
            programId: workout.trainingProgramIdUsed,
            dayName: workout.workoutDayNameUsed,
            workoutId: workout.id,
            totalVolume: vol
        };

        // Update local
        calendarIndex[dateKey] = entry;

        // Update Firestore (merge)
        const indexRef = doc(db, 'users', user.value.uid, 'indexes', 'calendar');
        // We use setDoc with merge to update just this key field
        await setDoc(indexRef, {
            [dateKey]: entry,
            lastUpdated: serverTimestamp(),
            version: CURRENT_INDEX_VERSION
        }, { merge: true });
    };

    return {
        calendarIndex,
        isIndexLoaded,
        isIndexLoading,
        fetchCalendarIndex,
        updateCalendarIndex
    };
}
