# LiftLogic PRO - Handoff for Review
**Branch:** `liftlogic-pro` (42 commits ahead of your `main`) · 80 unit tests (was 0) · type-check + build clean · nothing in your repo or Firebase project was touched (we never held credentials; verify: zero pushes, zero IAM changes)

## How to run
```bash
git checkout liftlogic-pro
npm install
npm test                                   # 80 pass
firebase emulators:start --only auth,firestore --project demo-liftlogic
npm run dev                                # .env.local ships demo keys -> emulator only
```
Sign up with any fake email. `VITE_USE_EMULATOR=true` gates all emulator wiring - production behavior is unchanged without it.

## Changes, succinct (ranked by importance)

### Correctness (engine + data)
1. **Progression engine extracted + tested** (`src/utils/progression.ts`, 24 tests). Fixes: #56 to-failure can now fail honestly; skips no longer count as failures (new `skipped` status); no weight increment unless lifted at/above prescription.
2. **Workout-loss bug fixed**: first-ever session save aborted the whole batch (`batch.update` on missing progress doc) - now `set(merge)`; calendar index written only after commit (no phantom days).
3. **Exercise-identity fix**: one slash-safe `getProgressKey()` replaces 16 copy-pasted key formulas - names with `/` (e.g. "Dumbbell Lat Pulldown / Band") produced invalid Firestore paths and broke session prep.
4. **kg users**: edit modals + history editor + share card now round-trip through display units (were silently writing/showing lbs-scale numbers).
5. **Rest timer rebuilt**: wall-clock anchored (survives lock/background), stop-and-wait at zero (no more wiping rep input), tone + vibration + notification, +30s/-15s.
6. **FAIL can record partial reps**; to-failure sets capture real AMRAP counts at log time - never double-asked.

### The differentiator
7. **Readiness verdict** (`readiness.ts` + signals + deload detection, all pure + tested): fuses rest gap, week progress, real fail rate, volume trend and stalled-lift streaks into one score + plain-language call (push / hold / recover; "Deload due" names the stalled lifts). "Show the work" expands the factors. Zero wearable, zero cloud, fully explainable.
8. **Streak with forgiveness**: one missed week is auto-covered by a rest pass banked by the prior met week (cap 1); "Rest pass ready" chip; week strip ends in a verdict ("2 of 2 - target met").
9. **PR beat** (`prDetection.ts`, Epley e1RM, tested): fires at the DONE that earns it; first-ever sets never count. The app's single celebration.

### Design system + UX (full program)
10. **Dark-first token system** (surfaces/text/accent/status/type/radius/motion), 15 base components, bottom tab bar, all views migrated. Default theme is now dark ('original' remains opt-in - it was hiding the redesign).
11. **Signature instrument language**: readiness gauge with graduated ticks + luminous endpoint + recessed readout + once-daily ignition sweep; rest ring in the same family; hero weight is a 112px display numeral that tweens between sets; staggered list entrances; per-action haptic vocabulary.
12. **Movement preview**: per-exercise Preview buttons in the pre-workout plan (plus in-set), retokenized demo modal with loading state.
13. **Completion seal**: Total Volume count-up hero + duration/sets/PR chips + calm confirm copy.
14. **Share card rebuilt**: dark instrument, volume hero, PR ribbon, kg-correct, font-load guard - and removed the hardcoded `lift-logic-app.web.app` URL (your prod URL was baked into a fork's share cards).
15. **Share-to-import**: PWA share-target + paste box -> parses "Bench 3x8-12"-style text into a staged selection list -> add to any routine (transaction-safe, XSS-guarded). LLM transcript analysis is spec'd, gated on an API key.
16. **A11y**: rest-timer screen-reader flood fixed (milestone announcements only), spoken set flow, 44px floors, reduced-motion contract.
17. **Perf**: entry chunk 776KB -> 24KB (vendor split; chart.js defers to the analytics drawer).

## Verification
Every commit gated on type-check + tests + build. Core loop E2E'd in the Firebase emulator (adopt routine -> log 9 sets -> seal 4,200 lbs -> save -> readiness updates). UI verified by Playwright screenshots at 390px. Two external multi-agent code reviews ran; all confirmed blockers fixed (incl. a share-URL XSS and a lost-share-on-login bug).

## Known gaps (honest)
- Google sign-in needs a real Firebase project (emulator build uses fake-picker/email).
- Gated on accounts/wrapper: LLM import analysis, payments/entitlements, native haptics + iOS share extension, store builds.
- Design docs in repo root: `LIFTLOGIC-STEPCHANGE-MASTERPLAN-*.md` (46-move roadmap), `LIFTLOGIC-PRO-BUILD-STATUS.md`, `FEATURE-SHARE-TO-IMPORT.md`.

Nothing merges into your app except what you choose to take - cherry-pick freely; the correctness fixes (items 1-6) stand alone if you want only those.
