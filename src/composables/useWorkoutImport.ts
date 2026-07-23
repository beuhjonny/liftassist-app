import { ref } from 'vue';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import useAuth from './useAuth';
import { detectSource, parseWorkoutText, type WorkoutSourceType } from '../utils/workoutParser';
import type { WorkoutDay, ExerciseConfig } from '@/types';

export interface ImportExercise {
  name: string;
  sets: number;
  minReps: number;
  maxReps: number;
  notes?: string;
  selected: boolean;
}

export type ImportStatus = 'ready' | 'needs_text' | 'error';

export interface ImportItem {
  id: string;
  sourceUrl: string;
  sourceType: WorkoutSourceType;
  routineName?: string;
  rawText?: string;
  exercises: ImportExercise[];
  status: ImportStatus;
  createdAt?: unknown;
}

export type AddTarget =
  | { mode: 'new'; name: string }
  | { mode: 'newDay'; programId: string; dayName: string }
  | { mode: 'existingDay'; programId: string; dayId: string };

const uid4 = (): string =>
  (globalThis.crypto?.randomUUID?.() ??
    'id-' + Math.abs(hashString(String(performance.now()))).toString(36));

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}

/** Map a staged exercise onto the app's ExerciseConfig with sane defaults. */
function toExerciseConfig(ex: ImportExercise): ExerciseConfig {
  return {
    id: uid4(),
    exerciseName: ex.name,
    targetSets: ex.sets,
    minReps: ex.minReps,
    maxReps: ex.maxReps,
    repOverloadStep: 1,
    weightIncrement: 5,
    enableProgression: true,
    notesForExercise: ex.notes || null,
  };
}

export default function useWorkoutImport() {
  const { user } = useAuth();
  const items = ref<ImportItem[]>([]);
  const error = ref<string | null>(null);

  const stagingCollection = () => {
    if (!user.value?.uid) throw new Error('Not signed in');
    return collection(db, 'users', user.value.uid, 'importStaging');
  };

  /** Live subscription to the staging basket. Returns an unsubscribe fn. */
  const subscribe = (): (() => void) => {
    if (!user.value?.uid) return () => {};
    const q = query(stagingCollection(), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => {
        items.value = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ImportItem, 'id'>) }));
      },
      (e) => {
        console.error('importStaging subscription error:', e);
        error.value = 'Could not load your import list.';
      },
    );
  };

  /**
   * Stage a shared video/text. Parses whatever text we have now; if the share
   * was only a bare URL, marks it needs_text so the user (or the Cloud Function
   * analyzer) can supply a description/transcript.
   */
  const stageFromShare = async (payload: { url?: string; text?: string; title?: string }) => {
    const sourceUrl = payload.url || extractUrl(payload.text) || '';
    const rawText = payload.text || '';
    const parsed = parseWorkoutText(rawText);
    const exercises: ImportExercise[] = parsed.map((p) => ({ ...p, selected: true }));

    const item: Omit<ImportItem, 'id'> = {
      sourceUrl,
      sourceType: detectSource(sourceUrl),
      routineName: payload.title || undefined,
      rawText: rawText || undefined,
      exercises,
      status: exercises.length > 0 ? 'ready' : 'needs_text',
      createdAt: serverTimestamp(),
    };
    const created = await addDoc(stagingCollection(), pruneUndefined(item));
    return created.id;
  };

  /** Re-analyze an item after the user pastes a description/transcript. */
  const analyzeText = async (itemId: string, text: string) => {
    const parsed = parseWorkoutText(text);
    const exercises: ImportExercise[] = parsed.map((p) => ({ ...p, selected: true }));
    await updateDoc(doc(stagingCollection(), itemId), {
      rawText: text,
      exercises,
      status: exercises.length > 0 ? 'ready' : 'needs_text',
    });
  };

  const updateItem = async (itemId: string, patch: Partial<ImportItem>) => {
    await updateDoc(doc(stagingCollection(), itemId), pruneUndefined(patch));
  };

  const removeItem = async (itemId: string) => {
    await deleteDoc(doc(stagingCollection(), itemId));
  };

  /**
   * Commit the selected exercises of a staged item into a routine, then drop
   * the staged item. Reuses the existing trainingPrograms document shape.
   */
  const addToRoutine = async (item: ImportItem, target: AddTarget): Promise<string> => {
    if (!user.value?.uid) throw new Error('Not signed in');
    const chosen = item.exercises.filter((e) => e.selected).map(toExerciseConfig);
    if (chosen.length === 0) throw new Error('Select at least one exercise.');

    const programsRef = collection(db, 'users', user.value.uid, 'trainingPrograms');
    let programId: string;

    if (target.mode === 'new') {
      const day: WorkoutDay = {
        id: uid4(),
        dayName: item.routineName || 'Imported Day',
        order: 0,
        exercises: chosen,
      };
      const created = await addDoc(programsRef, {
        programName: target.name || item.routineName || 'Imported Routine',
        description: item.sourceUrl ? `Imported from ${item.sourceUrl}` : 'Imported',
        workoutDays: [day],
        defaultRestTimer: 90,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      programId = created.id;
    } else {
      const progRef = doc(programsRef, target.programId);
      const snap = await getDoc(progRef);
      if (!snap.exists()) throw new Error('That routine no longer exists.');
      const data = snap.data() as { workoutDays?: WorkoutDay[] };
      const days: WorkoutDay[] = Array.isArray(data.workoutDays) ? data.workoutDays : [];

      if (target.mode === 'newDay') {
        const maxOrder = days.reduce((m, d) => Math.max(m, d.order ?? 0), -1);
        days.push({
          id: uid4(),
          dayName: target.dayName || item.routineName || 'Imported Day',
          order: maxOrder + 1,
          exercises: chosen,
        });
      } else {
        const day = days.find((d) => d.id === target.dayId);
        if (!day) throw new Error('That day no longer exists.');
        day.exercises = [...(day.exercises || []), ...chosen];
      }
      await updateDoc(progRef, { workoutDays: days, updatedAt: serverTimestamp() });
      programId = target.programId;
    }

    await removeItem(item.id);
    return programId;
  };

  return {
    items,
    error,
    subscribe,
    stageFromShare,
    analyzeText,
    updateItem,
    removeItem,
    addToRoutine,
  };
}

function extractUrl(text?: string): string {
  if (!text) return '';
  const m = text.match(/https?:\/\/\S+/);
  return m ? m[0] : '';
}

function pruneUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
  return out as T;
}
