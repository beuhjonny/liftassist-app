export interface ExerciseDemoInfo {
  name: string;
  category: string;
  targetMuscles: string[];
  formCues: string[];
  isUnknown?: boolean;
}

const DEMO_DATABASE: Record<string, ExerciseDemoInfo> = {
  'bench_press': {
    name: 'Barbell Bench Press',
    category: 'Chest',
    targetMuscles: ['Pectoralis Major', 'Anterior Deltoids', 'Triceps Brachii'],
    formCues: [
      'Retract shoulder blades and keep feet flat on the floor.',
      'Lower the bar with control to lower-mid chest level.',
      'Drive feet into the ground and press straight up to full lock.'
    ]
  },
  'incline_bench_press': {
    name: 'Incline Dumbbell Press',
    category: 'Chest',
    targetMuscles: ['Pectoralis Major', 'Anterior Deltoids', 'Triceps Brachii'],
    formCues: [
      'Set bench to 30–45 degrees incline.',
      'Keep wrists stacked directly over elbows at the bottom of the movement.',
      'Press dumbbells together at the top without touching.'
    ]
  },
  'hammer_curl': {
    name: 'Standing Hammer Curl',
    category: 'Arms',
    targetMuscles: ['Biceps Brachii', 'Brachialis', 'Brachioradialis'],
    formCues: [
      'Hold dumbbells with a neutral grip (palms facing each other).',
      'Keep upper arms stationary and curl weights upward.',
      'Squeeze biceps & forearms at the top and lower slowly.'
    ]
  },
  'squat': {
    name: 'Barbell Back Squat',
    category: 'Legs',
    targetMuscles: ['Quadriceps', 'Gluteus Maximus', 'Hamstrings', 'Core'],
    formCues: [
      'Set feet shoulder-width apart with toes slightly turned out.',
      'Brace core, break at hips and knees simultaneously.',
      'Squat below parallel while keeping chest up and knees tracking over toes.'
    ]
  },
  'deadlift': {
    name: 'Barbell Conventional Deadlift',
    category: 'Posterior Chain',
    targetMuscles: ['Hamstrings', 'Glutes', 'Erector Spinae', 'Latissimus Dorsi'],
    formCues: [
      'Position bar over mid-foot, shoulder-width stance.',
      'Hinge at hips, pull slack out of the bar, and engage lats.',
      'Push the floor away through mid-foot and lock out hips at the top.'
    ]
  },
  'overhead_press': {
    name: 'Standing Overhead Press',
    category: 'Shoulders',
    targetMuscles: ['Anterior Deltoids', 'Lateral Deltoids', 'Triceps', 'Upper Chest'],
    formCues: [
      'Grip bar slightly outside shoulder width, elbows slightly in front of bar.',
      'Press straight up, leaning head back slightly as bar passes your face.',
      'Lock out overhead and push head forward to neutral.'
    ]
  },
  'lat_pulldown': {
    name: 'Cable Lat Pulldown',
    category: 'Back',
    targetMuscles: ['Latissimus Dorsi', 'Rhomboids', 'Biceps Brachii'],
    formCues: [
      'Grip bar wider than shoulder width with a slight backward lean.',
      'Pull elbows down and back towards your ribcage.',
      'Squeeze shoulder blades at the bottom and control the return.'
    ]
  },
  'barbell_row': {
    name: 'Bent Over Barbell Row',
    category: 'Back',
    targetMuscles: ['Latissimus Dorsi', 'Trapezius', 'Rhomboids', 'Rear Deltoids'],
    formCues: [
      'Hinge forward at 45 degrees with a flat back and soft knees.',
      'Pull bar to lower sternum/belly button, driving elbows backward.',
      'Avoid swinging or using momentum to lift the weight.'
    ]
  },
  'bicep_curl': {
    name: 'Dumbbell Bicep Curl',
    category: 'Arms',
    targetMuscles: ['Biceps Brachii', 'Brachialis'],
    formCues: [
      'Keep upper arms pinned to your sides throughout the movement.',
      'Supinate wrists (palms facing up) as you curl the weight.',
      'Squeeze at the top and lower under full control.'
    ]
  },
  'tricep_pushdown': {
    name: 'Cable Tricep Pushdown',
    category: 'Arms',
    targetMuscles: ['Triceps Brachii'],
    formCues: [
      'Keep elbows locked near your torso.',
      'Extend arms fully downwards, squeezing triceps at lock-out.',
      'Control the ascent without allowing elbows to drift forward.'
    ]
  },
  'lateral_raise': {
    name: 'Dumbbell Lateral Raise',
    category: 'Shoulders',
    targetMuscles: ['Lateral Deltoids'],
    formCues: [
      'Slight forward lean with a soft bend in the elbows.',
      'Raise dumbbells out to the sides until parallel with the floor.',
      'Lead with your elbows and avoid shrugging your traps.'
    ]
  },
  'leg_press': {
    name: 'Leg Press',
    category: 'Legs',
    targetMuscles: ['Quadriceps', 'Glutes'],
    formCues: [
      'Set feet hip-width apart in the center of the sled.',
      'Lower weight until knees reach 90 degrees without lower back rounding.',
      'Press through heels without locking knees aggressively at top.'
    ]
  }
};

/**
 * Normalizes an exercise name and returns matching or fallback demo information.
 */
export function getExerciseDemo(rawName: string): ExerciseDemoInfo {
  if (!rawName) {
    return getUnknownDemo('Exercise');
  }

  const key = rawName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

  if (DEMO_DATABASE[key]) {
    return DEMO_DATABASE[key];
  }

  if (key.includes('hammer')) {
    return { ...DEMO_DATABASE['hammer_curl'], name: rawName };
  }
  if (key.includes('incline')) {
    return { ...DEMO_DATABASE['incline_bench_press'], name: rawName };
  }
  if (key.includes('bench') || key.includes('chest_press')) {
    return { ...DEMO_DATABASE['bench_press'], name: rawName };
  }
  if (key.includes('squat')) {
    return { ...DEMO_DATABASE['squat'], name: rawName };
  }
  if (key.includes('deadlift') || key.includes('rdl')) {
    return { ...DEMO_DATABASE['deadlift'], name: rawName };
  }
  if (key.includes('press') && (key.includes('shoulder') || key.includes('overhead') || key.includes('military'))) {
    return { ...DEMO_DATABASE['overhead_press'], name: rawName };
  }
  if (key.includes('lat') || key.includes('pulldown')) {
    return { ...DEMO_DATABASE['lat_pulldown'], name: rawName };
  }
  if (key.includes('row') || key.includes('helms')) {
    return { ...DEMO_DATABASE['barbell_row'], name: rawName };
  }
  if (key.includes('curl')) {
    return { ...DEMO_DATABASE['bicep_curl'], name: rawName };
  }
  if (key.includes('tricep') || key.includes('pushdown') || key.includes('extension')) {
    return { ...DEMO_DATABASE['tricep_pushdown'], name: rawName };
  }

  return getUnknownDemo(rawName);
}

function getUnknownDemo(name: string): ExerciseDemoInfo {
  return {
    name,
    category: 'Custom Exercise',
    targetMuscles: [],
    formCues: [],
    isUnknown: true
  };
}
