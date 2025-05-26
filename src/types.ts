// src/types.ts
import { type Timestamp } from 'firebase/firestore';

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
  // startingWeight is only in the form model for new exercises, not stored in ExerciseConfig
}

export interface ExerciseConfigForDisplay extends ExerciseConfig {
    currentPrescribedWeight?: number;
    currentPrescribedReps?: number;
}

export interface WorkoutDay {
  id: string;
  dayName: string;
  order: number;
  exercises: ExerciseConfigForDisplay[]; // Uses the display version
}

export interface TrainingProgram {
  id: string | null;
  programName: string;
  description: string;
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