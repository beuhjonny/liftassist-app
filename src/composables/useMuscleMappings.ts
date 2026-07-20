import { ref } from 'vue';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import useAuth from './useAuth';

export interface ExerciseMuscleMapping {
  primary: string[];
  secondary: string[];
}

const STORAGE_KEY = 'liftlogic_user_muscle_mappings';
const customMappings = ref<Record<string, ExerciseMuscleMapping>>({});
const isLoaded = ref(false);

export default function useMuscleMappings() {
  const { user } = useAuth();

  // Load mappings from localStorage immediately
  const loadLocal = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        customMappings.value = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse local muscle mappings:', e);
    }
  };

  if (!isLoaded.value) {
    loadLocal();
  }

  // Fetch mappings from Firestore
  const fetchCustomMappings = async () => {
    if (!user.value || !user.value.uid) return;
    try {
      const docRef = doc(db, 'users', user.value.uid, 'settings', 'muscle_mappings');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as Record<string, ExerciseMuscleMapping>;
        customMappings.value = { ...customMappings.value, ...data };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customMappings.value));
      }
      isLoaded.value = true;
    } catch (e) {
      console.warn('Error fetching custom muscle mappings:', e);
    }
  };

  // Save a custom mapping for a specific exercise
  const setCustomMapping = async (exerciseName: string, mapping: ExerciseMuscleMapping) => {
    const key = exerciseName.trim().toLowerCase();
    customMappings.value[key] = mapping;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customMappings.value));

    if (user.value && user.value.uid) {
      try {
        const docRef = doc(db, 'users', user.value.uid, 'settings', 'muscle_mappings');
        await setDoc(docRef, { [key]: mapping }, { merge: true });
      } catch (e) {
        console.error('Error saving custom muscle mapping to Firestore:', e);
      }
    }
  };

  // Get custom mapping if exists
  const getCustomMapping = (exerciseName: string): ExerciseMuscleMapping | null => {
    const key = exerciseName.trim().toLowerCase();
    return customMappings.value[key] || null;
  };

  return {
    customMappings,
    fetchCustomMappings,
    setCustomMapping,
    getCustomMapping
  };
}
