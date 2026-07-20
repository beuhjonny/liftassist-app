import type { LoggedWorkout } from '@/types';
import { toDisplay, displayUnit } from './weight';

/**
 * Renders a high-resolution 1080x1350 graphic card for a logged workout on an offscreen HTML5 Canvas.
 * Returns a PNG Blob ready for downloading or sharing via navigator.share.
 */
export async function generateWorkoutCardBlob(workout: LoggedWorkout, weightUnit: 'lbs' | 'kg' = 'lbs'): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get 2D canvas context');
  }

  // 1. Background Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1350);
  bgGrad.addColorStop(0, '#0a0d12');
  bgGrad.addColorStop(0.5, '#121822');
  bgGrad.addColorStop(1, '#0b0e14');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1080, 1350);

  // 2. Subtle Glowing Accents / Circles
  const topGlow = ctx.createRadialGradient(900, 150, 20, 900, 150, 450);
  topGlow.addColorStop(0, 'rgba(0, 123, 255, 0.25)');
  topGlow.addColorStop(1, 'rgba(0, 123, 255, 0)');
  ctx.fillStyle = topGlow;
  ctx.beginPath();
  ctx.arc(900, 150, 450, 0, Math.PI * 2);
  ctx.fill();

  const btmGlow = ctx.createRadialGradient(150, 1200, 20, 150, 1200, 450);
  btmGlow.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
  btmGlow.addColorStop(1, 'rgba(16, 185, 129, 0)');
  ctx.fillStyle = btmGlow;
  ctx.beginPath();
  ctx.arc(150, 1200, 450, 0, Math.PI * 2);
  ctx.fill();

  // Outer border line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 30, 1020, 1290);

  // 3. Header Branding: LIFT LOGIC
  ctx.textBaseline = 'top';
  ctx.font = '900 44px Montserrat, -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('LIFT', 80, 70);

  const liftWidth = ctx.measureText('LIFT').width;
  ctx.font = '400 44px Montserrat, -apple-system, sans-serif';
  ctx.fillStyle = '#007bff';
  ctx.fillText(' LOGIC', 80 + liftWidth, 70);

  // Date Tag
  const dateStr = formatDateStr(workout.date);
  ctx.font = '600 24px -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.textAlign = 'right';
  ctx.fillText(dateStr, 1000, 80);
  ctx.textAlign = 'left';

  // Divider Line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, 135);
  ctx.lineTo(1000, 135);
  ctx.stroke();

  // 4. Workout Day Title
  const title = workout.workoutDayNameUsed || 'Workout Session';
  ctx.font = '800 64px -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(truncateText(ctx, title, 880), 80, 175);

  if (workout.trainingProgramNameUsed) {
    ctx.font = '500 26px -apple-system, sans-serif';
    ctx.fillStyle = '#10b981';
    ctx.fillText(`ROUTINE: ${workout.trainingProgramNameUsed.toUpperCase()}`, 80, 255);
  }

  // 5. Stat Cards Grid (Duration, Volume, Sets)
  const statsY = workout.trainingProgramNameUsed ? 310 : 270;
  const cardWidth = 280;
  const cardHeight = 130;
  const cardGap = 20;

  // Calculate Volume & Sets
  const totalVolume = calculateTotalVolume(workout.performedExercises);
  const totalSets = calculateTotalSets(workout.performedExercises);
  const duration = workout.durationMinutes ? `${workout.durationMinutes}m` : 'N/A';

  const stats = [
    { label: 'WORKOUT TIME', val: duration, icon: '⏱️' },
    { label: 'TOTAL VOLUME', val: `${totalVolume.toLocaleString()} ${displayUnit(weightUnit)}`, icon: '🏋️' },
    { label: 'TOTAL SETS', val: `${totalSets} sets`, icon: '📊' }
  ];

  stats.forEach((s, idx) => {
    const cx = 80 + idx * (cardWidth + cardGap);
    
    // Card background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    drawRoundRect(ctx, cx, statsY, cardWidth, cardHeight, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.stroke();

    // Label
    ctx.font = '700 16px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(`${s.icon} ${s.label}`, cx + 20, statsY + 20);

    // Value
    ctx.font = '800 32px -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(s.val, cx + 20, statsY + 65);
  });

  // 6. Performed Exercises List Header
  let listY = statsY + cardHeight + 45;
  ctx.font = '800 28px -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('EXERCISE SUMMARY', 80, listY);

  listY += 45;

  const exercises = workout.performedExercises || [];
  const maxExercises = 6;
  const displayExercises = exercises.slice(0, maxExercises);

  displayExercises.forEach((ex, idx) => {
    const exBoxY = listY + idx * 105;
    
    // Row Card Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    drawRoundRect(ctx, 80, exBoxY, 920, 90, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.stroke();

    // Number + Name
    ctx.font = '700 28px -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    let nameText = `${idx + 1}. ${ex.exerciseName}`;
    if (ex.isPR) nameText += ' 🏅';
    ctx.fillText(truncateText(ctx, nameText, 520), 105, exBoxY + 26);

    // Summary line (e.g. "3 sets x 10 reps @ 185 lbs")
    const summaryLine = getExerciseSummaryLine(ex, weightUnit);
    ctx.font = '500 22px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'right';
    ctx.fillText(summaryLine, 980, exBoxY + 30);
    ctx.textAlign = 'left';
  });

  if (exercises.length > maxExercises) {
    const extraY = listY + maxExercises * 105 + 10;
    ctx.font = '600 22px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(`+ ${exercises.length - maxExercises} more exercises logged`, 80, extraY);
  }

  // 7. Footer Watermark & Branding
  const footerY = 1260;
  ctx.font = '600 22px -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillText('Logged with LiftLogic', 80, footerY);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#007bff';
  ctx.fillText('lift-logic-app.web.app', 1000, footerY);
  ctx.textAlign = 'left';

  // 8. Convert Canvas to PNG Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas toBlob failed'));
      }
    }, 'image/png');
  });
}

function formatDateStr(rawDate: any): string {
  if (!rawDate) return '';
  let d: Date;
  if (typeof rawDate.toDate === 'function') {
    d = rawDate.toDate();
  } else if (rawDate instanceof Date) {
    d = rawDate;
  } else {
    d = new Date(rawDate);
  }
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

function calculateTotalVolume(exercises: any[]): number {
  if (!exercises) return 0;
  let total = 0;
  exercises.forEach(ex => {
    if (ex.sets) {
      ex.sets.forEach((s: any) => {
        if (s.status === 'done' || s.status === 'completed' || s.status === 'completed_to_failure') {
          total += (s.actualWeight || 0) * (s.actualReps || 0);
        }
      });
    }
  });
  return Math.round(total);
}

function calculateTotalSets(exercises: any[]): number {
  if (!exercises) return 0;
  let count = 0;
  exercises.forEach(ex => {
    if (ex.sets) count += ex.sets.length;
  });
  return count;
}

function getExerciseSummaryLine(ex: any, weightUnit: 'lbs' | 'kg'): string {
  if (!ex.sets || ex.sets.length === 0) return '0 sets';
  const numSets = ex.sets.length;
  const firstSet = ex.sets[0];
  const weight = firstSet ? firstSet.actualWeight : 0;
  const reps = firstSet ? firstSet.actualReps : 0;
  return `${numSets} sets × ${reps} reps @ ${weight} ${displayUnit(weightUnit)}`;
}
