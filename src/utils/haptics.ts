/**
 * Haptic vocabulary - one distinct pattern per action class so the app can be
 * "felt", not just seen (ADA bible commandment 6; PowerWash / Not Boring Camera).
 *
 * Patterns are deliberately short and distinguishable. Silently a no-op where
 * the Vibration API is unavailable (iOS Safari, desktop) - the wrapper build
 * routes these to native haptics later.
 */

type Pattern = number | number[];

const buzz = (pattern: Pattern): void => {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
};

export const haptics = {
  /** A set logged successfully - the most common, confident tap. */
  logDone: () => buzz(30),
  /** A failed set - shorter, softer, distinct from a win. */
  logFail: () => buzz(15),
  /** Stepper / small adjustment - the lightest tick. */
  tick: () => buzz(10),
  /** Rest timer expired - a clear three-pulse alert. */
  restComplete: () => buzz([120, 60, 120]),
  /** A personal record - the one celebratory pattern. */
  pr: () => buzz([12, 40, 12, 40, 24]),
  /** Generic confirm (add to routine, save). */
  confirm: () => buzz(20),
  /** The session seal - workout complete. */
  sessionSeal: () => buzz([20, 80, 20]),
};

export default haptics;
