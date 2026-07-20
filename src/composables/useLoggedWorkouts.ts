import { ref, reactive, computed } from 'vue';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  limit, 
  startAfter, 
  doc, 
  updateDoc, 
  deleteDoc, 
  type QueryDocumentSnapshot, 
  type DocumentData 
} from 'firebase/firestore';
import { db } from '../firebase';
import useAuth from './useAuth';
import type { LoggedWorkout } from '@/types';

// Global state outside the function (shared across all component instances)
const globalLoggedWorkouts = reactive<LoggedWorkout[]>([]);
const isLoaded = ref(false);
const isLoading = ref(false);
const error = ref<string | null>(null);
const lastFetchTime = ref<number | null>(null);

// Pagination State
const lastVisibleDoc = ref<QueryDocumentSnapshot<DocumentData> | null>(null);
const hasMoreDocs = ref(true);
const PAGE_SIZE = 20;

export default function useLoggedWorkouts() {
    const { user } = useAuth();

    /**
     * Helper to process snapshots and append to list
     */
    const processQuerySnapshot = (querySnapshot: any, append: boolean) => {
        const newWorkouts: LoggedWorkout[] = [];
        querySnapshot.forEach((docSnap: any) => {
            newWorkouts.push({ id: docSnap.id, ...docSnap.data() } as LoggedWorkout);
        });

        if (append) {
            // Filter duplicates just in case
            const existingIds = new Set(globalLoggedWorkouts.map(w => w.id));
            const uniqueNewWorkouts = newWorkouts.filter(w => !existingIds.has(w.id));
            globalLoggedWorkouts.push(...uniqueNewWorkouts);
        } else {
            globalLoggedWorkouts.splice(0, globalLoggedWorkouts.length, ...newWorkouts);
        }

        // Update cursor
        const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
        if (lastDoc) {
            lastVisibleDoc.value = lastDoc;
        }

        // Check if we hit the limit, if we got fewer than PAGE_SIZE, we are done
        hasMoreDocs.value = querySnapshot.docs.length === PAGE_SIZE;
    };

    /**
     * Fetches the initial batch of workouts.
     * @param forceRefresh - If true, resets the list and fetches fresh data (read cost = PAGE_SIZE)
     */
    const fetchLoggedWorkouts = async (forceRefresh = false) => {
        if (!user.value || !user.value.uid) {
            globalLoggedWorkouts.length = 0;
            return;
        }

        if (isLoaded.value && !forceRefresh) {
            return;
        }

        isLoading.value = true;
        error.value = null;

        try {
            const historyCollectionRef = collection(db, 'users', user.value.uid, 'loggedWorkouts');
            const q = query(historyCollectionRef, orderBy('date', 'desc'), limit(PAGE_SIZE));

            const querySnapshot = await getDocs(q);
            processQuerySnapshot(querySnapshot, false);

            isLoaded.value = true;
            lastFetchTime.value = Date.now();
        } catch (e: any) {
            console.error("Error fetching logged workouts:", e);
            error.value = e.message;
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * Fetches the next page of workouts using the last visible document cursor.
     */
    const fetchMoreWorkouts = async () => {
        if (!user.value || !user.value.uid || isLoading.value || !hasMoreDocs.value || !lastVisibleDoc.value) {
            return;
        }

        isLoading.value = true;
        error.value = null;

        try {
            const historyCollectionRef = collection(db, 'users', user.value.uid, 'loggedWorkouts');
            const q = query(
                historyCollectionRef,
                orderBy('date', 'desc'),
                startAfter(lastVisibleDoc.value),
                limit(PAGE_SIZE)
            );

            const querySnapshot = await getDocs(q);
            processQuerySnapshot(querySnapshot, true);
        } catch (e: any) {
            console.error("Error fetching more workouts:", e);
            error.value = e.message;
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * Updates an existing logged workout in Firestore and local reactive state.
     */
    const updateLoggedWorkout = async (workoutId: string, updatedData: Partial<LoggedWorkout>) => {
        if (!user.value || !user.value.uid) {
            throw new Error("User must be authenticated to update a workout.");
        }

        try {
            const docRef = doc(db, 'users', user.value.uid, 'loggedWorkouts', workoutId);
            await updateDoc(docRef, updatedData);

            // Update in local array
            const idx = globalLoggedWorkouts.findIndex(w => w.id === workoutId);
            if (idx !== -1) {
                globalLoggedWorkouts[idx] = { ...globalLoggedWorkouts[idx], ...updatedData };
            }
        } catch (e: any) {
            console.error("Error updating logged workout:", e);
            throw e;
        }
    };

    /**
     * Deletes a logged workout from Firestore and local reactive state.
     */
    const deleteLoggedWorkout = async (workoutId: string) => {
        if (!user.value || !user.value.uid) {
            throw new Error("User must be authenticated to delete a workout.");
        }

        try {
            const docRef = doc(db, 'users', user.value.uid, 'loggedWorkouts', workoutId);
            await deleteDoc(docRef);

            // Remove from local array
            const idx = globalLoggedWorkouts.findIndex(w => w.id === workoutId);
            if (idx !== -1) {
                globalLoggedWorkouts.splice(idx, 1);
            }
        } catch (e: any) {
            console.error("Error deleting logged workout:", e);
            throw e;
        }
    };

    /**
     * Invalidates the cache so the next call to fetchLoggedWorkouts will hit the network.
     */
    const invalidateCache = () => {
        isLoaded.value = false;
        lastVisibleDoc.value = null;
        hasMoreDocs.value = true;
        globalLoggedWorkouts.length = 0;
    };

    const hasData = computed(() => globalLoggedWorkouts.length > 0);

    return {
        loggedWorkouts: globalLoggedWorkouts,
        isLoading,
        isLoaded,
        error,
        hasMoreDocs,
        fetchLoggedWorkouts,
        fetchMoreWorkouts,
        updateLoggedWorkout,
        deleteLoggedWorkout,
        invalidateCache,
        hasData
    };
}
