/**
 * The ONE progress-key formula (eng panel item 7, step 1).
 *
 * Previously `name.toLowerCase().replace(/\s+/g,'_')` was copy-pasted at 17
 * call sites, and names containing '/' (e.g. "Dumbbell Lat Pulldown / Band")
 * produced invalid Firestore document paths (odd segment count) that broke
 * hydration and session prep. Slashes never produced a valid doc before, so
 * mapping them to '-' is backward compatible with every real document.
 */
export function getProgressKey(exerciseName: string): string {
  return exerciseName
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/\//g, '-');
}
