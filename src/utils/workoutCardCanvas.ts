import type { LoggedWorkout } from '@/types';
import { toDisplay, displayUnit } from './weight';

/**
 * Renders the 1080x1350 share card - the app's billboard that leaves the app.
 *
 * Design (masterplan 2.5 / step-change 3.7): a signature dark instrument built
 * from the token palette (surface #121212, dark accent line #4c8dff, success
 * #6ee7a0, hairline white@0.08). One-dominant-number law: Total Volume is the
 * hero; everything else recedes. No emoji, no gradients, no leaked URLs.
 * Canvas cannot read CSS custom properties, so the token VALUES are mirrored
 * here as named constants - change tokens.css, change these together.
 */

const C = {
  bg: '#121212',
  raised: 'rgba(255, 255, 255, 0.04)',
  hairline: 'rgba(255, 255, 255, 0.08)',
  textPrimary: 'rgba(255, 255, 255, 0.95)',
  textSecondary: 'rgba(255, 255, 255, 0.70)',
  textTertiary: 'rgba(255, 255, 255, 0.52)',
  accent: '#4c8dff',
  successFg: '#6ee7a0',
  successBg: '#12271b',
  successLine: 'rgba(110, 231, 160, 0.28)',
} as const;

const DISPLAY = 'Montserrat, -apple-system, sans-serif';
const BODY = 'Inter, -apple-system, sans-serif';

export async function generateWorkoutCardBlob(workout: LoggedWorkout, weightUnit: 'lbs' | 'kg' = 'lbs'): Promise<Blob> {
  // Font-load guard: draw only after the display faces are ready so the hero
  // numeral never rasterizes in a fallback font.
  try {
    await Promise.all([
      document.fonts.load(`800 170px ${DISPLAY}`),
      document.fonts.load(`900 44px ${DISPLAY}`),
      document.fonts.load(`600 24px ${BODY}`),
    ]);
    await document.fonts.ready;
  } catch { /* draw with fallbacks rather than fail the share */ }

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D canvas context');

  // Surface + hairline frame
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, 1080, 1350);
  ctx.strokeStyle = C.hairline;
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, 1000, 1270);

  // Header: wordmark + date
  ctx.textBaseline = 'top';
  ctx.font = `900 44px ${DISPLAY}`;
  ctx.fillStyle = C.textPrimary;
  ctx.fillText('LIFT', 92, 92);
  const liftWidth = ctx.measureText('LIFT').width;
  ctx.font = `400 44px ${DISPLAY}`;
  ctx.fillStyle = C.accent;
  ctx.fillText(' LOGIC', 92 + liftWidth, 92);

  ctx.font = `600 24px ${BODY}`;
  ctx.fillStyle = C.textTertiary;
  ctx.textAlign = 'right';
  ctx.fillText(formatDateStr(workout.date), 988, 104);
  ctx.textAlign = 'left';

  hairline(ctx, 92, 168, 988);

  // Day title (+ routine eyebrow, quiet)
  let y = 204;
  if (workout.trainingProgramNameUsed) {
    ctx.font = `700 22px ${BODY}`;
    ctx.fillStyle = C.textTertiary;
    ctx.fillText(spaced(workout.trainingProgramNameUsed.toUpperCase()), 92, y);
    y += 44;
  }
  ctx.font = `800 68px ${DISPLAY}`;
  ctx.fillStyle = C.textPrimary;
  ctx.fillText(truncateText(ctx, workout.workoutDayNameUsed || 'Workout Session', 896), 92, y);
  y += 96;

  // PR ribbon (only when the session earned one)
  const prCount = (workout.performedExercises || []).filter((ex) => ex.isPR).length;
  if (prCount > 0) {
    ctx.font = `700 22px ${BODY}`;
    ctx.fillStyle = C.successFg;
    ctx.fillText(spaced('PERSONAL RECORD'), 92, y);
    const label = prCount > 1 ? `${prCount} NEW PRS` : 'NEW PR';
    pill(ctx, 92 + ctx.measureText(spaced('PERSONAL RECORD')).width + 28, y - 8, label);
    y += 52;
  }

  // HERO: Total Volume - the one dominant number
  const totalVolumeDisplay = toDisplay(calculateTotalVolume(workout.performedExercises), weightUnit);
  y += 12;
  ctx.font = `700 24px ${BODY}`;
  ctx.fillStyle = C.textTertiary;
  ctx.fillText(spaced('TOTAL VOLUME'), 92, y);
  y += 44;
  ctx.font = `800 170px ${DISPLAY}`;
  ctx.fillStyle = C.textPrimary;
  const heroText = totalVolumeDisplay.toLocaleString();
  ctx.fillText(heroText, 88, y);
  const heroWidth = ctx.measureText(heroText).width;
  ctx.font = `700 52px ${DISPLAY}`;
  ctx.fillStyle = C.textSecondary;
  ctx.fillText(displayUnit(weightUnit), 88 + heroWidth + 24, y + 104);
  y += 218;

  // Quiet stat chip row: Duration / Sets / Exercises
  const totalSets = calculateTotalSets(workout.performedExercises);
  const chips = [
    { label: 'DURATION', val: workout.durationMinutes ? `${workout.durationMinutes} min` : '-' },
    { label: 'SETS', val: `${totalSets}` },
    { label: 'EXERCISES', val: `${(workout.performedExercises || []).length}` },
  ];
  chips.forEach((s, idx) => {
    const cx = 92 + idx * 300;
    ctx.fillStyle = C.raised;
    drawRoundRect(ctx, cx, y, 280, 110, 12);
    ctx.fill();
    ctx.strokeStyle = C.hairline;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.font = `700 18px ${BODY}`;
    ctx.fillStyle = C.textTertiary;
    ctx.fillText(spaced(s.label), cx + 24, y + 22);
    ctx.font = `800 40px ${DISPLAY}`;
    ctx.fillStyle = C.textPrimary;
    ctx.fillText(s.val, cx + 24, y + 52);
  });
  y += 156;

  // Exercise rows
  const exercises = workout.performedExercises || [];
  const maxExercises = 5;
  exercises.slice(0, maxExercises).forEach((ex, idx) => {
    const rowY = y + idx * 96;
    ctx.fillStyle = C.raised;
    drawRoundRect(ctx, 92, rowY, 896, 82, 12);
    ctx.fill();
    ctx.strokeStyle = C.hairline;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = `700 27px ${BODY}`;
    ctx.fillStyle = C.textPrimary;
    ctx.fillText(truncateText(ctx, ex.exerciseName, ex.isPR ? 420 : 520), 118, rowY + 26);
    if (ex.isPR) {
      const nameW = ctx.measureText(truncateText(ctx, ex.exerciseName, 420)).width;
      pill(ctx, 118 + nameW + 20, rowY + 22, 'PR');
    }

    ctx.font = `500 24px ${BODY}`;
    ctx.fillStyle = C.textSecondary;
    ctx.textAlign = 'right';
    ctx.fillText(getExerciseSummaryLine(ex, weightUnit), 962, rowY + 28);
    ctx.textAlign = 'left';
  });
  if (exercises.length > maxExercises) {
    ctx.font = `600 22px ${BODY}`;
    ctx.fillStyle = C.textTertiary;
    ctx.fillText(`+ ${exercises.length - maxExercises} more`, 92, y + maxExercises * 96 + 8);
  }

  // Footer: wordmark only. No URL until the product has its own domain -
  // never advertise an environment this build does not control.
  ctx.font = `600 22px ${BODY}`;
  ctx.fillStyle = C.textTertiary;
  ctx.fillText('Logged with LiftLogic', 92, 1258);
  ctx.textAlign = 'right';
  ctx.fillStyle = C.textTertiary;
  ctx.fillText('Makes the call. Shows its work.', 988, 1258);
  ctx.textAlign = 'left';

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/png');
  });
}

/** Letter-space uppercase eyebrows the canvas way (canvas has no tracking). */
function spaced(text: string): string {
  return text.split('').join('  ');
}

function hairline(ctx: CanvasRenderingContext2D, x1: number, y: number, x2: number) {
  ctx.strokeStyle = C.hairline;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
}

function pill(ctx: CanvasRenderingContext2D, x: number, y: number, label: string) {
  ctx.font = `800 20px ${BODY}`;
  const w = ctx.measureText(label).width + 36;
  ctx.fillStyle = C.successBg;
  drawRoundRect(ctx, x, y, w, 38, 19);
  ctx.fill();
  ctx.strokeStyle = C.successLine;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = C.successFg;
  ctx.fillText(label, x + 18, y + 9);
}

function formatDateStr(rawDate: unknown): string {
  if (!rawDate) return '';
  let d: Date;
  const r = rawDate as { toDate?: () => Date };
  if (typeof r.toDate === 'function') d = r.toDate!();
  else if (rawDate instanceof Date) d = rawDate;
  else d = new Date(rawDate as string | number);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let len = text.length;
  while (len > 0 && ctx.measureText(text.slice(0, len) + '...').width > maxWidth) {
    len--;
  }
  return text.slice(0, len) + '...';
}

/** Total volume in INTERNAL lbs; converted for display by the caller path. */
function calculateTotalVolume(exercises: LoggedWorkout['performedExercises']): number {
  if (!exercises) return 0;
  let total = 0;
  for (const ex of exercises) {
    for (const s of ex.sets || []) {
      const status = s.status as string;
      if (status === 'done' || status === 'completed' || status === 'completed_to_failure') {
        total += (s.actualWeight || 0) * (s.actualReps || 0);
      }
    }
  }
  return Math.round(total);
}

function calculateTotalSets(exercises: LoggedWorkout['performedExercises']): number {
  if (!exercises) return 0;
  return exercises.reduce((n, ex) => n + (ex.sets?.length || 0), 0);
}

function getExerciseSummaryLine(ex: LoggedWorkout['performedExercises'][number], weightUnit: 'lbs' | 'kg'): string {
  if (!ex.sets || ex.sets.length === 0) return '0 sets';
  // Show the heaviest counted set, converted to the owner's unit (kg users no
  // longer see lbs-scale numbers on their own card).
  let best = ex.sets[0];
  for (const s of ex.sets) {
    if ((s.actualWeight || 0) > (best.actualWeight || 0)) best = s;
  }
  const weight = toDisplay(best.actualWeight || 0, weightUnit);
  return `${ex.sets.length} sets - top ${weight} ${displayUnit(weightUnit)} x ${best.actualReps || 0}`;
}
