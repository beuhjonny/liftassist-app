// src/types.ts
import { type Timestamp, type FieldValue } from 'firebase/firestore';

export interface ExerciseProgress {
  exerciseName: string;
  currentWeightToAttempt: number;
  repsToAttemptNext: number;
  lastWorkoutAllSetsSuccessfulAtCurrentWeight?: boolean;
  consecutiveFailedWorkoutsAtCurrentWeightAndReps?: number;
  lastPerformedDate?: Timestamp | Date | FieldValue | null;
  isTimed?: boolean;
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
  isTimed?: boolean;
  isSupersetWithPrevious?: boolean;
  fullRestAfterSuperset?: boolean;
  isToFailure?: boolean;
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
  color?: string;
}

export interface TrainingProgram {
  id: string | null;
  programName: string;
  description: string;
  defaultRestTimer?: number;
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
  timestamp: Date | Timestamp;
  isTimed?: boolean;
}

export interface PerformedExerciseInLog {
  exerciseId: string;
  exerciseName: string;
  sets: LoggedSetData[];
  isPR?: boolean;
  enableProgression?: boolean;
}

export interface LoggedWorkout {
  id: string;
  userId: string;
  date: Timestamp | Date;
  trainingProgramIdUsed: string;
  workoutDayNameUsed: string;
  workoutDayIdUsed: string;
  performedExercises: PerformedExerciseInLog[];
  trainingProgramNameUsed?: string;
  overallSessionNotes?: string;
  startTime?: Timestamp | Date;
  endTime?: Timestamp | Date;
  durationMinutes?: number;
}

export interface EnhancedWorkoutDay extends WorkoutDay {
  isNextRecommended: boolean;
  isLastDoneOverall: boolean;
  skipIndicatorCount: number;
  lastCompletedThisDayDate: Date | null;
}

export interface TimelineSetInfo {
  exerciseName: string;
  setNumberWithinExercise: number;
  isSuperset?: boolean;
  supersetColorIndex?: number;
  separatorGroupIndex: number;
  isConnectedToNext?: boolean;
  prescribedWeight?: number;
  prescribedReps?: number;
  isTimed?: boolean;
  targetSets?: number;
}