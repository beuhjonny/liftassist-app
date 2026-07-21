<template>
  <div class="version-history-view">
    <div class="header-section">
      <h1 class="page-title">The Evolution of <span class="brand-lift">LIFT</span> <span class="brand-logic">LOGIC</span></h1>
      <p class="subtitle">From Chalk Dust to Cloud Storage</p>
    </div>

    <div class="timeline-container">
      
      <!-- Lift Logic -->
      <div class="timeline-item modern-era">
         <div class="timeline-marker">🚀</div>
        <div class="timeline-content card active-era">
             <div class="era-header">
                <h2>Lift Logic</h2>
                <span class="era-date">Jan 16, 2026 - Present</span>
            </div>
            <p><strong>The Antigravity Era.</strong></p>
            <p>
                Rising from the ashes of Lift Assist and powered by <strong>Antigravity</strong>, the app has evolved into a fast, offline-capable Progressive Web App (PWA) with rapid feature development.
            </p>
            
            <div class="feature-log">
                <h3>Change Log</h3>

                <div class="log-entry">
                    <span class="log-date">Jul 21, 2026</span>
                    <h4>Active Workout Suite, Cardio Dashboard & UI Refinements</h4>
                    <p>A comprehensive update introducing Skip Whole Exercise controls, superset next-up tracking, cardio homepage integration, Strava web linking, and UI polish across the app:</p>
                    <ul class="feature-list">
                         <li><strong>Skip Whole Exercise:</strong> Added a <code>⏭️ Skip Exercise</code> button and confirmation modal to quickly log remaining sets as 0 reps and advance to the next exercise or workout summary. Tapping outside the modal dismisses it smoothly.</li>
                         <li><strong>Superset Next-Up Tracking:</strong> Fixed superset progression prediction on rest screens to accurately display interleaved superset moves (e.g. Wrist Extension → Face Pull Set 2).</li>
                         <li><strong>Timeline Bubble Bar Details:</strong> Tapping or hovering over any timeline progress dot now displays full target weight, prescribed reps, and set numbers in popovers.</li>
                         <li><strong>Cardio Dashboard Option:</strong> Added a "Show Cardio on Homepage" setting toggle and consolidated cardio tracking into a single reusable component with distance unit support (miles / km).</li>
                         <li><strong>Strava Web Link Integration:</strong> Automatically appends the live web app URL (<code>https://lift-logic-app.web.app</code>) to all workout descriptions uploaded to Strava.</li>
                         <li><strong>Auto-Progression Inline Guidance:</strong> Added inline 💡 guidance popovers inside exercise configuration boxes explaining min/max reps, rep overload increments, and weight steps without obscuring inputs.</li>
                         <li><strong>Vector SVG Trash Icons:</strong> Upgraded legacy OS wire basket emojis to crisp vector SVG trash icons across all delete action buttons.</li>
                         <li><strong>Rest Screen & Header Polish:</strong> Simplified "Skip Rest" button text, right-aligned set action icons, and restyled "Correct Last Set" into a subtle <code>↩ Undo Set</code> pill button.</li>
                    </ul>
                </div>

                <div class="log-entry">
                    <span class="log-date">Jul 21, 2026</span>
                    <h4>Routine Bank Library, AI Prompting & App Modals Update</h4>
                    <p>A major quality-of-life update focused on routine creation, app customization, and seamless user experience:</p>
                    <ul class="feature-list">
                         <li><strong>Routine Preset Library (24 Routines):</strong> Browse and adopt 24 popular training routines grouped by split type and equipment availability with Light/Medium/Heavy starting weight presets.</li>
                         <li><strong>Streamlined AI Setup:</strong> Integrated 3-step and 4-step inline guides for designing routines or converting workout notes using any AI assistant with copyable JSON transformation prompts.</li>
                         <li><strong>Units Preferences:</strong> Replaced single weight setting with dual independent toggles for Weight (lbs / kg) and Distance (miles / km).</li>
                         <li><strong>Garmin Link & Tooltips:</strong> Added a collapsible Connections card and Garmin Watch Sync tooltip with direct links to the Garmin Connect IQ app store.</li>
                         <li><strong>Custom App Modals:</strong> Replaced system chrome alert popups with native-styled, backdrop-dismissible app info modals.</li>
                    </ul>
                </div>

                <div class="log-entry">
                    <span class="log-date">Jul 20, 2026</span>
                    <h4>The Cardio, Sharing & FitNotes Expansion</h4>
                    <p>A massive update featuring FitNotes import/export, workout share cards, cardio tracking, analytics overhauls, and per-routine timers:</p>
                    <ul class="feature-list">
                         <li><strong>FitNotes Import & Export:</strong> Full data portability with 1-click `.fitnotes` SQLite database import and JSON/FitNotes backup exports.</li>
                         <li><strong>Workout Sharing:</strong> Export sessions as 1080x1350 JPEG story cards or share instant web links for public viewing.</li>
                         <li><strong>Cardio & Strava Suite:</strong> Log manual cardio, sync all endurance activity types, and auto-push sessions to Strava.</li>
                         <li><strong>Analytics Overhaul:</strong> Added weekly muscle volume bar charts, custom muscle group mapping overrides, and 1RM progress spline charts in an expandable drawer.</li>
                         <li><strong>Per-Routine Rest Timers:</strong> Moved default rest timers from global user settings into individual routine settings.</li>
                         <li><strong>Exercise Video Demos:</strong> Instant video demo popups and form tips with a setting toggle to disable them.</li>
                         <li><strong>History & Calendar Upgrades:</strong> Edit historical workout logs retroactively and view side-by-side vertical splits for multi-lift days.</li>
                    </ul>
                </div>

                <div class="log-entry">
                    <span class="log-date">Jun 14, 2026</span>
                    <h4>The "New Laptop" Expansion & Strava Sync</h4>
                    <p>A massive update containing all features shipped since transitioning to the new laptop. Focused on Strava integration, custom routine colors, UI enhancements, and improved analytics:</p>
                    <ul class="feature-list">
                         <li><strong>Strava Two-Way Sync:</strong> Completed weightlifting sessions are automatically pushed to Strava as WeightTraining activities with comprehensive set breakdowns, while external cardio activities (runs, rides, etc.) are pulled in.</li>
                         <li><strong>Cardio Distance Settings & Stats:</strong> Added a cardio distance unit preference (miles vs km). Tooltips convert runs dynamically, and connected users see a dedicated cardio stats card (Total Runs & Lifetime Distance) in their profile.</li>
                         <li><strong>Custom Session Colors:</strong> Routine editors now feature inline color pickers for customized session colors, which automatically propagate to the calendar heatmap and legends.</li>
                         <li><strong>Heatmap Calendar Polish:</strong> Cardio-only days render with a clean bottom-right orange triangle. Inset outlines replace standard borders to prevent gradient bleeding, and tooltips auto-shift to avoid viewport clipping.</li>
                         <li><strong>Volume Trend Aggregation:</strong> Added weekly and monthly aggregation options in the volume trend chart for better long-term progress tracking.</li>
                         <li><strong>Rest Screen Overall Timer:</strong> The active workout resting screen now displays the overall workout elapsed timer alongside the rest countdown.</li>
                         <li><strong>UI Restructuring & Theme Fixes:</strong> Reorganized profile settings into separate Account, Settings, Connections, and Stats cards with collapsible menus, and fixed secondary button text contrast in the 'Original' theme.</li>
                         <li><strong>Stats Refinement:</strong> Renamed PRs to "Overloads Triggered" and added a "Heaviest Lift" tracker.</li>
                    </ul>
                </div>

                <div class="log-entry">
                    <span class="log-date">Jan 23, 2026</span>
                    <h4>The "Antigravity" Speed Run</h4>
                    <p>A massive day of shipping features:</p>
                    <ul class="feature-list">
                         <li><strong>Offline Mode (PWA):</strong> The app now works without an internet connection, syncing data when you go back online.</li>
                         <li><strong>Skeleton Loading:</strong> Smoother loading states with shimmering skeletons instead of jumping content.</li>
                         <li><strong>Styling Polish:</strong> Restored the classic visual identity and fixed layout issues across the board.</li>
                    </ul>
                </div>

                <div class="log-entry">
                    <span class="log-date">Jan 22, 2026</span>
                    <h4>"To Failure" Mode</h4>
                    <p>Major update for intensity tracking. You can now mark sets as "To Failure" instead of a specific rep target. Includes "Get Ready" screen updates and rep capture logic.</p>
                </div>

                <div class="log-entry">
                    <span class="log-date">Jan 20, 2026</span>
                    <h4>Super Support for Supersets</h4>
                    <p>A massive update affecting every part of the app. You can now link exercises (Linked Exercises), share timers, and visualize connections in the timeline.</p>
                </div>

                <div class="log-entry">
                     <span class="log-date">Jan 18, 2026</span>
                    <h4>Embiggened Buttons</h4>
                    <p>Added collection settings for larger, easier-to-hit buttons during heavy sets.</p>
                </div>

                <div class="log-entry">
                    <span class="log-date">Jan 16, 2026</span>
                    <h4>Lift Logic v2.0: The "It Actually Works Now" Update</h4>
                    <p>A comprehensive overhaul moving from "Science Experiment" to "Real Product".</p>
                    <ul class="feature-list">
                         <li><strong>Multiple Routines:</strong> Create distinct programs (Bulk, Cut, Focus) and switch instantly while syncing progress.</li>
                         <li><strong>Smart Workouts:</strong> Resume state saved automatically. Live edit weights during sets. "Fix It Later" editing.</li>
                         <li><strong>Routine Management:</strong> Drag-and-drop reordering, AI-assisted creation.</li>
                         <li><strong>Fresh Look:</strong> Montserrat typography, modern icons, and a refined "Progress" dashboard.</li>
                         <li><strong>Customization:</strong> Dark Mode default, custom timer sounds (Robot!), and Lbs/Kg support.</li>
                    </ul>
                </div>
            </div>
        </div>
      </div>

      <!-- Lift Assist -->
      <div class="timeline-item prototype-era">
         <div class="timeline-marker">🤖</div>
        <div class="timeline-content card">
             <div class="era-header">
                <h2>Lift Assist (The First Web App)</h2>
                <span class="era-date">June 2025 - Jan 2026</span>
            </div>
            <p><strong>Built with Gemini & Copy-Paste.</strong></p>
            <p>
                The first true web app, hand-assembled entirely by pasting code from Gemini. It featured a Routine Editor, Active Workout Mode, and comprehensive History, all while maintaining the core double progression logic.
                It was powerful, usable, and mostly stable.
            </p>
            <div class="death-notice">
                <span class="skull">💀</span>
                <p><strong>The Bot Murder:</strong> Tragically killed by AI automated systems because a "Password" input field was placed too close to a "Sign In" button. AI brought it in and AI took it out. RIP.</p>
            </div>
        </div>
      </div>

      <!-- The Spreadsheet Era -->
      <div class="timeline-item sheets-era">
        <div class="timeline-marker">📊</div>
        <div class="timeline-content card">
             <div class="era-header">
                <h2>The Prototype</h2>
                <span class="era-date">Feb 11, 2025 - May 28, 2025</span>
            </div>
            <p><strong>Google Sheets + ActionScript.</strong></p>
            <p>
                The first step into automation. This era introduced the core <strong>Auto-Double Progression</strong> logic, a "Fail" button, and finally, a built-in timer.
            </p>
            <p>
                It had simple buttons, and it worked! This proof of concept version drove many workouts and lots of gains. But it wasn't great on mobile, and the UX was barebones at best.
            </p>
            <button @click="openImageModal('/prototype-spreadsheet.png', 'The original LiftAssist prototype built using Google Sheets and Google Apps Script.')" class="button-pic">
              📷 View Original Spreadsheet
            </button>
        </div>
      </div>

      <!-- The Stone Age -->
      <div class="timeline-item stone-age">
        <div class="timeline-marker">🪨</div>
        <div class="timeline-content card">
            <div class="era-header">
                <h2>The Stone Age</h2>
                <span class="era-date">Pre-2025</span>
            </div>
            <p><strong>The Chalk Board.</strong></p>
            <p>
                Before the algorithms, there was just dust and friction. Double progression was manual—erasing yesterday's numbers and rewriting today's targets. 
                It was effective, primitive, and honest. But it was missing a timer.
            </p>
            <button @click="openImageModal('/stone-age-chalkboard.jpg', 'The original LiftLogic workout routine, handwritten on the chalkboard.')" class="button-pic">
              📷 View Original Chalkboard
            </button>
        </div>
      </div>

    </div>
    
    <div class="back-action">
        <button @click="$router.back()" class="button-secondary">Close</button>
    </div>

    <!-- History Picture Modal -->
    <div v-if="modalImage" class="image-modal-overlay" @click="closeImageModal">
      <div class="image-modal-content" @click.stop>
        <button class="image-modal-close" @click="closeImageModal">&times;</button>
        <img :src="modalImage" alt="LiftLogic History Picture" class="chalkboard-img" />
        <p v-if="modalCaption" class="image-modal-caption">{{ modalCaption }}</p>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useChangelog } from '../utils/changelog';

const { markAsRead } = useChangelog();

onMounted(() => {
  markAsRead();
});

const modalImage = ref<string | null>(null);
const modalCaption = ref<string | null>(null);

const openImageModal = (imagePath: string, caption: string) => {
  modalImage.value = imagePath;
  modalCaption.value = caption;
};

const closeImageModal = () => {
  modalImage.value = null;
  modalCaption.value = null;
};
</script>

<style scoped>
.version-history-view {
  padding: 20px 10px;
  max-width: 700px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;
}

.header-section {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  font-size: 2em;
  color: var(--color-heading);
  margin-bottom: 5px;
  font-family: 'Montserrat', sans-serif;
}

.brand-lift { font-weight: 900; }
.brand-logic { font-weight: 400; }

.subtitle {
  color: var(--color-text);
  opacity: 0.7;
  font-style: italic;
  font-size: 1.1em;
}

/* Timeline Styles */
.timeline-container {
  position: relative;
  border-left: 3px solid var(--color-border);
  margin-left: 20px;
  padding-left: 30px;
  padding-bottom: 20px;
}

.timeline-item {
  position: relative;
  margin-bottom: 40px;
}

.timeline-marker {
  position: absolute;
  left: -46px; /* 30px padding + 3px border + half icon width */
  top: 0;
  width: 32px;
  height: 32px;
  background-color: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2em;
  z-index: 1;
}

.card {
  background-color: var(--color-card-bg);
  padding: 20px 25px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  border: 1px solid var(--color-card-border);
  color: var(--color-card-text);
}

.active-era {
    border: 2px solid var(--color-primary, #007bff);
    position: relative;
}
.active-era::after {
    content: "CURRENT";
    position: absolute;
    top: -10px;
    right: 15px;
    background-color: var(--color-primary, #007bff);
    color: white;
    font-size: 0.7em;
    font-weight: bold;
    padding: 2px 8px;
    border-radius: 10px;
}

.era-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 15px;
    border-bottom: 1px solid var(--color-card-border);
    padding-bottom: 10px;
    flex-wrap: wrap;
    gap: 5px;
}

.era-header h2 {
    margin: 0;
    font-size: 1.4em;
    color: var(--color-card-heading);
}

.era-date {
    font-size: 0.85em;
    opacity: 0.7;
    font-weight: 500;
}

.timeline-content p {
    line-height: 1.6;
    margin-bottom: 15px;
}

/* Death Notice */
.death-notice {
    background-color: rgba(220, 53, 69, 0.1);
    border-left: 4px solid #dc3545;
    padding: 15px;
    margin-top: 15px;
    border-radius: 4px;
    display: flex;
    gap: 15px;
    align-items: flex-start;
}
.skull { font-size: 1.5em; }
.death-notice p { margin: 0; font-size: 0.95em; color: var(--color-card-text); }

/* Feature Log */
.feature-log {
    margin-top: 30px;
    background-color: var(--color-card-mute);
    padding: 15px;
    border-radius: 8px;
}

.feature-log h3 {
    margin-top: 0;
    font-size: 1.1em;
    color: var(--color-card-heading);
    margin-bottom: 15px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.log-entry {
    margin-bottom: 15px;
    padding-bottom: 15px;
    border-bottom: 1px dashed var(--color-card-border);
}
.log-entry:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }

.log-date {
    display: inline-block;
    font-size: 0.75em;
    text-transform: uppercase;
    font-weight: bold;
    color: var(--color-primary, #007bff);
    margin-bottom: 4px;
    background-color: rgba(0, 123, 255, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
}

.log-entry h4 {
    margin: 0 0 5px 0;
    font-size: 1em;
    color: var(--color-card-heading);
}

.log-entry p {
    margin: 0;
    font-size: 0.9em;
    opacity: 0.85;
}

.feature-list {
    margin-top: 8px;
    padding-left: 20px;
    margin-bottom: 0;
}
.feature-list li {
    font-size: 0.9em;
    margin-bottom: 6px;
    color: var(--color-card-text);
}
.feature-list strong {
    color: var(--color-card-heading);
}

.back-action {
    text-align: center;
    margin-top: 30px;
}
.button-secondary {
    display: inline-block;
    padding: 10px 20px;
    background-color: var(--color-secondary, #6c757d);
    color: white;
    text-decoration: none;
    border-radius: 4px;
    font-weight: 500;
}

/* Image Modal Styles */
.image-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

.image-modal-content {
  position: relative;
  background-color: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  padding: 15px;
  border-radius: 12px;
  max-width: 90%;
  max-height: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  animation: scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.image-modal-close {
  position: absolute;
  top: 10px;
  right: 15px;
  background: none;
  border: none;
  color: var(--color-card-heading);
  font-size: 2rem;
  cursor: pointer;
  line-height: 1;
  transition: transform 0.2s, color 0.2s;
}

.image-modal-close:hover {
  transform: scale(1.1);
  color: var(--color-primary);
}

.chalkboard-img {
  max-width: 100%;
  max-height: 70vh;
  border-radius: 8px;
  object-fit: contain;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.image-modal-caption {
  margin-top: 12px;
  font-size: 0.95em;
  color: var(--color-card-text);
  opacity: 0.9;
  text-align: center;
  font-style: italic;
}

.button-pic {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background-color: var(--color-primary, #007bff);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9em;
  font-weight: 600;
  cursor: pointer;
  margin-top: 10px;
  transition: transform 0.1s ease, background-color 0.2s;
}

.button-pic:hover {
  background-color: var(--color-primary-hover, #0056b3);
  transform: translateY(-1px);
}

.button-pic:active {
  transform: translateY(0);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
