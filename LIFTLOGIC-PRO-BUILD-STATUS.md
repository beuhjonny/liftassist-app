# Lift Logic PRO - Build Status (clone fork)
**Branch:** `liftlogic-pro` | **Date:** 2026-07-22 | **Base:** beuhjonny/liftassist-app @ upstream/main
**For:** Jonny - this is the proving-ground clone. Nothing here has touched your app.

---

## Isolation confirmed (your app is untouched)

- Work is on a local branch `liftlogic-pro`. The original repo is registered as `upstream` with its **push URL disabled** (`DISABLED_no_push`), so a push to your repo is structurally impossible.
- No Firebase project was created or accessed. The clone has **no `.env`**, so it cannot reach any Firestore/Auth. Your `lift-logic-app` project was never authenticated against.
- Anything you want from this branch travels only as a PR you review and merge. 5 commits, all local:

```
816edb5 feat(progression): extract pure tested engine + fix data-loss save path
9e3833c feat(timer): wall-clock rest timer, stop-and-wait, native alerts
5d8025e feat(safety): route guard, error decouple, draft + unit fixes
5e1d53f feat(design): token foundation, font fix, unified day palette (#73), stylelint
8d2d9db feat(ux): surface why-this-weight + numeric keypad on rep input
```

19 files changed, ~3260 insertions. Build green, type-check clean, **29 unit tests pass** (was 0).

---

## What was built (DONE, verifiable)

### Phase 1 - Correctness core

| Item | What changed | Files | Fixes |
|---|---|---|---|
| Progression engine extracted | Pure, tested `computeNextPrescription`; 24 table-driven tests | `src/utils/progression.ts` (+ `.test.ts`) | foundation for all below |
| To-failure can fail (#56) | Missed AMRAP now holds + increments the streak instead of resetting it | `progression.ts` | #56 |
| Skips are neutral | New `'skipped'` set status; skipped exercises no longer count as failures | `types.ts`, `WorkoutActive.vue` | progression honesty |
| Earned-increment guard | No weight bump unless you lifted at/above the prescribed weight | `progression.ts` | phantom weight bug |
| Save-path atomicity | `batch.set(merge)` so a first-ever session cannot lose the workout; calendar index written **after** commit | `WorkoutActive.vue` | data-loss on adopt-preset; phantom history days |
| Why-this-weight data | Stores `lastProgressionReason` per exercise | `types.ts`, `WorkoutActive.vue` | feeds M11 |
| Rest timer rebuild | Wall-clock `restEndsAt` (survives lock/background); stop-and-wait at expiry (no destructive auto-advance); tone + vibrate + native notification; +30s/-15s controls; resync on visibility | `WorkoutActive.vue` | timer freeze (#26 class), rep-input wipe |
| Route + unload guard | Confirm before leaving an in-progress workout | `WorkoutActive.vue` | accidental exit |
| Error decouple | Failed save shows a dismissible banner instead of tearing down the workout into a dead-end card | `WorkoutActive.vue` | dead-end save error |
| Draft safety | Backdrop tap no longer deletes the draft; Discard now confirms | `DraftPromptOverlay.vue` | accidental draft delete |
| Unit correctness | Edit-prescription label follows the user's unit; history editor round-trips weight through `toDisplay`/`fromInput` (+`inputmode=decimal`) | `EditPrescriptionModal.vue`, `EditLoggedWorkoutModal.vue` | silent kg->lbs corruption |

### Phase 2 - Design foundation

| Item | What changed | Files |
|---|---|---|
| Font fix | Inter (declared as body font, never loaded) now loads; paired with Montserrat display. Verified in-browser. | `index.html` |
| Token system | 4px spacing, radii, rem type scale, motion, elevation, per-theme status tokens, 44px tap floor | `src/assets/tokens.css` |
| Day palette (#73) | One shared `src/design/dayPalette.ts` + deterministic `colorForDay`; Routines + History import it instead of divergent copies (5 tests) | `dayPalette.ts`, `Routines.vue`, `WorkoutHistory.vue` |
| Lint enforcement | stylelint with `color-no-hex` (warning) + Vue SFC support; `npm run lint:css`. Baseline 362 raw hex to migrate. | `package.json` |

### Phase 3 - Interaction

| Item | What changed | Files |
|---|---|---|
| Why-this-weight surfaced | Plain-language line under the prescription ("+5 to 105 because you hit 3x12"): the explainable-progression flank vs Fitbod | `ActiveExerciseCard.vue`, `WorkoutActive.vue` |
| Numeric keypad | `inputmode=numeric` on the rep logger | `ActualRepsLogger.vue` |

### Phase 0 - Delivery

- `vitest` + `@vue/test-utils` + `jsdom` installed; `npm test`, `npm run test:watch`, `npm run lint:check`, `npm run lint:css`.
- CI (`.github/workflows/ci.yml`) now runs unit tests + lint before build.

---

## Metric movement (measured or wired)

| Metric | Before | Now | Note |
|---|---|---|---|
| Automated tests | 0 | 29 passing | engine + palette |
| Progression correctness (#56, skips, earned) | broken | fixed + tested | pure module |
| Rest-timer wall-clock accuracy | freezes on lock | anchored, resyncs | native-alert half needs Phase 4 wrapper |
| Data-loss on first session | loses workout | cannot lose | set(merge) + index-after-commit |
| kg data corruption surfaces | 2 confirmed | fixed (edit modal + history) | share card still open (below) |
| Raw hex (VIS) | 377 | 362 + enforced baseline | full codemod pending |
| M11 why-this-weight | 0% | shown per exercise | data + UI live |

---

## Remaining work

### Continuation (code, no credentials needed) - the honest to-do

1. **Full token migration** - 362 raw hex -> tokens across `.vue` files; then flip `color-no-hex` to error in CI. Mechanical but needs visual QA on authed screens (I could not see them without your Firebase keys).
2. **Base components** - extract `BaseButton/BaseModal/BaseCard`; migrate Routines + Profile first (largest inline-style debt). Pattern is set by the token layer.
3. **Bottom tab bar + lucide icons** - replace the desktop top-nav / emoji nav; add safe-area insets.
4. **Share card units** - `workoutCardCanvas.ts` + public view still hardcode lbs; route through `toDisplay`, store owner unit in the share payload, add a font-load guard, and add the share button at the completion screen.
5. **Deviation UX** - inline +/- weight steppers, reps-above-target on DONE, single bottom-sheet editor (replaces the two-modal chain), "do this later" deferral.
6. **Offline UX** - online/offline listeners, offline badge, queued-writes toast, precache demo assets, airplane-mode e2e.
7. **Plate + warmup calculators** - inline in the set row (the last two table-stakes gaps).
8. **PR detection + restrained celebration**; analytics defaults (accordion open >=10 workouts, preselect top lift).
9. **Draft discard undo snackbar** (soft-delete) - I did the confirm; the undo is heavier.

### Blocked on YOUR accounts (Phase 4-6)

| Item | Needs | Ready to run |
|---|---|---|
| Deploy to a dev channel | A Firebase project + `firebase login` on your side, or CI token | `firebase hosting:channel:deploy development` |
| Capacitor wrapper (iOS locked-screen timer alerts = the category loop) | Apple Developer + Google Play accounts | code scaffold + native notification/haptic plugins |
| Stripe lifetime checkout -> `pro:true` claim | Stripe account + keys | webhook Cloud Function + claim gate on Garmin/Strava/analytics |
| Store listings | Both store accounts | ASO copy + screenshots from the new visual system |
| Benchmark scorecard vs competitors | Physical phones + paid competitor installs | protocol in the plan (12 metrics) |

---

## How to run the clone locally

```bash
git checkout liftlogic-pro
npm install
npm test          # 29 pass
npm run dev       # boots; Firebase features need a .env (see below)
```

To exercise the authed screens (active workout, history), create a `.env` with a **separate** Firebase project's keys (never the production `lift-logic-app`):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

---

## Decisions still open for you (from the build plan)

D1 name/brand, D2 clone-vs-v2 relationship, D3 keep Garmin (recommend yes - it's the moat), D4 pricing (recommend $39-49 lifetime), D5 Capacitor (recommend yes - the iOS timer loop), D6 trim level.
