export interface ExerciseDemoInfo {
  name: string;
  category: string;
  targetMuscles: string[];
  formCues: string[];
  exerciseDbGifUrl?: string;
  fitGifUrl?: string;
  youtubeEmbedUrl?: string;
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
    ],
    exerciseDbGifUrl: 'https://d205bpvrqc9yn1.cloudfront.net/0025.gif',
    fitGifUrl: 'https://cdn.jsdelivr.net/gh/akbartaimurr/FitGif-Exercise-API@main/gifs/Barbell%20Bench%20Press.gif',
    youtubeEmbedUrl: 'https://www.youtube-nocookie.com/embed/rT7DgCr-3pg?autoplay=1&mute=1&loop=1&playlist=rT7DgCr-3pg&controls=1'
  },
  'incline_bench_press': {
    name: 'Incline Dumbbell Press',
    category: 'Chest',
    targetMuscles: ['Pectoralis Major', 'Anterior Deltoids', 'Triceps Brachii'],
    formCues: [
      'Set bench to 30–45 degrees incline.',
      'Keep wrists stacked directly over elbows at the bottom of the movement.',
      'Press dumbbells together at the top without touching.'
    ],
    exerciseDbGifUrl: 'https://d205bpvrqc9yn1.cloudfront.net/0314.gif',
    fitGifUrl: 'https://cdn.jsdelivr.net/gh/akbartaimurr/FitGif-Exercise-API@main/gifs/Incline%20Dumbbell%20Press.gif',
    youtubeEmbedUrl: 'https://www.youtube-nocookie.com/embed/8iPEnn-ltC8?autoplay=1&mute=1&loop=1&playlist=8iPEnn-ltC8&controls=1'
  },
  'hammer_curl': {
    name: 'Standing Hammer Curl',
    category: 'Arms',
    targetMuscles: ['Biceps Brachii', 'Brachialis', 'Brachioradialis'],
    formCues: [
      'Hold dumbbells with a neutral grip (palms facing each other).',
      'Keep upper arms stationary and curl weights upward.',
      'Squeeze biceps & forearms at the top and lower slowly.'
    ],
    exerciseDbGifUrl: 'https://d205bpvrqc9yn1.cloudfront.net/0306.gif',
    fitGifUrl: 'https://cdn.jsdelivr.net/gh/akbartaimurr/FitGif-Exercise-API@main/gifs/Dumbbell%20Hammer%20Curl.gif',
    youtubeEmbedUrl: 'https://www.youtube-nocookie.com/embed/zC3nLlEvin4?autoplay=1&mute=1&loop=1&playlist=zC3nLlEvin4&controls=1'
  },
  'squat': {
    name: 'Barbell Back Squat',
    category: 'Legs',
    targetMuscles: ['Quadriceps', 'Gluteus Maximus', 'Hamstrings', 'Core'],
    formCues: [
      'Set feet shoulder-width apart with toes slightly turned out.',
      'Brace core, break at hips and knees simultaneously.',
      'Squat below parallel while keeping chest up and knees tracking over toes.'
    ],
    exerciseDbGifUrl: 'https://d205bpvrqc9yn1.cloudfront.net/0043.gif',
    fitGifUrl: 'https://cdn.jsdelivr.net/gh/akbartaimurr/FitGif-Exercise-API@main/gifs/Barbell%20Squat.gif',
    youtubeEmbedUrl: 'https://www.youtube-nocookie.com/embed/ultWZbUMPL8?autoplay=1&mute=1&loop=1&playlist=ultWZbUMPL8&controls=1'
  },
  'deadlift': {
    name: 'Barbell Conventional Deadlift',
    category: 'Posterior Chain',
    targetMuscles: ['Hamstrings', 'Glutes', 'Erector Spinae', 'Latissimus Dorsi'],
    formCues: [
      'Position bar over mid-foot, shoulder-width stance.',
      'Hinge at hips, pull slack out of the bar, and engage lats.',
      'Push the floor away through mid-foot and lock out hips at the top.'
    ],
    exerciseDbGifUrl: 'https://d205bpvrqc9yn1.cloudfront.net/0032.gif',
    fitGifUrl: 'https://cdn.jsdelivr.net/gh/akbartaimurr/FitGif-Exercise-API@main/gifs/Barbell%20Deadlift.gif',
    youtubeEmbedUrl: 'https://www.youtube-nocookie.com/embed/op9kVnSso6Q?autoplay=1&mute=1&loop=1&playlist=op9kVnSso6Q&controls=1'
  },
  'overhead_press': {
    name: 'Standing Overhead Press',
    category: 'Shoulders',
    targetMuscles: ['Anterior Deltoids', 'Lateral Deltoids', 'Triceps', 'Upper Chest'],
    formCues: [
      'Grip bar slightly outside shoulder width, elbows slightly in front of bar.',
      'Press straight up, leaning head back slightly as bar passes your face.',
      'Lock out overhead and push head forward to neutral.'
    ],
    exerciseDbGifUrl: 'https://d205bpvrqc9yn1.cloudfront.net/0091.gif',
    fitGifUrl: 'https://cdn.jsdelivr.net/gh/akbartaimurr/FitGif-Exercise-API@main/gifs/Overhead%20Press.gif',
    youtubeEmbedUrl: 'https://www.youtube-nocookie.com/embed/2yjwXTZQDDI?autoplay=1&mute=1&loop=1&playlist=2yjwXTZQDDI&controls=1'
  },
  'lat_pulldown': {
    name: 'Cable Lat Pulldown',
    category: 'Back',
    targetMuscles: ['Latissimus Dorsi', 'Rhomboids', 'Biceps Brachii'],
    formCues: [
      'Grip bar wider than shoulder width with a slight backward lean.',
      'Pull elbows down and back towards your ribcage.',
      'Squeeze shoulder blades at the bottom and control the return.'
    ],
    exerciseDbGifUrl: 'https://d205bpvrqc9yn1.cloudfront.net/0150.gif',
    fitGifUrl: 'https://cdn.jsdelivr.net/gh/akbartaimurr/FitGif-Exercise-API@main/gifs/Lat%20Pulldown.gif',
    youtubeEmbedUrl: 'https://www.youtube-nocookie.com/embed/CAwf7n6Luuc?autoplay=1&mute=1&loop=1&playlist=CAwf7n6Luuc&controls=1'
  },
  'barbell_row': {
    name: 'Bent Over Barbell Row',
    category: 'Back',
    targetMuscles: ['Latissimus Dorsi', 'Trapezius', 'Rhomboids', 'Rear Deltoids'],
    formCues: [
      'Hinge forward at 45 degrees with a flat back and soft knees.',
      'Pull bar to lower sternum/belly button, driving elbows backward.',
      'Avoid swinging or using momentum to lift the weight.'
    ],
    exerciseDbGifUrl: 'https://d205bpvrqc9yn1.cloudfront.net/0027.gif',
    fitGifUrl: 'https://cdn.jsdelivr.net/gh/akbartaimurr/FitGif-Exercise-API@main/gifs/Bent%20Over%20Row.gif',
    youtubeEmbedUrl: 'https://www.youtube-nocookie.com/embed/FWJR5YeXDYA?autoplay=1&mute=1&loop=1&playlist=FWJR5YeXDYA&controls=1'
  }
};

export function getExerciseDemo(rawName: string): ExerciseDemoInfo {
  if (!rawName) {
    return getFallbackDemo('Exercise');
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

  return getFallbackDemo(rawName);
}

function getFallbackDemo(name: string): ExerciseDemoInfo {
  return {
    name,
    category: 'General Strength',
    targetMuscles: ['Target Muscle Group', 'Stabilizers'],
    formCues: [
      'Maintain a neutral spine and brace your core throughout.',
      'Control the eccentric (lowering) phase for 2 seconds.',
      'Drive through the movement with intent without using excessive momentum.'
    ],
    exerciseDbGifUrl: 'https://d205bpvrqc9yn1.cloudfront.net/0025.gif',
    fitGifUrl: 'https://cdn.jsdelivr.net/gh/akbartaimurr/FitGif-Exercise-API@main/gifs/Barbell%20Bench%20Press.gif',
    youtubeEmbedUrl: 'https://www.youtube-nocookie.com/embed/rT7DgCr-3pg?autoplay=1&mute=1&loop=1&playlist=rT7DgCr-3pg&controls=1'
  };
}
