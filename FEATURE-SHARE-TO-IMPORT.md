# Feature: Share to LiftLogic (video -> workout selection list)

**Status:** entry point built (manifest share_target); staging UI + analysis backend planned below.
**Why it matters:** this is the "get an AI to help you import your favorite routine" promise on the landing page, and no competitor (Hevy/Strong/Fitbod/Boostcamp) does share-a-video-to-app well. It is a real differentiator and a viral loop (creators' videos become routines in your app).

---

## User flow

1. User watches a workout on YouTube / Instagram / TikTok.
2. Taps the native **Share** button, picks **LiftLogic**.
3. LiftLogic opens on a capture screen, shows the video is being analyzed.
4. It extracts a structured workout (routine name + exercises with sets/reps/notes) from the transcript / caption / description.
5. Extracted exercises land in a persistent **Selection List** (a staging basket). The user can keep sharing more videos; items accumulate.
6. From the Selection List the user reviews/edits, multi-selects, and taps **Add to routine** -> pick a new or existing routine/day.

---

## Architecture

### A. Entry points (how LiftLogic gets into the share sheet)

| Platform | Mechanism | Status |
|---|---|---|
| Android + installed PWA | Web Share Target API via manifest `share_target` (action `/import/share`, GET, params title/text/url) | **BUILT** (vite.config.ts) |
| Desktop | Same PWA share target where supported; plus a paste-a-link box on the import screen | planned (paste box) |
| iOS | Web Share Target is NOT supported by iOS Safari PWAs -> requires a native **Share Extension** in the Capacitor wrapper (Phase 4) | wrapper-gated |

The shared payload is usually just a URL (in `text` or `url`). We read both.

### B. Analysis backend (the AI part) - credential-gated

Browsers cannot fetch third-party transcripts (CORS), so this runs server-side:

```
Cloud Function: analyzeSharedWorkout({ url, text })
  1. Identify source (youtube | instagram | tiktok | other) from the URL.
  2. Fetch transcript / caption / description server-side:
     - YouTube: timedtext / captions (or a transcript service).
     - IG / TikTok: oEmbed + caption; video ASR if no caption.
  3. Call Claude (claude-sonnet-5) with a strict extraction prompt ->
     structured JSON: { routineName?, sourceUrl, exercises: [
       { name, sets, minReps, maxReps, notes, confidence } ] }.
  4. Return to client; client stages it in the Selection List.
```

Needs: a Cloud Function deploy + `ANTHROPIC_API_KEY` (server secret) + transcript access. Contract is fixed above so the client can be built against it now, with a local heuristic fallback (parse obvious "3x10 Bench Press" patterns from shared text) so the flow is demoable without the key.

### C. Selection List (staging basket) - buildable now, design-led

- **Persistence:** `users/{uid}/importStaging/{itemId}` in Firestore, so the basket survives the share-open (which is a fresh app launch) and accumulates across multiple shares.
- **Item shape:**
  ```
  { id, sourceUrl, sourceType, routineName?, createdAt,
    exercises: [{ name, sets, minReps, maxReps, notes, selected }],
    status: 'analyzing' | 'ready' | 'error' }
  ```
- **UI (new surface `/import`):** list of staged imports; each expands to editable exercises with select checkboxes; bulk "Add selected to routine"; empty state that explains how to share from a video.
- Reuses the existing exercise/day model (`ExerciseConfig`) and routine-write paths, so "Add to routine" is a thin adapter over current Routines logic.

### D. Add-to-routine

- Target picker: **New routine**, **New day in existing routine**, or **Append to existing day**.
- Maps each selected staged exercise -> `ExerciseConfig` (name, targetSets=sets, minReps, maxReps, sensible default weightIncrement/repOverloadStep), writes via the existing program update path.

---

## Build order

1. **[DONE]** Manifest `share_target` -> `/import/share`.
2. **[S]** Route `/import/share` (capture) + `/import` (selection list). Capture reads url/text, creates a staging item with status `analyzing`, hands off to the analyzer, redirects to `/import`.
3. **[M]** `useWorkoutImport` composable: staging CRUD in Firestore + local heuristic analyzer fallback.
4. **[M, design-led]** Selection List view styled to the design system (once the design panel lands so it matches).
5. **[M]** Add-to-routine adapter + target picker.
6. **[L, credential-gated]** `analyzeSharedWorkout` Cloud Function + Claude extraction + transcript fetching.
7. **[wrapper-gated]** iOS native share extension (Capacitor, Phase 4).

Quickest visible win: steps 2-5 give a working "paste a link or share -> review -> add to routine" flow using the heuristic fallback, fully demoable in the emulator, before the LLM backend exists.

---

## Notes / decisions for Jonny

- This supersedes the current static "Import Routine" card (FitNotes/JSON) by adding the video path; keep both under one Import hub.
- The LLM cost per import is a few cents; gate heavy use behind Pro if needed.
- Transcript access for IG/TikTok is the riskiest dependency (no official caption API); YouTube is reliable. Ship YouTube first.
