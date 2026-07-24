import { findBestExerciseMatch, type ExerciseTaxonomy } from './exerciseMatching';

export interface ExerciseDemoInfo {
  name: string;
  category: string;
  targetMuscles: string[];
  formCues: string[];
  primaryGifUrl?: string;
  youtubeId?: string;
  frames?: string[];
  isUnknown?: boolean;
}

/**
 * Delegates to the unified Exercise Matching Engine in exerciseMatching.ts
 */
export function getExerciseDemo(rawName: string): ExerciseDemoInfo {
  if (!rawName || !rawName.trim()) {
    return {
      name: 'Custom Exercise',
      category: 'Custom Movement',
      targetMuscles: [],
      formCues: [],
      isUnknown: true
    };
  }

  const taxonomy = findBestExerciseMatch(rawName);

  return {
    name: rawName || taxonomy.name,
    category: taxonomy.category,
    targetMuscles: [...taxonomy.primaryMuscles, ...taxonomy.secondaryMuscles],
    formCues: taxonomy.formCues,
    youtubeId: taxonomy.youtubeId,
    isUnknown: taxonomy.id === 'custom_exercise'
  };
}

