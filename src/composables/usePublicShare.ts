import { ref } from 'vue';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { LoggedWorkout } from '@/types';

export interface PublicWorkoutShareData {
  id: string;
  workoutDayName: string;
  programName?: string;
  dateStr: string;
  durationMinutes?: number;
  performedExercises: any[];
  totalVolume: number;
  totalSets: number;
  createdAt: any;
}

export default function usePublicShare() {
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Creates a public workout share document in Firestore `public_workouts/{shareId}`.
   * Returns the full share URL string.
   */
  const createPublicWorkoutShare = async (workout: LoggedWorkout): Promise<string> => {
    isLoading.value = true;
    error.value = null;

    try {
      // Generate share ID or use existing workout ID
      const shareId = workout.id || `share_${Date.now()}`;
      const docRef = doc(db, 'public_workouts', shareId);

      // Check if already shared
      const existingSnap = await getDoc(docRef);
      if (existingSnap.exists()) {
        const origin = window.location.origin;
        return `${origin}/share/workout/${shareId}`;
      }

      const totalVolume = calculateTotalVolume(workout.performedExercises);
      const totalSets = calculateTotalSets(workout.performedExercises);

      const sharePayload: PublicWorkoutShareData = {
        id: shareId,
        workoutDayName: workout.workoutDayNameUsed || 'Workout Session',
        programName: workout.trainingProgramNameUsed || '',
        dateStr: formatDateStr(workout.date),
        durationMinutes: workout.durationMinutes || 0,
        performedExercises: workout.performedExercises || [],
        totalVolume,
        totalSets,
        createdAt: serverTimestamp()
      };

      await setDoc(docRef, sharePayload);

      const origin = window.location.origin;
      return `${origin}/share/workout/${shareId}`;
    } catch (e: any) {
      console.error('Error creating public workout share:', e);
      error.value = e.message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Fetches a shared workout document by `shareId`.
   */
  const fetchPublicWorkoutShare = async (shareId: string): Promise<PublicWorkoutShareData | null> => {
    isLoading.value = true;
    error.value = null;

    try {
      const docRef = doc(db, 'public_workouts', shareId);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        return snap.data() as PublicWorkoutShareData;
      } else {
        error.value = 'Shared workout link not found or has been removed.';
        return null;
      }
    } catch (e: any) {
      console.error('Error fetching public workout share:', e);
      error.value = e.message;
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    isLoading,
    error,
    createPublicWorkoutShare,
    fetchPublicWorkoutShare
  };
}

function formatDateStr(rawDate: any): string {
  if (!rawDate) return '';
  let d: Date;
  if (typeof rawDate.toDate === 'function') {
    d = rawDate.toDate();
  } else if (rawDate instanceof Date) {
    d = rawDate;
  } else {
    d = new Date(rawDate);
  }
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function calculateTotalVolume(exercises: any[]): number {
  if (!exercises) return 0;
  let total = 0;
  exercises.forEach(ex => {
    if (ex.sets) {
      ex.sets.forEach((s: any) => {
        if (s.status === 'done' || s.status === 'completed' || s.status === 'completed_to_failure') {
          total += (s.actualWeight || 0) * (s.actualReps || 0);
        }
      });
    }
  });
  return Math.round(total);
}

function calculateTotalSets(exercises: any[]): number {
  if (!exercises) return 0;
  let count = 0;
  exercises.forEach(ex => {
    if (ex.sets) count += ex.sets.length;
  });
  return count;
}
