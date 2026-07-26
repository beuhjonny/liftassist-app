# LiftLogic Step-Change - Execution Status
**Branch:** `liftlogic-pro` | **2026-07-26** | Against `LIFTLOGIC-STEPCHANGE-MASTERPLAN-2026-07-25.md` (46 moves, 4 waves)

Everything below is committed on `liftlogic-pro`, type-checks clean, and passes the suite (**80 tests**). The core loop was verified live end-to-end in the Firebase emulator (adopt routine -> run session -> save -> Home readiness), not just unit-tested.

---

## Shipped this program (billion-dollar-feel payload)

### The flagship differentiator - the Readiness layer (Wave 2)
- `readiness.ts` engine + `ReadinessCard.vue` dial (SVG ring, verdict, factor row) - LIVE-verified showing **38/100 "Trained today"** on real logged data.
- `trainingSignals.ts` (10 tests): real `recentFailRate` + weekly volume trend - **killed the dead-wired `recentFailRate: 0`** the code review caught; the recover verdict now fires on real data.
- `deload.ts` (7 tests): reads the progression engine's honest fail streaks; **>=2 lifts stalled pins the verdict to "Deload due"** with a line naming them.

### The 5 signature moments
1. **First-set onboarding surface** - Home first-session state ("START HERE", one hero CTA, demoted day list) verified live.
2. **Readiness reveal** - the dial above the hero (above).
3. **PR beat** - `prDetection.ts` (Epley e1RM, 8 tests) + the one sanctioned flourish: success-triad NEW PR banner, `--ease-pr` scale-in, PR haptic, at the DONE that earns it. First-ever sets never count.
4. **Completion seal** - one dominant number: Total Volume count-up (rAF + hidden-tab fallback) + Duration/Sets/PR chips; verified counting to **4,200 lbs**.
5. **Share card** - rebuilt as the dark-instrument billboard (volume hero, PR ribbon, kg-correct, font guard) and **removed the leaked prod URL** (isolation fix).

### Craft + foundations
- **Haptic vocabulary** (`haptics.ts`): distinct pattern per action class (done/fail/tick/rest/pr/seal).
- **Visual elevation**: `--text-hero` clamp (in-workout numeral verified at **112px Montserrat**), two-part material rim, accent-tinted elevation on the one live action, peer demotion, `.num-display`/`.sr-only` utilities.
- **Bundle split**: entry chunk **776KB -> 24KB** (firebase/vue/charts vendor chunks; chart.js defers to the analytics drawer).
- **PWA shortcut loop**: `?action=start` deep-links the OS icon into a live session; manifest colors fixed.
- **Brand bind**: manifesto + about carry "Makes the call. Shows its work."
- **Root-cause fix** (found by live E2E): one slash-safe `getProgressKey()` replacing 16 duplicated sites - a `/` in an exercise name was producing invalid Firestore paths and breaking session prep.
- **A11y**: rest-timer SR flood fixed (was re-reading the ring every tick); milestone-only announcements.

Plus the entire prior design system (tokens, 15 base components, bottom nav, all surfaces migrated) and the Phase 1-3 correctness/feature/import work underneath.

---

## Remaining, honestly categorized

### A. Buildable now, deferred as high-risk-low-visible-ROI
- **WorkoutActive decomposition (2.16)** - extract `useRestTimer`/`useWorkoutSession`/`useWorkoutCommit` from the 3060-line view. Pure refactor, no user-visible gain, real regression risk on a loop that now works. Do behind characterization tests, as its own focused pass.
- **Thumb-dock frame + on-card rep stepper (2.11/2.12)** - restructure activeSet into a sticky bottom dock. Ergonomic win, but an L-effort restructure of the just-verified core loop. Sequence after the decomposition so it lands on seams, not spaghetti.
- **Deviation dock (2.14)**, **motion beats (2.15)**, **CoachLine primitive (2.9)** - medium, additive; next in line.

### B. Buildable now, larger scope (Wave 3 growth)
- **Anonymous auth + first-set-under-60s (3.1-3.3)** - the biggest conversion lever, but an L-effort auth-flow change; needs careful guard/link work and its own E2E.
- **Viral loop + referrals (3.4-3.6)** - deterministic program fork, `?ref=`, referral counters, share-at-the-peak.

### C. Credential / platform gated (cannot complete here)
- **Entitlement + upsell (4.11)** - needs a `pro` custom-claim Cloud Function.
- **Founding-lifter storefront (4.12)** - needs the platform payment sheet (StoreKit/Play Billing via the native wrapper). Per safety rules the app only opens the sheet; it never captures card data.
- **Native haptics / iOS share extension / locked-screen timer** - need the Capacitor wrapper.
- **Real device benchmark scorecard vs competitors** - needs physical phones + paid competitor installs.

---

## The honest read
The step-change identity - readiness spine, PR beat, completion seal, share billboard, the instrument numeral, the honest engine - is **shipped and verified**. What a user feels in the first 10 seconds is done. The remainder is either a risky refactor best done deliberately (A), a large growth build (B), or genuinely gated on accounts/wrapper you control (C). None of C can be finished on this machine; A and B are the next focused sessions.
