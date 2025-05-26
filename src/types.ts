// src/types.ts
import { type Timestamp } from 'firebase/firestore'; // If you use Firestore Timestamp directly

export interface ExerciseProgress {
  exerciseName: string;
  currentWeightToAttempt: number;
  repsToAttemptNext: number;
  lastWorkoutAllSetsSuccessfulAtCurrentWeight?: boolean;
  consecutiveFailedWorkoutsAtCurrentWeightAndReps?: number;
  lastPerformedDate?: Timestamp | Date | null;
}

export interface ExerciseConfig {
  id: string;
  exerciseName: string;
  targetSets: number;
  minReps: number;
  maxReps: number;
  repOverloadStep: number;
  weightIncrement: number;
  customRestSeconds?: number | null;
  notesForExercise?: string | null;
  enableProgression?: boolean;
  // startingWeight is not stored here, it's a form model property in Routines.vue
}

export interface ExerciseConfigForDisplay extends ExerciseConfig {
  currentPrescribedWeight?: number;
  currentPrescribedReps?: number;
}

export interface WorkoutDay {
  id: string;
  dayName: string;
  order: number;
  exercises: ExerciseConfigForDisplay[]; // Used in Routines.vue for display
}

// This might be a slightly different version for what's stored in Firestore for a program
export interface WorkoutDayInRoutineConfig {
  id: string;
  dayName: string;
  order: number;
  exercises: ExerciseConfig[]; // Stores pure ExerciseConfig
}


export interface TrainingProgram {
  id: string | null;
  programName: string;
  description: string;
  // workoutDays could be WorkoutDay[] or WorkoutDayInRoutineConfig[] depending on context
  // For Routines.vue's activeProgram, it's WorkoutDay[] (with display fields)
  // For saving to Firestore, it should be stripped down to store objects matching ExerciseConfig
  workoutDays: WorkoutDay[];
}


export interface SessionExercise extends ExerciseConfig { // Used in WorkoutActive.vue
  prescribedWeight: number;
  prescribedReps: number;
}

export interface LoggedSetData {
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  prescribedWeight: number;
  prescribedReps: number;
  actualWeight: number;
  actualReps: number;
  status: 'done' | 'failed';
  timestamp: Date;
}