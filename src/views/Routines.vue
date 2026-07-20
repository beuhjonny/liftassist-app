<template>
  <div class="routines-view">
    <h1>Training Routines</h1>

    <!-- Loading / Error -->
    <div v-if="isLoading" class="loading-message card">
      <p>Loading routine...</p>
    </div>
    <div v-if="error && !isLoading" class="error-message card" style="position: relative;">
      <button @click="error = null" class="modal-close-button" style="top: 5px; right: 10px; font-size: 1.2em;">&times;</button>
      <p>Error: {{ error }}</p>
    </div>

    <!-- Creation Choices (Active ID null) -->
    <div v-if="!activeProgram.id && !isLoading && user" class="create-routine-section">
      <div v-if="!creationMode" class="creation-choice-phase card">
        <h2>How would you like to start?</h2>
        <p class="choice-subtitle">Choose the method that works best for your training style.</p>
        
        <div class="choice-grid">
          <button @click="quickStartManualRoutine" class="choice-card manual-choice">
            <div class="choice-icon">✍️</div>
            <div class="choice-content">
              <h3>Create Manually</h3>
              <p>Build your routine from scratch, exercise by exercise.</p>
            </div>
            <div class="choice-arrow">→</div>
          </button>

          <button @click="creationMode = 'ai'" class="choice-card ai-choice">
            <div class="choice-icon">✨</div>
            <div class="choice-content">
              <h3>AI Assisted</h3>
              <p>Import from notes, screenshots, or let AI design a plan for you.</p>
            </div>
            <div class="choice-arrow">→</div>
          </button>
        </div>

        <div class="secondary-choice-actions" style="margin-top: 30px; border-top: 1px solid var(--color-card-border); padding-top: 20px; display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
            <button @click="creationMode = 'fitnotes'" class="button-secondary small" style="display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 6px; border: 1px solid var(--color-card-border); background: var(--color-card-mute); color: var(--color-card-text); cursor: pointer; font-size: 0.9em; font-weight: 500;">
                📋 Import from FitNotes (.fitnotes)
            </button>
            <button 
              @click="loadJonnyPPL" 
              class="button-secondary small" 
              style="display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 6px; border: 1px solid var(--color-card-border); background: var(--color-card-mute); color: var(--color-card-text); cursor: pointer; font-size: 0.9em; font-weight: 500;" 
              title="Use a default Push/Pull/Leg routine you can customize. If you have dumbbells, elastics, and a bench, this is a good place to start."
            >
                💪 Use Default LiftLogic PPL
                <span 
                  @click.stop.prevent="showTooltipAlert('Use a default Push/Pull/Leg routine you can customize. If you have dumbbells, elastics, and a bench, this is a good place to start.')" 
                  style="font-size: 0.95em; cursor: pointer; opacity: 0.8; margin-left: 2px;"
                  title="Use a default Push/Pull/Leg routine you can customize. If you have dumbbells, elastics, and a bench, this is a good place to start."
                >💡</span>
            </button>
        </div>
      </div>


      <div v-if="creationMode === 'ai'" class="ai-creation-flow card animate-fade-in">
        <header class="flow-header" style="margin-bottom: 15px; text-align: left;">
          <button @click="creationMode = null" class="back-link" style="background: none; border: none; color: var(--color-primary); cursor: pointer; padding: 0; font-size: 0.95em; font-weight: 500;">← Back to choices</button>
          <h2 style="margin-top: 10px;">AI Assisted Setup</h2>
        </header>

        <p style="font-size: 0.95em; opacity: 0.85; margin-bottom: 25px; line-height: 1.5; text-align: left; background: var(--color-card-mute); padding: 14px 18px; border-radius: 8px; border: 1px solid var(--color-card-border);">
          The following two options use the external AI agent of your choice (such as <strong>ChatGPT</strong>, <strong>Claude</strong>, or <strong>Gemini</strong>) to create a routine for LiftLogic. Simply follow the instructions to import from any source, or create a custom plan from scratch.
        </p>

        <div class="ai-sub-options" style="text-align: left;">
          <h4 style="margin-top: 0; margin-bottom: 12px; font-weight: 600;">Step 1: Choose Method & Copy AI Prompt</h4>
          
          <div class="ai-nudge-section" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 15px; margin-bottom: 30px;">
             <button @click="toggleExistingRoutineHelp" class="ai-nudge-card" style="padding: 16px; border-radius: 8px; border: 1px solid var(--color-card-border); background: var(--color-card-bg); cursor: pointer; text-align: left; transition: all 0.2s ease; display: flex; align-items: flex-start; gap: 12px;">
               <div class="nudge-icon" style="font-size: 1.8em;">📸</div>
               <div class="nudge-text" style="display: flex; flex-direction: column; gap: 4px;">
                 <strong style="color: var(--color-card-text); font-size: 1em;">Import Existing Routine</strong>
                 <span style="font-size: 0.85em; opacity: 0.7;">Convert notes, screenshots, or text via AI prompt</span>
               </div>
             </button>

             <button @click="toggleNewRoutineHelp" class="ai-nudge-card" style="padding: 16px; border-radius: 8px; border: 1px solid var(--color-card-border); background: var(--color-card-bg); cursor: pointer; text-align: left; transition: all 0.2s ease; display: flex; align-items: flex-start; gap: 12px;">
               <div class="nudge-icon" style="font-size: 1.8em;">🤖</div>
               <div class="nudge-text" style="display: flex; flex-direction: column; gap: 4px;">
                 <strong style="color: var(--color-card-text); font-size: 1em;">Design New with AI</strong>
                 <span style="font-size: 0.85em; opacity: 0.7;">Let AI build a tailored plan based on your goals</span>
               </div>
             </button>
          </div>

          <div class="import-routine-section card-inset" style="padding: 20px; background: var(--color-card-mute); border-radius: 8px; border: 1px solid var(--color-card-border);">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="font-size: 1.2em;">📋</span>
              <h4 style="margin: 0; font-weight: 600;">Step 2: Paste Generated Routine JSON</h4>
            </div>
            <p class="small-text" style="font-size: 0.85em; opacity: 0.8; margin-bottom: 15px; line-height: 1.4;">
              Once you've copied the prompt above into ChatGPT, Claude, or Gemini and received your routine JSON code block, paste it below to build your routine.
            </p>
            <form @submit.prevent="importPastedRoutine">
              <div class="form-group" style="margin-bottom: 15px;">
                <textarea 
                  id="routineJsonData" 
                  v-model="pastedRoutineJson" 
                  rows="2" 
                  placeholder="Paste your generated routine JSON code block here..."
                  style="width: 100%; border-radius: 6px; border: 1px solid var(--color-card-border); padding: 8px 12px; font-family: monospace; font-size: 0.85em; background: var(--color-card-bg); color: var(--color-card-text); resize: vertical; min-height: 52px; max-height: 180px;"
                ></textarea>
              </div>
              <button type="submit" :disabled="isSaving || !pastedRoutineJson.trim()" class="button-primary button-large full-width" style="padding: 12px; font-weight: 600; font-size: 1em; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
                {{ isSaving ? 'Importing Routine...' : '🚀 Import Routine JSON' }}
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- FitNotes SQLite Import Flow -->
      <div v-if="creationMode === 'fitnotes'" class="fitnotes-creation-flow card animate-fade-in">
        <header class="flow-header" style="margin-bottom: 20px; text-align: left; display: flex; flex-direction: column; align-items: flex-start; gap: 5px;">
          <button @click="creationMode = null" class="back-link" style="background: none; border: none; color: var(--color-primary); cursor: pointer; padding: 0; font-size: 0.95em; display: flex; align-items: center; gap: 5px; font-weight: 500;">← Back to choices</button>
          <h2 style="margin-top: 10px; font-family: 'Montserrat', sans-serif;">FitNotes SQLite Import</h2>
        </header>

        <div class="import-routine-section card-inset" style="padding: 20px; background: var(--color-card-mute); border-radius: 8px; border: 1px solid var(--color-card-border); text-align: left;">
          <h4 style="margin-top: 0; margin-bottom: 10px; font-weight: 600;">Select FitNotes Backup File</h4>
          <p class="small-text" style="font-size: 0.85em; opacity: 0.8; margin-bottom: 20px; line-height: 1.4;">
            Select your <strong>.fitnotes</strong> or <strong>.db</strong> SQLite backup file exported from the FitNotes app settings. 
            All parsing will happen locally in your browser.
          </p>

          <div class="form-group" style="margin-bottom: 20px;">
            <input type="file" accept=".fitnotes,.db,.sqlite" @change="handleFitNotesFile" style="width: 100%; padding: 8px; border: 1px solid var(--color-card-border); border-radius: 6px; background: var(--color-card-bg); color: var(--color-card-text); font-size: 0.9em;" />
          </div>

          <div v-if="fitnotesParsedData" class="import-preview card-inset" style="margin-bottom: 20px; padding: 15px; background: var(--color-card-bg); border-radius: 6px; border: 1px solid var(--color-card-border); font-size: 0.95em;">
             <h5 style="margin-top:0; margin-bottom: 12px; font-weight: 600; border-bottom: 1px dashed var(--color-card-border); padding-bottom: 8px;">Backup Contents:</h5>
             <ul style="list-style: none; padding-left: 0; margin-bottom: 0; display: flex; flex-direction: column; gap: 8px;">
                <li style="display: flex; align-items: center; gap: 8px;">📅 <span><strong>Workout Days Logged:</strong> {{ fitnotesParsedData.workoutsCount }}</span></li>
                <li style="display: flex; align-items: center; gap: 8px;">🏋️ <span><strong>Unique Exercises:</strong> {{ fitnotesParsedData.exercisesCount }}</span></li>
                <li style="display: flex; align-items: center; gap: 8px;">📋 <span><strong>Pre-defined Routines:</strong> {{ fitnotesParsedData.routinesCount }}</span></li>
             </ul>
          </div>

          <button @click="performFitNotesImport" :disabled="isSaving || !fitnotesFile" class="button-primary button-large full-width" style="padding: 12px; font-size: 1.1em; display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: 6px; cursor: pointer; border: none; font-weight: 600; width: 100%;">
            {{ isSaving ? 'Importing... ' + importProgressStatus : '🚀 Start Import' }}
          </button>
          
          <div v-if="isSaving && importProgressPercentage > 0" style="margin-top: 15px; width: 100%; background-color: var(--color-card-border); height: 10px; border-radius: 5px; overflow: hidden;">
              <div :style="{ width: importProgressPercentage + '%' }" style="background-color: var(--color-primary); height: 100%; transition: width 0.3s ease;"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- AI/Import Help Modals -->

    <div v-if="showExistingRoutineHelpDialog" class="modal-overlay">
        <div class="modal-content" style="max-width: 700px; text-align: left;">
            <button @click="showExistingRoutineHelpDialog = false" class="modal-close-button">&times;</button>
            <h3 style="margin-top:0;">Import Existing Routine</h3>
            <p style="font-size: 1em; line-height: 1.5; color: var(--color-card-text); opacity: 0.9;">
                Take <strong>ANY</strong> routine you already have (notes, screenshot, or dictation) and convert it to LiftLogic format using your preferred AI.
            </p>
            
            <div style="margin-top: 15px; display: flex; flex-direction: column; gap: 12px;">
                <div>
                    <strong>Step 1:</strong> Copy the prompt below into ChatGPT, Claude, or Gemini along with your routine text or image.
                </div>
                
                <div class="code-block-container" style="background: var(--color-card-mute); border: 1px solid var(--color-card-border); padding: 14px; border-radius: 6px; overflow-x: auto; font-size: 0.8em; white-space: pre-wrap; font-family: monospace; color: var(--color-card-text); max-height: 250px;">
System Prompt:
You are an expert fitness data assistant for the LiftLogic app.
I am providing a workout routine (text, notes, or image). Convert it into the specific JSON format required by the app.

GUIDELINES:
1. Interpret intelligently: "Bench 3x10 @ 135" means { "exerciseName": "Bench Press", "targetSets": 3, "minReps": 10, "maxReps": 10, "startingWeight": 135 }. If rep range is "8-12", set minReps: 8, maxReps: 12.
2. Fill gaps: If sets are missing, assume 3. If reps are missing, assume 8-12.
3. Estimate Weight: Provide a reasonable starting weight estimate for a beginner (e.g. 135 for Bench Press, 45 for Curl). Do not use 0 unless bodyweight.
4. Output format: Output ONLY valid raw JSON with NO conversational text or commentary.

REQUIRED JSON STRUCTURE:
{
  "programName": "Routine Name",
  "description": "Short description",
  "defaultRestTimer": 90,
  "workoutDays": [
    {
      "dayName": "Push Day",
      "order": 1,
      "exercises": [
        {
          "exerciseName": "Dumbbell Bench Press",
          "targetSets": 3,
          "minReps": 8,
          "maxReps": 12,
          "startingWeight": 50,
          "weightIncrement": 5,
          "repOverloadStep": 2,
          "isTimed": false,
          "customRestSeconds": 90,
          "notesForExercise": "Optional execution notes"
        }
      ]
    }
  ]
}
                </div>
                
                <button 
                  @click="copyExistingRoutinePrompt" 
                  class="button-secondary small" 
                  style="align-self: flex-start; display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 6px; font-weight: 500;"
                >
                    📋 Copy Prompt to Clipboard
                </button>

                <div>
                    <strong>Step 2:</strong> Copy the resulting JSON code block output from the AI and paste it into the JSON box below.
                </div>
            </div>
            
            <div class="form-actions" style="justify-content: flex-end; margin-top: 20px;">
                <button @click="showExistingRoutineHelpDialog = false" class="button-primary small">Got it</button>
            </div>
        </div>
    </div>

    <div v-if="showNewRoutineHelpDialog" class="modal-overlay">
        <div class="modal-content" style="max-width: 700px; text-align: left;">
            <button @click="showNewRoutineHelpDialog = false" class="modal-close-button">&times;</button>
            <h3 style="margin-top:0;">Design Fresh with AI</h3>
            <p style="font-size: 1em; line-height: 1.5; color: var(--color-card-text); opacity: 0.9;">
                Ask ChatGPT, Claude, or Gemini to design a custom training program from scratch based on your goals and equipment.
            </p>

            <div style="margin-top: 15px; display: flex; flex-direction: column; gap: 12px;">
                <div>
                    <strong>Step 1:</strong> Copy the prompt below into your favorite AI tool and fill in your goal, equipment, and training frequency.
                </div>

                <div class="code-block-container" style="background: var(--color-card-mute); border: 1px solid var(--color-card-border); padding: 14px; border-radius: 6px; overflow-x: auto; font-size: 0.8em; white-space: pre-wrap; font-family: monospace; color: var(--color-card-text); max-height: 250px;">
System Prompt:
Act as an expert strength coach for the LiftLogic app. I want a new workout routine.

My Profile:
- Goal: [Hypertrophy / Strength / General Fitness]
- Experience Level: [Beginner / Intermediate / Advanced]
- Equipment Access: [Full Gym / Dumbbells & Bench / Bodyweight]
- Frequency: [3 or 4 days per week]

Your Task:
Design a balanced training program for me and output it ONLY as strict raw JSON with NO commentary.

REQUIRED JSON STRUCTURE:
{
  "programName": "Suggested Program Name",
  "description": "Brief strategy summary",
  "defaultRestTimer": 90,
  "workoutDays": [
    {
      "dayName": "Day 1 - Push",
      "order": 1,
      "exercises": [
        {
          "exerciseName": "Dumbbell Bench Press",
          "targetSets": 3,
          "minReps": 8,
          "maxReps": 12,
          "startingWeight": 50,
          "weightIncrement": 5,
          "repOverloadStep": 2,
          "isTimed": false,
          "customRestSeconds": 90,
          "notesForExercise": "Optional execution notes"
        }
      ]
    }
  ]
}
                </div>

                <button 
                  @click="copyNewRoutinePrompt" 
                  class="button-secondary small" 
                  style="align-self: flex-start; display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 6px; font-weight: 500;"
                >
                    📋 Copy Prompt to Clipboard
                </button>

                <div>
                    <strong>Step 2:</strong> Paste the resulting JSON code block output into the box on the setup screen.
                </div>
            </div>

            <div class="form-actions" style="justify-content: flex-end; margin-top: 20px;">
                <button @click="showNewRoutineHelpDialog = false" class="button-primary small">Got it</button>
            </div>
        </div>
    </div>

    <!-- Active Routine Display -->
    <div v-if="activeProgram.id && !isLoading && user" class="active-routine-display card">
      <div v-if="!isInOverallEditMode" class="routine-info-display">
        <div class="routine-header-flex" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
             <h2 style="margin: 0;">{{ activeProgram.programName }}</h2>
             <div class="header-actions" style="display:flex; gap:10px;">
                 <button 
                    v-if="settings.activeProgramId !== activeProgram.id" 
                    @click="handleSetAsActive(activeProgram.id)" 
                    class="button-secondary small"
                    title="Make this my primary routine"
                 >
                    Set as Active
                 </button>
                 <button @click="toggleOverallEditMode" class="button-primary small">Edit Routine</button>
             </div>
        </div>
        <p class="routine-description">
          <em>{{ activeProgram.description || 'No description.' }}</em>
        </p>
      </div>

      <form v-if="isInOverallEditMode" @submit.prevent="saveActiveProgramBaseDetails" class="edit-details-form card-inset">
        <div class="edit-mode-header" style="display: flex; justify-content: space-between; align-items:center; margin-bottom: 15px;">
            <h4 style="margin:0;">Editing Routine Details</h4>
            <button type="button" @click="toggleOverallEditMode" class="button-primary small">Done Editing</button>
        </div>
        
        <div class="form-group"><label for="editProgramName">Routine Name:</label><input type="text" id="editProgramName" v-model="editableProgramDetails.programName" required /></div>
        <div class="form-group"><label for="editProgramDescription">Description (Optional):</label><textarea id="editProgramDescription" v-model="editableProgramDetails.description"></textarea></div>
        <div class="form-group">
          <label for="editProgramDefaultRest">Default Rest Timer (sec):</label>
          <input type="number" id="editProgramDefaultRest" v-model.number="editableProgramDetails.defaultRestTimer" min="0" step="5" style="width: 100px;" />
        </div>
      </form>

      <div class="workout-days-list">
        <draggable 
            v-model="activeProgram.workoutDays" 
            item-key="id" 
            handle=".drag-handle-day"
            :disabled="!isInOverallEditMode"
            @end="onDayDragEnd"
            class="days-draggable-area"
        >
            <template #item="{ element: day }">
                <div class="workout-day-entry card-inset">
                  <div class="workout-day-entry-header">
                    <div class="header-left-group" style="display:flex; align-items: baseline;">
                        <span v-if="isInOverallEditMode" class="drag-handle-day" style="cursor: grab; margin-right: 10px; font-size: 1.2rem;" title="Drag to reorder session">☰</span>
                        <span 
                          v-if="!(isInOverallEditMode && editingDayNameId === day.id)" 
                          class="day-color-badge" 
                          :style="{ backgroundColor: day.color || daySequenceColorPalette[(day.order - 1) % daySequenceColorPalette.length] || '#10B981' }" 
                          style="width: 15px; height: 15px; border-radius: 3px; margin-right: 8px; display: inline-block; flex-shrink: 0; border: 1px solid var(--color-card-border);"
                          title="Workout Day Color"
                        ></span>
                        <h4 v-if="!(isInOverallEditMode && editingDayNameId === day.id)" class="day-name-display" style="margin: 0;">{{ day.dayName }}</h4>
                        <div v-if="isInOverallEditMode && editingDayNameId === day.id" class="day-name-edit-form">
                          <input type="text" v-model="editableDayName" @keyup.enter="saveWorkoutDayName(day.id)" @keyup.esc="cancelEditWorkoutDayName()" placeholder="Session Name"/>
                          <input type="color" v-model="editableDayColor" title="Choose Session Color" style="width: 40px; height: 38px; padding: 2px; border: 1px solid var(--color-card-border); border-radius: 4px; cursor: pointer; background: none; flex-shrink: 0; margin-right: 5px;" />
                          <button @click="saveWorkoutDayName(day.id)" :disabled="isSaving" class="button-icon success small" title="Save Name">✔️</button>
                          <button @click="cancelEditWorkoutDayName()" class="button-icon danger small" title="Cancel Edit Name">❌</button>
                        </div>
                    </div>
                    
                    <div v-if="isInOverallEditMode" class="day-header-actions">
                      <button v-if="editingDayNameId !== day.id" @click="startEditWorkoutDayName(day)" class="button-icon small" title="Edit Session Name">✏️</button>
                      <button @click="removeWorkoutDay(day.id)" :disabled="isSaving" class="button-icon small danger" title="Remove Session">🗑️</button>
                    </div>
                  </div>

                  <!-- Exercise List Draggable -->
                  <div v-if="day.exercises && day.exercises.length > 0" class="exercise-list-display">
                      <draggable 
                        v-model="day.exercises" 
                        item-key="id" 
                        handle=".drag-handle-exercise"
                        group="exercises" 
                        :disabled="!isInOverallEditMode"
                        @end="onExerciseDragEnd(day.id, $event)"
                        @start="onExerciseDragStart(day.id, $event)"
                        @change="() => onExerciseDragChange(day.id)"
                      >
                        <template #item="{ element: exercise, index }">
                            <div class="exercise-item-with-inline-form" :class="{ 'is-superset-slave': exercise.isSupersetWithPrevious }">

                              <div class="exercise-item-display">
                                <div class="exercise-info-text" style="display:flex; align-items:center;">
                                  <span v-if="isInOverallEditMode" class="drag-handle-exercise" style="cursor: grab; margin-right: 8px; color:#888;" title="Drag to reorder exercise">::</span>
                                  <span v-if="exercise.isSupersetWithPrevious" class="superset-link-icon" title="Superset with previous">🔗</span>
                                  <span class="ex-name">{{ exercise.exerciseName }}</span>
                                  <span class="ex-details">
                                    : {{ exercise.targetSets }} sets, 
                                    <template v-if="exercise.isToFailure">To Failure</template>
                                    <template v-else>{{ exercise.currentPrescribedReps ?? exercise.minReps }} {{ exercise.isTimed ? 'sec' : 'reps' }}</template>, 
                                    {{ toDisplay(exercise.currentPrescribedWeight, settings.weightUnit) }} {{ displayUnit(settings.weightUnit) }}
                                    <span v-if="exercise.customRestSeconds">, {{ exercise.customRestSeconds }}s rest</span>
                                    <span v-else-if="isInOverallEditMode && (exercise.customRestSeconds === null || exercise.customRestSeconds === undefined)">, (Default Rest)</span>
                                    <span v-if="exercise.enableProgression === false" class="no-progression-note"> (No Auto-Progression)</span>
                                  </span>
                                </div>
                                <div v-if="isInOverallEditMode" class="exercise-item-actions">
                                  <button @click="startEditExercise(day.id!, exercise)" class="button-icon extra-small" title="Edit Exercise">✏️</button>

                                  <button @click="removeExerciseFromDay(day.id!, exercise.id!)" :disabled="isSaving" class="button-icon extra-small danger" title="Remove Exercise">🗑️</button>
                                </div>
                              </div>

                              <!-- Inline Edit Form (Keep existing logic) -->
                              <div v-if="isInOverallEditMode && editingExerciseDayId === day.id && editingExercise.id === exercise.id" 
                                   class="exercise-form-container edit-exercise-form-inline" 
                                   style="margin-top: 10px; padding-top:10px; border-top: 1px dashed #ddd; margin-bottom: 10px; padding-bottom:10px; border-bottom: 1px dashed #ddd;">
                                <form @submit.prevent="addOrUpdateExercise(day.id!)" class="add-exercise-form">
                                  <h5>{{ 'Edit Exercise: ' + editingExercise.exerciseName }}</h5>
                                  <div class="form-group"><label>Name:</label><input type="text" v-model="editingExercise.exerciseName" required /></div>
                                  
                                  <div class="form-group form-group-inline" v-if="editingExercise.id">
                                    <div>
                                        <label>Current Weight ({{ displayUnit(settings.weightUnit) }}):</label>
                                        <input type="number" v-model.number="editingExercise.currentWeightToDisplayOrEdit" step="0.1" />
                                    </div>
                                    <div>
                                        <label>{{ editingExercise.isTimed ? 'Current Hold (sec):' : 'Current Reps:' }}</label>
                                        <input type="number" v-model.number="editingExercise.currentRepsToDisplayOrEdit" step="1" min="1" />
                                    </div>
                                  </div>

                                  <div class="form-group form-group-inline">
                                    <div><label>Sets:</label><input type="number" v-model.number="editingExercise.targetSets" min="1" required /></div>
                                    <div><label>Rest (sec):</label><input type="number" v-model.number="editingExercise.customRestSeconds" min="10" :placeholder="'Default (' + settings.defaultRestTimer + 's)'" /></div>
                                  </div>
                                  
                                  <div class="exercise-options-container card-inset" style="padding: 10px; margin-bottom: 15px; background-color: #f9f9f9; border: 1px solid #eee;">
                                    <label class="form-section-label" style="font-weight:600; margin-bottom:8px; display:block;">Configuration</label>

                                    <div class="form-group" style="display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 15px;">
                                        <label class="checkbox-label">
                                            <input type="checkbox" v-model="editingExercise.enableProgression" /> Enable Auto-Progression
                                        </label>
                                        <label class="checkbox-label">
                                            <input type="checkbox" v-model="editingExercise.isToFailure" /> To Failure
                                        </label>
                                        <label class="checkbox-label">
                                            <input type="checkbox" v-model="editingExercise.isTimed" /> Timed Exercise
                                        </label>
                                    </div>

                                    <div v-if="editingExercise.enableProgression">
                                        <div class="form-group form-group-inline" v-if="!editingExercise.isToFailure || editingExercise.enableProgression" style="margin-bottom: 15px; border-bottom: 1px dashed #eee; padding-bottom: 10px;">
                                            <div v-if="!editingExercise.isToFailure">
                                                <label>{{ editingExercise.isTimed ? 'Min Hold (sec):' : 'Min Reps:' }}</label>
                                                <input type="number" v-model.number="editingExercise.minReps" min="1" required />
                                            </div>
                                            <div :style="editingExercise.isToFailure ? 'width: 100%' : ''">
                                                <label>
                                                    {{ editingExercise.isToFailure ? (editingExercise.isTimed ? 'Progression Trigger (Max Hold sec):' : 'Progression Trigger (Max Reps):') : (editingExercise.isTimed ? 'Max Hold (sec):' : 'Max Reps:') }}
                                                    <span v-if="editingExercise.isToFailure" @click.prevent="showFailureProgressionHelp = !showFailureProgressionHelp" style="cursor: pointer; margin-left: 5px;">
                                                        💡
                                                    </span>
                                                </label>
                                                <input type="number" v-model.number="editingExercise.maxReps" min="1" required />
                                                <div v-if="showFailureProgressionHelp && editingExercise.isToFailure" style="font-size: 0.85em; color: #666; background: #fff3cd; padding: 5px; border-radius: 4px; margin-top: 5px; border: 1px solid #ffeeba;">
                                                    If you exceed this rep count on <strong>all sets</strong> during a workout, the weight will automatically increase for the next session.
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div v-if="editingExercise.enableProgression" class="form-group form-group-inline">
                                        <div><label>Weight Progression ({{ displayUnit(settings.weightUnit) }}):</label><input type="number" v-model.number="editingExercise.weightIncrement" step="0.1" required /></div>
                                        <div v-if="!editingExercise.isToFailure"><label>{{ editingExercise.isTimed ? 'Hold Progression (sec):' : 'Rep Progression:' }}</label><input type="number" v-model.number="editingExercise.repOverloadStep" min="1" required /></div>
                                    </div>
                                    
                                    <div class="form-group" v-if="day.exercises.findIndex((e: any) => e.id === exercise.id) > 0">
                                        <label class="checkbox-label" title="Must match sets of previous exercise">
                                            <input type="checkbox" v-model="editingExercise.isSupersetWithPrevious" /> Superset with Previous Exercise
                                        </label>
                                        
                                        <div v-if="editingExercise.isSupersetWithPrevious">
                                            <div style="font-size:0.8em; color:#007bff; margin-left: 25px; margin-top: 2px;">
                                                Sets locked to match previous exercise.
                                            </div>
                                            <div style="margin-top:8px;">
                                                <label class="checkbox-label">
                                                    <input type="checkbox" v-model="editingExercise.fullRestAfterSuperset" /> Start timer after set (standard rest)
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                  </div>

                                  <div class="form-group" v-if="!editingExercise.id">
                                      <label>Starting Weight ({{ displayUnit(settings.weightUnit) }}):</label>
                                      <input type="number" v-model.number="editingExercise.startingWeight" step="0.1" :required="!editingExercise.id" />
                                  </div>
                                  <div class="form-group"><label>Notes:</label><textarea v-model="editingExercise.notesForExercise"></textarea></div>

                                  <div class="form-actions">
                                    <button type="submit" :disabled="isSaving" class="button-primary small">{{ isSaving ? 'Saving...' : (editingExercise.id ? 'Update Exercise' : 'Add Exercise') }}</button>
                                    <button type="button" @click="cancelAddOrEditExercise" class="button-secondary small">Cancel</button>
                                  </div>
                                </form>
                              </div>
                            </div>
                        </template>
                      </draggable>
                  </div>
                  <div v-else class="no-items-message small-text">
                      No exercises yet.
                  </div>

                  <!-- Inline Add Exercise Form (Only if active for this day) --> 
                   <div v-if="isInOverallEditMode && addingExerciseToDayId === day.id && !editingExercise.id" class="exercise-form-container add-exercise-form-inline">
                      <form @submit.prevent="addOrUpdateExercise(day.id)" class="add-exercise-form">
                          <h5>Add New Exercise to {{ day.dayName }}</h5>
                          <div class="form-group"><label>Exercise Name:</label><input type="text" v-model="editingExercise.exerciseName" required placeholder="e.g. Bench Press" /></div>
                          <div class="form-group form-group-inline">
                              <div><label>Target Sets:</label><input type="number" v-model.number="editingExercise.targetSets" min="1" required /></div>
                              <div><label>Rest (sec):</label><input type="number" v-model.number="editingExercise.customRestSeconds" min="10" :placeholder="'Default (' + settings.defaultRestTimer + 's)'" /></div>
                          </div>
                          
                          <div class="exercise-options-container card-inset" style="padding: 10px; margin-bottom: 15px; background-color: #f9f9f9; border: 1px solid #eee;">
                            <label class="form-section-label" style="font-weight:600; margin-bottom:8px; display:block;">Configuration</label>
                            
                            <div class="form-group" style="display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 15px;">
                                <label class="checkbox-label"><input type="checkbox" v-model="editingExercise.enableProgression" /> Enable Auto-Progression</label>
                                <label class="checkbox-label"><input type="checkbox" v-model="editingExercise.isToFailure" /> To Failure</label>
                                <label class="checkbox-label"><input type="checkbox" v-model="editingExercise.isTimed" /> Timed Exercise</label>
                            </div>

                            <div v-if="editingExercise.enableProgression">
                                <div class="form-group form-group-inline" v-if="!editingExercise.isToFailure || editingExercise.enableProgression" style="margin-bottom: 15px; border-bottom: 1px dashed #eee; padding-bottom: 10px;">
                                    <div v-if="!editingExercise.isToFailure">
                                        <label>{{ editingExercise.isTimed ? 'Min Hold (sec):' : 'Min Reps:' }}</label>
                                        <input type="number" v-model.number="editingExercise.minReps" min="1" required />
                                    </div>
                                    <div :style="editingExercise.isToFailure ? 'width: 100%' : ''">
                                        <label>
                                            {{ editingExercise.isToFailure ? (editingExercise.isTimed ? 'Progression Trigger (Max Hold sec):' : 'Progression Trigger (Max Reps):') : (editingExercise.isTimed ? 'Max Hold (sec):' : 'Max Reps:') }}
                                            <span v-if="editingExercise.isToFailure" @click.prevent="showFailureProgressionHelp = !showFailureProgressionHelp" style="cursor: pointer; margin-left: 5px;">
                                                💡
                                            </span>
                                        </label>
                                        <input type="number" v-model.number="editingExercise.maxReps" min="1" required />
                                        <div v-if="showFailureProgressionHelp && editingExercise.isToFailure" style="font-size: 0.85em; color: #666; background: #fff3cd; padding: 5px; border-radius: 4px; margin-top: 5px; border: 1px solid #ffeeba;">
                                            If you exceed this rep count on <strong>all sets</strong> during a workout, the weight will automatically increase for the next session.
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div v-if="editingExercise.enableProgression" class="form-group form-group-inline">
                                <div><label>Weight Progression ({{ displayUnit(settings.weightUnit) }}):</label><input type="number" v-model.number="editingExercise.weightIncrement" step="0.1" required /></div>
                                <div v-if="!editingExercise.isToFailure"><label>{{ editingExercise.isTimed ? 'Hold Progression (sec):' : 'Rep Progression:' }}</label><input type="number" v-model.number="editingExercise.repOverloadStep" min="1" required /></div>
                            </div>

                            <div class="form-group" v-if="day.exercises.length > 0">
                                <label class="checkbox-label" title="Must match sets of previous exercise">
                                  <input type="checkbox" v-model="editingExercise.isSupersetWithPrevious" /> Superset with Previous Exercise
                                </label>
                            </div>
                          </div>
                          
                          <div class="form-group">
                            <label>Starting Weight ({{ displayUnit(settings.weightUnit) }}):</label>
                            <input type="number" v-model.number="editingExercise.startingWeight" step="0.1" />
                          </div>
                          
                          <div class="form-group form-group-inline" v-if="!editingExercise.id">
                              <!-- No longer grouping these here if we moved them to config.. but wait, this is the inline form logic from before? -->
                              <!-- Actually, looking at previous edit: lines 440-444 were simple Starting Weight. -->
                              <!-- The user previously asked for inline "Rep Incr" but we moved it to config block. -->
                              <!-- So we just need to make sure the CONFIG block change (above) covered it. -->
                              <!-- The replace above covered the Config block. This specific block seems to be just starting weight now. -->
                              <!-- Wait, I see "repOverloadStep" in my previous edits was REMOVED from the bottom form group and put in the config group. -->
                              <!-- So this replacement might be unnecessary if I only touched the config block. -->
                              <!-- Checking context... -->
                              <!-- The target content shows what's currently there. -->
                              <!-- Lines 440-444 are: -->
                              <!-- <div class="form-group"> -->
                              <!-- <label>Starting Weight... -->
                              <!-- </div> -->
                              <!-- That looks correct. I don't need to change this block if the previous edits moved the increment fields to the config block. -->
                          </div>
                          <div class="form-group"><label>Notes:</label><textarea v-model="editingExercise.notesForExercise"></textarea></div>
                          <div class="form-actions">
                              <button type="submit" :disabled="isSaving" class="button-primary small">{{ isSaving ? 'Scanning...' : 'Add Exercise' }}</button>
                              <button type="button" @click="cancelAddOrEditExercise" class="button-secondary small">Cancel</button>
                          </div>
                      </form>
                   </div>
                  
                  <div v-if="isInOverallEditMode" class="add-day-controls" style="text-align: left; padding-top: 0; margin-top: 10px;">
                       <button v-if="addingExerciseToDayId !== day.id" @click="prepareAddExerciseToDay(day.id)" class="button-primary-outline small">+ Add Exercise</button>
                  </div>
                </div>
            </template>
        </draggable>
      </div>
        
        <!-- Add New Session Logic -->
         <div v-if="isInOverallEditMode" class="add-day-section card-inset" style="text-align: center; margin-top: 25px;">
            <button v-if="!addingNewDay" @click="prepareAddNewDay" class="button-primary full-width">+ Add Session</button>
            
            <div v-if="addingNewDay && !activeProgram.id" style="color:red; font-size:0.9em; margin-bottom:5px;">
                (Save routine details above first)
            </div>
            
            <div v-if="addingNewDay" class="add-day-form-inline">
               <input type="text" v-model="newWorkoutDayName" placeholder="New Session Name (e.g. Pull Day)" @keyup.enter="addWorkoutDayToList" />
               <input type="color" v-model="newWorkoutDayColor" title="Choose Session Color" style="width: 40px; height: 38px; padding: 2px; border: 1px solid var(--color-card-border); border-radius: 4px; cursor: pointer; background: none; flex-shrink: 0;" />
               <button @click="addWorkoutDayToList" :disabled="isSaving" class="button-primary small" style="height: 38px;">Save</button>
               <button @click="addingNewDay = false" class="button-secondary small" style="height: 38px;">Cancel</button>
           </div>
        </div>
      
       <!-- Bottom Save Button for UX -->
       <div v-if="isInOverallEditMode" class="bottom-save-bar" style="margin-top: 20px; text-align: center;">
            <button @click="toggleOverallEditMode" class="button-primary full-width">
                💾 Save Routine
            </button>
       </div>
      
      <!-- Routine Actions Footer -->
      <div v-if="isInOverallEditMode" class="routine-level-actions">
           <h4>Danger Zone</h4>
           <button @click.prevent="requestDeleteRoutine" class="button-danger full-width" :disabled="isSaving" style="margin-top:20px;">
               Delete Entire Routine
           </button>
           <p class="warning-text">This will delete the routine "{{ activeProgram.programName }}" and all its configuration. Exercise history will be preserved.</p>
      </div>

    
    </div> <!-- End active-routine-display -->
    
    <!-- Manage Routines List -->
    <div v-if="!isLoading && user" class="manage-routines-section card" style="margin-top: 40px;">
        <div class="header-with-actions" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0;">Manage Routines</h3>
            <button @click="showProgressionHint = !showProgressionHint" class="button-icon" title="Progression Tip" style="font-size: 1.2rem; cursor: pointer; background: none; border: none;">
                💡
            </button>
        </div>
        
        <div v-if="showProgressionHint" class="info-hint-box animate-fade-in" style="background-color: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 10px; border-radius: 4px; margin-bottom: 20px; font-size: 0.9em;">
            <strong>Pro Tip:</strong> Using the exact same exercise name across multiple routines will share your progress (weight/reps) between them automatically.
        </div>
        
        <div class="routines-list">
             <ProgramCard 
                v-for="program in validPrograms" 
                :key="program.id"
                :program="program"
                :isActive="settings.activeProgramId === program.id"
                @setActive="handleSetAsActive"
                @select="handleSwitchRoutine"
             />
        </div>
        
        <div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="button-primary" @click="startCreatingNewRoutine" style="flex: 1; min-width: 160px;">
                + Add New Routine
            </button>
            <button class="button-secondary" @click="showLogCardioModal = true" style="flex: 1; min-width: 160px; display: flex; align-items: center; justify-content: center; gap: 6px;">
                🏃 Log Cardio Session
            </button>
        </div>
    </div>

    <!-- Manual Cardio Log Modal -->
    <LogCardioModal 
        v-if="showLogCardioModal" 
        @close="showLogCardioModal = false"
    />

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirmation" class="modal-overlay">
        <div class="modal-content" style="max-width: 500px; text-align: center;">
            <button @click="cancelDeleteRoutine" class="modal-close-button">&times;</button>
            <h3 style="color: #dc3545;">Delete Routine?</h3>
            <p>Are you sure you want to permanently delete <strong>{{ activeProgram.programName }}</strong>?</p>
            <p class="small-text warning-text" style="margin-bottom: 25px;">This action cannot be undone.</p>
            
            <div class="form-actions" style="justify-content: center; gap: 15px;">
                <button @click="confirmDeleteRoutine" class="button-danger" :disabled="isSaving">
                    {{ isSaving ? 'Deleting...' : 'Yes, Delete Routine' }}
                </button>
                <button @click="cancelDeleteRoutine" class="button-secondary">Cancel</button>
            </div>
        </div>
    </div>

  </div> <!-- End routines-view -->
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, collection, writeBatch, deleteDoc, addDoc, Timestamp, type DocumentData } from 'firebase/firestore';
import { db } from '../firebase.js';
import useAuth from '../composables/useAuth';
import useSettings, { type WeightUnitOption } from '../composables/useSettings';
import useTrainingProgram from '../composables/useTrainingProgram';
import ProgramCard from '../components/routines/ProgramCard.vue';
import LogCardioModal from '../components/history/LogCardioModal.vue';
import useHistoryIndex from '../composables/useHistoryIndex';
import useLoggedWorkouts from '../composables/useLoggedWorkouts';
import { toDisplay, fromInput, displayUnit } from '../utils/weight';
import {
  type ExerciseProgress,
  type ExerciseConfig,
  type ExerciseConfigForDisplay,
  type WorkoutDay,
  type TrainingProgram,
  type SessionExercise,
  type LoggedWorkout,
  type PerformedExerciseInLog,
  type LoggedSetData
} from '../types';
import draggable from 'vuedraggable';

const daySequenceColorPalette = [
  '#FF5252', // Vibrant Red
  '#2ECC71', // Vibrant Green
  '#2979FF', // Vibrant Blue
  '#FFD600', // Vibrant Gold/Yellow
  '#9C27B0', // Vibrant Purple
  '#FF9100', // Vibrant Orange
];

// --- Core State ---
const router = useRouter();
const { user } = useAuth();
const { settings, saveSettings } = useSettings();
const { 
  activeProgram, 
  loadProgram, 
  isProgramLoading, 
  programLoadingError, 
  fetchAllPrograms, 
  allPrograms,
  createProgram,
  setActiveProgram
} = useTrainingProgram();

const { fetchCalendarIndex: rebuildCalendarIndex } = useHistoryIndex();
const { invalidateCache: invalidateWorkoutCache } = useLoggedWorkouts();

const isLoading = computed(() => isProgramLoading.value);
const isSaving = ref(false);
const error = ref<string | null>(null);
const showLogCardioModal = ref(false);
const showDeleteConfirmation = ref(false);
const showExerciseDeleteConfirmation = ref(false); // Potential future use, but let's stick to routine for now
const itemToDelete = ref<any>(null); // For generic delete if needed
const showProgressionHint = ref(false);
const showFailureProgressionHelp = ref(false);

const showTooltipAlert = (msg: string) => {
  alert(msg);
};

const copyPromptToClipboard = (text: string) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      alert("📋 Prompt copied to clipboard! Paste it into ChatGPT, Claude, or Gemini.");
    }).catch(() => {
      alert("Could not copy automatically. Please select text manually.");
    });
  } else {
    alert("Clipboard access not available on this browser.");
  }
};

const copyExistingRoutinePrompt = () => {
  const promptText = `System Prompt:
You are an expert fitness data assistant for the LiftLogic app.
I am providing a workout routine (text, notes, or image). Convert it into the specific JSON format required by the app.

GUIDELINES:
1. Interpret intelligently: "Bench 3x10 @ 135" means { "exerciseName": "Bench Press", "targetSets": 3, "minReps": 10, "maxReps": 10, "startingWeight": 135 }. If rep range is "8-12", set minReps: 8, maxReps: 12.
2. Fill gaps: If sets are missing, assume 3. If reps are missing, assume 8-12.
3. Estimate Weight: Provide a reasonable starting weight estimate for a beginner (e.g. 135 for Bench Press, 45 for Curl). Do not use 0 unless bodyweight.
4. Output format: Output ONLY valid raw JSON with NO conversational text or commentary.

REQUIRED JSON STRUCTURE:
{
  "programName": "Routine Name",
  "description": "Short description",
  "defaultRestTimer": 90,
  "workoutDays": [
    {
      "dayName": "Push Day",
      "order": 1,
      "exercises": [
        {
          "exerciseName": "Dumbbell Bench Press",
          "targetSets": 3,
          "minReps": 8,
          "maxReps": 12,
          "startingWeight": 50,
          "weightIncrement": 5,
          "repOverloadStep": 2,
          "isTimed": false,
          "customRestSeconds": 90,
          "notesForExercise": "Optional execution notes"
        }
      ]
    }
  ]
}`;
  copyPromptToClipboard(promptText);
};

const copyNewRoutinePrompt = () => {
  const promptText = `System Prompt:
Act as an expert strength coach for the LiftLogic app. I want a new workout routine.

My Profile:
- Goal: [Hypertrophy / Strength / General Fitness]
- Experience Level: [Beginner / Intermediate / Advanced]
- Equipment Access: [Full Gym / Dumbbells & Bench / Bodyweight]
- Frequency: [3 or 4 days per week]

Your Task:
Design a balanced training program for me and output it ONLY as strict raw JSON with NO commentary.

REQUIRED JSON STRUCTURE:
{
  "programName": "Suggested Program Name",
  "description": "Brief strategy summary",
  "defaultRestTimer": 90,
  "workoutDays": [
    {
      "dayName": "Day 1 - Push",
      "order": 1,
      "exercises": [
        {
          "exerciseName": "Dumbbell Bench Press",
          "targetSets": 3,
          "minReps": 8,
          "maxReps": 12,
          "startingWeight": 50,
          "weightIncrement": 5,
          "repOverloadStep": 2,
          "isTimed": false,
          "customRestSeconds": 90,
          "notesForExercise": "Optional execution notes"
        }
      ]
    }
  ]
}`;
  copyPromptToClipboard(promptText);
};

const validPrograms = computed(() => {
  return allPrograms.value.filter(p => p.id !== null) as (TrainingProgram & { id: string })[];
});

// --- Switcher Logic ---
const isActiveRoutine = computed(() => {
  return activeProgram.id === settings.value.activeProgramId;
});

const handleSwitchRoutine = async (programId: string) => {
    creationMode.value = null; // Exit creation if searching
    await loadProgram(programId);
};

const handleSetAsActive = async (programId?: string) => {
  const idToSet = programId || activeProgram.id;
  if (!idToSet) return;
  
  try {
    isSaving.value = true;
    await setActiveProgram(idToSet);
  } catch (e: any) {
    console.error(e);
    error.value = "Failed to set active routine.";
  } finally {
    isSaving.value = false;
  }
};

const startCreatingNewRoutine = () => {
    // Clear active program view to show the "Choice" screen.
    // We set activeProgram.id to null to trigger the v-if="!activeProgram.id" check in template.
    // Does NOT write to DB yet.
    activeProgram.id = null;
    activeProgram.programName = '';
    activeProgram.description = '';
    activeProgram.workoutDays = []; // Ensure empty
    creationMode.value = null; // Resets choice
};

// --- Import Routine State ---
const pastedRoutineJson = ref('');
const showExistingRoutineHelpDialog = ref(false);
const showNewRoutineHelpDialog = ref(false);

// --- FitNotes SQLite Import State ---
const fitnotesFile = ref<File | null>(null);
const fitnotesParsedData = ref<{
  workoutsCount: number;
  exercisesCount: number;
  routinesCount: number;
  db: any;
} | null>(null);
const importProgressStatus = ref('');
const importProgressPercentage = ref(0);

// --- Overall Edit Mode State ---
const isInOverallEditMode = ref(false);
const creationMode = ref<'manual' | 'ai' | 'fitnotes' | null>(null);

// --- Routine Name/Description Edit State ---
const showEditProgramDetailsForm = ref(false);
const editableProgramDetails = reactive({ programName: '', description: '', defaultRestTimer: 90 });

// --- Workout Day Management State ---
const newWorkoutDayName = ref('');
const newWorkoutDayColor = ref('#10B981');
const addingNewDay = ref(false);
const editingDayNameId = ref<string | null>(null);
const editableDayName = ref('');
const editableDayColor = ref('#10B981');

const prepareAddNewDay = () => {
  addingNewDay.value = true;
  newWorkoutDayColor.value = daySequenceColorPalette[activeProgram.workoutDays.length % daySequenceColorPalette.length] || '#10B981';
};

// --- Exercise Management State ---
const editingExerciseDayId = ref<string | null>(null);
const editingExercise = reactive<Partial<ExerciseConfig> & { startingWeight?: number; currentWeightToDisplayOrEdit?: number; currentRepsToDisplayOrEdit?: number }>({
  id: undefined, exerciseName: '', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2,
  weightIncrement: 5, customRestSeconds: undefined, notesForExercise: '', enableProgression: true,
  isTimed: false,
  startingWeight: 45, currentWeightToDisplayOrEdit: undefined, currentRepsToDisplayOrEdit: undefined,
});
const addingExerciseToDayId = ref<string | null>(null);


// --- Computed Properties ---
// We no longer use a computed property for sorting because we need to bind v-model directly to the array for drag-and-drop.
// Instead, we will rely on activeProgram.workoutDays being sorted upon load, and maintained in order.
// const sortedWorkoutDays = computed(() => { ... }); REMOVED

// --- Functions ---
const onDayDragEnd = async () => {
    isSaving.value = true;
    try {
        // Update order property based on new index
        activeProgram.workoutDays.forEach((day, index) => {
            day.order = index + 1;
        });

        const programDocRef = doc(db, 'users', user.value!.uid, 'trainingPrograms', activeProgram.id!);
        // We need to save the new order to Firestore
        // We'll map to the persistable structure (removing display-only fields is handled in saveActiveProgramBaseDetails but we can duplicate minimal logic here for speed or reuse)
        
        // Let's reuse the logic from saveActiveProgramBaseDetails or create a dedicate saveOrder function.
        // For safety, let's just trigger a full update of the workoutDays structure.
        
        const workoutDaysToSave = activeProgram.workoutDays.map(day => ({
             ...day,
             exercises: day.exercises.map(ex => {
                 // eslint-disable-next-line @typescript-eslint/no-unused-vars
                 const { currentPrescribedReps, currentPrescribedWeight, ...routineExerciseConfig } = ex;
                 return routineExerciseConfig as ExerciseConfig;
             })
         }));

         await updateDoc(programDocRef, { workoutDays: workoutDaysToSave, updatedAt: serverTimestamp() });

    } catch (e: any) {
        error.value = "Failed to save new order. " + e.message;
        // Optionally revert order here if needed, but for MVP we just show error
    } finally {
        isSaving.value = false;
    }
};



const toggleExistingRoutineHelp = () => {
  showExistingRoutineHelpDialog.value = !showExistingRoutineHelpDialog.value;
  if (showExistingRoutineHelpDialog.value) {
    showNewRoutineHelpDialog.value = false; 
  }
};

const toggleNewRoutineHelp = () => {
  showNewRoutineHelpDialog.value = !showNewRoutineHelpDialog.value;
  if (showNewRoutineHelpDialog.value) {
    showExistingRoutineHelpDialog.value = false; 
  }
};

const toggleOverallEditMode = async () => {
  if (isInOverallEditMode.value) {
    // We are exiting edit mode - Auto Save
    await saveActiveProgramBaseDetails();
    if (!error.value) {
        isInOverallEditMode.value = false;
        showEditProgramDetailsForm.value = false; // Cleanup
        cancelEditWorkoutDayName();
        cancelAddOrEditExercise();
        addingNewDay.value = false;
    }
  } else {
    // Entering edit mode
    editableProgramDetails.programName = activeProgram.programName;
    editableProgramDetails.description = activeProgram.description;
    editableProgramDetails.defaultRestTimer = activeProgram.defaultRestTimer || 90;
    isInOverallEditMode.value = true;
    showEditProgramDetailsForm.value = true;
  }
};

// Local loadActiveProgram removed in favor of useTrainingProgram

const quickStartManualRoutine = async () => {
    // Instead of creating immediately, we just set up the LOCAL state for a new routine.
    // It will be saved when the user clicks "Done Editing" or tries to add days/exercises? 
    // Actually, adding days/exercises requires an ID in the current architecture (subcollections nested under program ID).
    // So we HAVE to create the document if we want to add subcollections using the existing logic.
    // BUT the user complaint is "immediately saves it as new routine... then creates a duplicate".
    
    // SOLUTION: We create the doc immediately (necessary for subcollections), BUT we ensure we rely on THAT ID.
    // The issue might be that `startCreatingNewRoutine` was clearing the ID, and then maybe `createProgram` was called again?
    // Or when they "saved", it created a NEW one instead of UPDATE?
    
    // Let's first make sure we are not creating duplicates.
    // The previous implementation of `quickStartManualRoutine` called `createProgram`.
    // The user says: "starting a new routine immediately saves it as new routine, then when you save the routine you were actually making it creates a duplicate"
    
    // This implies that `saveActiveProgramBaseDetails` might be doing `createProgram` too?
    // Let's look at `saveActiveProgramBaseDetails`.
    // It does `updateDoc` if `activeProgram.id` exists.
    
    // If `quickStartManualRoutine` sets `activeProgram.id`, then `save` handles it correctly.
    // Maybe the user clicked "Add New Routine" (startCreatingNewRoutine) -> then clicked "Manual" (quickStart...) -> this created Doc A.
    // Then they edited name "My Split".
    // Then they clicked "Done Editing" -> `saveActiveProgramBaseDetails` -> Updates Doc A.
    // This seems correct?
    
    // Unless... `createProgram` adds it to the list.
    // Maybe the user is confused by the list updating?
    
    // OR: maybe they are clicking "+ Add New Routine" again?
    
    // Let's try to keep it local until they rename it?
    // No, we need ID for subcollections.
    // We will stick to `createProgram` but ensure we handle the UI better so they don't feel lost.
    
    if (!user.value || !user.value.uid) { error.value = 'User not logged in.'; return; }
    isSaving.value = true;
    try {
        const newProgramId = await createProgram("New Routine", "");
        await loadProgram(newProgramId); 
        
        // Reset UI states
        creationMode.value = null;
        isInOverallEditMode.value = true;
        
        // Pre-fill edit forms
        editableProgramDetails.programName = ""; // Blank so they interpret it as 'new'
        editableProgramDetails.description = "";
        showEditProgramDetailsForm.value = true;
        
        // We do NOT add a new day automatically yet, let them name the routine first.
        // Or if we do, we must ensure it doesn't cause issues.
        
        addingNewDay.value = true; 
        
    } catch (e: any) {
        error.value = "Failed to create routine. " + e.message;
    } finally {
        isSaving.value = false;
    }
};

const saveActiveProgramBaseDetails = async () => {
  if (!user.value || !user.value.uid) { error.value = 'User not logged in.'; return; }
  if (!editableProgramDetails.programName.trim()) { error.value = 'Routine name is required.'; return; }
  
  const initialCreationMode = creationMode.value; // Capture mode at start
  
  isSaving.value = true; error.value = null;
  try {
    // If we don't have an ID, we should technically be creating a new one, but 
    // saveActiveProgramBaseDetails is usually called when editing an EXISTING one.
    // If it's called during "Quick Start Manual", we already created the program.
    // If it's called via "AI Import", we should use createProgram.
    
    // However, for existing logic compatibility:
    const programId = activeProgram.id;
    if (!programId) {
        throw new Error("No active routine to save to.");
    }

    const programDocRef = doc(db, 'users', user.value.uid, 'trainingPrograms', programId);
    
    // We only need to save name/desc here, usually.
    // But the original function saved workoutDays too?
    // Let's keep it safe.
    
    const workoutDaysToSave = activeProgram.workoutDays.map(day => ({
        ...day,
        exercises: day.exercises.map(ex => {
            const { currentPrescribedReps, currentPrescribedWeight, ...routineExerciseConfig } = ex;
            return routineExerciseConfig as ExerciseConfig;
        })
    }));
    
    const dataToSave: any = {
      programName: editableProgramDetails.programName,
      description: editableProgramDetails.description,
      defaultRestTimer: editableProgramDetails.defaultRestTimer || 90,
      workoutDays: workoutDaysToSave,
      updatedAt: serverTimestamp(),
    };
    
    await updateDoc(programDocRef, dataToSave);

    activeProgram.programName = editableProgramDetails.programName;
    activeProgram.description = editableProgramDetails.description;
    activeProgram.defaultRestTimer = editableProgramDetails.defaultRestTimer || 90;
    
    await loadProgram(programId); 
    await fetchAllPrograms(); // Refresh list to show new name in switcher
    
    // After successful save, if we were in manual creation mode, transition to full edit mode
    // AND automatically open the "Add Day" form
    if (initialCreationMode === 'manual') {
      creationMode.value = null;
      isInOverallEditMode.value = true;
      showEditProgramDetailsForm.value = false; 
      addingNewDay.value = true; // <--- Auto-open the "Add Day" form
    }
  } catch (e: any) { error.value = "Failed to save routine details. " + e.message; }
  finally { isSaving.value = false; }
};

const loadJonnyPPL = async () => {
  if (!user.value || !user.value.uid) {
    alert("Please sign in to copy the default PPL routine.");
    return;
  }

  if (confirm("Copy the Default LiftLogic PPL routine to your account? You will need to adjust your weights.")) {
    try {
      isSaving.value = true;
      const programsRef = collection(db, 'users', user.value.uid, 'trainingPrograms');
      
      const newProgramDoc = {
        programName: "Default LiftLogic PPL",
        description: "Standard Push/Pull/Legs split built for Dumbbells, an Adjustable Bench, and Doorway Resistance Bands.",
        defaultRestTimer: 90,
        workoutDays: [
          {
            id: 'day_push_' + Date.now(),
            dayName: "Push (Chest, Shoulders, Triceps)",
            order: 1,
            workoutColor: "#FF5252",
            exercises: [
              {
                id: "ex_push_1_" + Date.now(),
                exerciseName: "Dumbbell Bench Press",
                targetSets: 3,
                minReps: 8,
                maxReps: 12,
                startingWeight: 50,
                weightIncrement: 5,
                repOverloadStep: 2,
                enableProgression: true,
                customRestSeconds: 90,
                notesForExercise: "Flat or slight incline bench. Retract shoulder blades."
              },
              {
                id: "ex_push_2_" + Date.now(),
                exerciseName: "Seated Dumbbell Overhead Press",
                targetSets: 3,
                minReps: 8,
                maxReps: 12,
                startingWeight: 35,
                weightIncrement: 5,
                repOverloadStep: 2,
                enableProgression: true,
                customRestSeconds: 90,
                notesForExercise: "Upright bench support. Press vertically without arching lower back."
              },
              {
                id: "ex_push_3_" + Date.now(),
                exerciseName: "Incline Dumbbell Flyes",
                targetSets: 3,
                minReps: 10,
                maxReps: 15,
                startingWeight: 25,
                weightIncrement: 5,
                repOverloadStep: 2,
                enableProgression: true,
                customRestSeconds: 60,
                notesForExercise: "Deep chest stretch at the bottom with a slight bend in elbows."
              },
              {
                id: "ex_push_4_" + Date.now(),
                exerciseName: "Dumbbell Lateral Raise",
                targetSets: 3,
                minReps: 12,
                maxReps: 15,
                startingWeight: 15,
                weightIncrement: 2.5,
                repOverloadStep: 1,
                enableProgression: true,
                customRestSeconds: 60,
                notesForExercise: "Lead with elbows, raise to shoulder height."
              },
              {
                id: "ex_push_5_" + Date.now(),
                exerciseName: "Overhead Dumbbell Tricep Extension",
                targetSets: 3,
                minReps: 10,
                maxReps: 12,
                startingWeight: 30,
                weightIncrement: 5,
                repOverloadStep: 2,
                enableProgression: true,
                customRestSeconds: 60,
                notesForExercise: "Keep elbows pointed forward and close to head."
              },
              {
                id: "ex_push_6_" + Date.now(),
                exerciseName: "Doorway Band Tricep Pushdown",
                targetSets: 3,
                minReps: 12,
                maxReps: 15,
                startingWeight: 20,
                weightIncrement: 5,
                repOverloadStep: 2,
                enableProgression: true,
                customRestSeconds: 60,
                notesForExercise: "Anchor band at top of doorframe. Lock out elbows at the bottom."
              }
            ]
          },
          {
            id: 'day_pull_' + Date.now(),
            dayName: "Pull (Back, Rear Delts, Biceps)",
            order: 2,
            workoutColor: "#2ECC71",
            exercises: [
              {
                id: "ex_pull_1_" + Date.now(),
                exerciseName: "One-Arm Dumbbell Row",
                targetSets: 3,
                minReps: 8,
                maxReps: 12,
                startingWeight: 45,
                weightIncrement: 5,
                repOverloadStep: 2,
                enableProgression: true,
                customRestSeconds: 90,
                notesForExercise: "Hand and knee on bench. Pull dumbbell to hip."
              },
              {
                id: "ex_pull_2_" + Date.now(),
                exerciseName: "Doorway Band Lat Pulldown",
                targetSets: 3,
                minReps: 10,
                maxReps: 15,
                startingWeight: 30,
                weightIncrement: 5,
                repOverloadStep: 2,
                enableProgression: true,
                customRestSeconds: 75,
                notesForExercise: "Kneel down, anchor band at top of door, pull down to collarbone."
              },
              {
                id: "ex_pull_3_" + Date.now(),
                exerciseName: "Doorway Band Face Pull",
                targetSets: 3,
                minReps: 12,
                maxReps: 15,
                startingWeight: 20,
                weightIncrement: 5,
                repOverloadStep: 2,
                enableProgression: true,
                customRestSeconds: 60,
                notesForExercise: "Anchor band at chest level. Pull hands back towards ears."
              },
              {
                id: "ex_pull_4_" + Date.now(),
                exerciseName: "Dumbbell Bicep Curl",
                targetSets: 3,
                minReps: 8,
                maxReps: 12,
                startingWeight: 25,
                weightIncrement: 2.5,
                repOverloadStep: 2,
                enableProgression: true,
                customRestSeconds: 60,
                notesForExercise: "Strict form, rotate palms up as you curl."
              },
              {
                id: "ex_pull_5_" + Date.now(),
                exerciseName: "Dumbbell Hammer Curl",
                targetSets: 3,
                minReps: 10,
                maxReps: 12,
                startingWeight: 25,
                weightIncrement: 2.5,
                repOverloadStep: 2,
                enableProgression: true,
                customRestSeconds: 60,
                notesForExercise: "Palms facing each other throughout the lift."
              }
            ]
          },
          {
            id: 'day_legs_' + Date.now(),
            dayName: "Legs & Core",
            order: 3,
            workoutColor: "#2979FF",
            exercises: [
              {
                id: "ex_legs_1_" + Date.now(),
                exerciseName: "Dumbbell Goblet Squat",
                targetSets: 3,
                minReps: 8,
                maxReps: 12,
                startingWeight: 55,
                weightIncrement: 5,
                repOverloadStep: 2,
                enableProgression: true,
                customRestSeconds: 90,
                notesForExercise: "Hold dumbbell against upper chest, squat below parallel."
              },
              {
                id: "ex_legs_2_" + Date.now(),
                exerciseName: "Dumbbell Romanian Deadlift",
                targetSets: 3,
                minReps: 8,
                maxReps: 12,
                startingWeight: 50,
                weightIncrement: 5,
                repOverloadStep: 2,
                enableProgression: true,
                customRestSeconds: 90,
                notesForExercise: "Soft knees, hinge hips back until hamstrings stretch."
              },
              {
                id: "ex_legs_3_" + Date.now(),
                exerciseName: "Dumbbell Lunge",
                targetSets: 3,
                minReps: 10,
                maxReps: 12,
                startingWeight: 30,
                weightIncrement: 5,
                repOverloadStep: 2,
                enableProgression: true,
                customRestSeconds: 75,
                notesForExercise: "Step forward into a deep lunge with torso upright."
              },
              {
                id: "ex_legs_4_" + Date.now(),
                exerciseName: "Single-Leg Dumbbell Calf Raise",
                targetSets: 3,
                minReps: 12,
                maxReps: 15,
                startingWeight: 30,
                weightIncrement: 5,
                repOverloadStep: 2,
                enableProgression: true,
                customRestSeconds: 60,
                notesForExercise: "Balance on step or plate for full stretch at bottom."
              },
              {
                id: "ex_legs_5_" + Date.now(),
                exerciseName: "Weighted Plank",
                targetSets: 3,
                minReps: 45,
                maxReps: 60,
                startingWeight: 0,
                weightIncrement: 5,
                repOverloadStep: 15,
                enableProgression: true,
                isTimed: true,
                customRestSeconds: 60,
                notesForExercise: "Keep core rigid and glutes engaged throughout."
              }
            ]
          }
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(programsRef, newProgramDoc);
      await fetchAllPrograms();
      await setActiveProgram(docRef.id);
      await loadProgram(docRef.id);
      creationMode.value = null;
      alert("🎉 Default LiftLogic PPL routine copied and set as active!");
    } catch (e: any) {
      alert("Failed to copy default PPL routine: " + e.message);
    } finally {
      isSaving.value = false;
    }
  }
};

const importPastedRoutine = async () => {
  if (!user.value || !user.value.uid) {
    error.value = "You must be logged in to import a routine.";
    return;
  }
  if (!pastedRoutineJson.value.trim()) {
    error.value = "Please paste routine data into the text area.";
    return;
  }

  isSaving.value = true;
  error.value = null;

  try {
    let rawJson = pastedRoutineJson.value.trim();
    // Clean up markdown code block delimiters if present (e.g. ```json ... ```)
    rawJson = rawJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    const importedData = JSON.parse(rawJson);

    if (!importedData || !importedData.programName || !Array.isArray(importedData.workoutDays)) {
        throw new Error("Invalid routine data structure. Missing programName or workoutDays array.");
    }
    
    // Use createProgram to get an ID
    const newId = await createProgram(importedData.programName, importedData.description || "");
    
    // Now update that program with the full workout days
    const programDocRef = doc(db, 'users', user.value.uid, 'trainingPrograms', newId);
    
    const workoutDaysToSave = importedData.workoutDays.map((day: any) => ({
            id: day.id || doc(collection(db, '_')).id,
            dayName: day.dayName || "Unnamed Day",
            order: typeof day.order === 'number' ? day.order : 0,
            color: day.color || null,
            exercises: Array.isArray(day.exercises) ? day.exercises.map((ex: any) => ({
                id: ex.id || doc(collection(db, '_')).id,
                exerciseName: ex.exerciseName || "Unnamed Exercise",
                targetSets: ex.targetSets || 3,
                minReps: ex.minReps || 8,
                maxReps: ex.maxReps || 12,
                repOverloadStep: ex.repOverloadStep || 1,
                weightIncrement: ex.weightIncrement || 5,
                customRestSeconds: (ex.customRestSeconds !== null && ex.customRestSeconds !== undefined && ex.customRestSeconds >=10) ? ex.customRestSeconds : null,
                notesForExercise: ex.notesForExercise || null,
                enableProgression: typeof ex.enableProgression === 'boolean' ? ex.enableProgression : true,
                isTimed: typeof ex.isTimed === 'boolean' ? ex.isTimed : false,
                startingWeight: typeof ex.startingWeight === 'number' ? ex.startingWeight : 45
            })) : []
    }));

    // Prepare batch for creating progress docs
    const batch = writeBatch(db);
    
    // Create new ID for program if I haven't already (actually createProgram above made it)
    // But we need to update it with the days.
    
    // We already have `workoutDaysToSave` prepared above.
    // Let's iterate them to add Progress operations to the batch.
    
    for (const day of workoutDaysToSave) {
        for (const ex of day.exercises) {
            // Check if we have a starting weight to save
            if (ex.startingWeight !== undefined && ex.startingWeight !== null) {
                 const exerciseProgressKey = ex.exerciseName.toLowerCase().replace(/\s+/g, '_');
                 const exerciseProgressRef = doc(db, 'users', user.value.uid, 'exerciseProgress', exerciseProgressKey);
                 
                 // We use set with merge:true or just set?
                 // If it exists, we probably shouldn't overwrite it unless the user explicitly wants to reset?
                 // But this is an IMPORT. Usually implies setting it up. 
                 // However, if they share "Bench Press" with another routine, we generally want to KEEP the existing progress.
                 // Manual add logic (lines 1123-1135) checks if it exists & only sets if NOT exists.
                 // We cannot easily checks existence of ALL inside a loop without many reads.
                 // But we can use `update` and ignore failure? No.
                 // We can use `create`? Firestore doesn't have "create if not exists" easily in batch without reading.
                 
                 // Actually, for bulk import, reading all might be heavy if they import 50 exercises.
                 // But standard routine is ~20 exercises. 20 reads is fine.
                 // Let's read to be safe and avoid overwriting progress for existing exercises.
                 
                 // Note: we can't await inside mapping nicely, so we use a for loop.
            }
        }
    }
    
    // Re-structure the logic to be async friendly
    // We need to read existing progress to avoid overwriting.
    
    // 1. Collect all unique exercise names
    const allExerciseNames = new Set<string>();
    workoutDaysToSave.forEach((d: any) => d.exercises.forEach((e: any) => allExerciseNames.add(e.exerciseName)));
    
    // 2. We could fetch them, but simpler: just loop and getDoc. 
    // It's client side, a few parallel reads is ok.
    
    const progressPromises = [];
    
    // We need to strip `startingWeight` from the config we save to the Program, 
    // because ExerciseConfig doesn't officially support it (though Firestore creates it if we pass it).
    // Types.ts says: startingWeight is only in form model.
    // So strictly we should remove it from `workoutDaysToSave` before updating program, 
    // but use it for the progress creation.
    
    const cleanedWorkoutDaysToSave = workoutDaysToSave.map((day: any) => ({
        ...day,
        exercises: day.exercises.map((ex: any) => {
             const { startingWeight, ...rest } = ex;
             return rest;
        })
    }));

    // Add program update to batch
    batch.update(programDocRef, { workoutDays: cleanedWorkoutDaysToSave });

    // Handle Progress
    const uid = user.value.uid; 
    for (const day of workoutDaysToSave) {
        for (const ex of day.exercises) {
             if (ex.startingWeight !== undefined && ex.startingWeight !== null) {
                 progressPromises.push((async () => {
                     const exerciseProgressKey = ex.exerciseName.toLowerCase().replace(/\s+/g, '_');
                     const exerciseProgressRef = doc(db, 'users', uid, 'exerciseProgress', exerciseProgressKey);
                     const snap = await getDoc(exerciseProgressRef);
                     
                     if (!snap.exists()) {
                         const initialProgressData: ExerciseProgress = {
                            exerciseName: ex.exerciseName, 
                            currentWeightToAttempt: ex.startingWeight,
                            repsToAttemptNext: ex.minReps || 8, 
                            lastWorkoutAllSetsSuccessfulAtCurrentWeight: false,
                            consecutiveFailedWorkoutsAtCurrentWeightAndReps: 0, 
                            lastPerformedDate: null,
                         };
                         batch.set(exerciseProgressRef, initialProgressData);
                     }
                 })());
             }
        }
    }
    
    await Promise.all(progressPromises);
    await batch.commit();
    
    // Load it
    await loadProgram(newId);

    // Reset UI
    pastedRoutineJson.value = '';
    creationMode.value = null;

 } catch (e: any) {
    console.error("Import error:", e);
    error.value = "Failed to import routine. " + (e.message || "Unknown error.");
  } finally {
    isSaving.value = false;
  }
};

const loadSqlJs = async (): Promise<any> => {
  if ((window as any).initSqlJs) return (window as any).initSqlJs;
  
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js';
    script.onload = () => {
      resolve((window as any).initSqlJs);
    };
    script.onerror = (e) => reject(new Error("Failed to load sql.js from CDN. Please check your internet connection."));
    document.head.appendChild(script);
  });
};

const handleFitNotesFile = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) {
    fitnotesFile.value = null;
    fitnotesParsedData.value = null;
    return;
  }
  
  fitnotesFile.value = target.files[0];
  error.value = null;
  isSaving.value = true;
  importProgressStatus.value = "Initializing SQLite parser...";
  
  try {
    const initSqlJs = await loadSqlJs();
    const initSql = await initSqlJs({
      locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
    });
    
    const reader = new FileReader();
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(fitnotesFile.value!);
    });
    
    const uInt8Array = new Uint8Array(arrayBuffer);
    const dbObj = new initSql.Database(uInt8Array);
    
    // Count workouts (unique dates in training_log)
    const workoutsRes = dbObj.exec("SELECT COUNT(DISTINCT date) FROM training_log");
    const workoutsCount = workoutsRes[0]?.values[0]?.[0] || 0;
    
    // Count exercises
    const exercisesRes = dbObj.exec("SELECT COUNT(*) FROM exercise");
    const exercisesCount = exercisesRes[0]?.values[0]?.[0] || 0;
    
    // Count routines
    const routinesRes = dbObj.exec("SELECT COUNT(*) FROM Routine");
    const routinesCount = routinesRes[0]?.values[0]?.[0] || 0;
    
    fitnotesParsedData.value = {
      workoutsCount,
      exercisesCount,
      routinesCount,
      db: dbObj
    };
    
  } catch (e: any) {
    console.error("Error reading FitNotes SQLite backup:", e);
    error.value = "Error reading FitNotes backup: " + e.message;
    fitnotesFile.value = null;
    fitnotesParsedData.value = null;
  } finally {
    isSaving.value = false;
  }
};

const getWords = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
const jaccardSimilarity = (s1: string, s2: string): number => {
  const w1 = new Set(getWords(s1));
  const w2 = new Set(getWords(s2));
  const intersection = new Set([...w1].filter(x => w2.has(x)));
  const union = new Set([...w1, ...w2]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
};

const performFitNotesImport = async () => {
  if (!user.value || !user.value.uid || !fitnotesParsedData.value) {
    error.value = "No data to import.";
    return;
  }
  
  isSaving.value = true;
  error.value = null;
  importProgressStatus.value = "Analyzing exercises...";
  importProgressPercentage.value = 5;
  
  const dbObj = fitnotesParsedData.value.db;
  const uid = user.value.uid;
  
  try {
    // 1. Fetch all exercises and categories from SQLite
    const exerciseQuery = dbObj.exec(`
      SELECT e._id, e.name, c.name as category_name 
      FROM exercise e
      JOIN Category c ON e.category_id = c._id
    `);
    
    const exerciseMap = new Map<number, { name: string, category: string }>();
    if (exerciseQuery.length > 0 && exerciseQuery[0].values) {
      exerciseQuery[0].values.forEach((row: any) => {
        exerciseMap.set(row[0], { name: row[1], category: row[2] });
      });
    }
    
    // Fetch all logs from training_log to inspect history
    const logsQuery = dbObj.exec(`
      SELECT t.date, t.exercise_id, t.metric_weight, t.reps, t.unit, t.is_personal_record, t.distance, t.duration_seconds, wt.start_date_time, wt.end_date_time
      FROM training_log t
      LEFT JOIN WorkoutTime wt ON t.date = wt.workout_date
      ORDER BY t.date ASC, t._id ASC
    `);
    
    interface FitNotesSqlRow {
      dateStr: string;
      exerciseId: number;
      weightLbs: number;
      reps: number;
      isPR: boolean;
      distance: number;
      durationSeconds: number;
      startTimeStr?: string;
      endTimeStr?: string;
    }
    
    const rawLogs: FitNotesSqlRow[] = [];
    if (logsQuery.length > 0 && logsQuery[0].values && logsQuery[0].values.length > 0) {
      logsQuery[0].values.forEach((row: any) => {
        const dateStr = row[0];
        const exerciseId = row[1];
        const metricWeight = row[2];
        const reps = row[3];
        const unit = row[4];
        const isPR = row[5] === 1;
        const distance = row[6] || 0;
        const durationSeconds = row[7] || 0;
        const startTimeStr = row[8] || undefined;
        const endTimeStr = row[9] || undefined;
        
        // Convert metricWeight (kg) to LBS
        const weightLbs = Math.round(metricWeight * 2.20462262 * 100) / 100;
        
        rawLogs.push({
          dateStr,
          exerciseId,
          weightLbs,
          reps,
          isPR,
          distance,
          durationSeconds,
          startTimeStr,
          endTimeStr
        });
      });
    }
    
    // Group logs by Date
    const logsByDate = new Map<string, FitNotesSqlRow[]>();
    rawLogs.forEach(row => {
      if (!logsByDate.has(row.dateStr)) {
        logsByDate.set(row.dateStr, []);
      }
      logsByDate.get(row.dateStr)!.push(row);
    });
    
    const datesSorted = Array.from(logsByDate.keys()).sort();
    
    // 2. Fetch routines from SQLite
    const routinesQuery = dbObj.exec("SELECT _id, name, notes FROM Routine");
    const importedRoutines: TrainingProgram[] = [];
    const workoutDaysToSaveList: { programId: string, days: WorkoutDay[] }[] = [];
    
    if (routinesQuery.length > 0 && routinesQuery[0].values && routinesQuery[0].values.length > 0) {
      importProgressStatus.value = "Importing routines...";
      importProgressPercentage.value = 10;
      
      for (const rRow of routinesQuery[0].values) {
        const routineId = rRow[0];
        const routineName = rRow[1];
        const routineNotes = rRow[2] || '';
        
        // Fetch sections for this routine
        const sectionsQuery = dbObj.exec(`
          SELECT _id, name, sort_order 
          FROM RoutineSection 
          WHERE routine_id = ${routineId}
          ORDER BY sort_order ASC
        `);
        
        const workoutDays: WorkoutDay[] = [];
        if (sectionsQuery.length > 0 && sectionsQuery[0].values && sectionsQuery[0].values.length > 0) {
          for (const sRow of sectionsQuery[0].values) {
            const sectionId = sRow[0];
            const sectionName = sRow[1];
            const sectionOrder = sRow[2];
            
            // Fetch exercises for this section
            const rseQuery = dbObj.exec(`
              SELECT rse._id, rse.exercise_id, rse.sort_order
              FROM RoutineSectionExercise rse
              WHERE rse.routine_section_id = ${sectionId}
              ORDER BY rse.sort_order ASC
            `);
            
            const exercises: ExerciseConfigForDisplay[] = [];
            if (rseQuery.length > 0 && rseQuery[0].values && rseQuery[0].values.length > 0) {
              for (const rseRow of rseQuery[0].values) {
                const rseId = rseRow[0];
                const exerciseId = rseRow[1];
                const exDetails = exerciseMap.get(exerciseId);
                if (!exDetails) continue;
                
                // Fuzzy match to check if this routine exercise exists under a slightly different name in the logs
                const hasLogs = rawLogs.some(l => l.exerciseId === exerciseId);
                let chosenExerciseName = exDetails.name;
                
                if (!hasLogs) {
                  let bestMatchName = exDetails.name;
                  let maxSimilarity = 0;
                  
                  exerciseMap.forEach((otherExDetails, otherExId) => {
                    const otherHasLogs = rawLogs.some(l => l.exerciseId === otherExId);
                    if (otherHasLogs) {
                      const sim = jaccardSimilarity(exDetails.name, otherExDetails.name);
                      if (sim > maxSimilarity) {
                        maxSimilarity = sim;
                        bestMatchName = otherExDetails.name;
                      }
                    }
                  });
                  
                  if (maxSimilarity >= 0.50) {
                    chosenExerciseName = bestMatchName;
                  }
                }
                
                // Fetch sets in this routine exercise
                const setsQuery = dbObj.exec(`
                  SELECT metric_weight, reps, sort_order, unit
                  FROM RoutineSectionExerciseSet
                  WHERE routine_section_exercise_id = ${rseId}
                  ORDER BY sort_order ASC
                `);
                
                let targetSets = 3;
                let avgReps = 10;
                let startingWeight = 45;
                
                if (setsQuery.length > 0 && setsQuery[0].values && setsQuery[0].values.length > 0) {
                  targetSets = setsQuery[0].values.length;
                  const repsList = setsQuery[0].values.map((s: any) => s[1]);
                  avgReps = Math.round(repsList.reduce((a: number, b: number) => a + b, 0) / repsList.length) || 10;
                  
                  // Convert weight from kg to lbs
                  const weightsLbs = setsQuery[0].values.map((s: any) => s[0] * 2.20462262);
                  startingWeight = weightsLbs.length > 0 ? Math.round(weightsLbs[0] * 10) / 10 : 45;
                }
                
                let minReps = 8;
                let maxReps = 12;
                if (avgReps <= 5) { minReps = 5; maxReps = 5; }
                else if (avgReps <= 8) { minReps = 6; maxReps = 8; }
                else if (avgReps <= 10) { minReps = 8; maxReps = 10; }
                else if (avgReps <= 12) { minReps = 8; maxReps = 12; }
                else { minReps = 10; maxReps = 15; }
                
                const newExId = doc(collection(db, '_')).id;
                exercises.push({
                  id: newExId,
                  exerciseName: chosenExerciseName,
                  targetSets,
                  minReps,
                  maxReps,
                  repOverloadStep: 2,
                  weightIncrement: 5,
                  customRestSeconds: null,
                  notesForExercise: null,
                  enableProgression: true,
                  isTimed: false,
                  startingWeight
                } as any);
              }
            }
            
            const newDayId = doc(collection(db, '_')).id;
            workoutDays.push({
              id: newDayId,
              dayName: sectionName,
              order: sectionOrder + 1,
              color: daySequenceColorPalette[workoutDays.length % daySequenceColorPalette.length] || '#10B981',
              exercises
            });
          }
        }
        
        const newProgramId = doc(collection(db, '_')).id;
        importedRoutines.push({
          id: newProgramId,
          programName: routineName,
          description: routineNotes || `Imported from FitNotes routine on ${new Date().toLocaleDateString()}`,
          workoutDays
        });
        
        workoutDaysToSaveList.push({ programId: newProgramId, days: workoutDays });
      }
    }
    
    // Logs and datesSorted are already prepared at the beginning of the function
    
    // Fallback: If no routines defined in SQLite, run Jaccard clustering on history
    if (importedRoutines.length === 0 && datesSorted.length > 0) {
      importProgressStatus.value = "Reconstructing routines from history...";
      importProgressPercentage.value = 15;
      
      const workoutDaySignatures = datesSorted.map(dateStr => {
        const rows = logsByDate.get(dateStr)!;
        const exNames = rows.map(r => exerciseMap.get(r.exerciseId)?.name).filter(Boolean) as string[];
        return {
          dateStr,
          exercises: [...new Set(exNames)]
        };
      }).filter(s => s.exercises.length >= 2);
      
      const clusters: { exercises: Set<string>; dates: string[]; dayName: string }[] = [];
      
      workoutDaySignatures.forEach(sig => {
        const sigSet = new Set(sig.exercises);
        let bestMatchIdx = -1;
        let maxSim = 0;
        
        clusters.forEach((c, idx) => {
          const intersection = new Set([...sigSet].filter(x => c.exercises.has(x)));
          const union = new Set([...sigSet, ...c.exercises]);
          const sim = intersection.size / union.size;
          if (sim > maxSim) {
            maxSim = sim;
            bestMatchIdx = idx;
          }
        });
        
        if (maxSim >= 0.45 && bestMatchIdx !== -1) {
          sig.exercises.forEach(e => clusters[bestMatchIdx].exercises.add(e));
          clusters[bestMatchIdx].dates.push(sig.dateStr);
        } else {
          clusters.push({
            exercises: sigSet,
            dates: [sig.dateStr],
            dayName: ''
          });
        }
      });
      
      const topClusters = clusters.sort((a, b) => b.dates.length - a.dates.length).slice(0, 6);
      
      // Name clusters based on category
      topClusters.forEach((c, index) => {
        const categoryCounts: { [key: string]: number } = {};
        let totalCount = 0;
        
        c.dates.forEach(dateStr => {
          const rows = logsByDate.get(dateStr)!;
          rows.forEach(r => {
            const exDetails = exerciseMap.get(r.exerciseId);
            if (exDetails && c.exercises.has(exDetails.name)) {
              categoryCounts[exDetails.category] = (categoryCounts[exDetails.category] || 0) + 1;
              totalCount++;
            }
          });
        });
        
        let primaryCategory = '';
        let maxPct = 0;
        for (const cat in categoryCounts) {
          const pct = categoryCounts[cat] / totalCount;
          if (pct > maxPct) {
            maxPct = pct;
            primaryCategory = cat;
          }
        }
        
        if (maxPct >= 0.5 && primaryCategory) {
          if (['chest', 'shoulders', 'triceps'].includes(primaryCategory.toLowerCase())) {
            c.dayName = `Push (${primaryCategory})`;
          } else if (['back', 'biceps'].includes(primaryCategory.toLowerCase())) {
            c.dayName = `Pull (${primaryCategory})`;
          } else if (['legs', 'quads', 'calves', 'glutes', 'hamstrings'].includes(primaryCategory.toLowerCase())) {
            c.dayName = `Legs (${primaryCategory})`;
          } else {
            c.dayName = `${primaryCategory} Day`;
          }
        } else {
          c.dayName = `Imported Session ${String.fromCharCode(65 + index)}`;
        }
      });
      
      if (topClusters.length === 0) {
        const allExNames = new Set<string>();
        exerciseMap.forEach(v => allExNames.add(v.name));
        topClusters.push({
          exercises: allExNames,
          dates: datesSorted,
          dayName: 'Imported Session A'
        });
      }
      
      const fallbackWorkoutDays = topClusters.map((c, index) => {
        const dayId = doc(collection(db, '_')).id;
        
        const exercises: ExerciseConfigForDisplay[] = Array.from(c.exercises).map(exName => {
          const exId = doc(collection(db, '_')).id;
          
          const setCounts: number[] = [];
          const repsList: number[] = [];
          
          c.dates.forEach(dateStr => {
            const rows = logsByDate.get(dateStr)!;
            const exRows = rows.filter(r => exerciseMap.get(r.exerciseId)?.name === exName);
            if (exRows.length > 0) {
              setCounts.push(exRows.length);
              exRows.forEach(r => repsList.push(r.reps));
            }
          });
          
          const setCountsFreq: { [key: number]: number } = {};
          setCounts.forEach(c => setCountsFreq[c] = (setCountsFreq[c] || 0) + 1);
          let targetSets = 3;
          let maxSetsFreq = 0;
          for (const count in setCountsFreq) {
            if (setCountsFreq[count] > maxSetsFreq) {
              maxSetsFreq = setCountsFreq[count];
              targetSets = parseInt(count);
            }
          }
          
          const avgReps = repsList.length > 0 ? Math.round(repsList.reduce((a: number, b: number) => a + b, 0) / repsList.length) : 10;
          let minReps = 8;
          let maxReps = 12;
          if (avgReps <= 5) { minReps = 5; maxReps = 5; }
          else if (avgReps <= 8) { minReps = 6; maxReps = 8; }
          else if (avgReps <= 10) { minReps = 8; maxReps = 10; }
          else if (avgReps <= 12) { minReps = 8; maxReps = 12; }
          else { minReps = 10; maxReps = 15; }
          
          return {
            id: exId,
            exerciseName: exName,
            targetSets,
            minReps,
            maxReps,
            repOverloadStep: 2,
            weightIncrement: 5,
            customRestSeconds: null,
            notesForExercise: null,
            enableProgression: true,
            isTimed: false
          };
        });
        
        return {
          id: dayId,
          dayName: c.dayName,
          order: index + 1,
          color: daySequenceColorPalette[index % daySequenceColorPalette.length] || '#10B981',
          exercises
        };
      });
      
      const fallbackProgramId = doc(collection(db, '_')).id;
      importedRoutines.push({
        id: fallbackProgramId,
        programName: "Imported from FitNotes",
        description: `Automatically reconstructed on ${new Date().toLocaleDateString()} from your FitNotes log.`,
        workoutDays: fallbackWorkoutDays
      });
      
      workoutDaysToSaveList.push({ programId: fallbackProgramId, days: fallbackWorkoutDays });
    }
    
    // Save all training programs to Firestore
    importProgressStatus.value = "Saving routines...";
    importProgressPercentage.value = 25;
    
    for (const prog of importedRoutines) {
      const progDocRef = doc(db, 'users', uid, 'trainingPrograms', prog.id!);
      const daysToSave = prog.workoutDays.map(day => ({
        ...day,
        exercises: day.exercises.map(ex => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { currentPrescribedReps, currentPrescribedWeight, startingWeight, ...config } = ex as any;
          return config as ExerciseConfig;
        })
      }));
      
      await setDoc(progDocRef, {
        programName: prog.programName,
        description: prog.description,
        workoutDays: daysToSave,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    // Set first routine as active if none is set
    if (!settings.value.activeProgramId && importedRoutines.length > 0) {
      await saveSettings({ activeProgramId: importedRoutines[0].id });
    }
    
    // 3. Import Workout Logs History
    importProgressStatus.value = "Preparing workout history...";
    importProgressPercentage.value = 35;
    
    const loggedWorkoutsToSave: LoggedWorkout[] = [];
    const mainProgram = importedRoutines[0];
    const mainDays = mainProgram ? mainProgram.workoutDays : [];
    
    datesSorted.forEach(dateStr => {
      const rows = logsByDate.get(dateStr)!;
      const workoutId = doc(collection(db, '_')).id;
      
      // Group rows by exerciseId to aggregate sets
      const exerciseRowsMap = new Map<number, FitNotesSqlRow[]>();
      rows.forEach(r => {
        if (!exerciseRowsMap.has(r.exerciseId)) {
          exerciseRowsMap.set(r.exerciseId, []);
        }
        exerciseRowsMap.get(r.exerciseId)!.push(r);
      });
      
      // Determine best day match in the routine
      let bestDayMatch = mainDays[0];
      let maxOverlap = 0;
      const workoutExNames = Array.from(exerciseRowsMap.keys()).map(id => exerciseMap.get(id)?.name).filter(Boolean) as string[];
      
      mainDays.forEach(day => {
        const dayExNames = day.exercises.map(e => e.exerciseName);
        const overlap = workoutExNames.filter(name => dayExNames.includes(name)).length;
        if (overlap > maxOverlap) {
          maxOverlap = overlap;
          bestDayMatch = day;
        }
      });
      
      const performedExercises: PerformedExerciseInLog[] = [];
      exerciseRowsMap.forEach((exRows, exerciseId) => {
        const exDetails = exerciseMap.get(exerciseId);
        if (!exDetails) return;
        
        const matchedEx = bestDayMatch?.exercises.find(e => e.exerciseName === exDetails.name);
        const newExId = matchedEx ? matchedEx.id : doc(collection(db, '_')).id;
        
        const sets: LoggedSetData[] = exRows.map((r, index) => {
          return {
            exerciseId: newExId,
            exerciseName: exDetails.name,
            setNumber: index + 1,
            prescribedWeight: r.weightLbs,
            prescribedReps: r.reps,
            actualWeight: r.weightLbs,
            actualReps: r.reps,
            status: 'done',
            timestamp: new Date(dateStr)
          };
        });
        
        performedExercises.push({
          exerciseId: newExId,
          exerciseName: exDetails.name,
          sets
        });
      });
      
      // Extract start / end time if present
      const sampleRow = rows[0];
      let startTime: Date | undefined = undefined;
      let endTime: Date | undefined = undefined;
      let durationMinutes: number | undefined = undefined;
      
      if (sampleRow.startTimeStr && sampleRow.endTimeStr) {
        startTime = new Date(sampleRow.startTimeStr);
        endTime = new Date(sampleRow.endTimeStr);
        durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
      }
      
      const workoutDoc: LoggedWorkout = {
        id: workoutId,
        userId: uid,
        date: new Date(dateStr),
        trainingProgramIdUsed: mainProgram ? mainProgram.id! : 'fitnotes_imported',
        workoutDayNameUsed: bestDayMatch ? bestDayMatch.dayName : 'Imported Workout',
        workoutDayIdUsed: bestDayMatch ? bestDayMatch.id : 'imported_day',
        performedExercises,
        trainingProgramNameUsed: mainProgram ? mainProgram.programName : 'Imported Routine'
      };
      
      if (startTime) workoutDoc.startTime = startTime;
      if (endTime) workoutDoc.endTime = endTime;
      if (durationMinutes !== undefined) workoutDoc.durationMinutes = durationMinutes;
      
      loggedWorkoutsToSave.push(workoutDoc);
    });
    
    // Save history in chunked batches
    importProgressStatus.value = "Saving workout history...";
    const totalWorkouts = loggedWorkoutsToSave.length;
    
    for (let i = 0; i < loggedWorkoutsToSave.length; i += 400) {
      const chunk = loggedWorkoutsToSave.slice(i, i + 400);
      const batch = writeBatch(db);
      
      chunk.forEach(workout => {
        const ref = doc(db, 'users', uid, 'loggedWorkouts', workout.id);
        batch.set(ref, workout);
      });
      
      await batch.commit();
      
      const pct = Math.round(35 + (i / totalWorkouts) * 40);
      importProgressPercentage.value = pct;
      importProgressStatus.value = `Saving workout history (${Math.min(i + chunk.length, totalWorkouts)} of ${totalWorkouts})...`;
    }
    
    // 4. Compute and save exercise progress docs
    importProgressStatus.value = "Computing exercise progress...";
    importProgressPercentage.value = 75;
    
    const exerciseConfigsMap = new Map<string, ExerciseConfig>();
    workoutDaysToSaveList.forEach(item => {
      item.days.forEach(day => {
        day.exercises.forEach(ex => {
          if (!exerciseConfigsMap.has(ex.exerciseName)) {
            exerciseConfigsMap.set(ex.exerciseName, ex);
          }
        });
      });
    });
    
    const progressDocsToSet: { ref: any, data: ExerciseProgress }[] = [];
    exerciseMap.forEach((exDetails, exerciseId) => {
      const exLogs = rawLogs.filter(l => l.exerciseId === exerciseId);
      if (exLogs.length === 0) return;
      
      const lastDate = exLogs[exLogs.length - 1].dateStr;
      const lastExLogs = exLogs.filter(l => l.dateStr === lastDate);
      
      let maxWeight = 0;
      let setsAtMaxWeight: FitNotesSqlRow[] = [];
      lastExLogs.forEach(l => {
        if (l.weightLbs > maxWeight) {
          maxWeight = l.weightLbs;
          setsAtMaxWeight = [l];
        } else if (l.weightLbs === maxWeight) {
          setsAtMaxWeight.push(l);
        }
      });
      
      const minRepsAtMaxWeight = setsAtMaxWeight.length > 0 ? Math.min(...setsAtMaxWeight.map(l => l.reps)) : 0;
      
      const exConfig = exerciseConfigsMap.get(exDetails.name) || {
        minReps: 8,
        maxReps: 12,
        weightIncrement: 5,
        repOverloadStep: 2,
        targetSets: 3
      };
      
      const configMinReps = exConfig.minReps || 8;
      const configMaxReps = exConfig.maxReps || 12;
      const configWeightIncr = exConfig.weightIncrement || 5;
      const configRepStep = exConfig.repOverloadStep || 2;
      
      let currentWeightToAttempt = maxWeight;
      let repsToAttemptNext = configMinReps;
      let consecutiveFailedWorkoutsAtCurrentWeightAndReps = 0;
      let lastWorkoutAllSetsSuccessfulAtCurrentWeight = false;
      
      if (minRepsAtMaxWeight >= configMaxReps) {
        currentWeightToAttempt = maxWeight + configWeightIncr;
        repsToAttemptNext = configMinReps;
        lastWorkoutAllSetsSuccessfulAtCurrentWeight = true;
      } else if (minRepsAtMaxWeight < configMinReps) {
        currentWeightToAttempt = maxWeight;
        repsToAttemptNext = configMinReps;
        consecutiveFailedWorkoutsAtCurrentWeightAndReps = 1;
        lastWorkoutAllSetsSuccessfulAtCurrentWeight = false;
      } else {
        currentWeightToAttempt = maxWeight;
        repsToAttemptNext = Math.min(minRepsAtMaxWeight + configRepStep, configMaxReps);
        lastWorkoutAllSetsSuccessfulAtCurrentWeight = true;
      }
      
      const exerciseProgressKey = exDetails.name.toLowerCase().replace(/\s+/g, '_');
      const progressRef = doc(db, 'users', uid, 'exerciseProgress', exerciseProgressKey);
      
      progressDocsToSet.push({
        ref: progressRef,
        data: {
          exerciseName: exDetails.name,
          currentWeightToAttempt,
          repsToAttemptNext,
          lastWorkoutAllSetsSuccessfulAtCurrentWeight,
          consecutiveFailedWorkoutsAtCurrentWeightAndReps,
          lastPerformedDate: Timestamp.fromDate(new Date(lastDate))
        }
      });
    });
    
    // Save progress docs in batches
    importProgressStatus.value = "Saving exercise progress docs...";
    const totalProgress = progressDocsToSet.length;
    
    for (let i = 0; i < progressDocsToSet.length; i += 400) {
      const chunk = progressDocsToSet.slice(i, i + 400);
      const batch = writeBatch(db);
      
      chunk.forEach(item => {
        batch.set(item.ref, item.data);
      });
      
      await batch.commit();
      
      const pct = Math.round(75 + (i / totalProgress) * 15);
      importProgressPercentage.value = pct;
      importProgressStatus.value = `Saving progress docs (${Math.min(i + chunk.length, totalProgress)} of ${totalProgress})...`;
    }
    
    // 5. Rebuild history index
    importProgressStatus.value = "Rebuilding calendar history index...";
    importProgressPercentage.value = 90;
    
    invalidateWorkoutCache();
    await rebuildCalendarIndex(true); // Rebuild calendar index from history
    
    importProgressPercentage.value = 100;
    importProgressStatus.value = "Done!";
    
    // Switch to first imported program
    if (importedRoutines.length > 0) {
      await loadProgram(importedRoutines[0].id!);
    }
    
    // Close SQLite db
    dbObj.close();
    
    // Reset states
    fitnotesFile.value = null;
    fitnotesParsedData.value = null;
    creationMode.value = null;
    
    setTimeout(() => {
      window.location.reload();
    }, 1500);
    
  } catch (e: any) {
    console.error("FitNotes import failed:", e);
    error.value = "FitNotes import failed: " + e.message;
  } finally {
    isSaving.value = false;
  }
};

const addWorkoutDayToList = async () => {
  if (!user.value || !user.value.uid || !activeProgram.id) { error.value = 'No active routine or user.'; return; }
  if (!newWorkoutDayName.value.trim()) { error.value = 'Day name is required.'; return; }
  isSaving.value = true; error.value = null;
  const newDayId = doc(collection(db, '_')).id;
  const newOrder = activeProgram.workoutDays.length + 1;
  const dayToAdd: WorkoutDay = { 
    id: newDayId, 
    dayName: newWorkoutDayName.value.trim(), 
    order: newOrder, 
    exercises: [],
    color: newWorkoutDayColor.value
  };
  const updatedWorkoutDaysList = [...activeProgram.workoutDays, dayToAdd];
  try {
    const programDocRef = doc(db, 'users', user.value.uid, 'trainingPrograms', activeProgram.id);
    const workoutDaysToSave = updatedWorkoutDaysList.map(day => ({
      ...day, exercises: day.exercises.map(ex => {
        const { currentPrescribedReps, currentPrescribedWeight, ...config } = ex; return config as ExerciseConfig;
      })
    }));
    await updateDoc(programDocRef, { workoutDays: workoutDaysToSave, updatedAt: serverTimestamp() });
    activeProgram.workoutDays = updatedWorkoutDaysList;
    newWorkoutDayName.value = ''; addingNewDay.value = false;
  } catch (e: any) { error.value = "Failed to add workout day. " + e.message; }
  finally { isSaving.value = false; }
};

const removeWorkoutDay = async (dayIdToRemove: string) => {
  if (!user.value || !user.value.uid || !activeProgram.id) return;
  if (!confirm(`Remove this workout day and all its exercises from the routine?`)) return;
  isSaving.value = true; error.value = null;
  let updatedWorkoutDaysList = activeProgram.workoutDays.filter(day => day.id !== dayIdToRemove);
  updatedWorkoutDaysList = updatedWorkoutDaysList.map((day, index) => ({ ...day, order: index + 1 }));
  try {
    const programDocRef = doc(db, 'users', user.value.uid, 'trainingPrograms', activeProgram.id);
    const workoutDaysToSave = updatedWorkoutDaysList.map(day => ({
      ...day, exercises: day.exercises.map(ex => {
        const { currentPrescribedReps, currentPrescribedWeight, ...config } = ex; return config as ExerciseConfig;
      })
    }));
    await updateDoc(programDocRef, { workoutDays: workoutDaysToSave, updatedAt: serverTimestamp() });
    activeProgram.workoutDays = updatedWorkoutDaysList;
    if (editingDayNameId.value === dayIdToRemove) cancelEditWorkoutDayName();
    if (editingExerciseDayId.value === dayIdToRemove) cancelAddOrEditExercise();
  } catch (e: any) { error.value = "Failed to remove workout day. " + e.message; }
  finally { isSaving.value = false; }
};

const toggleSuperset = async (dayId: string, exerciseIndex: number) => {
    if (!user.value || !user.value.uid || !activeProgram.id) return;
    const day = activeProgram.workoutDays.find(d => d.id === dayId);
    if (!day || !day.exercises) return;
    
    // Cannot make first exercise a superset slave
    if (exerciseIndex === 0) return;

    const exercise = day.exercises[exerciseIndex];
    if (!exercise) return;

    const newStatus = !exercise.isSupersetWithPrevious;
    
    // If enabling superset, we must match the sets of the previous exercise
    let updatedSets = exercise.targetSets;
    if (newStatus) {
        const prevExercise = day.exercises[exerciseIndex - 1];
        if (prevExercise) {
            updatedSets = prevExercise.targetSets;
        }
    }

    isSaving.value = true;
    try {
        const programDocRef = doc(db, 'users', user.value.uid, 'trainingPrograms', activeProgram.id);
        
        // Update local state first for responsiveness
        exercise.isSupersetWithPrevious = newStatus;
        if (newStatus) exercise.targetSets = updatedSets;

        const newWorkoutDaysArray = activeProgram.workoutDays.map(d => {
             if (d.id === dayId) {
                 return {
                     ...d,
                     exercises: d.exercises.map((ex, idx) => {
                         if (idx === exerciseIndex) {
                             return { ...ex, isSupersetWithPrevious: newStatus, targetSets: updatedSets };
                         }
                         return ex;
                     })
                 };
             }
             return d;
        });
        
        const workoutDaysToSave = newWorkoutDaysArray.map(day => ({
          ...day, exercises: day.exercises.map(ex => {
            const { currentPrescribedReps, currentPrescribedWeight, ...config } = ex; return config as ExerciseConfig;
          })
        }));

        await updateDoc(programDocRef, { workoutDays: workoutDaysToSave, updatedAt: serverTimestamp() });
        activeProgram.workoutDays = newWorkoutDaysArray;

    } catch (e: any) {
        error.value = "Failed to update superset status: " + e.message;
        // Revert local change on error
        exercise.isSupersetWithPrevious = !newStatus;
    } finally {
        isSaving.value = false;
    }
};

const onExerciseDragChange = async (dayId: string) => {
    if (!user.value || !user.value.uid || !activeProgram.id) return;
  
    // Sanitize Superset Status after reorder
    const day = activeProgram.workoutDays.find(d => d.id === dayId);
    if (day && day.exercises) {
        if (day.exercises.length > 0) {
            // First item cannot be superset
            if (day.exercises[0].isSupersetWithPrevious) {
                day.exercises[0].isSupersetWithPrevious = false;
            }
            
            for (let i = 1; i < day.exercises.length; i++) {
                const ex = day.exercises[i];
                if (ex.isSupersetWithPrevious) {
                    const prev = day.exercises[i-1];
                    if (ex.targetSets !== prev.targetSets) {
                        ex.targetSets = prev.targetSets;
                    }
                }
            }
        }
    }

    isSaving.value = true; error.value = null;
    
    try {
        const programDocRef = doc(db, 'users', user.value.uid, 'trainingPrograms', activeProgram.id);
        const workoutDaysToSave = activeProgram.workoutDays.map(d => ({
        ...d, exercises: d.exercises.map(ex => {
            const { currentPrescribedReps, currentPrescribedWeight, ...config } = ex; return config as ExerciseConfig;
        })
        }));
        await updateDoc(programDocRef, { workoutDays: workoutDaysToSave, updatedAt: serverTimestamp() });
    } catch (e: any) { error.value = "Failed to save exercise order. " + e.message; }
    finally { isSaving.value = false; }
};

// --- Drag and Drop Grouping Logic ---
const draggedSlaveId = ref<string | null>(null);

const onExerciseDragStart = (dayId: string, evt: any) => {
    const day = activeProgram.workoutDays.find(d => d.id === dayId);
    if (!day) return;
    
    // Check if the item we are dragging is a Master (i.e., the NEXT item is a Slave)
    const oldIndex = evt.oldIndex;
    if (day.exercises && day.exercises.length > oldIndex + 1) {
        const potentialSlave = day.exercises[oldIndex + 1];
        if (potentialSlave.isSupersetWithPrevious) {
            draggedSlaveId.value = potentialSlave.id;
        } else {
            draggedSlaveId.value = null;
        }
    } else {
        draggedSlaveId.value = null;
    }
};

const onExerciseDragEnd = (dayId: string, evt: any) => {
    const day = activeProgram.workoutDays.find(d => d.id === dayId);
    if (!day || !day.exercises) return;

    // If we dragged a Master, we must move its Slave to follow it
    if (draggedSlaveId.value) {
        const slaveIndex = day.exercises.findIndex(e => e.id === draggedSlaveId.value);
        if (slaveIndex !== -1) {
             const masterNewIndex = evt.newIndex;
             // Logic to handle indices shift if slave was before master (unlikely for slave)
             // But if we move master UP, slave is "below" it, so slave index is > master index.
             // If we move master DOWN, slave is "above" it? No, slave follows master.
             
             // Simple removal and re-insertion based on Current indices.
             
             const [slave] = day.exercises.splice(slaveIndex, 1);
             
             let targetInsertIndex = masterNewIndex + 1;
             if (slaveIndex < masterNewIndex) {
                 // If we removed something from BEFORE the insertion point, the insertion point index must decrement
                 targetInsertIndex -= 1;
             }
             
             // Safety bounds
             if (targetInsertIndex > day.exercises.length) targetInsertIndex = day.exercises.length;
             
             day.exercises.splice(targetInsertIndex, 0, slave);

             // CRITICAL: Restore the link status, because intermediate states (e.g. validtion during drag)
             // might have stripped it if the slave was temporarily orphaned or at index 0.
             slave.isSupersetWithPrevious = true;
        }
        draggedSlaveId.value = null;
    }
    
    // Always validate linkage (fix orphans etc)
    onExerciseDragChange(dayId);
};

const startEditWorkoutDayName = (day: WorkoutDay) => {
  cancelAddOrEditExercise(); 
  editingDayNameId.value = day.id; 
  editableDayName.value = day.dayName;
  editableDayColor.value = day.color || daySequenceColorPalette[(day.order - 1) % daySequenceColorPalette.length] || '#10B981';
};
const cancelEditWorkoutDayName = () => { 
  editingDayNameId.value = null; 
  editableDayName.value = ''; 
  editableDayColor.value = '#10B981';
};

const saveWorkoutDayName = async (dayIdToSave: string) => {
  if (!user.value || !user.value.uid || !activeProgram.id) return;
  if (!editableDayName.value.trim()) { error.value = "Day name cannot be empty."; return; }
  isSaving.value = true; error.value = null;
  const updatedWorkoutDaysList = activeProgram.workoutDays.map(d =>
    d.id === dayIdToSave ? { ...d, dayName: editableDayName.value.trim(), color: editableDayColor.value } : d
  );
  try {
    const programDocRef = doc(db, 'users', user.value.uid, 'trainingPrograms', activeProgram.id);
    const workoutDaysToSave = updatedWorkoutDaysList.map(day => ({
      ...day, exercises: day.exercises.map(ex => {
        const { currentPrescribedReps, currentPrescribedWeight, ...config } = ex; return config as ExerciseConfig;
      })
    }));
    await updateDoc(programDocRef, { workoutDays: workoutDaysToSave, updatedAt: serverTimestamp() });
    activeProgram.workoutDays = updatedWorkoutDaysList;
    cancelEditWorkoutDayName();
  } catch (e: any) { error.value = "Failed to update day name. " + e.message; }
  finally { isSaving.value = false; }
};

const resetEditingExerciseForm = () => {
  Object.assign(editingExercise, {
    id: undefined, exerciseName: '', targetSets: 3, minReps: 8, maxReps: 12, repOverloadStep: 2,
    weightIncrement: 5, customRestSeconds: undefined, notesForExercise: '', enableProgression: true,
    isTimed: false,
    startingWeight: 45, currentWeightToDisplayOrEdit: undefined, currentRepsToDisplayOrEdit: undefined,
    isSupersetWithPrevious: false,
  });
};

const prepareAddExerciseToDay = (dayId: string) => {
  cancelAddOrEditExercise(); cancelEditWorkoutDayName();
  addingExerciseToDayId.value = dayId; editingExerciseDayId.value = dayId;
  resetEditingExerciseForm();
};

const startEditExercise = async (dayId: string, exerciseToEdit: ExerciseConfigForDisplay) => {
  const isCurrentlyEditingThis = editingExerciseDayId.value === dayId && editingExercise.id === exerciseToEdit.id;

  if (isCurrentlyEditingThis) {
    cancelAddOrEditExercise(); // This will clear editingExercise.id, thus closing the form
    // You might optionally call cancelEditWorkoutDayName() here if you want to ensure
    // day name editing also cancels, though it's likely not what's active.
  } else {
    // If a different exercise is being edited, or "add new" is open, or day name is being edited, cancel them.
    cancelAddOrEditExercise();
    cancelEditWorkoutDayName();

    // Proceed to open/populate the form for the clicked exercise
    editingExerciseDayId.value = dayId;
    editingExercise.id = exerciseToEdit.id; // This ID makes it an "edit" context
    editingExercise.exerciseName = exerciseToEdit.exerciseName || '';
    editingExercise.targetSets = exerciseToEdit.targetSets || 3;
    editingExercise.minReps = exerciseToEdit.minReps || 8;
    editingExercise.maxReps = exerciseToEdit.maxReps || 12;
    editingExercise.repOverloadStep = exerciseToEdit.repOverloadStep || 1;
    editingExercise.weightIncrement = exerciseToEdit.weightIncrement || 5;
    editingExercise.customRestSeconds = exerciseToEdit.customRestSeconds ?? undefined; // Use ?? for null/undefined
    editingExercise.notesForExercise = exerciseToEdit.notesForExercise || '';
    editingExercise.enableProgression = exerciseToEdit.enableProgression !== false;
    editingExercise.enableProgression = exerciseToEdit.enableProgression !== false;
    editingExercise.isTimed = exerciseToEdit.isTimed === true;
    editingExercise.isSupersetWithPrevious = exerciseToEdit.isSupersetWithPrevious === true;
    
    // Convert to display units
    editingExercise.weightIncrement = toDisplay(exerciseToEdit.weightIncrement, settings.value.weightUnit);
    editingExercise.startingWeight = toDisplay((exerciseToEdit as any).startingWeight, settings.value.weightUnit);
    
    // We already have the current prescriptions from fetchWorkoutData if they exist 
    editingExercise.currentWeightToDisplayOrEdit = toDisplay(exerciseToEdit.currentPrescribedWeight, settings.value.weightUnit);
    editingExercise.currentRepsToDisplayOrEdit = exerciseToEdit.currentPrescribedReps;
    // Note: startingWeight is not used when editing an existing exercise's config,
    // but it might be populated if the exercise was newly added and then immediately edited.
    // The line below ensures it's cleared if it's an existing exercise being edited.
    if (exerciseToEdit.id) { // Only clear if it's an existing exercise
        editingExercise.startingWeight = undefined; 
    }

    // Fallback for fetching progress data if not available on exerciseToEdit or needs refresh
    if ((editingExercise.currentWeightToDisplayOrEdit === undefined || editingExercise.currentRepsToDisplayOrEdit === undefined) &&
        user.value && user.value.uid && exerciseToEdit.exerciseName) {
      const progressKey = exerciseToEdit.exerciseName.toLowerCase().replace(/\s+/g, '_');
      const progressDocRef = doc(db, 'users', user.value.uid, 'exerciseProgress', progressKey);
      try {
        const progressSnap = await getDoc(progressDocRef);
        if (progressSnap.exists()) {
          const progressData = progressSnap.data() as ExerciseProgress;
          // Only update if the form values are still undefined from exerciseToEdit
          if (editingExercise.currentWeightToDisplayOrEdit === undefined) {
               editingExercise.currentWeightToDisplayOrEdit = toDisplay(progressData?.currentWeightToAttempt, settings.value.weightUnit);
          }
          if (editingExercise.currentRepsToDisplayOrEdit === undefined) {
               editingExercise.currentRepsToDisplayOrEdit = progressData?.repsToAttemptNext;
          }
        } else {
           // If no progress doc, and currentRepsToDisplayOrEdit is still undefined, default to minReps from config
           if (editingExercise.currentRepsToDisplayOrEdit === undefined) {
              editingExercise.currentRepsToDisplayOrEdit = editingExercise.minReps;
           }
           if (editingExercise.currentWeightToDisplayOrEdit === undefined) {
              editingExercise.currentWeightToDisplayOrEdit = toDisplay((editingExercise as any).startingWeight, settings.value.weightUnit) || 0;
           }
        }
      } catch (e) { 
        console.error("Fallback fetch progress error for " + exerciseToEdit.exerciseName + ":", e); 
        // If error and still undefined, ensure reps default to minReps
        if (editingExercise.currentRepsToDisplayOrEdit === undefined && editingExercise.minReps) {
            editingExercise.currentRepsToDisplayOrEdit = editingExercise.minReps;
        }
      }
    }
    
    // Final safety net for reps if it's still undefined
    if (editingExercise.currentRepsToDisplayOrEdit === undefined && editingExercise.minReps) {
        editingExercise.currentRepsToDisplayOrEdit = editingExercise.minReps;
    }

    showFailureProgressionHelp.value = false;

    addingExerciseToDayId.value = null; // Ensure we are not in "add new exercise" mode for this day
  }
};

const cancelAddOrEditExercise = () => {
  editingExerciseDayId.value = null; addingExerciseToDayId.value = null;
  resetEditingExerciseForm();
  showFailureProgressionHelp.value = false;
};

const addOrUpdateExercise = async (dayId: string) => {
  if (!user.value || !user.value.uid || !activeProgram.id) { error.value = "User or active program context missing."; return; }

  const exName = editingExercise.exerciseName?.trim();
  const sets = editingExercise.targetSets; const minR = editingExercise.minReps;
  const maxR = editingExercise.maxReps; const repStep = editingExercise.repOverloadStep;
  const weightInc = fromInput(editingExercise.weightIncrement, settings.value.weightUnit); const formCustomRest = editingExercise.customRestSeconds;
  const formEnableProg = editingExercise.enableProgression; const formNotes = editingExercise.notesForExercise?.trim();
  const formStartingWeight = fromInput(editingExercise.startingWeight, settings.value.weightUnit);
  const formCurrentWeight = fromInput(editingExercise.currentWeightToDisplayOrEdit, settings.value.weightUnit);
  const formCurrentReps = editingExercise.currentRepsToDisplayOrEdit;

  if (!exName) { error.value = "Exercise name is required."; return; }
  if (typeof sets !== 'number' || sets < 1) { error.value = "Target sets must be >= 1."; return; }
  if (typeof minR !== 'number' || minR < 1) { error.value = editingExercise.isTimed ? "Min hold must be >= 1s." : "Min reps must be >= 1."; return; }
  if (typeof maxR !== 'number' || maxR < minR) { error.value = editingExercise.isTimed ? "Max hold must be >= min hold." : "Max reps must be >= min reps."; return; }
  if (typeof repStep !== 'number' || repStep < 0) { error.value = editingExercise.isTimed ? "Time step must be >= 0." : "Rep step must be >= 0."; return; }
  if (typeof weightInc !== 'number' || weightInc < 0) { error.value = "Weight increment must be >= 0."; return; }

  let customRestForSave: number | null = null;
  if (formCustomRest !== null && formCustomRest !== undefined) {
    const restValue = Number(formCustomRest);
    if (!isNaN(restValue) && restValue >= 10) { customRestForSave = restValue; }
    else { error.value = "Custom rest must be a number >= 10, or blank."; isSaving.value = false; return; }
  }

  if (!editingExercise.id) {
    if (formStartingWeight !== null && formStartingWeight !== undefined && (typeof formStartingWeight !== 'number' || formStartingWeight < 0)) {
      error.value = "Starting weight must be >= 0 or blank."; return;
    }
  } else {
    if (formCurrentWeight !== null && formCurrentWeight !== undefined && (typeof formCurrentWeight !== 'number' || formCurrentWeight < 0)) {
      error.value = "Current weight must be >= 0 or blank."; return;
    }
    if (formCurrentReps !== null && formCurrentReps !== undefined && (typeof formCurrentReps !== 'number' || formCurrentReps < 1)) {
      error.value = "Current reps must be >= 1 or blank."; return;
    }
  }

  isSaving.value = true; error.value = null;
  const dayIndex = activeProgram.workoutDays.findIndex(d => d.id === dayId);
  if (dayIndex === -1) { error.value = "Workout day not found."; isSaving.value = false; return; }

  let exerciseDataToSaveForRoutine: ExerciseConfig;
  const notesToSave = formNotes || null;
  const enableProgToSave = typeof formEnableProg === 'boolean' ? formEnableProg : true;

  const baseDataForRoutine: Omit<ExerciseConfig, 'id'> = {
    exerciseName: exName, targetSets: sets, minReps: minR, maxReps: maxR,
    repOverloadStep: repStep, weightIncrement: weightInc, enableProgression: enableProgToSave,
    customRestSeconds: customRestForSave, notesForExercise: notesToSave,
    isTimed: editingExercise.isTimed || false,
    isSupersetWithPrevious: editingExercise.isSupersetWithPrevious || false,
    isToFailure: editingExercise.isToFailure || false,
    fullRestAfterSuperset: editingExercise.fullRestAfterSuperset || false,
  };

  // Enforce superset constraints (must match previous sets)
  if (baseDataForRoutine.isSupersetWithPrevious) {
      // Find previous exercise to sync sets
      // This is tricky because we need the index relative to the list.
       const currentExercises = activeProgram.workoutDays[dayIndex].exercises;
       let prevExercise: ExerciseConfigForDisplay | undefined;
       
       if (editingExercise.id) {
           // Editing existing: find its index
           const myIndex = currentExercises.findIndex(ex => ex.id === editingExercise.id);
           if (myIndex > 0) prevExercise = currentExercises[myIndex - 1];
           else {
               // First item cannot be superset
               baseDataForRoutine.isSupersetWithPrevious = false; 
           }
       } else {
           // Adding new: it will be at the end, so previous is the last current one
           if (currentExercises.length > 0) prevExercise = currentExercises[currentExercises.length - 1];
           else {
               baseDataForRoutine.isSupersetWithPrevious = false;
           }
       }

       if (baseDataForRoutine.isSupersetWithPrevious && prevExercise) {
           baseDataForRoutine.targetSets = prevExercise.targetSets;
       }
  }

  if (editingExercise.id) {
    const existingEx = activeProgram.workoutDays[dayIndex].exercises.find(ex => ex.id === editingExercise.id);
    if (!existingEx) { error.value = "Original exercise not found for update."; isSaving.value = false; return; }
    exerciseDataToSaveForRoutine = { id: existingEx.id, ...baseDataForRoutine };
  } else {
    exerciseDataToSaveForRoutine = { id: doc(collection(db, '_')).id, ...baseDataForRoutine };
  }

  const newWorkoutDaysArrayForDisplay = activeProgram.workoutDays.map(day => {
    if (day.id === dayId) {
      let newExercisesForDayDisplay: ExerciseConfigForDisplay[];
      if (editingExercise.id) {
        newExercisesForDayDisplay = day.exercises.map(ex => 
            ex.id === exerciseDataToSaveForRoutine.id ? 
            { ...exerciseDataToSaveForRoutine, currentPrescribedWeight: editingExercise.currentWeightToDisplayOrEdit ?? ex.currentPrescribedWeight, currentPrescribedReps: editingExercise.currentRepsToDisplayOrEdit ?? ex.currentPrescribedReps } : 
            ex
        );
      } else {
        newExercisesForDayDisplay = [...day.exercises, { ...exerciseDataToSaveForRoutine, currentPrescribedWeight: editingExercise.startingWeight ?? 0, currentPrescribedReps: exerciseDataToSaveForRoutine.minReps }];
      }
      return { ...day, exercises: newExercisesForDayDisplay };
    }
    return day;
  });

  const workoutDaysToSaveForFirestore = newWorkoutDaysArrayForDisplay.map(d => ({
      ...d,
      exercises: d.exercises.map(exDisp => {
          const { currentPrescribedReps, currentPrescribedWeight, ...config } = exDisp;
          return config as ExerciseConfig;
      })
  }));

  const batch = writeBatch(db);
  const programDocRef = doc(db, 'users', user.value.uid, 'trainingPrograms', activeProgram.id);
  batch.update(programDocRef, { workoutDays: workoutDaysToSaveForFirestore, updatedAt: serverTimestamp() });

  const exerciseProgressKey = exerciseDataToSaveForRoutine.exerciseName.toLowerCase().replace(/\s+/g, '_');
  const exerciseProgressRef = doc(db, 'users', user.value.uid, 'exerciseProgress', exerciseProgressKey);

  if (!editingExercise.id) {
    const exerciseProgressSnap = await getDoc(exerciseProgressRef);
    if (!exerciseProgressSnap.exists()) {
      let actualStartingWeight = 45;
      if (formStartingWeight !== null && formStartingWeight !== undefined && formStartingWeight >= 0) {
        actualStartingWeight = formStartingWeight;
      }
      const initialProgressData: ExerciseProgress = {
        exerciseName: exerciseDataToSaveForRoutine.exerciseName, currentWeightToAttempt: actualStartingWeight,
        repsToAttemptNext: exerciseDataToSaveForRoutine.minReps, lastWorkoutAllSetsSuccessfulAtCurrentWeight: false,
        consecutiveFailedWorkoutsAtCurrentWeightAndReps: 0, lastPerformedDate: null,
      };
      batch.set(exerciseProgressRef, initialProgressData);
    }
  } else {
    const progressUpdates: Partial<ExerciseProgress> = {};
    let needsProgressDocUpdate = false;
    if (formCurrentWeight !== null && formCurrentWeight !== undefined && typeof formCurrentWeight === 'number' && formCurrentWeight >= 0) {
        progressUpdates.currentWeightToAttempt = formCurrentWeight; needsProgressDocUpdate = true;
    }
    if (formCurrentReps !== null && formCurrentReps !== undefined && typeof formCurrentReps === 'number' && formCurrentReps >= 1) {
        progressUpdates.repsToAttemptNext = formCurrentReps; needsProgressDocUpdate = true;
    }
    if (needsProgressDocUpdate) {
        const progressSnap = await getDoc(exerciseProgressRef);
        if (progressSnap.exists()) {
            const currentProgData = progressSnap.data() as ExerciseProgress;
            const finalProgressUpdates: Partial<ExerciseProgress> = {};
            if (progressUpdates.currentWeightToAttempt !== undefined && progressUpdates.currentWeightToAttempt !== currentProgData.currentWeightToAttempt) {
                finalProgressUpdates.currentWeightToAttempt = progressUpdates.currentWeightToAttempt;
            }
            if (progressUpdates.repsToAttemptNext !== undefined && progressUpdates.repsToAttemptNext !== currentProgData.repsToAttemptNext) {
                finalProgressUpdates.repsToAttemptNext = progressUpdates.repsToAttemptNext;
            }
            if (Object.keys(finalProgressUpdates).length > 0) { batch.update(exerciseProgressRef, finalProgressUpdates); }
        } else {
            const initWeight = (typeof formCurrentWeight === 'number' && formCurrentWeight >=0) ? formCurrentWeight : 45;
            const initReps = (typeof formCurrentReps === 'number' && formCurrentReps >=1) ? formCurrentReps : exerciseDataToSaveForRoutine.minReps;
            const initialProgressData: ExerciseProgress = {
                exerciseName: exerciseDataToSaveForRoutine.exerciseName, currentWeightToAttempt: initWeight,
                repsToAttemptNext: initReps, lastWorkoutAllSetsSuccessfulAtCurrentWeight: false,
                consecutiveFailedWorkoutsAtCurrentWeightAndReps: 0, lastPerformedDate: null,
            };
            batch.set(exerciseProgressRef, initialProgressData);
        }
    }
  }

  try {
    await batch.commit();
    activeProgram.workoutDays = newWorkoutDaysArrayForDisplay;
    cancelAddOrEditExercise();
  } catch (e: any) { error.value = "Failed to save exercise. Firestore error: " + e.message; console.error("Error committing batch for exercise save:", e); }
  finally { isSaving.value = false; }
};

const removeExerciseFromDay = async (dayId: string, exerciseIdToRemove: string) => {
  if (!user.value || !user.value.uid || !activeProgram.id) return;
  if (!confirm(`Remove this exercise from ${activeProgram.workoutDays.find(d=>d.id===dayId)?.dayName || 'this day'}? Progress for this exercise won't be deleted.`)) return;
  isSaving.value = true; error.value = null;
  const dayIndex = activeProgram.workoutDays.findIndex(d => d.id === dayId);
  if (dayIndex === -1) { isSaving.value = false; return; }
  const updatedExercises = activeProgram.workoutDays[dayIndex].exercises.filter(ex => ex.id !== exerciseIdToRemove);
  const newWorkoutDaysArray = activeProgram.workoutDays.map(d => d.id === dayId ? { ...d, exercises: updatedExercises } : d);
  try {
    const programDocRef = doc(db, 'users', user.value.uid, 'trainingPrograms', activeProgram.id);
    const workoutDaysToSave = newWorkoutDaysArray.map(day => ({
      ...day, exercises: day.exercises.map(ex => {
        const { currentPrescribedReps, currentPrescribedWeight, ...config } = ex; return config as ExerciseConfig;
      })
    }));
    await updateDoc(programDocRef, { workoutDays: workoutDaysToSave, updatedAt: serverTimestamp() });
    activeProgram.workoutDays = newWorkoutDaysArray;
  } catch (e: any) { error.value = "Failed to remove exercise. " + e.message; }
  finally { isSaving.value = false; }
};

const deleteActiveProgramFromFirestore = async (programId: string) => {
    if (!user.value || !user.value.uid) return;
    const programRef = doc(db, 'users', user.value.uid, 'trainingPrograms', programId);
    await deleteDoc(programRef);
};

const requestDeleteRoutine = () => {
    if (!activeProgram.id) return;
    showDeleteConfirmation.value = true;
};

const cancelDeleteRoutine = () => {
    showDeleteConfirmation.value = false;
};

const confirmDeleteRoutine = async () => {
  showDeleteConfirmation.value = false; // Close immediately or wait? Better wait.
  // Actually, keeping it open with loading state is better UX.
  // But we reused `isSaving` for overall page...
  
  if (!activeProgram.id) return;
  isSaving.value = true;
  const idToDelete = activeProgram.id;

  try {
    console.log("Deleting program:", idToDelete);
    await deleteActiveProgramFromFirestore(idToDelete);
    
    if (settings.value.activeProgramId === idToDelete) {
         settings.value.activeProgramId = null;
         saveSettings();
    }
    
    await fetchAllPrograms();

    activeProgram.id = null; 
    activeProgram.programName = '';
    activeProgram.description = '';
    activeProgram.workoutDays = [];
    isInOverallEditMode.value = false;
    showDeleteConfirmation.value = false; // Close after success

  } catch (e: any) {
    console.error("Delete failed", e);
    error.value = "Failed to delete routine: " + e.message;
    // We can reopen modal or just show error on page
  } finally {
    isSaving.value = false;
    // ensure modal is closed if it wasn't
    showDeleteConfirmation.value = false;
  }
};

// --- Lifecycle Hooks ---
onMounted(() => {
    // We don't need to manually watch user here to load active program, 
    // because useTrainingProgram does it.
    // However, if we want to ensure we fetch the LIST of programs:
    if (user.value) {
        fetchAllPrograms();
    }
    
    watch(user, (u) => {
        if (u) fetchAllPrograms();
    });
});

onUnmounted(() => {
  // Cleanup if needed
});
</script>

<style scoped>
/* --- New Routine Creation UX Styles --- */
.creation-choice-phase {
  text-align: center;
  padding: 40px 20px;
}
.choice-subtitle {
  margin-bottom: 30px;
  opacity: 0.8;
  font-size: 1.1em;
}
.choice-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}
.choice-card {
  background: var(--color-card-mute);
  border: 1px solid var(--color-card-border);
  border-radius: 12px;
  padding: 30px 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.choice-card:hover {
  transform: translateY(-5px);
  border-color: #007bff;
  box-shadow: 0 8px 25px rgba(0, 123, 255, 0.15);
  background: var(--color-card-bg);
}
.choice-icon {
  font-size: 3em;
  line-height: 1;
}
.choice-content h3 {
  margin: 0 0 8px 0;
  font-size: 1.3em;
  color: var(--color-card-heading);
}
.choice-content p {
  margin: 0;
  font-size: 0.9em;
  opacity: 0.8;
  line-height: 1.4;
}
.choice-arrow {
  font-size: 1.5em;
  color: #007bff;
  opacity: 0;
  transition: all 0.3s;
  margin-top: 10px;
}
.choice-card:hover .choice-arrow {
  opacity: 1;
  transform: translateX(5px);
}

/* AI Creation Flow Specifics */
.ai-nudge-section {
  display: grid;
  gap: 15px;
  margin-bottom: 25px;
}
.ai-nudge-card {
  display: flex;
  align-items: center;
  gap: 15px;
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  padding: 15px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
}
.ai-nudge-card:hover {
  border-color: #007bff;
  background: var(--color-card-mute);
  transform: translateX(5px);
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.1);
}
.nudge-icon { font-size: 1.5em; }
.nudge-text { display: flex; flex-direction: column; }
.nudge-text strong { color: var(--color-card-heading); font-size: 1.1em; }
.nudge-text span { font-size: 0.9em; opacity: 0.8; }

/* Flow Headers & Back Links */
.flow-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 25px;
  border-bottom: 1px solid var(--color-card-border);
  padding-bottom: 15px;
}
.back-link {
  background: none;
  border: none;
  color: var(--color-interactive);
  cursor: pointer;
  padding: 0;
  font-size: 0.9em;
  text-decoration: underline;
}

/* --- Routine Switcher Styles --- */
.routine-switcher-container {
  margin-bottom: 20px;
  width: 100%;
}

.tabs-scroll-area {
  display: flex;
  overflow-x: auto;
  gap: 10px;
  padding: 5px 2px;
  scrollbar-width: none; 
  -ms-overflow-style: none;
}
.tabs-scroll-area::-webkit-scrollbar {
  display: none;
}

.tab-chip {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 20px;
  background-color: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  color: var(--color-text);
  font-size: 0.9em;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.tab-chip:hover {
  background-color: var(--color-card-mute);
  border-color: #aaa;
}

.tab-chip.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.4);
}

.tab-chip.is-main {
  font-weight: 600;
}

.tab-chip .active-badge {
  margin-left: 6px;
  font-size: 0.8em;
  color: #FFD700;
}

.tab-chip.create-new {
  background-color: transparent;
  border: 1px dashed #aaa;
  color: var(--color-text-mute);
}
.tab-chip.create-new:hover {
  border-color: #007bff;
  color: #007bff;
  background-color: rgba(0, 123, 255, 0.05);
}

/* Edit Routine Button - Font Boost */
.active-routine-display .button-primary.small,
.routine-info-display .button-primary.small {
    font-size: 1rem;
    padding: 8px 16px;
}

/* --- Routine List Styles --- */
.routine-list-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 0;
    border-bottom: 1px solid var(--color-card-border);
}
.routine-list-item:last-child {
    border-bottom: none;
}
.routine-name {
    font-size: 1.05em;
    color: var(--color-card-heading);
}
.active-badge-inline {
    color: #FFD700;
    font-size: 0.85em;
    margin-left: 8px;
    font-weight: normal;
}
.routine-actions {
    display: flex;
    gap: 8px;
}

@media (max-width: 500px) {
    .routine-list-item {
        flex-direction: row !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 5px; /* Reduce gap slightly */
    }
    .routine-info {
        text-align: left;
        flex: 1;
        padding-right: 5px;
    }
    .routine-actions {
        width: auto;
        justify-content: flex-end !important;
    }
}
.back-link:hover { text-decoration: underline; }
.section-hint {
  margin-bottom: 20px;
  font-style: italic;
  opacity: 0.8;
  font-size: 0.95em;
}

/* Animations */
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 500px) {
  .choice-grid {
    grid-template-columns: 1fr;
  }
}
.routines-view {
  padding: 10px;
  max-width: 700px;
  margin: 20px auto;
}
.routines-view h1 {
  text-align: center;
  margin-bottom: 20px;
  color: var(--color-heading);
  font-family: 'Montserrat', sans-serif;
  font-weight: 400;
}
.routine-actions-header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 20px; 
  padding-bottom: 15px; 
  border-bottom: 1px solid var(--color-card-border);
}
.card { 
  background-color: var(--color-card-bg);   
  padding: 20px 25px;
  border-radius: 8px; /* Standardize with Home */
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08); /* Standardize with Home */
  text-align: left;
  border: 1px solid var(--color-card-border); 
  color: var(--color-card-text);  
}
.card-inset { background-color: var(--color-card-mute); color: var(--color-card-text); padding: 15px; border-radius: 6px; margin-top: 15px; margin-bottom:15px; border: 1px solid var(--color-card-border);}
.active-routine-display h2, .active-routine-display h3, .active-routine-display h4, .active-routine-display h5 { text-align:left; margin-bottom: 0.5em; color: var(--color-card-heading); }
.active-routine-display h3 { margin-top: 1.5em; padding-bottom: 0.3em; border-bottom: 1px solid var(--color-card-border); }
.routine-description { margin-top: 5px; margin-bottom: 15px; color: var(--color-card-text); font-style: italic; font-size: 0.95em; text-align:left;}
.edit-details-form { margin-top: 10px; padding: 20px; border: 1px solid var(--color-card-border); border-radius: 6px; background-color: var(--color-card-mute); }
.form-group { margin-bottom: 12px; }
.form-group-inline { display: flex; gap: 10px; flex-wrap: wrap; }
.form-group-inline > div { flex: 1; min-width: 120px; }
label { display: block; margin-bottom: 5px; font-weight: 500; font-size:0.9em; color: var(--color-card-text); }
input[type="text"], input[type="number"], textarea { width: 100%; padding: 8px 10px; border: 1px solid var(--color-card-border); border-radius: 4px; box-sizing: border-box; font-size: 0.95rem; background-color: var(--color-card-bg); color: var(--color-card-text); }
textarea { min-height: 70px; resize: vertical; }
.button-primary { padding: 10px 15px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; transition: background-color 0.2s; }
.button-primary:hover:not(:disabled) { background-color: #0056b3; }
.button-primary.small, .button-secondary.small { padding: 6px 10px; font-size: 0.85em; border: 1px solid transparent; }
.button-primary-outline.small { padding: 6px 10px; font-size: 0.85em; margin-top: 0; }
.button-primary-outline { padding: 8px 12px; background-color: transparent; color: #007bff; border: 1px solid #007bff; border-radius: 4px; cursor: pointer; font-size: 0.9em; transition: background-color 0.2s, color 0.2s; margin-top:10px; }
.button-primary-outline:hover:not(:disabled) { background-color: #007bff; color:white; }
.button-secondary { background-color: #6c757d; color:white; border:none; border-radius:4px; padding:10px 15px; cursor:pointer; font-size: 0.95rem; transition: background-color 0.2s;}
.button-secondary:hover:not(:disabled) { background-color: #545b62; }
button:disabled { background-color: #e9ecef; color: #6c757d; cursor: not-allowed; border-color: #ced4da !important; }
.workout-day-entry { margin-bottom: 15px; text-align:left; }
.workout-day-entry-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.day-name-display { font-weight: 600; font-size: 1.1em; color: #0056b3; flex-grow: 1; margin: 0; }
.day-name-edit-form { display: flex; align-items: center; flex-grow: 1; gap: 5px; }
.day-name-edit-form input[type="text"] { flex-grow: 1; }
.day-header-actions .button-icon { margin-left: 5px; }
.button-icon { background: none; border: none; cursor: pointer; padding: 4px; font-size: 1.1em; }
.button-icon.small { font-size: 1em; } .button-icon.extra-small { font-size: 0.9em; }
.button-icon.danger { color: #dc3545; } .button-icon.danger:hover { color: #c82333; }
.button-icon.success { color: #28a745; } .button-icon.success:hover { color: #218838; }
.button-icon:hover { opacity: 0.7; }
.exercise-list-display { list-style-type: none; padding-left: 0; margin-top:10px; margin-bottom: 10px; }
.exercise-item-display { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 0.9em; border-bottom: 1px solid var(--color-card-border); }
.exercise-item-display:last-child { border-bottom: none; }
.exercise-info-text { text-align:left; flex-grow:1; color: var(--color-card-text);}
.ex-name { font-weight: 500; color: var(--color-card-heading); }
.ex-details { color: var(--color-card-text); opacity: 0.8; font-size: 0.9em; margin-left: 5px; }
.no-progression-note { font-style: italic; color: #777; }
.exercise-item-actions { white-space: nowrap; }
.exercise-form-container { margin-top: 15px; padding-top:15px; border-top:1px dashed var(--color-card-border);}
.add-exercise-form h5 { margin-top: 0; margin-bottom: 15px; font-size: 1.1em; text-align:left; color: var(--color-card-heading); }
.add-day-controls { text-align: center; padding-top: 10px; }
.add-day-form-inline { display: flex; gap: 10px; align-items: center; margin-top:10px; }
.add-day-form-inline input {flex-grow:1;}
.form-actions { margin-top:15px; display:flex; gap:10px; justify-content: flex-start;}
.no-items-message, .loading-message, .login-prompt { color: #6c757d; text-align: center; padding: 20px; }
.no-items-message.small-text { font-size:0.9em; padding:10px 0; text-align:left; }
.error-message { color: #dc3545; background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 10px; border-radius: 4px; margin-top: 15px; }
.checkbox-label { display: flex; align-items: center; font-weight: normal; color: var(--color-card-text); font-size: 0.9em; }
.checkbox-label input[type="checkbox"] { width: auto; margin-right: 8px; }

.import-routine-section h4, .manual-create-section h4 { margin-top: 0; margin-bottom: 10px; color: var(--color-card-heading); }
.import-routine-section textarea { width: 100%; min-height: 150px; font-family: monospace; font-size: 0.9em; background-color: var(--color-card-bg); color: var(--color-card-text); }
.section-divider { margin: 30px 0; border: 0; border-top: 1px solid var(--color-card-border); }

.button-danger { padding: 10px 15px; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; transition: background-color 0.2s; box-sizing: border-box;}
.button-danger:hover:not(:disabled) { background-color: #c82333; }
.button-danger:disabled { background-color: #f8d7da; color: #721c24; cursor: not-allowed; }
.full-width { width: 100%; display: block; }
.routine-level-actions { margin-top: 25px; padding: 20px; border: 1px solid #f5c6cb; background-color: #fdf2f2; border-radius: 6px;}
.routine-level-actions h4 { margin-top: 0; margin-bottom: 10px; color: #721c24;}
.warning-text { color: #721c24; margin-top: 10px; font-size: 0.85em;}
.small-text { font-size: 0.9em; }

.lazy-import-help { padding: 15px; margin-bottom: 20px; }
.full-width-button-link {
  width: 100%;
  display: block;
  box-sizing: border-box;
  text-align: center;
  /* Uses .button-secondary styles implicitly or add them if needed */
}

.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.6); display: flex; justify-content: center; align-items: center; z-index: 1000;}
.modal-content { background-color: var(--color-card-bg); padding: 25px 30px; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); width: 90%; max-width: 750px; max-height: 85vh; overflow-y: auto; position: relative; color: var(--color-card-text);}
.modal-close-button { position: absolute; top: 10px; right: 15px; background: none; border: none; font-size: 2rem; line-height: 1; color: #888; cursor: pointer;}
.modal-close-button:hover { color: var(--color-card-text); }
.modal-content h3 { margin-top: 0; color: var(--color-card-heading); border-bottom: 1px solid var(--color-card-border); padding-bottom: 10px; margin-bottom: 15px;}
.ai-instructions { margin-top: 10px; background-color: var(--color-card-mute); border: 1px solid var(--color-card-border); padding: 15px; border-radius: 4px; font-size: 0.9em; color: var(--color-card-text);}
.ai-instructions pre { white-space: pre-wrap; word-wrap: break-word; background-color: var(--color-card-bg); padding: 10px; border-radius: 4px; max-height: 40vh; overflow-y: auto; font-family: monospace; font-size: 0.90em; line-height: 1.4; color: var(--color-card-text);}

@media (max-width: 600px) {
  .routines-view {
    padding: 5px;
  }
  /* Align header with card content (5px view + 10px header = 15px visual start, matching card text loosely) */
  .routine-actions-header {
    padding: 0 10px; 
    margin-bottom: 10px;
  }
  .routine-actions-header h1 {
    font-size: 1.5rem; /* Slightly smaller for mobile */
  }
  
  .card {
    padding: 15px 15px; /* Reduced from 20px 25px */
    margin-bottom: 15px;
  }
  /* Reduce inset card padding to save even more space for lists */
  .card-inset {
    padding: 10px;
    margin-top: 10px;
    margin-bottom: 10px;
  }
  
  .section-divider {
    margin: 20px 0;
  }
  .import-routine-section textarea {
    min-height: 100px;
  }
}

.is-superset-slave {
    margin-left: 20px;
    padding-left: 10px;
}
.superset-link-icon {
    margin-right: 5px;
    font-size: 1.1em;
}
.active-superset {
    background-color: rgba(0, 123, 255, 0.1);
    color: #007bff;
    border-radius: 4px;
}
</style>