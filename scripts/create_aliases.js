import fs from 'fs';
import path from 'path';

const PUBLIC_DEMOS_DIR = path.resolve('public/demos');

const ALIASES = {
  // Incline Press variations
  'incline_bench_dumbbell_press': 'incline_dumbbell_press',
  'incline_dumbbell_bench_press': 'incline_dumbbell_press',
  'incline_bench_press': 'incline_dumbbell_press',
  'incline_press': 'incline_dumbbell_press',

  // Lateral Raise variations
  'lateral_raise': 'lateral_raise_with_bands',
  'dumbbell_lateral_raise': 'lateral_raise_with_bands',
  'side_lateral_raise': 'lateral_raise_with_bands',
  'standing_lateral_raise': 'lateral_raise_with_bands',

  // Hammer Curl variations
  'standing_hammer_curl': 'hammer_curls',
  'dumbbell_hammer_curl': 'hammer_curls',
  'hammer_curl': 'hammer_curls',
  'alternate_hammer_curl': 'hammer_curls',

  // Bench Press variations
  'barbell_bench_press': 'barbell_bench_press_medium_grip',
  'bench_press': 'barbell_bench_press_medium_grip',
  'flat_bench_press': 'barbell_bench_press_medium_grip',

  // Squat variations
  'barbell_back_squat': 'barbell_squat',
  'back_squat': 'barbell_squat',
  'squat': 'barbell_squat',

  // Deadlift variations
  'barbell_conventional_deadlift': 'barbell_deadlift',
  'conventional_deadlift': 'barbell_deadlift',
  'deadlift': 'barbell_deadlift',

  // Overhead Press variations
  'standing_overhead_press': 'barbell_shoulder_press',
  'overhead_press': 'barbell_shoulder_press',
  'military_press': 'barbell_shoulder_press',

  // Lat Pulldown variations
  'cable_lat_pulldown': 'full_range_of_motion_lat_pulldown',
  'lat_pulldown': 'full_range_of_motion_lat_pulldown',

  // Row variations
  'bent_over_barbell_row': 'bent_over_barbell_row',
  'barbell_row': 'bent_over_barbell_row',
  'bent_over_row': 'bent_over_barbell_row',
  'helms_row': 'bent_over_barbell_row',

  // Curl & Tricep variations
  'dumbbell_bicep_curl': 'machine_bicep_curl',
  'bicep_curl': 'machine_bicep_curl',
  'cable_tricep_pushdown': 'cable_incline_pushdown',
  'tricep_pushdown': 'cable_incline_pushdown',

  // Leg Press & Extensions
  'leg_press': 'leg_press',
  'leg_extension': 'leg_extensions',
  'lying_leg_curl': 'lying_leg_curls'
};

function copyAlias(aliasKey, sourceKey) {
  for (const ext of ['_0.jpg', '_1.jpg', '.jpg']) {
    const src = path.join(PUBLIC_DEMOS_DIR, `${sourceKey}${ext}`);
    const dest = path.join(PUBLIC_DEMOS_DIR, `${aliasKey}${ext}`);

    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  }
}

let count = 0;
for (const [alias, source] of Object.entries(ALIASES)) {
  copyAlias(alias, source);
  count++;
}

console.log(`Successfully created ${count} exercise alias mappings in public/demos/`);
