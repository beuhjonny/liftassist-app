export interface ExerciseTaxonomy {
  id: string;
  name: string;
  category: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  formCues: string[];
  youtubeId?: string;
  keywords: string[];
}

export const GENERAL_MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Quads',
  'Hamstrings & Glutes',
  'Biceps',
  'Triceps',
  'Abs & Core',
  'Calves',
  'Forearms',
  'Traps'
] as const;

export type GeneralMuscleGroup = typeof GENERAL_MUSCLE_GROUPS[number];

/**
 * Curated Exercise Database with HD YouTube Shorts/Videos, General Muscle Groups, and Form Cues.
 */
export const EXERCISE_TAXONOMY_DATABASE: ExerciseTaxonomy[] = [
  {
    id: 'incline_bench_press',
    name: 'Incline Dumbbell Press',
    category: 'Chest',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Shoulders', 'Triceps'],
    formCues: [
      'Set bench angle between 30 and 45 degrees.',
      'Keep wrists stacked directly over your elbows at the bottom.',
      'Press dumbbells up smoothly without banging them together at the top.'
    ],
    youtubeId: 'VmB1G1Kj548',
    keywords: ['incline bench', 'incline press', 'incline dumbbell', 'incline db', 'incline chest', 'incline']
  },
  {
    id: 'flat_bench_press',
    name: 'Barbell Bench Press',
    category: 'Chest',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Shoulders', 'Triceps'],
    formCues: [
      'Retract shoulder blades and plant feet firmly on the floor.',
      'Lower the bar under control to mid-chest level.',
      'Drive up forcefully through mid-chest without letting elbows flare excessively.'
    ],
    youtubeId: 'vthMCtgVtFw',
    keywords: ['bench press', 'barbell bench', 'flat bench', 'chest press', 'pec press', 'bench']
  },
  {
    id: 'chest_fly',
    name: 'Dumbbell / Cable Chest Fly',
    category: 'Chest',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Shoulders'],
    formCues: [
      'Maintain a slight, fixed bend in the elbows throughout.',
      'Lower until a gentle stretch is felt across the chest.',
      'Squeeze chest muscles together at the peak contraction.'
    ],
    youtubeId: 'eozdVDA78K0',
    keywords: ['chest fly', 'cable fly', 'pec fly', 'dumbbell fly', 'flye', 'pec deck']
  },
  {
    id: 'overhead_press',
    name: 'Overhead / Shoulder Press',
    category: 'Shoulders',
    primaryMuscles: ['Shoulders'],
    secondaryMuscles: ['Triceps', 'Chest'],
    formCues: [
      'Keep core and glutes braced to prevent lower back arching.',
      'Press dumbbells or bar straight overhead until arms fully extend.',
      'Lower weight with control to upper chest or shoulder level.'
    ],
    youtubeId: '2yjwXTZQDDI',
    keywords: ['overhead press', 'ohp', 'shoulder press', 'military press', 'dumbbell shoulder press', 'db press']
  },
  {
    id: 'lateral_raise',
    name: 'Dumbbell Lateral Raise',
    category: 'Shoulders',
    primaryMuscles: ['Shoulders'],
    secondaryMuscles: ['Traps'],
    formCues: [
      'Hinge forward slightly at the hips with soft knees and soft elbows.',
      'Lead with your elbows as you raise the dumbbells out to the sides.',
      'Raise to shoulder height, avoiding shrugging your neck or swinging.'
    ],
    youtubeId: 'PzsMitRjIy0',
    keywords: ['lateral raise', 'side raise', 'delt raise', 'dumbbell raise', 'cable lateral raise', 'lateral']
  },
  {
    id: 'barbell_row',
    name: 'Bent-Over Row',
    category: 'Back',
    primaryMuscles: ['Back'],
    secondaryMuscles: ['Biceps', 'Traps'],
    formCues: [
      'Hinge forward at 45 degrees with a flat back and engaged core.',
      'Pull weight toward your belly button, driving elbows back.',
      'Squeeze shoulder blades together at the top of each rep.'
    ],
    youtubeId: '6FZHJGzMFEc',
    keywords: ['bent row', 'barbell row', 'dumbbell row', 'helms row', 't bar row', 'row']
  },
  {
    id: 'lat_pulldown',
    name: 'Lat Pulldown',
    category: 'Back',
    primaryMuscles: ['Back'],
    secondaryMuscles: ['Biceps'],
    formCues: [
      'Grip handle slightly wider than shoulder-width with chest lifted.',
      'Pull bar down to upper chest level, driving elbows downward.',
      'Control the weight as it rises back to full overhead extension.'
    ],
    youtubeId: 'CAwf7n6Luuc',
    keywords: ['lat pulldown', 'pulldown', 'pull down', 'cable pulldown', 'chin up', 'pull up']
  },
  {
    id: 'face_pull',
    name: 'Cable Face Pull',
    category: 'Back',
    primaryMuscles: ['Shoulders', 'Back'],
    secondaryMuscles: ['Traps'],
    formCues: [
      'Set cable pulley to eye level with rope attachment.',
      'Pull rope toward forehead, separating hands and rotating knuckles back.',
      'Hold the contraction for a moment before returning slowly.'
    ],
    youtubeId: 'V8dZ3pyiCBo',
    keywords: ['face pull', 'facepull', 'rear delt fly', 'rear delt']
  },
  {
    id: 'squat',
    name: 'Barbell Back Squat',
    category: 'Quads',
    primaryMuscles: ['Quads', 'Hamstrings & Glutes'],
    secondaryMuscles: ['Abs & Core', 'Calves'],
    formCues: [
      'Set feet shoulder-width apart with toes turned slightly outward.',
      'Brace core and sit back into hips while bending knees.',
      'Lower until thighs are at or below parallel, then drive through mid-foot to stand.'
    ],
    youtubeId: 'ultWZbUMPL8',
    keywords: ['squat', 'back squat', 'front squat', 'goblet squat', 'hack squat', 'leg press']
  },
  {
    id: 'romanian_deadlift',
    name: 'Dumbbell / Barbell RDL (Romanian Deadlift)',
    category: 'Hamstrings & Glutes',
    primaryMuscles: ['Hamstrings & Glutes'],
    secondaryMuscles: ['Back'],
    formCues: [
      'Keep knees soft (slightly bent) and hinge backward at the hips.',
      'Lower dumbbells along your shins until a deep stretch is felt in hamstrings.',
      'Squeeze glutes and drive hips forward to return to standing.'
    ],
    youtubeId: 'JmtYQIQlhdQ',
    keywords: ['rdl', 'romanian deadlift', 'dumbbell rdl', 'db rdl', 'barbell rdl', 'romanian']
  },
  {
    id: 'deadlift',
    name: 'Barbell Conventional Deadlift',
    category: 'Hamstrings & Glutes',
    primaryMuscles: ['Hamstrings & Glutes', 'Back'],
    secondaryMuscles: ['Traps', 'Abs & Core'],
    formCues: [
      'Position bar over mid-foot with shoulder-width grip.',
      'Pull slack out of the bar and engage lats before lifting.',
      'Drive floor away with your legs and push hips forward at lockout.'
    ],
    youtubeId: 'op9kVnSso6Q',
    keywords: ['deadlift', 'sumo deadlift', 'conventional deadlift']
  },
  {
    id: 'bicep_curl',
    name: 'Dumbbell Bicep Curl',
    category: 'Biceps',
    primaryMuscles: ['Biceps'],
    secondaryMuscles: ['Forearms'],
    formCues: [
      'Keep upper arms stationary and pinned near your torso.',
      'Curl weight upward while rotating palms to face ceiling.',
      'Squeeze biceps at the top and lower under full control.'
    ],
    youtubeId: 'in7PaeYlhrM',
    keywords: ['bicep curl', 'dumbbell curl', 'barbell curl', 'preacher curl', 'spider curl', 'curl']
  },
  {
    id: 'hammer_curl',
    name: 'Hammer Curl',
    category: 'Biceps',
    primaryMuscles: ['Biceps', 'Forearms'],
    secondaryMuscles: [],
    formCues: [
      'Hold dumbbells with a neutral grip (palms facing each other).',
      'Keep elbows still and curl weight upward towards shoulders.',
      'Lower slowly without swinging your upper body.'
    ],
    youtubeId: 'zC3nLlEvin4',
    keywords: ['hammer curl', 'neutral curl', 'rope curl']
  },
  {
    id: 'tricep_pushdown',
    name: 'Tricep Rope Pushdown',
    category: 'Triceps',
    primaryMuscles: ['Triceps'],
    secondaryMuscles: [],
    formCues: [
      'Keep elbows tucked close to your torso throughout the movement.',
      'Push attachment straight down, locking out elbows completely.',
      'Spread rope apart at the bottom to maximize tricep contraction.'
    ],
    youtubeId: '2-LAMcpzODU',
    keywords: ['tricep pushdown', 'pushdown', 'tricep extension', 'skullcrusher', 'french press', 'dip', 'dips']
  },
  {
    id: 'shrugs',
    name: 'Dumbbell / Barbell Shrugs',
    category: 'Traps',
    primaryMuscles: ['Traps'],
    secondaryMuscles: ['Forearms'],
    formCues: [
      'Stand upright holding weights at your sides.',
      'Shrug shoulders straight up toward your ears without rolling them.',
      'Pause at the top for a brief squeeze and lower with control.'
    ],
    youtubeId: 'g6qbq4a1e88',
    keywords: ['shrug', 'shrugs', 'trap raise']
  },
  {
    id: 'calves',
    name: 'Standing Calf Raise',
    category: 'Calves',
    primaryMuscles: ['Calves'],
    secondaryMuscles: [],
    formCues: [
      'Place balls of feet on platform with heels hanging slightly.',
      'Lower heels down into a deep calf stretch.',
      'Press through big toes to raise up onto tiptoes.'
    ],
    youtubeId: '-M4-G8p8fmc',
    keywords: ['calf raise', 'calves', 'donkey calf', 'seated calf']
  },
  {
    id: 'abs_core',
    name: 'Abdominal Crunch / Leg Raise',
    category: 'Abs & Core',
    primaryMuscles: ['Abs & Core'],
    secondaryMuscles: [],
    formCues: [
      'Initiate movement by flexing your abs, not pulling on your neck.',
      'Exhale sharply on the contraction phase.',
      'Control the descent to maintain abdominal tension.'
    ],
    youtubeId: 'Xyd_fa5zoEU',
    keywords: ['crunch', 'ab crunch', 'leg raise', 'hanging leg raise', 'plank', 'cable crunch', 'sit up']
  }
];

/**
 * Weighted token fuzzy matching algorithm.
 * Evaluates ALL database entries, ranking matches by exact phrase matches and weighted keyword tokens.
 */
export function findBestExerciseMatch(rawName: string): ExerciseTaxonomy {
  if (!rawName || !rawName.trim()) {
    return getFallbackTaxonomy('Exercise');
  }

  const cleanName = rawName.toLowerCase().replace(/[^a-z0-9\s]+/g, ' ').trim();
  const tokens = cleanName.split(/\s+/).filter(t => t.length > 0);

  let bestMatch: ExerciseTaxonomy | null = null;
  let highestScore = -1;

  for (const item of EXERCISE_TAXONOMY_DATABASE) {
    let score = 0;

    // Check exact keyword containment (e.g. "incline press", "rdl", "lateral raise")
    for (const kw of item.keywords) {
      if (cleanName.includes(kw)) {
        // High-specificity keywords get massive bonus
        if (['rdl', 'romanian deadlift', 'incline press', 'incline bench', 'incline db', 'lateral raise', 'hammer curl'].includes(kw)) {
          score += 20;
        } else {
          score += 10;
        }
      }
    }

    // Token-by-token weighting
    tokens.forEach(token => {
      // Specific variation modifiers (+10)
      if (['incline', 'decline', 'hammer', 'lateral', 'lat', 'overhead', 'romanian', 'rdl', 'face'].includes(token)) {
        if (item.keywords.some(k => k.includes(token))) score += 10;
      }
      // Equipment terms (+3)
      else if (['dumbbell', 'db', 'barbell', 'cable', 'machine', 'smith'].includes(token)) {
        if (item.keywords.some(k => k.includes(token))) score += 3;
      }
      // Generic movement terms (+1)
      else if (['press', 'curl', 'squat', 'row', 'fly', 'raise', 'extension', 'pushdown', 'deadlift'].includes(token)) {
        if (item.keywords.some(k => k.includes(token))) score += 1;
      }
    });

    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  if (bestMatch && highestScore > 0) {
    return bestMatch;
  }

  return getFallbackTaxonomy(rawName);
}

function getFallbackTaxonomy(name: string): ExerciseTaxonomy {
  return {
    id: 'custom_exercise',
    name,
    category: 'Custom Movement',
    primaryMuscles: ['Chest'],
    secondaryMuscles: [],
    formCues: [
      'Maintain a neutral spine and keep your core braced throughout.',
      'Control the eccentric (lowering) phase for 2 seconds.',
      'Drive with intent while maintaining proper joint alignment.'
    ],
    keywords: []
  };
}
