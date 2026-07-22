import { ref, reactive, watch } from 'vue';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  limit, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import useAuth from './useAuth';
import useHistoryIndex from './useHistoryIndex';

export interface ExternalActivity {
  id?: string;
  name: string;
  type: string; // 'Run', 'Ride', 'Swim', 'Walk', 'Hike', 'Rowing', 'Cardio'
  date: any;
  durationMinutes: number;
  distanceMiles: number;
  source?: 'strava' | 'manual';
  notes?: string;
}

const LOCAL_STORAGE_KEY = 'liftlogic_external_activities_cache';

const loadCacheFromLocalStorage = (): ExternalActivity[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
};

const saveCacheToLocalStorage = (activities: ExternalActivity[]) => {
  try {
    const clean = activities.map(act => ({
      ...act,
      date: typeof act.date?.seconds === 'number' 
        ? new Date(act.date.seconds * 1000).toISOString() 
        : (act.date instanceof Date ? act.date.toISOString() : act.date)
    }));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(clean));
  } catch (e) {}
};

const cachedInitial = loadCacheFromLocalStorage();
const externalActivities = reactive<ExternalActivity[]>(cachedInitial);
const isLoaded = ref(false);
const isLoading = ref(false);
const error = ref<string | null>(null);

export default function useExternalActivities() {
  const { user } = useAuth();
  const { fetchCalendarIndex } = useHistoryIndex();

  const fetchExternalActivities = async (forceRefresh = false) => {
    if (!user.value || !user.value.uid) {
      externalActivities.length = 0;
      isLoaded.value = false;
      try { localStorage.removeItem(LOCAL_STORAGE_KEY); } catch (e) {}
      return;
    }

    if (isLoaded.value && !forceRefresh) return;

    isLoading.value = true;
    error.value = null;

    try {
      const colRef = collection(db, 'users', user.value.uid, 'externalActivities');
      const q = query(colRef, orderBy('date', 'desc'), limit(50));
      const snap = await getDocs(q);

      const items: ExternalActivity[] = [];
      snap.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as ExternalActivity);
      });

      externalActivities.splice(0, externalActivities.length, ...items);
      saveCacheToLocalStorage(items);
      isLoaded.value = true;
    } catch (e: any) {
      console.error('Error fetching external activities:', e);
      error.value = e.message;
    } finally {
      isLoading.value = false;
    }
  };

  const logCardioSession = async (activityData: Omit<ExternalActivity, 'id'>) => {
    if (!user.value || !user.value.uid) {
      throw new Error('User must be logged in to log cardio.');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const colRef = collection(db, 'users', user.value.uid, 'externalActivities');
      const newDoc = {
        name: activityData.name || activityData.type,
        type: activityData.type || 'Cardio',
        date: activityData.date instanceof Date ? Timestamp.fromDate(activityData.date) : activityData.date,
        durationMinutes: Number(activityData.durationMinutes) || 0,
        distanceMiles: Number(activityData.distanceMiles) || 0,
        source: activityData.source || 'manual',
        notes: activityData.notes || '',
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(colRef, newDoc);
      
      const newActivity: ExternalActivity = {
        id: docRef.id,
        ...newDoc
      };

      // Add to local state (sorted by date desc)
      externalActivities.unshift(newActivity);
      externalActivities.sort((a, b) => {
        const da = getObjDate(a.date).getTime();
        const db = getObjDate(b.date).getTime();
        return db - da;
      });

      // Update Calendar Index & Cache
      saveCacheToLocalStorage(externalActivities);
      await fetchCalendarIndex(true);
      return docRef.id;
    } catch (e: any) {
      console.error('Error logging cardio session:', e);
      error.value = e.message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteExternalActivity = async (id: string) => {
    if (!user.value || !user.value.uid || !id) return;
    try {
      const docRef = doc(db, 'users', user.value.uid, 'externalActivities', id);
      await deleteDoc(docRef);

      const idx = externalActivities.findIndex(a => a.id === id);
      if (idx > -1) {
        externalActivities.splice(idx, 1);
        saveCacheToLocalStorage(externalActivities);
      }

      await fetchCalendarIndex(true);
    } catch (e: any) {
      console.error('Error deleting external activity:', e);
      throw e;
    }
  };

  const getObjDate = (dateVal: any): Date => {
    if (!dateVal) return new Date(0);
    if (typeof dateVal.toDate === 'function') return dateVal.toDate();
    if (typeof dateVal.seconds === 'number') return new Date(dateVal.seconds * 1000);
    if (dateVal instanceof Date) return dateVal;
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? new Date(0) : d;
  };

  watch(user, (newUser) => {
    if (newUser && newUser.uid) {
      fetchExternalActivities();
    } else {
      externalActivities.length = 0;
      isLoaded.value = false;
    }
  }, { immediate: true });

  return {
    externalActivities,
    isLoading,
    error,
    fetchExternalActivities,
    logCardioSession,
    deleteExternalActivity
  };
}
