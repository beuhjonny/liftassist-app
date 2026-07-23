import { describe, it, expect } from 'vitest';
import { parseWorkoutText, detectSource } from './workoutParser';

describe('detectSource', () => {
  it('identifies platforms from a url', () => {
    expect(detectSource('https://www.youtube.com/watch?v=x')).toBe('youtube');
    expect(detectSource('https://youtu.be/x')).toBe('youtube');
    expect(detectSource('https://www.instagram.com/reel/x')).toBe('instagram');
    expect(detectSource('https://www.tiktok.com/@u/video/1')).toBe('tiktok');
    expect(detectSource('https://example.com/x')).toBe('web');
    expect(detectSource(null)).toBe('manual');
    expect(detectSource('')).toBe('manual');
  });
});

describe('parseWorkoutText', () => {
  it('parses "Name 3x10"', () => {
    const r = parseWorkoutText('Bench Press 3x10');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ name: 'Bench Press', sets: 3, minReps: 10, maxReps: 10 });
  });

  it('parses a rep range "3x8-12"', () => {
    const r = parseWorkoutText('Barbell Squat 4x8-12');
    expect(r[0]).toMatchObject({ name: 'Barbell Squat', sets: 4, minReps: 8, maxReps: 12 });
  });

  it('parses "N sets of M" phrasing', () => {
    const r = parseWorkoutText('Deadlift: 5 sets of 5 reps');
    expect(r[0]).toMatchObject({ name: 'Deadlift', sets: 5, minReps: 5, maxReps: 5 });
  });

  it('strips list numbering and leading bullets', () => {
    const r = parseWorkoutText('1. Overhead Press - 3x12');
    expect(r[0]).toMatchObject({ name: 'Overhead Press', sets: 3, minReps: 12 });
  });

  it('parses a multi-line routine and dedupes', () => {
    const text = [
      'Push Day',
      'Bench Press 4x8-12',
      '- Incline Dumbbell Press 3x10',
      'Tricep Pushdown 3 sets x 15',
      'Bench Press 4x8-12',
      'Have a great workout and subscribe!',
    ].join('\n');
    const r = parseWorkoutText(text);
    const names = r.map((e) => e.name);
    expect(names).toContain('Bench Press');
    expect(names).toContain('Incline Dumbbell Press');
    expect(names).toContain('Tricep Pushdown');
    expect(names.filter((n) => n === 'Bench Press')).toHaveLength(1); // deduped
    expect(names).not.toContain('Push Day'); // no sets/reps token
  });

  it('ignores lines without a sets/reps token', () => {
    expect(parseWorkoutText('Just chatting about form today')).toHaveLength(0);
  });

  it('rejects a bare number token with no name', () => {
    expect(parseWorkoutText('3x10')).toHaveLength(0);
  });

  it('clamps absurd values into sane ranges', () => {
    const r = parseWorkoutText('Curl 99x999');
    expect(r[0].sets).toBeLessThanOrEqual(20);
    expect(r[0].minReps).toBeLessThanOrEqual(100);
  });

  it('returns empty for empty input', () => {
    expect(parseWorkoutText('')).toEqual([]);
  });
});
