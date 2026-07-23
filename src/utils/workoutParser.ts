/**
 * Heuristic workout parser.
 *
 * Turns free text (a shared video description, caption, or pasted transcript)
 * into structured exercises. This is the local fallback so the share-to-import
 * flow works with no LLM backend; the Cloud Function analyzer (Claude) replaces
 * it for messy real-world transcripts. Deterministic and pure so it is testable.
 */

export type WorkoutSourceType =
  | 'youtube'
  | 'instagram'
  | 'tiktok'
  | 'web'
  | 'manual';

export interface ParsedExercise {
  name: string;
  sets: number;
  minReps: number;
  maxReps: number;
}

/** Return the url only if it is a safe http(s) URL, capped in length; else ''.
 *  Blocks javascript:/data:/other schemes from untrusted shared payloads. */
export function safeHttpUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim().slice(0, 2048);
  return /^https?:\/\//i.test(trimmed) ? trimmed : '';
}

export function detectSource(url?: string | null): WorkoutSourceType {
  if (!url) return 'manual';
  const u = url.toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('instagram.com')) return 'instagram';
  if (u.includes('tiktok.com')) return 'tiktok';
  if (/^https?:\/\//.test(u)) return 'web';
  return 'manual';
}

const NUMBERING = /^\s*(?:\d+[.)]|[-*•])\s*/;
// "3x10", "3 x 8-12", "4 sets x 5", "3 sets of 12", "5x5 reps"
const SETS_REPS =
  /(\d+)\s*(?:sets?)?\s*(?:x|×|of)\s*(\d+)(?:\s*(?:-|–|to)\s*(\d+))?\s*(?:reps?)?/i;

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function cleanName(raw: string): string {
  return raw
    .replace(NUMBERING, '')
    .replace(SETS_REPS, '')
    .replace(/\breps?\b/gi, '')
    .replace(/\bsets?\b/gi, '')
    .replace(/[-–:|]+/g, ' ')
    .replace(/[()]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Parse a block of text into exercises, one per line that looks like one.
 * A line qualifies when it has both a plausible name and a sets/reps token.
 */
export function parseWorkoutText(text: string): ParsedExercise[] {
  if (!text) return [];
  const out: ParsedExercise[] = [];
  const seen = new Set<string>();

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const m = line.match(SETS_REPS);
    if (!m) continue;

    const sets = clampInt(m[1], 1, 20);
    const minReps = clampInt(m[2], 1, 100);
    const maxReps = m[3] ? clampInt(m[3], minReps, 100) : minReps;

    const name = titleCase(cleanName(line));
    // Reject if nothing name-like survived (a bare "3x10" is not an exercise).
    if (name.replace(/[^a-z]/gi, '').length < 3) continue;

    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({ name, sets, minReps, maxReps });
  }
  return out;
}

function clampInt(raw: string, lo: number, hi: number): number {
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}
