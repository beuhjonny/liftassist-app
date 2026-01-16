/**
 * Utility functions for weight conversion between LBS and KG.
 * Internal storage is always LBS.
 */

const LBS_PER_KG = 2.20462;

export const toDisplay = (lbs: number | null | undefined, unit: 'lbs' | 'kg'): number => {
    if (lbs === null || lbs === undefined) return 0;
    if (unit === 'lbs') return lbs;

    // Convert to KG and round to 1 decimal place
    const kg = lbs / LBS_PER_KG;
    return Math.round(kg * 10) / 10;
};

export const fromInput = (val: number | null | undefined, unit: 'lbs' | 'kg'): number => {
    if (val === null || val === undefined) return 0;
    if (unit === 'lbs') return val;

    // Convert from KG back to LBS and round to 2 decimal places for storage precision
    const lbs = val * LBS_PER_KG;
    return Math.round(lbs * 100) / 100;
};

export const displayUnit = (unit: 'lbs' | 'kg'): string => {
    return unit === 'kg' ? 'kg' : 'lbs';
};
