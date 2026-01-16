import { ref, reactive, computed } from 'vue';
import { collection, query, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import useAuth from './useAuth';
import type { LoggedWorkout } from '@/types';

// Global state outside the function (shared across all component instances)
const globalLoggedWorkouts = reactive<LoggedWorkout[]>([]);
const isLoaded = ref(false);
const isLoading = ref(false);
const error = ref<string | null>(null);
const lastFetchTime = ref<number | null>(null);

export default function useLoggedWorkouts() {
    const { user } = useAuth();

    /**
     * Fetches workout history from Firestore if not already loaded.
     * @param forceRefresh - If true, bypasses cache and fetches fresh data.
     */
    const fetchLoggedWorkouts = async (forceRefresh = false) => {
        if (!user.value || !user.value.uid) {
            globalLoggedWorkouts.length = 0;
            return;
        }

        // Return immediately if data is loaded and we don't want to force refresh
        if (isLoaded.value && !forceRefresh) {
            return;
        }

        isLoading.value = true;
        error.value = null;

        try {
            const historyCollectionRef = collection(db, 'users', user.value.uid, 'loggedWorkouts');
            const q = query(historyCollectionRef, orderBy('date', 'desc'));

            const querySnapshot = await getDocs(q);
            const newWorkouts: LoggedWorkout[] = [];

            querySnapshot.forEach((docSnap) => {
                newWorkouts.push({ id: docSnap.id, ...docSnap.data() } as LoggedWorkout);
            });

            // Replace global array content
            globalLoggedWorkouts.splice(0, globalLoggedWorkouts.length, ...newWorkouts);

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
     * Invalidates the cache so the next call to fetchLoggedWorkouts will hit the network.
     * Useful after adding/deleting a workout.
     */
    const invalidateCache = () => {
        isLoaded.value = false;
    };

    /**
     * Check if we have any data (useful for computed properties)
     */
    const hasData = computed(() => globalLoggedWorkouts.length > 0);

    return {
        loggedWorkouts: globalLoggedWorkouts,
        isLoading,
        isLoaded,
        error,
        fetchLoggedWorkouts,
        invalidateCache,
        hasData
    };
}
