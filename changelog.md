# What's New in LiftLogic 🚀

**Strava Cardio Integration & Two-Way Sync 🏃**
*   **Two-Way Cardio Sync:** LiftLogic now connects directly to the Strava API. Completed weightlifting sessions are automatically pushed to Strava as `WeightTraining` activities with comprehensive set breakdowns. 
*   **External Activity Fetching:** Sync and download all of your cardio activities (Runs, Rides, Swims, Hikes, etc.). Pulls your active history on connect, with support for manual sync and full history imports (up to 1,000 past activities).
*   **Cardio Distance Preferences:** Canadians rejoice! Added a distinct Cardio Distance Unit setting (`mi` vs `km`) in the Strava Connections panel. Heatmap calendar tooltips dynamically convert run distances to kilometers if `km` is selected.
*   **Lifetime Cardio Stats:** If Strava is connected, a dedicated **Strava Cardio Stats** section appears in your Lifetime Stats card, aggregating your Total Runs and total cardio distance in your preferred unit.

**Custom Routine Day Coloring 🎨**
*   **Interactive Color Picker:** You are no longer locked into hardcoded color sequences! Access the Routine Editor, click "Edit Routine," and use the inline HTML5 color pickers to customize the color of each workout day/session.
*   **Visual Badging:** A clean 15x15px rounded square (matching the calendar heatmap style) displays next to each session name, aligned neatly to the text baseline.
*   **Dynamic Calendar Resolution:** Repairing your calendar index automatically compiles your program's custom day colors and maps them retroactively onto your past logged history.

**Heatmap Calendar Upgrades & Polish 🧹**
*   **Cardio-Only Triangle Cells:** External cardio days are represented as a clean, transparent top-left split cell showing only a bottom-right Strava Orange triangle. Combined workout + cardio days split dynamically using the day's custom color and Strava Orange.
*   **Borders Bleed Fix:** Removed transparent borders on calendar cells, replacing them with inset outlines to prevent hardware-accelerated linear-gradient bleeding.
*   **Dynamic Routine Legend:** The calendar legend now displays the actual names of your session days (e.g. Push, Pull, Legs) in their respective colors rather than generic explanation boxes.
*   **Edge-Checking Tooltips:** Tooltips now dynamically shift to the left of the cursor if they are opened in the right half of the screen, preventing them from clipping past the screen boundary.

**Profile Settings Restructuring ⚙️**
*   **Connections Panel:** Split the profile page into separate, focused cards: Account details, Settings, and Connections (Garmin & Strava). 
*   **Collapsible settings:** Collapsed all Strava sync controls, sync buttons, and preferences inside a clean, collapsible `Manage ⚙️` panel to keep the UI clean.
*   **Original Theme Button Contrast:** Fixed the contrast of secondary buttons on white card backgrounds in the original theme (e.g. the "Hide" and "Full Sync" buttons now have readable dark text instead of white-on-white).

**Volume Trend Chart & Resting Screen Timer 📊**
*   **Volume Aggregation:** Added support for weekly and monthly aggregation in the Volume Trend chart to view long-term progress.
*   **Overall Resting Timer:** Added the overall elapsed workout timer to the rest screen to track total session duration.

**Stats & UI Refinements 📈**
*   **Stats Renaming:** Renamed Personal Records (PRs) to "Overloads Triggered" and added a "Heaviest Lift" tracker to the statistics card.

---

**Smoother Loading 🌊**
*   **Skeleton Screens:** Say goodbye to "Loading..." text and jumping content. The dashboard now loads with a smooth, shimmering skeleton UI that perfectly matches the layout. It feels native and instant.
*   **Theme Aware:** Whether you rock Dark Mode or the Original styling, the skeletons adapt to match your cards perfectly. No jagged edges.

**Active Workout Polish ✨**
*   **Refactored Core:** We completely rebuilt the Active Workout engine under the hood. It’s cleaner, faster, and more robust.
*   **Visual Fixes:** Restored the crisp blue timer, correct timeline dot colors (Green/Yellow/Blue), and proper font sizes after the rebuild.
*   **Safety First:** If you accidentally navigate away, your draft is waiting for you with a much nicer prompt.

---


**Failure Mode & Supersets**
*   **Smarter "To Failure" Targets:** The "Get Ready" screen now clearly spells out the plan (e.g., "3 sets of 45 lbs to failure").
*   **Superset Failure Support:** We can now track failure properly even when you're super-setting. Whether you fail the first or second exercise, the app handles the inputs correctly.
*   **Rep Capture:** "To Failure" sets now always ask for your rep count, even if you mark them as "Done". Gotta track those PRs!

**Context is King 👑**
*   **"Last Performed" Stats:** Active workout cards now show you exactly what you did last time (e.g., "*Last: 45 lbs x 10*"). This pops up automatically for "To Failure" sets or if you failed the set last session. Now you know exactly what number to beat.

**Fixes & Polish 🧹**
*   **Emoji Rescue Mission:** Fixed an issue where emojis (🔗, ✏️, 🏅) and icons were showing up as "weird characters". They look crisp again.
*   **Stability:** Squashed a nasty "Unexpected token" bug that was crashing the active workout view.
*   **VisualTweak:** Fixed the superset indentation arrow `↳` so your lists look clean.

Time to lift! 💪
