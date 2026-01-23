<template>
  <div class="version-history-view">
    <div class="header-section">
      <h1 class="page-title">The Evolution of <span class="brand-lift">LIFT</span> <span class="brand-logic">LOGIC</span></h1>
      <p class="subtitle">From Chalk Dust to Cloud Storage</p>
    </div>

    <div class="timeline-container">
      
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
                <p><strong>The Google Murder:</strong> Tragically killed by Google's automated systems because a "Password" input field was placed too close to a "Sign In" button. RIP.</p>
            </div>
        </div>
      </div>

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
                    <span class="log-date">Jan 23, 2026</span>
                    <h4>Styling & Polish Hotfix</h4>
                    <p>Restored the classic blue/green visual identity to the Active Workout timers and dots. Fixed font sizes and layout issues across the board.</p>
                </div>

                <div class="log-entry">
                    <span class="log-date">Jan 20, 2026</span>
                    <h4>Super Support for Supersets</h4>
                    <p>A massive update affecting every part of the app. You can now link exercises (Master/Slave), share timers, and visualize connections in the timeline.</p>
                </div>

                <div class="log-entry">
                    <span class="log-date">Jan 16, 2026</span>
                    <h4>Lift Logic v2.0: The "It Actually Works Now" Update</h4>
                    <p>A comprehensive overhaul moving from "Science Experiment" to "Real Product".</p>
                    <ul class="feature-list">
                        <li><strong>Multiple Routines:</strong> Create distinct programs (Bulk, Cut, Focus) and switch instantly while syncing progress across shared exercises.</li>
                        <li><strong>Smart Workouts:</strong> Resume state saved automatically. Live edit weights during sets. "Fix It Later" editing for completed workouts.</li>
                        <li><strong>Routine Management:</strong> Drag-and-drop reordering, AI-assisted creation, and smarter logic (0 lbs allowed!).</li>
                        <li><strong>Fresh Look:</strong> Montserrat typography, modern icons, and a refined "Progress" dashboard.</li>
                        <li><strong>Customization:</strong> Dark Mode default, custom timer sounds (Robot!), and Lbs/Kg support.</li>
                        <li><strong>Performance:</strong> Faster loading, robust database, and offline PWA support.</li>
                    </ul>
                </div>
            </div>
        </div>
      </div>
    </div>
    
    <div class="back-action">
        <router-link to="/profile" class="button-secondary">Back to Profile</router-link>
    </div>

  </div>
</template>

<script setup lang="ts">
// No logic needed, purely presentational
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
</style>
