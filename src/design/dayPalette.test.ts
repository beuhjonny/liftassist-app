import { describe, it, expect } from 'vitest';
import { colorForDay, DAY_COLOR_PALETTE, DEFAULT_DAY_COLOR } from './dayPalette';

describe('colorForDay', () => {
  it('prefers an explicit stored color', () => {
    expect(colorForDay(2, '#123456')).toBe('#123456');
  });

  it('maps 1-based order onto the palette', () => {
    expect(colorForDay(1)).toBe(DAY_COLOR_PALETTE[0]);
    expect(colorForDay(3)).toBe(DAY_COLOR_PALETTE[2]);
  });

  it('wraps past the end of the palette', () => {
    expect(colorForDay(DAY_COLOR_PALETTE.length + 1)).toBe(DAY_COLOR_PALETTE[0]);
  });

  it('falls back to the default when order is missing or invalid', () => {
    expect(colorForDay(undefined)).toBe(DEFAULT_DAY_COLOR);
    expect(colorForDay(0)).toBe(DEFAULT_DAY_COLOR);
  });

  it('is deterministic: the same day always resolves to the same color', () => {
    expect(colorForDay(4)).toBe(colorForDay(4));
  });
});
