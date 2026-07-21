export type EquipmentCategory = 'dumbbells' | 'full_gym' | 'smith_machine' | 'bodyweight';
export type SplitType = 'ppl' | 'upper_lower' | 'full_body' | 'bro_split' | 'express' | 'specialty';
export type IntensityLevel = 'light' | 'medium' | 'heavy';

export interface BankExercise {
  exerciseName: string;
  targetSets: number;
  minReps: number;
  maxReps: number;
  repOverloadStep: number;
  weightIncrement: number;
  isTimed?: boolean;
  isToFailure?: boolean;
  customRestSeconds?: number;
  notesForExercise?: string;
  weights: {
    light: number;
    medium: number;
    heavy: number;
  };
}

export interface BankWorkoutDay {
  dayName: string;
  order: number;
  exercises: BankExercise[];
}

export interface PresetRoutine {
  id: string;
  name: string;
  description: string;
  equipmentCategory: EquipmentCategory;
  equipmentLabel: string;
  splitType: SplitType;
  splitLabel: string;
  daysPerWeek: number;
  defaultRestTimer: number;
  tags: string[];
  workoutDays: BankWorkoutDay[];
}

export const ROUTINE_BANK: PresetRoutine[] = [
  // -------------------------------------------------------------
  // DUMBBELLS, BENCH & ELASTICS (HOME GYM)
  // -------------------------------------------------------------
  {
    id: 'ppl_dumbbells_3d',
    name: 'Push / Pull / Legs (Dumbbells & Bench)',
    description: 'The ultimate 3-day home routine using dumbbells, an adjustable bench, and doorway bands for total-body hypertrophy.',
    equipmentCategory: 'dumbbells',
    equipmentLabel: 'Dumbbells, Bench & Bands',
    splitType: 'ppl',
    splitLabel: 'PPL (3 Days/wk)',
    daysPerWeek: 3,
    defaultRestTimer: 90,
    tags: ['Popular', 'Home Gym', 'Hypertrophy'],
    workoutDays: [
      {
        dayName: 'Day 1: Push',
        order: 1,
        exercises: [
          {
            exerciseName: 'Dumbbell Bench Press',
            targetSets: 3,
            minReps: 8,
            maxReps: 12,
            repOverloadStep: 2,
            weightIncrement: 5,
            customRestSeconds: 90,
            notesForExercise: 'Flat bench. Retract shoulder blades and press through chest.',
            weights: { light: 25, medium: 45, heavy: 65 }
          },
          {
            exerciseName: 'Incline Dumbbell Press',
            targetSets: 3,
            minReps: 8,
            maxReps: 12,
            repOverloadStep: 2,
            weightIncrement: 5,
            customRestSeconds: 90,
            notesForExercise: 'Set bench to 30-45 degree incline.',
            weights: { light: 20, medium: 35, heavy: 55 }
          },
          {
            exerciseName: 'Seated Dumbbell Shoulder Press',
            targetSets: 3,
            minReps: 8,
            maxReps: 12,
            repOverloadStep: 2,
            weightIncrement: 5,
            customRestSeconds: 90,
            notesForExercise: 'Keep core tight, press overhead without excessive arch.',
            weights: { light: 15, medium: 30, heavy: 45 }
          },
          {
            exerciseName: 'Dumbbell Lateral Raise',
            targetSets: 3,
            minReps: 12,
            maxReps: 15,
            repOverloadStep: 1,
            weightIncrement: 2.5,
            customRestSeconds: 60,
            notesForExercise: 'Slight bend in elbows, lead with elbows to shoulder height.',
            weights: { light: 10, medium: 15, heavy: 25 }
          },
          {
            exerciseName: 'Overhead Dumbbell Triceps Extension',
            targetSets: 3,
            minReps: 10,
            maxReps: 12,
            repOverloadStep: 2,
            weightIncrement: 5,
            customRestSeconds: 60,
            notesForExercise: 'Hold single dumbbell with both hands behind head.',
            weights: { light: 20, medium: 35, heavy: 50 }
          }
        ]
      },
      {
        dayName: 'Day 2: Pull',
        order: 2,
        exercises: [
          {
            exerciseName: 'Single-Arm Dumbbell Row',
            targetSets: 3,
            minReps: 8,
            maxReps: 12,
            repOverloadStep: 2,
            weightIncrement: 5,
            customRestSeconds: 90,
            notesForExercise: 'One knee on bench, row dumbbell to hip crease.',
            weights: { light: 25, medium: 45, heavy: 65 }
          },
          {
            exerciseName: 'Doorway Band Lat Pulldown',
            targetSets: 3,
            minReps: 10,
            maxReps: 15,
            repOverloadStep: 2,
            weightIncrement: 5,
            customRestSeconds: 75,
            notesForExercise: 'Anchor band at top of door, pull down squeezing lats.',
            weights: { light: 20, medium: 35, heavy: 50 }
          },
          {
            exerciseName: 'Chest-Supported Dumbbell Rear Delt Fly',
            targetSets: 3,
            minReps: 12,
            maxReps: 15,
            repOverloadStep: 1,
            weightIncrement: 2.5,
            customRestSeconds: 60,
            notesForExercise: 'Lie face down on incline bench, raise dumbbells out to sides.',
            weights: { light: 10, medium: 15, heavy: 20 }
          },
          {
            exerciseName: 'Standing Dumbbell Biceps Curl',
            targetSets: 3,
            minReps: 8,
            maxReps: 12,
            repOverloadStep: 2,
            weightIncrement: 5,
            customRestSeconds: 60,
            notesForExercise: 'Strict form, palms up at top of movement.',
            weights: { light: 15, medium: 25, heavy: 35 }
          },
          {
            exerciseName: 'Dumbbell Hammer Curl',
            targetSets: 3,
            minReps: 10,
            maxReps: 12,
            repOverloadStep: 2,
            weightIncrement: 5,
            customRestSeconds: 60,
            notesForExercise: 'Neutral grip (palms facing each other) for brachialis development.',
            weights: { light: 15, medium: 25, heavy: 35 }
          }
        ]
      },
      {
        dayName: 'Day 3: Legs & Core',
        order: 3,
        exercises: [
          {
            exerciseName: 'Goblet Squat',
            targetSets: 3,
            minReps: 8,
            maxReps: 12,
            repOverloadStep: 2,
            weightIncrement: 5,
            customRestSeconds: 90,
            notesForExercise: 'Hold single dumbbell at chest, squat below parallel.',
            weights: { light: 30, medium: 50, heavy: 75 }
          },
          {
            exerciseName: 'Dumbbell Romanian Deadlift',
            targetSets: 3,
            minReps: 8,
            maxReps: 12,
            repOverloadStep: 2,
            weightIncrement: 5,
            customRestSeconds: 90,
            notesForExercise: 'Hinge at hips, keep dumbbells close to shins for hamstring stretch.',
            weights: { light: 25, medium: 45, heavy: 65 }
          },
          {
            exerciseName: 'Dumbbell Walking Lunge',
            targetSets: 3,
            minReps: 10,
            maxReps: 12,
            repOverloadStep: 2,
            weightIncrement: 5,
            customRestSeconds: 75,
            notesForExercise: 'Controlled steps, 10 reps per leg.',
            weights: { light: 15, medium: 25, heavy: 40 }
          },
          {
            exerciseName: 'Single-Leg Dumbbell Calf Raise',
            targetSets: 3,
            minReps: 12,
            maxReps: 15,
            repOverloadStep: 2,
            weightIncrement: 5,
            customRestSeconds: 60,
            notesForExercise: 'Balance on step for full stretch at bottom.',
            weights: { light: 15, medium: 25, heavy: 35 }
          },
          {
            exerciseName: 'Weighted Plank',
            targetSets: 3,
            minReps: 45,
            maxReps: 60,
            repOverloadStep: 15,
            weightIncrement: 5,
            isTimed: true,
            customRestSeconds: 60,
            notesForExercise: 'Hold isometric plank position with high core tension.',
            weights: { light: 0, medium: 10, heavy: 25 }
          }
        ]
      }
    ]
  },
  {
    id: 'ppl_dumbbells_6d',
    name: 'PPL High Frequency (6 Days / Dumbbells)',
    description: 'A 6-day Push/Pull/Legs split hit twice a week for maximum hypertrophy using dumbbells and bench.',
    equipmentCategory: 'dumbbells',
    equipmentLabel: 'Dumbbells & Bench',
    splitType: 'ppl',
    splitLabel: 'PPL (6 Days/wk)',
    daysPerWeek: 6,
    defaultRestTimer: 90,
    tags: ['High Volume', 'Hypertrophy'],
    workoutDays: [
      {
        dayName: 'Push A',
        order: 1,
        exercises: [
          { exerciseName: 'Dumbbell Bench Press', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 25, medium: 45, heavy: 65 } },
          { exerciseName: 'Standing Dumbbell Overhead Press', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 15, medium: 30, heavy: 45 } },
          { exerciseName: 'Incline Dumbbell Fly', targetSets: 3, minReps: 10, maxReps: 15, repOverloadStep: 2, weightIncrement: 2.5, weights: { light: 12.5, medium: 20, heavy: 30 } },
          { exerciseName: 'Dumbbell Lateral Raise', targetSets: 3, minReps: 12, maxReps: 15, repOverloadStep: 1, weightIncrement: 2.5, weights: { light: 10, medium: 15, heavy: 25 } },
          { exerciseName: 'Dumbbell Skullcrushers', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 12.5, medium: 20, heavy: 30 } }
        ]
      },
      {
        dayName: 'Pull A',
        order: 2,
        exercises: [
          { exerciseName: 'Two-Arm Dumbbell Bent-Over Row', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 25, medium: 40, heavy: 60 } },
          { exerciseName: 'Single-Arm Dumbbell Row', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 25, medium: 45, heavy: 65 } },
          { exerciseName: 'Incline Bench Dumbbell Reverse Fly', targetSets: 3, minReps: 12, maxReps: 15, repOverloadStep: 1, weightIncrement: 2.5, weights: { light: 10, medium: 15, heavy: 20 } },
          { exerciseName: 'Incline Dumbbell Biceps Curl', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 12.5, medium: 20, heavy: 30 } },
          { exerciseName: 'Dumbbell Shrugs', targetSets: 3, minReps: 12, maxReps: 15, repOverloadStep: 2, weightIncrement: 5, weights: { light: 30, medium: 50, heavy: 70 } }
        ]
      },
      {
        dayName: 'Legs A',
        order: 3,
        exercises: [
          { exerciseName: 'Goblet Squat', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 30, medium: 50, heavy: 75 } },
          { exerciseName: 'Dumbbell Romanian Deadlift', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 25, medium: 45, heavy: 65 } },
          { exerciseName: 'Dumbbell Bulgarian Split Squat', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 15, medium: 25, heavy: 35 } },
          { exerciseName: 'Standing Dumbbell Calf Raise', targetSets: 3, minReps: 12, maxReps: 15, repOverloadStep: 2, weightIncrement: 5, weights: { light: 20, medium: 35, heavy: 50 } }
        ]
      },
      {
        dayName: 'Push B',
        order: 4,
        exercises: [
          { exerciseName: 'Incline Dumbbell Bench Press', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 20, medium: 35, heavy: 55 } },
          { exerciseName: 'Dumbbell Flat Bench Press', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 25, medium: 45, heavy: 65 } },
          { exerciseName: 'Dumbbell Arnold Press', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 15, medium: 25, heavy: 40 } },
          { exerciseName: 'Dumbbell Floor Press', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 25, medium: 45, heavy: 65 } },
          { exerciseName: 'Dumbbell Kickbacks', targetSets: 3, minReps: 12, maxReps: 15, repOverloadStep: 1, weightIncrement: 2.5, weights: { light: 10, medium: 15, heavy: 22.5 } }
        ]
      },
      {
        dayName: 'Pull B',
        order: 5,
        exercises: [
          { exerciseName: 'Single-Arm Dumbbell Row', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 25, medium: 45, heavy: 65 } },
          { exerciseName: 'Dumbbell Pullover', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 20, medium: 35, heavy: 50 } },
          { exerciseName: 'Dumbbell Face Pulls (Band)', targetSets: 3, minReps: 12, maxReps: 15, repOverloadStep: 2, weightIncrement: 2.5, weights: { light: 15, medium: 25, heavy: 35 } },
          { exerciseName: 'Dumbbell Hammer Curl', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 15, medium: 25, heavy: 35 } },
          { exerciseName: 'Concentration Curl', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 2.5, weights: { light: 12.5, medium: 20, heavy: 30 } }
        ]
      },
      {
        dayName: 'Legs B',
        order: 6,
        exercises: [
          { exerciseName: 'Dumbbell Sumo Squat', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 30, medium: 50, heavy: 75 } },
          { exerciseName: 'Single-Leg Dumbbell Romanian Deadlift', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 15, medium: 25, heavy: 35 } },
          { exerciseName: 'Dumbbell Step-Ups', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 15, medium: 25, heavy: 35 } },
          { exerciseName: 'Dumbbell Farmer Carry', targetSets: 3, minReps: 45, maxReps: 60, repOverloadStep: 15, weightIncrement: 5, isTimed: true, weights: { light: 25, medium: 45, heavy: 65 } }
        ]
      }
    ]
  },
  {
    id: 'arnold_dumbbells_4d',
    name: 'Arnold Split (Dumbbells & Bench)',
    description: 'The legendary Arnold Schwarzenegger split: Chest & Back, Shoulders & Arms, Legs. 4-day rotation for intense pump.',
    equipmentCategory: 'dumbbells',
    equipmentLabel: 'Dumbbells & Bench',
    splitType: 'bro_split',
    splitLabel: 'Arnold Split (4 Days/wk)',
    daysPerWeek: 4,
    defaultRestTimer: 90,
    tags: ['Arnold Split', 'Hypertrophy'],
    workoutDays: [
      {
        dayName: 'Chest & Back',
        order: 1,
        exercises: [
          { exerciseName: 'Dumbbell Bench Press', targetSets: 4, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 25, medium: 45, heavy: 65 } },
          { exerciseName: 'Single-Arm Dumbbell Row', targetSets: 4, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 25, medium: 45, heavy: 65 } },
          { exerciseName: 'Incline Dumbbell Press', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 20, medium: 35, heavy: 55 } },
          { exerciseName: 'Dumbbell Pullover', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 20, medium: 35, heavy: 50 } }
        ]
      },
      {
        dayName: 'Shoulders & Arms',
        order: 2,
        exercises: [
          { exerciseName: 'Dumbbell Arnold Press', targetSets: 4, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 15, medium: 25, heavy: 40 } },
          { exerciseName: 'Dumbbell Lateral Raise', targetSets: 3, minReps: 12, maxReps: 15, repOverloadStep: 1, weightIncrement: 2.5, weights: { light: 10, medium: 15, heavy: 25 } },
          { exerciseName: 'Incline Dumbbell Biceps Curl', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 12.5, medium: 20, heavy: 30 } },
          { exerciseName: 'Overhead Dumbbell Triceps Extension', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 20, medium: 35, heavy: 50 } },
          { exerciseName: 'Dumbbell Hammer Curl', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 15, medium: 25, heavy: 35 } }
        ]
      },
      {
        dayName: 'Legs & Abs',
        order: 3,
        exercises: [
          { exerciseName: 'Goblet Squat', targetSets: 4, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 30, medium: 50, heavy: 75 } },
          { exerciseName: 'Dumbbell Romanian Deadlift', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 25, medium: 45, heavy: 65 } },
          { exerciseName: 'Dumbbell Lunge', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 15, medium: 25, heavy: 40 } },
          { exerciseName: 'Single-Leg Dumbbell Calf Raise', targetSets: 3, minReps: 12, maxReps: 15, repOverloadStep: 2, weightIncrement: 5, weights: { light: 15, medium: 25, heavy: 35 } }
        ]
      },
      {
        dayName: 'Upper Body Pump',
        order: 4,
        exercises: [
          { exerciseName: 'Dumbbell Floor Press', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 25, medium: 45, heavy: 65 } },
          { exerciseName: 'Chest-Supported Dumbbell Row', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 20, medium: 35, heavy: 50 } },
          { exerciseName: 'Seated Dumbbell Lateral Raise', targetSets: 3, minReps: 12, maxReps: 15, repOverloadStep: 1, weightIncrement: 2.5, weights: { light: 10, medium: 15, heavy: 20 } },
          { exerciseName: 'Concentration Curl', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 2.5, weights: { light: 12.5, medium: 20, heavy: 30 } }
        ]
      }
    ]
  },
  {
    id: 'upper_lower_dumbbells_4d',
    name: 'Upper / Lower (Dumbbells & Bench 4-Day)',
    description: 'Balanced 4-day split alternating upper body and lower body days for strength and muscle size.',
    equipmentCategory: 'dumbbells',
    equipmentLabel: 'Dumbbells & Bench',
    splitType: 'upper_lower',
    splitLabel: 'Upper / Lower (4 Days/wk)',
    daysPerWeek: 4,
    defaultRestTimer: 90,
    tags: ['Balanced', 'Hypertrophy'],
    workoutDays: [
      {
        dayName: 'Upper A',
        order: 1,
        exercises: [
          { exerciseName: 'Dumbbell Bench Press', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 25, medium: 45, heavy: 65 } },
          { exerciseName: 'Single-Arm Dumbbell Row', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 25, medium: 45, heavy: 65 } },
          { exerciseName: 'Seated Dumbbell Shoulder Press', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 15, medium: 30, heavy: 45 } },
          { exerciseName: 'Standing Dumbbell Biceps Curl', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 15, medium: 25, heavy: 35 } },
          { exerciseName: 'Dumbbell Triceps Extension', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 15, medium: 25, heavy: 40 } }
        ]
      },
      {
        dayName: 'Lower A',
        order: 2,
        exercises: [
          { exerciseName: 'Goblet Squat', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 30, medium: 50, heavy: 75 } },
          { exerciseName: 'Dumbbell Romanian Deadlift', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 25, medium: 45, heavy: 65 } },
          { exerciseName: 'Dumbbell Walking Lunge', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 15, medium: 25, heavy: 40 } },
          { exerciseName: 'Single-Leg Dumbbell Calf Raise', targetSets: 3, minReps: 12, maxReps: 15, repOverloadStep: 2, weightIncrement: 5, weights: { light: 15, medium: 25, heavy: 35 } }
        ]
      },
      {
        dayName: 'Upper B',
        order: 3,
        exercises: [
          { exerciseName: 'Incline Dumbbell Press', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 20, medium: 35, heavy: 55 } },
          { exerciseName: 'Two-Arm Dumbbell Bent-Over Row', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 20, medium: 35, heavy: 50 } },
          { exerciseName: 'Dumbbell Lateral Raise', targetSets: 3, minReps: 12, maxReps: 15, repOverloadStep: 1, weightIncrement: 2.5, weights: { light: 10, medium: 15, heavy: 25 } },
          { exerciseName: 'Dumbbell Hammer Curl', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 15, medium: 25, heavy: 35 } }
        ]
      },
      {
        dayName: 'Lower B',
        order: 4,
        exercises: [
          { exerciseName: 'Dumbbell Bulgarian Split Squat', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 15, medium: 25, heavy: 35 } },
          { exerciseName: 'Dumbbell Sumo Squat', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 30, medium: 50, heavy: 75 } },
          { exerciseName: 'Dumbbell Glute Bridge', targetSets: 3, minReps: 10, maxReps: 15, repOverloadStep: 2, weightIncrement: 5, weights: { light: 25, medium: 45, heavy: 65 } },
          { exerciseName: 'Standing Dumbbell Calf Raise', targetSets: 3, minReps: 12, maxReps: 15, repOverloadStep: 2, weightIncrement: 5, weights: { light: 20, medium: 35, heavy: 50 } }
        ]
      }
    ]
  },
  {
    id: 'full_body_dumbbells_3d',
    name: 'Full Body Minimalist (3 Days / Dumbbells)',
    description: 'Efficient 3-day full body routine hitting all major muscle groups every session in under 45 minutes.',
    equipmentCategory: 'dumbbells',
    equipmentLabel: 'Dumbbells & Bench',
    splitType: 'full_body',
    splitLabel: 'Full Body (3 Days/wk)',
    daysPerWeek: 3,
    defaultRestTimer: 90,
    tags: ['Minimalist', 'Full Body', 'Beginner Friendly'],
    workoutDays: [
      {
        dayName: 'Full Body Workout A',
        order: 1,
        exercises: [
          { exerciseName: 'Goblet Squat', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 30, medium: 50, heavy: 75 } },
          { exerciseName: 'Dumbbell Bench Press', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 25, medium: 45, heavy: 65 } },
          { exerciseName: 'Single-Arm Dumbbell Row', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 25, medium: 45, heavy: 65 } },
          { exerciseName: 'Dumbbell Lateral Raise', targetSets: 3, minReps: 12, maxReps: 15, repOverloadStep: 1, weightIncrement: 2.5, weights: { light: 10, medium: 15, heavy: 25 } }
        ]
      },
      {
        dayName: 'Full Body Workout B',
        order: 2,
        exercises: [
          { exerciseName: 'Dumbbell Romanian Deadlift', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 25, medium: 45, heavy: 65 } },
          { exerciseName: 'Seated Dumbbell Shoulder Press', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 15, medium: 30, heavy: 45 } },
          { exerciseName: 'Incline Dumbbell Press', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 20, medium: 35, heavy: 55 } },
          { exerciseName: 'Standing Dumbbell Biceps Curl', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 15, medium: 25, heavy: 35 } }
        ]
      },
      {
        dayName: 'Full Body Workout C',
        order: 3,
        exercises: [
          { exerciseName: 'Dumbbell Reverse Lunge', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 15, medium: 25, heavy: 40 } },
          { exerciseName: 'Dumbbell Floor Press', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 25, medium: 45, heavy: 65 } },
          { exerciseName: 'Two-Arm Dumbbell Bent-Over Row', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 20, medium: 35, heavy: 50 } },
          { exerciseName: 'Overhead Dumbbell Triceps Extension', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 20, medium: 35, heavy: 50 } }
        ]
      }
    ]
  },

  // -------------------------------------------------------------
  // FULL GYM (BARBELLS, CABLES & MACHINES)
  // -------------------------------------------------------------
  {
    id: 'ppl_fullgym_6d',
    name: 'PPL Classic (6 Days / Full Gym)',
    description: 'The gold standard Push/Pull/Legs 6-day split utilizing barbells, cable stations, and machines.',
    equipmentCategory: 'full_gym',
    equipmentLabel: 'Full Commercial Gym',
    splitType: 'ppl',
    splitLabel: 'PPL (6 Days/wk)',
    daysPerWeek: 6,
    defaultRestTimer: 90,
    tags: ['Gold Standard', 'High Volume', 'Hypertrophy'],
    workoutDays: [
      {
        dayName: 'Push A (Chest Focus)',
        order: 1,
        exercises: [
          { exerciseName: 'Barbell Bench Press', targetSets: 4, minReps: 6, maxReps: 8, repOverloadStep: 2, weightIncrement: 5, customRestSeconds: 120, weights: { light: 95, medium: 135, heavy: 185 } },
          { exerciseName: 'Overhead Barbell Press', targetSets: 3, minReps: 8, maxReps: 10, repOverloadStep: 2, weightIncrement: 5, customRestSeconds: 90, weights: { light: 65, medium: 95, heavy: 135 } },
          { exerciseName: 'Incline Dumbbell Press', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 30, medium: 50, heavy: 70 } },
          { exerciseName: 'Cable Lateral Raise', targetSets: 3, minReps: 12, maxReps: 15, repOverloadStep: 1, weightIncrement: 2.5, weights: { light: 10, medium: 20, heavy: 30 } },
          { exerciseName: 'Triceps Rope Pushdown', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 30, medium: 50, heavy: 70 } }
        ]
      },
      {
        dayName: 'Pull A (Lat Focus)',
        order: 2,
        exercises: [
          { exerciseName: 'Barbell Conventional Deadlift', targetSets: 3, minReps: 5, maxReps: 5, repOverloadStep: 1, weightIncrement: 10, customRestSeconds: 150, weights: { light: 135, medium: 225, heavy: 315 } },
          { exerciseName: 'Lat Pulldown', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 70, medium: 110, heavy: 150 } },
          { exerciseName: 'Seated Cable Row', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 70, medium: 110, heavy: 150 } },
          { exerciseName: 'Face Pulls', targetSets: 3, minReps: 12, maxReps: 15, repOverloadStep: 1, weightIncrement: 2.5, weights: { light: 25, medium: 40, heavy: 60 } },
          { exerciseName: 'EZ-Bar Biceps Curl', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 35, medium: 55, heavy: 75 } }
        ]
      },
      {
        dayName: 'Legs A (Quad Focus)',
        order: 3,
        exercises: [
          { exerciseName: 'Barbell Back Squat', targetSets: 4, minReps: 6, maxReps: 8, repOverloadStep: 2, weightIncrement: 5, customRestSeconds: 120, weights: { light: 95, medium: 155, heavy: 225 } },
          { exerciseName: 'Leg Press', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 10, weights: { light: 140, medium: 230, heavy: 360 } },
          { exerciseName: 'Leg Extension', targetSets: 3, minReps: 12, maxReps: 15, repOverloadStep: 2, weightIncrement: 5, weights: { light: 50, medium: 80, heavy: 120 } },
          { exerciseName: 'Lying Leg Curl', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 40, medium: 70, heavy: 100 } },
          { exerciseName: 'Standing Calf Raise Machine', targetSets: 4, minReps: 12, maxReps: 15, repOverloadStep: 2, weightIncrement: 10, weights: { light: 70, medium: 120, heavy: 180 } }
        ]
      },
      {
        dayName: 'Push B (Shoulder Focus)',
        order: 4,
        exercises: [
          { exerciseName: 'Seated Barbell Overhead Press', targetSets: 4, minReps: 6, maxReps: 8, repOverloadStep: 2, weightIncrement: 5, customRestSeconds: 120, weights: { light: 65, medium: 95, heavy: 135 } },
          { exerciseName: 'Incline Barbell Bench Press', targetSets: 3, minReps: 8, maxReps: 10, repOverloadStep: 2, weightIncrement: 5, weights: { light: 75, medium: 115, heavy: 155 } },
          { exerciseName: 'Dumbbell Chest Fly', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 2.5, weights: { light: 15, medium: 25, heavy: 35 } },
          { exerciseName: 'Dumbbell Lateral Raise', targetSets: 3, minReps: 12, maxReps: 15, repOverloadStep: 1, weightIncrement: 2.5, weights: { light: 10, medium: 15, heavy: 25 } },
          { exerciseName: 'Incline Dumbbell Overhead Triceps Extension', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 25, medium: 40, heavy: 55 } }
        ]
      },
      {
        dayName: 'Pull B (Upper Back Focus)',
        order: 5,
        exercises: [
          { exerciseName: 'Barbell Bent-Over Row', targetSets: 4, minReps: 6, maxReps: 8, repOverloadStep: 2, weightIncrement: 5, customRestSeconds: 90, weights: { light: 75, medium: 115, heavy: 155 } },
          { exerciseName: 'Neutral Grip Lat Pulldown', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 70, medium: 110, heavy: 150 } },
          { exerciseName: 'Single-Arm Cable Row', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 30, medium: 50, heavy: 70 } },
          { exerciseName: 'Reverse Cable Fly', targetSets: 3, minReps: 12, maxReps: 15, repOverloadStep: 1, weightIncrement: 2.5, weights: { light: 10, medium: 15, heavy: 25 } },
          { exerciseName: 'Incline Dumbbell Hammer Curl', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 15, medium: 25, heavy: 35 } }
        ]
      },
      {
        dayName: 'Legs B (Hamstring Focus)',
        order: 6,
        exercises: [
          { exerciseName: 'Barbell Romanian Deadlift', targetSets: 4, minReps: 8, maxReps: 10, repOverloadStep: 2, weightIncrement: 10, customRestSeconds: 120, weights: { light: 95, medium: 155, heavy: 225 } },
          { exerciseName: 'Barbell Hip Thrust', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 10, weights: { light: 95, medium: 155, heavy: 225 } },
          { exerciseName: 'Seated Leg Curl', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 40, medium: 70, heavy: 100 } },
          { exerciseName: 'Goblet Bulgarian Split Squat', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 15, medium: 25, heavy: 40 } },
          { exerciseName: 'Seated Calf Raise Machine', targetSets: 4, minReps: 12, maxReps: 15, repOverloadStep: 2, weightIncrement: 5, weights: { light: 45, medium: 70, heavy: 100 } }
        ]
      }
    ]
  },
  {
    id: 'stronglifts_5x5',
    name: 'StrongLifts 5x5 / Linear Strength',
    description: 'The proven 3-day strength building program focusing on heavy compound barbell movements.',
    equipmentCategory: 'full_gym',
    equipmentLabel: 'Full Commercial Gym',
    splitType: 'full_body',
    splitLabel: 'Full Body (3 Days/wk)',
    daysPerWeek: 3,
    defaultRestTimer: 120,
    tags: ['Strength Focus', 'Barbell', 'Beginner Strength'],
    workoutDays: [
      {
        dayName: 'Workout A',
        order: 1,
        exercises: [
          { exerciseName: 'Barbell Back Squat', targetSets: 5, minReps: 5, maxReps: 5, repOverloadStep: 1, weightIncrement: 5, customRestSeconds: 120, notesForExercise: 'Deep parallel squat, add 5lbs every workout.', weights: { light: 95, medium: 135, heavy: 185 } },
          { exerciseName: 'Barbell Bench Press', targetSets: 5, minReps: 5, maxReps: 5, repOverloadStep: 1, weightIncrement: 5, customRestSeconds: 120, notesForExercise: 'Touch chest firmly on every rep.', weights: { light: 85, medium: 115, heavy: 155 } },
          { exerciseName: 'Barbell Bent-Over Row', targetSets: 5, minReps: 5, maxReps: 5, repOverloadStep: 1, weightIncrement: 5, customRestSeconds: 90, notesForExercise: 'Pull from floor to lower chest.', weights: { light: 75, medium: 95, heavy: 135 } }
        ]
      },
      {
        dayName: 'Workout B',
        order: 2,
        exercises: [
          { exerciseName: 'Barbell Back Squat', targetSets: 5, minReps: 5, maxReps: 5, repOverloadStep: 1, weightIncrement: 5, customRestSeconds: 120, weights: { light: 95, medium: 135, heavy: 185 } },
          { exerciseName: 'Overhead Barbell Press', targetSets: 5, minReps: 5, maxReps: 5, repOverloadStep: 1, weightIncrement: 5, customRestSeconds: 120, weights: { light: 55, medium: 75, heavy: 105 } },
          { exerciseName: 'Barbell Conventional Deadlift', targetSets: 1, minReps: 5, maxReps: 5, repOverloadStep: 1, weightIncrement: 10, customRestSeconds: 180, notesForExercise: '1 heavy set of 5 reps.', weights: { light: 135, medium: 185, heavy: 275 } }
        ]
      }
    ]
  },
  {
    id: 'gzclp_3d',
    name: 'Phrak\'s GZCLP (3-Day Strength & Size)',
    description: 'Tiered linear progression program combining heavy low-rep strength work with higher rep hypertrophy accessory sets.',
    equipmentCategory: 'full_gym',
    equipmentLabel: 'Full Commercial Gym',
    splitType: 'full_body',
    splitLabel: 'Powerbuilding (3 Days/wk)',
    daysPerWeek: 3,
    defaultRestTimer: 120,
    tags: ['GZCLP', 'Powerbuilding', 'Linear Progression'],
    workoutDays: [
      {
        dayName: 'Day 1: Squat T1 / Bench T2',
        order: 1,
        exercises: [
          { exerciseName: 'Barbell Back Squat', targetSets: 5, minReps: 3, maxReps: 3, repOverloadStep: 1, weightIncrement: 5, customRestSeconds: 180, notesForExercise: 'Tier 1 Heavy: 5 sets of 3 reps.', weights: { light: 115, medium: 165, heavy: 225 } },
          { exerciseName: 'Barbell Bench Press', targetSets: 3, minReps: 10, maxReps: 10, repOverloadStep: 1, weightIncrement: 5, customRestSeconds: 90, notesForExercise: 'Tier 2 Volume: 3 sets of 10 reps.', weights: { light: 75, medium: 105, heavy: 135 } },
          { exerciseName: 'Lat Pulldown', targetSets: 3, minReps: 15, maxReps: 15, repOverloadStep: 1, weightIncrement: 5, customRestSeconds: 60, notesForExercise: 'Tier 3 Accessory.', weights: { light: 60, medium: 90, heavy: 120 } }
        ]
      },
      {
        dayName: 'Day 2: OHP T1 / Deadlift T2',
        order: 2,
        exercises: [
          { exerciseName: 'Overhead Barbell Press', targetSets: 5, minReps: 3, maxReps: 3, repOverloadStep: 1, weightIncrement: 5, customRestSeconds: 180, notesForExercise: 'Tier 1 Heavy: 5 sets of 3 reps.', weights: { light: 65, medium: 95, heavy: 125 } },
          { exerciseName: 'Barbell Conventional Deadlift', targetSets: 3, minReps: 10, maxReps: 10, repOverloadStep: 1, weightIncrement: 10, customRestSeconds: 120, notesForExercise: 'Tier 2 Volume.', weights: { light: 115, medium: 165, heavy: 225 } },
          { exerciseName: 'Dumbbell Bent-Over Row', targetSets: 3, minReps: 15, maxReps: 15, repOverloadStep: 1, weightIncrement: 5, customRestSeconds: 60, weights: { light: 25, medium: 40, heavy: 55 } }
        ]
      },
      {
        dayName: 'Day 3: Bench T1 / Squat T2',
        order: 3,
        exercises: [
          { exerciseName: 'Barbell Bench Press', targetSets: 5, minReps: 3, maxReps: 3, repOverloadStep: 1, weightIncrement: 5, customRestSeconds: 180, notesForExercise: 'Tier 1 Heavy.', weights: { light: 105, medium: 145, heavy: 195 } },
          { exerciseName: 'Barbell Back Squat', targetSets: 3, minReps: 10, maxReps: 10, repOverloadStep: 1, weightIncrement: 5, customRestSeconds: 90, notesForExercise: 'Tier 2 Volume.', weights: { light: 85, medium: 125, heavy: 165 } },
          { exerciseName: 'Face Pulls', targetSets: 3, minReps: 15, maxReps: 15, repOverloadStep: 1, weightIncrement: 2.5, customRestSeconds: 60, weights: { light: 20, medium: 35, heavy: 50 } }
        ]
      }
    ]
  },
  {
    id: 'bro_split_fullgym_5d',
    name: '5-Day Bodybuilding Bro Split',
    description: 'Classic 5-day bodypart split targeting one major muscle group per workout with maximum volume.',
    equipmentCategory: 'full_gym',
    equipmentLabel: 'Full Commercial Gym',
    splitType: 'bro_split',
    splitLabel: 'Bro Split (5 Days/wk)',
    daysPerWeek: 5,
    defaultRestTimer: 90,
    tags: ['Bodybuilding', 'Bro Split', 'High Volume'],
    workoutDays: [
      {
        dayName: 'Chest Day',
        order: 1,
        exercises: [
          { exerciseName: 'Barbell Bench Press', targetSets: 4, minReps: 8, maxReps: 10, repOverloadStep: 2, weightIncrement: 5, weights: { light: 95, medium: 135, heavy: 185 } },
          { exerciseName: 'Incline Dumbbell Press', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 30, medium: 50, heavy: 70 } },
          { exerciseName: 'Cable Chest Fly', targetSets: 3, minReps: 12, maxReps: 15, repOverloadStep: 1, weightIncrement: 2.5, weights: { light: 20, medium: 35, heavy: 50 } },
          { exerciseName: 'Dips (Chest Focus)', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 0, medium: 0, heavy: 25 } }
        ]
      },
      {
        dayName: 'Back Day',
        order: 2,
        exercises: [
          { exerciseName: 'Barbell Bent-Over Row', targetSets: 4, minReps: 8, maxReps: 10, repOverloadStep: 2, weightIncrement: 5, weights: { light: 75, medium: 115, heavy: 155 } },
          { exerciseName: 'Lat Pulldown', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 70, medium: 110, heavy: 150 } },
          { exerciseName: 'Seated Cable Row', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 70, medium: 110, heavy: 150 } },
          { exerciseName: 'Straight-Arm Cable Pulldown', targetSets: 3, minReps: 12, maxReps: 15, repOverloadStep: 1, weightIncrement: 2.5, weights: { light: 30, medium: 45, heavy: 60 } }
        ]
      },
      {
        dayName: 'Shoulder Day',
        order: 3,
        exercises: [
          { exerciseName: 'Seated Dumbbell Shoulder Press', targetSets: 4, minReps: 8, maxReps: 10, repOverloadStep: 2, weightIncrement: 5, weights: { light: 20, medium: 35, heavy: 55 } },
          { exerciseName: 'Dumbbell Lateral Raise', targetSets: 4, minReps: 12, maxReps: 15, repOverloadStep: 1, weightIncrement: 2.5, weights: { light: 10, medium: 15, heavy: 25 } },
          { exerciseName: 'Face Pulls', targetSets: 3, minReps: 12, maxReps: 15, repOverloadStep: 1, weightIncrement: 2.5, weights: { light: 25, medium: 40, heavy: 60 } },
          { exerciseName: 'Barbell Shrugs', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 10, weights: { light: 95, medium: 155, heavy: 225 } }
        ]
      },
      {
        dayName: 'Leg Day',
        order: 4,
        exercises: [
          { exerciseName: 'Barbell Back Squat', targetSets: 4, minReps: 8, maxReps: 10, repOverloadStep: 2, weightIncrement: 5, weights: { light: 95, medium: 155, heavy: 225 } },
          { exerciseName: 'Leg Press', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 10, weights: { light: 140, medium: 230, heavy: 360 } },
          { exerciseName: 'Lying Leg Curl', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 40, medium: 70, heavy: 100 } },
          { exerciseName: 'Leg Extension', targetSets: 3, minReps: 12, maxReps: 15, repOverloadStep: 2, weightIncrement: 5, weights: { light: 50, medium: 80, heavy: 120 } }
        ]
      },
      {
        dayName: 'Arm Day',
        order: 5,
        exercises: [
          { exerciseName: 'Barbell Biceps Curl', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 35, medium: 55, heavy: 75 } },
          { exerciseName: 'Close-Grip Barbell Bench Press', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 75, medium: 105, heavy: 145 } },
          { exerciseName: 'Incline Dumbbell Hammer Curl', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 15, medium: 25, heavy: 35 } },
          { exerciseName: 'Triceps Rope Pushdown', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 30, medium: 50, heavy: 70 } }
        ]
      }
    ]
  },
  {
    id: 'glute_sculpt_4d',
    name: 'Glute & Upper Body Sculpt (4 Days)',
    description: 'Designed for targeted glute hypertrophy, hamstring development, and a toned upper body using hip thrusts and cables.',
    equipmentCategory: 'full_gym',
    equipmentLabel: 'Full Commercial Gym',
    splitType: 'specialty',
    splitLabel: 'Glute & Upper (4 Days/wk)',
    daysPerWeek: 4,
    defaultRestTimer: 90,
    tags: ['Glute Focus', 'Specialty', 'Hypertrophy'],
    workoutDays: [
      {
        dayName: 'Glutes & Hamstrings A',
        order: 1,
        exercises: [
          { exerciseName: 'Barbell Hip Thrust', targetSets: 4, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 10, customRestSeconds: 120, notesForExercise: 'Pause 1s at top extension.', weights: { light: 65, medium: 115, heavy: 185 } },
          { exerciseName: 'Barbell Romanian Deadlift', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 10, customRestSeconds: 90, weights: { light: 65, medium: 95, heavy: 145 } },
          { exerciseName: 'Cable Kickbacks', targetSets: 3, minReps: 12, maxReps: 15, repOverloadStep: 1, weightIncrement: 2.5, weights: { light: 10, medium: 20, heavy: 30 } },
          { exerciseName: 'Seated Leg Curl', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 30, medium: 50, heavy: 75 } }
        ]
      },
      {
        dayName: 'Upper Body A',
        order: 2,
        exercises: [
          { exerciseName: 'Dumbbell Bench Press', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 15, medium: 30, heavy: 45 } },
          { exerciseName: 'Lat Pulldown', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 50, medium: 80, heavy: 110 } },
          { exerciseName: 'Dumbbell Lateral Raise', targetSets: 3, minReps: 12, maxReps: 15, repOverloadStep: 1, weightIncrement: 2.5, weights: { light: 7.5, medium: 12.5, heavy: 20 } },
          { exerciseName: 'Face Pulls', targetSets: 3, minReps: 12, maxReps: 15, repOverloadStep: 1, weightIncrement: 2.5, weights: { light: 15, medium: 25, heavy: 40 } }
        ]
      },
      {
        dayName: 'Glutes & Quads B',
        order: 3,
        exercises: [
          { exerciseName: 'Goblet Bulgarian Split Squat', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 10, medium: 20, heavy: 35 } },
          { exerciseName: 'Single-Leg Cable Glute Medius Kickback', targetSets: 3, minReps: 12, maxReps: 15, repOverloadStep: 1, weightIncrement: 2.5, weights: { light: 5, medium: 12.5, heavy: 20 } },
          { exerciseName: 'Leg Press (Foot Placement High & Wide)', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 10, weights: { light: 90, medium: 160, heavy: 250 } },
          { exerciseName: 'Standing Calf Raise', targetSets: 3, minReps: 12, maxReps: 15, repOverloadStep: 2, weightIncrement: 5, weights: { light: 15, medium: 25, heavy: 40 } }
        ]
      },
      {
        dayName: 'Upper Body B & Core',
        order: 4,
        exercises: [
          { exerciseName: 'Seated Dumbbell Shoulder Press', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 12.5, medium: 20, heavy: 35 } },
          { exerciseName: 'Seated Cable Row', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 50, medium: 80, heavy: 110 } },
          { exerciseName: 'Triceps Rope Pushdown', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 20, medium: 35, heavy: 50 } },
          { exerciseName: 'Hanging Knee Raise', targetSets: 3, minReps: 10, maxReps: 15, repOverloadStep: 2, weightIncrement: 5, weights: { light: 0, medium: 0, heavy: 10 } }
        ]
      }
    ]
  },

  // -------------------------------------------------------------
  // SMITH MACHINE & MACHINES
  // -------------------------------------------------------------
  {
    id: 'smith_fullbody_3d',
    name: 'Smith Machine Full Body (3 Days)',
    description: 'Safe, controlled 3-day workout leveraging the Smith machine for squats, presses, and rows with smooth progression.',
    equipmentCategory: 'smith_machine',
    equipmentLabel: 'Smith Machine & Cables',
    splitType: 'full_body',
    splitLabel: 'Full Body (3 Days/wk)',
    daysPerWeek: 3,
    defaultRestTimer: 90,
    tags: ['Smith Machine', 'Beginner Friendly', 'Safe Lifting'],
    workoutDays: [
      {
        dayName: 'Smith Day A',
        order: 1,
        exercises: [
          { exerciseName: 'Smith Machine Squat', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, customRestSeconds: 90, notesForExercise: 'Feet slightly forward of bar to target quads safely.', weights: { light: 50, medium: 90, heavy: 135 } },
          { exerciseName: 'Smith Machine Bench Press', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, customRestSeconds: 90, weights: { light: 50, medium: 90, heavy: 135 } },
          { exerciseName: 'Lat Pulldown', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 60, medium: 90, heavy: 130 } },
          { exerciseName: 'Dumbbell Lateral Raise', targetSets: 3, minReps: 12, maxReps: 15, repOverloadStep: 1, weightIncrement: 2.5, weights: { light: 10, medium: 15, heavy: 22.5 } }
        ]
      },
      {
        dayName: 'Smith Day B',
        order: 2,
        exercises: [
          { exerciseName: 'Smith Machine Romanian Deadlift', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, customRestSeconds: 90, weights: { light: 50, medium: 90, heavy: 135 } },
          { exerciseName: 'Smith Machine Shoulder Press', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 40, medium: 70, heavy: 100 } },
          { exerciseName: 'Smith Machine Bent-Over Row', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 40, medium: 70, heavy: 110 } },
          { exerciseName: 'Cable Biceps Curl', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 25, medium: 40, heavy: 60 } }
        ]
      },
      {
        dayName: 'Smith Day C',
        order: 3,
        exercises: [
          { exerciseName: 'Smith Machine Incline Press', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 40, medium: 75, heavy: 115 } },
          { exerciseName: 'Smith Machine Hip Thrust', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 10, weights: { light: 60, medium: 110, heavy: 160 } },
          { exerciseName: 'Seated Cable Row', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 60, medium: 90, heavy: 130 } },
          { exerciseName: 'Triceps Rope Pushdown', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 25, medium: 40, heavy: 60 } }
        ]
      }
    ]
  },
  {
    id: 'machines_beginner_3d',
    name: 'Machine-Only Guided Intro (3 Days)',
    description: 'Designed for beginners or rehabilitation: 100% pin-selected machines for total movement security.',
    equipmentCategory: 'smith_machine',
    equipmentLabel: 'Selectorized Machines',
    splitType: 'full_body',
    splitLabel: 'Full Body (3 Days/wk)',
    daysPerWeek: 3,
    defaultRestTimer: 75,
    tags: ['Beginner', 'Machines Only', 'Rehab / Gentle'],
    workoutDays: [
      {
        dayName: 'Machine Day 1',
        order: 1,
        exercises: [
          { exerciseName: 'Seated Chest Press Machine', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 40, medium: 70, heavy: 100 } },
          { exerciseName: 'Seated Row Machine', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 40, medium: 70, heavy: 100 } },
          { exerciseName: 'Leg Press Machine', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 10, weights: { light: 80, medium: 140, heavy: 200 } },
          { exerciseName: 'Abdominal Crunch Machine', targetSets: 3, minReps: 12, maxReps: 15, repOverloadStep: 2, weightIncrement: 5, weights: { light: 30, medium: 50, heavy: 70 } }
        ]
      },
      {
        dayName: 'Machine Day 2',
        order: 2,
        exercises: [
          { exerciseName: 'Seated Shoulder Press Machine', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 30, medium: 50, heavy: 80 } },
          { exerciseName: 'Lat Pulldown Machine', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 50, medium: 80, heavy: 110 } },
          { exerciseName: 'Seated Leg Curl Machine', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 35, medium: 55, heavy: 80 } },
          { exerciseName: 'Leg Extension Machine', targetSets: 3, minReps: 12, maxReps: 15, repOverloadStep: 2, weightIncrement: 5, weights: { light: 40, medium: 65, heavy: 90 } }
        ]
      },
      {
        dayName: 'Machine Day 3',
        order: 3,
        exercises: [
          { exerciseName: 'Pec Deck Fly Machine', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 35, medium: 55, heavy: 80 } },
          { exerciseName: 'Rear Delt Fly Machine', targetSets: 3, minReps: 12, maxReps: 15, repOverloadStep: 1, weightIncrement: 2.5, weights: { light: 25, medium: 40, heavy: 60 } },
          { exerciseName: 'Seated Calf Raise Machine', targetSets: 3, minReps: 12, maxReps: 15, repOverloadStep: 2, weightIncrement: 5, weights: { light: 40, medium: 65, heavy: 90 } },
          { exerciseName: 'Machine Biceps Curl', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 25, medium: 40, heavy: 60 } }
        ]
      }
    ]
  },

  // -------------------------------------------------------------
  // BODYWEIGHT & CALISTHENICS
  // -------------------------------------------------------------
  {
    id: 'calisthenics_fullbody_3d',
    name: 'Bodyweight & Calisthenics (3 Days)',
    description: 'Zero-equipment bodyweight training focusing on pull-ups, push-ups, dips, and leg endurance.',
    equipmentCategory: 'bodyweight',
    equipmentLabel: 'Bodyweight & Pull-Up Bar',
    splitType: 'full_body',
    splitLabel: 'Full Body (3 Days/wk)',
    daysPerWeek: 3,
    defaultRestTimer: 90,
    tags: ['Calisthenics', 'Bodyweight', 'No Equipment'],
    workoutDays: [
      {
        dayName: 'Bodyweight Workout A',
        order: 1,
        exercises: [
          { exerciseName: 'Push-Ups', targetSets: 3, minReps: 10, maxReps: 20, repOverloadStep: 2, weightIncrement: 5, isToFailure: true, weights: { light: 0, medium: 0, heavy: 10 } },
          { exerciseName: 'Pull-Ups / Inverted Rows', targetSets: 3, minReps: 5, maxReps: 10, repOverloadStep: 1, weightIncrement: 5, isToFailure: true, weights: { light: 0, medium: 0, heavy: 10 } },
          { exerciseName: 'Bodyweight Squats', targetSets: 3, minReps: 15, maxReps: 25, repOverloadStep: 3, weightIncrement: 5, weights: { light: 0, medium: 0, heavy: 15 } },
          { exerciseName: 'Plank', targetSets: 3, minReps: 45, maxReps: 90, repOverloadStep: 15, weightIncrement: 5, isTimed: true, weights: { light: 0, medium: 0, heavy: 10 } }
        ]
      },
      {
        dayName: 'Bodyweight Workout B',
        order: 2,
        exercises: [
          { exerciseName: 'Dips / Decline Push-Ups', targetSets: 3, minReps: 8, maxReps: 15, repOverloadStep: 2, weightIncrement: 5, isToFailure: true, weights: { light: 0, medium: 0, heavy: 10 } },
          { exerciseName: 'Chin-Ups', targetSets: 3, minReps: 5, maxReps: 10, repOverloadStep: 1, weightIncrement: 5, isToFailure: true, weights: { light: 0, medium: 0, heavy: 10 } },
          { exerciseName: 'Walking Lunges', targetSets: 3, minReps: 12, maxReps: 20, repOverloadStep: 2, weightIncrement: 5, weights: { light: 0, medium: 0, heavy: 15 } },
          { exerciseName: 'Hanging Leg Raises', targetSets: 3, minReps: 8, maxReps: 15, repOverloadStep: 2, weightIncrement: 5, weights: { light: 0, medium: 0, heavy: 5 } }
        ]
      },
      {
        dayName: 'Bodyweight Workout C',
        order: 3,
        exercises: [
          { exerciseName: 'Pike Push-Ups (Shoulder Focus)', targetSets: 3, minReps: 8, maxReps: 15, repOverloadStep: 2, weightIncrement: 5, isToFailure: true, weights: { light: 0, medium: 0, heavy: 5 } },
          { exerciseName: 'Inverted Australian Rows', targetSets: 3, minReps: 10, maxReps: 15, repOverloadStep: 2, weightIncrement: 5, weights: { light: 0, medium: 0, heavy: 10 } },
          { exerciseName: 'Single-Leg Bodyweight Box Squats', targetSets: 3, minReps: 6, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, weights: { light: 0, medium: 0, heavy: 10 } },
          { exerciseName: 'Single-Leg Bodyweight Calf Raise', targetSets: 3, minReps: 15, maxReps: 25, repOverloadStep: 3, weightIncrement: 5, weights: { light: 0, medium: 0, heavy: 10 } }
        ]
      }
    ]
  },

  // -------------------------------------------------------------
  // EXPRESS & TIME SAVER
  // -------------------------------------------------------------
  {
    id: 'express_fullbody_3d',
    name: '20-Minute Express Full Body (3 Days)',
    description: 'Tight schedule? 3 antagonist superset exercises per session to get in and out in 20 minutes.',
    equipmentCategory: 'dumbbells',
    equipmentLabel: 'Dumbbells & Bench',
    splitType: 'express',
    splitLabel: 'Express (20 Mins)',
    daysPerWeek: 3,
    defaultRestTimer: 60,
    tags: ['Express', 'Fast Workout', 'Time Saver'],
    workoutDays: [
      {
        dayName: 'Express A',
        order: 1,
        exercises: [
          { exerciseName: 'Goblet Squat', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, customRestSeconds: 60, weights: { light: 30, medium: 50, heavy: 70 } },
          { exerciseName: 'Dumbbell Bench Press', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, customRestSeconds: 60, weights: { light: 25, medium: 45, heavy: 65 } },
          { exerciseName: 'Single-Arm Dumbbell Row', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, customRestSeconds: 60, weights: { light: 25, medium: 45, heavy: 65 } }
        ]
      },
      {
        dayName: 'Express B',
        order: 2,
        exercises: [
          { exerciseName: 'Dumbbell Romanian Deadlift', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, customRestSeconds: 60, weights: { light: 25, medium: 45, heavy: 65 } },
          { exerciseName: 'Seated Dumbbell Shoulder Press', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, customRestSeconds: 60, weights: { light: 15, medium: 30, heavy: 45 } },
          { exerciseName: 'Dumbbell Lat Pulldown / Band', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, customRestSeconds: 60, weights: { light: 20, medium: 35, heavy: 50 } }
        ]
      },
      {
        dayName: 'Express C',
        order: 3,
        exercises: [
          { exerciseName: 'Dumbbell Walking Lunge', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, customRestSeconds: 60, weights: { light: 15, medium: 25, heavy: 40 } },
          { exerciseName: 'Incline Dumbbell Press', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, customRestSeconds: 60, weights: { light: 20, medium: 35, heavy: 55 } },
          { exerciseName: 'Dumbbell Curl & Press Combo', targetSets: 3, minReps: 10, maxReps: 12, repOverloadStep: 2, weightIncrement: 5, customRestSeconds: 60, weights: { light: 12.5, medium: 22.5, heavy: 35 } }
        ]
      }
    ]
  }
];
