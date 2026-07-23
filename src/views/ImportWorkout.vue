<template>
  <div class="import-view">
    <header class="import-header">
      <h1>Import Workouts</h1>
      <p class="import-sub">
        Share a workout video from YouTube, Instagram, or TikTok to LiftLogic, or paste
        a routine below. We pull out the exercises so you can add them to any routine.
      </p>
    </header>

    <!-- Paste / manual entry -->
    <section class="paste-card card">
      <label for="pasteBox" class="paste-label">Paste a routine or video description</label>
      <textarea
        id="pasteBox"
        v-model="pasteText"
        class="paste-box"
        rows="4"
        placeholder="e.g.&#10;Bench Press 4x8-12&#10;Incline Dumbbell Press 3x10&#10;Tricep Pushdown 3x15"
      ></textarea>
      <div class="paste-actions">
        <button class="btn-primary" :disabled="busy || !pasteText.trim()" @click="addFromPaste">
          {{ busy ? 'Adding...' : 'Add to selection list' }}
        </button>
      </div>
    </section>

    <!-- Selection list -->
    <section class="selection-list">
      <h2 class="section-title">Selection list <span v-if="items.length" class="count">({{ items.length }})</span></h2>

      <p v-if="items.length === 0" class="empty-state">
        Nothing here yet. Share a video to LiftLogic or paste a routine above and it will
        appear here, ready to add to a routine.
      </p>

      <article v-for="item in items" :key="item.id" class="import-item card">
        <div class="item-head">
          <span class="source-badge" :data-source="item.sourceType">{{ sourceLabel(item.sourceType) }}</span>
          <span class="item-title">{{ item.routineName || 'Imported workout' }}</span>
          <button class="icon-btn" title="Remove" @click="remove(item.id)">✕</button>
        </div>
        <a v-if="item.sourceUrl" :href="item.sourceUrl" target="_blank" rel="noopener" class="source-link">{{ item.sourceUrl }}</a>

        <!-- Needs a description/transcript -->
        <div v-if="item.status === 'needs_text'" class="needs-text">
          <p class="hint">We could not read exercises from the link alone. Paste the video's description or a routine:</p>
          <textarea v-model="itemText[item.id]" class="paste-box" rows="3" placeholder="Paste description or routine..."></textarea>
          <button class="btn-secondary" :disabled="!itemText[item.id]?.trim()" @click="reanalyze(item)">Analyze</button>
        </div>

        <!-- Parsed exercises -->
        <ul v-else class="exercise-list">
          <li v-for="(ex, i) in item.exercises" :key="i" class="exercise-row">
            <label class="ex-check">
              <input type="checkbox" :checked="ex.selected" @change="toggleExercise(item, i)" />
              <span class="ex-name">{{ ex.name }}</span>
            </label>
            <span class="ex-scheme">{{ ex.sets }} x {{ ex.minReps }}<template v-if="ex.maxReps !== ex.minReps">-{{ ex.maxReps }}</template></span>
          </li>
        </ul>

        <!-- Add-to-routine -->
        <div v-if="item.status === 'ready'" class="add-panel">
          <button v-if="openPickerId !== item.id" class="btn-primary" @click="openPicker(item)">Add to routine</button>

          <div v-else class="picker">
            <div class="picker-modes">
              <label><input type="radio" value="new" v-model="target.mode" /> New routine</label>
              <label><input type="radio" value="newDay" v-model="target.mode" :disabled="!programs.length" /> New day in existing</label>
              <label><input type="radio" value="existingDay" v-model="target.mode" :disabled="!programs.length" /> Existing day</label>
            </div>

            <input v-if="target.mode === 'new'" v-model="target.newName" class="picker-input" placeholder="Routine name" />

            <template v-else>
              <select v-model="target.programId" class="picker-input" @change="target.dayId = firstDayId(target.programId)">
                <option value="" disabled>Choose routine</option>
                <option v-for="p in programs" :key="p.id!" :value="p.id">{{ p.programName }}</option>
              </select>
              <input v-if="target.mode === 'newDay'" v-model="target.newDayName" class="picker-input" placeholder="New day name (e.g. Push)" />
              <select v-else v-model="target.dayId" class="picker-input">
                <option value="" disabled>Choose day</option>
                <option v-for="d in daysFor(target.programId)" :key="d.id" :value="d.id">{{ d.dayName }}</option>
              </select>
            </template>

            <div class="picker-actions">
              <button class="btn-secondary" @click="openPickerId = null">Cancel</button>
              <button class="btn-primary" :disabled="busy || !canConfirm(item)" @click="confirmAdd(item)">
                {{ busy ? 'Adding...' : 'Add' }}
              </button>
            </div>
          </div>
        </div>
      </article>
    </section>

    <div v-if="toast" class="import-toast" role="status">{{ toast }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import useWorkoutImport, { type ImportItem, type AddTarget } from '../composables/useWorkoutImport';
import useTrainingProgram from '../composables/useTrainingProgram';
import type { WorkoutSourceType } from '../utils/workoutParser';
import type { WorkoutDay } from '@/types';

const route = useRoute();
const router = useRouter();
const { items, subscribe, stageFromShare, analyzeText, updateItem, removeItem, addToRoutine } = useWorkoutImport();
const { allPrograms: programs, fetchAllPrograms } = useTrainingProgram();

const pasteText = ref('');
const itemText = reactive<Record<string, string>>({});
const busy = ref(false);
const toast = ref('');
const openPickerId = ref<string | null>(null);
const target = reactive<{ mode: AddTarget['mode']; newName: string; programId: string; dayId: string; newDayName: string }>({
  mode: 'new',
  newName: '',
  programId: '',
  dayId: '',
  newDayName: '',
});

let unsubscribe: (() => void) | null = null;

onMounted(async () => {
  await fetchAllPrograms();
  unsubscribe = subscribe();

  // PWA share-target capture: /import/share?url=&text=&title=
  const { url, text, title } = route.query;
  if (url || text || title) {
    try {
      await stageFromShare({
        url: asStr(url),
        text: asStr(text),
        title: asStr(title),
      });
      flash('Added to your selection list.');
    } catch (e) {
      console.error('share capture failed', e);
      flash('Could not import that share.');
    }
    router.replace({ name: 'ImportWorkout' });
  }
});

onUnmounted(() => unsubscribe?.());

const asStr = (v: unknown): string => (Array.isArray(v) ? String(v[0] ?? '') : v == null ? '' : String(v));

const addFromPaste = async () => {
  busy.value = true;
  try {
    await stageFromShare({ text: pasteText.value });
    pasteText.value = '';
    flash('Added to your selection list.');
  } catch (e) {
    console.error(e);
    flash('Could not add that.');
  } finally {
    busy.value = false;
  }
};

const reanalyze = async (item: ImportItem) => {
  const text = itemText[item.id];
  if (!text?.trim()) return;
  await analyzeText(item.id, text);
  itemText[item.id] = '';
};

const toggleExercise = (item: ImportItem, index: number) => {
  const next = item.exercises.map((e, i) => (i === index ? { ...e, selected: !e.selected } : e));
  updateItem(item.id, { exercises: next });
};

const remove = (id: string) => removeItem(id);

const openPicker = (item: ImportItem) => {
  openPickerId.value = item.id;
  target.mode = 'new';
  target.newName = item.routineName || '';
  target.programId = programs.value[0]?.id || '';
  target.dayId = firstDayId(target.programId);
  target.newDayName = '';
};

const firstDayId = (programId: string): string => daysFor(programId)[0]?.id || '';
const daysFor = (programId: string): WorkoutDay[] =>
  programs.value.find((p) => p.id === programId)?.workoutDays || [];

const canConfirm = (item: ImportItem): boolean => {
  if (!item.exercises.some((e) => e.selected)) return false;
  if (target.mode === 'new') return !!target.newName.trim();
  if (!target.programId) return false;
  if (target.mode === 'newDay') return !!target.newDayName.trim();
  return !!target.dayId;
};

const confirmAdd = async (item: ImportItem) => {
  busy.value = true;
  try {
    let t: AddTarget;
    if (target.mode === 'new') t = { mode: 'new', name: target.newName.trim() };
    else if (target.mode === 'newDay') t = { mode: 'newDay', programId: target.programId, dayName: target.newDayName.trim() };
    else t = { mode: 'existingDay', programId: target.programId, dayId: target.dayId };

    await addToRoutine(item, t);
    openPickerId.value = null;
    await fetchAllPrograms();
    flash('Added to your routine.');
  } catch (e: unknown) {
    console.error(e);
    flash(e instanceof Error ? e.message : 'Could not add to routine.');
  } finally {
    busy.value = false;
  }
};

const sourceLabel = (s: WorkoutSourceType): string =>
  ({ youtube: 'YouTube', instagram: 'Instagram', tiktok: 'TikTok', web: 'Web', manual: 'Manual' })[s] || 'Manual';

let toastTimer: ReturnType<typeof setTimeout> | undefined;
const flash = (msg: string) => {
  toast.value = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.value = ''), 2600);
};
</script>

<style scoped>
.import-view {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}
.import-header h1 {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  color: var(--color-heading);
  margin: 0 0 var(--space-2);
}
.import-sub {
  color: var(--color-text);
  opacity: 0.8;
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  margin: 0;
}
.card {
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}
.paste-label { display: block; font-weight: 600; font-size: var(--text-sm); margin-bottom: var(--space-2); color: var(--color-card-text); }
.paste-box {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-sm);
  background: var(--color-card-mute);
  color: var(--color-card-text);
  padding: var(--space-3);
  font: inherit;
  resize: vertical;
}
.paste-actions { display: flex; justify-content: flex-end; margin-top: var(--space-3); }
.section-title { font-size: var(--text-lg); color: var(--color-heading); margin: 0 0 var(--space-3); }
.count { opacity: 0.6; font-weight: 400; }
.empty-state { color: var(--color-text); opacity: 0.7; font-size: var(--text-sm); line-height: var(--leading-normal); }
.import-item { display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-4); }
.item-head { display: flex; align-items: center; gap: var(--space-3); }
.item-title { font-weight: 600; color: var(--color-card-heading); flex: 1; }
.source-badge {
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.02em;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: var(--color-card-mute);
  color: var(--color-card-text);
  border: 1px solid var(--color-card-border);
}
.source-link { font-size: var(--text-xs); color: var(--color-accent); word-break: break-all; opacity: 0.85; }
.icon-btn { background: none; border: none; color: var(--color-card-text); opacity: 0.6; cursor: pointer; min-width: var(--tap-min); min-height: var(--tap-min); font-size: 1rem; }
.exercise-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--space-1); }
.exercise-row { display: flex; align-items: center; justify-content: space-between; padding: var(--space-2) 0; border-bottom: 1px solid var(--color-card-border); }
.ex-check { display: flex; align-items: center; gap: var(--space-3); cursor: pointer; }
.ex-check input { width: 20px; height: 20px; }
.ex-name { color: var(--color-card-text); }
.ex-scheme { color: var(--color-card-text); opacity: 0.75; font-variant-numeric: tabular-nums; font-size: var(--text-sm); }
.needs-text { display: flex; flex-direction: column; gap: var(--space-2); }
.hint { font-size: var(--text-sm); color: var(--color-card-text); opacity: 0.8; margin: 0; }
.add-panel { display: flex; flex-direction: column; gap: var(--space-3); }
.picker { display: flex; flex-direction: column; gap: var(--space-3); background: var(--color-card-mute); border-radius: var(--radius-sm); padding: var(--space-3); }
.picker-modes { display: flex; flex-wrap: wrap; gap: var(--space-3); font-size: var(--text-sm); }
.picker-input { width: 100%; box-sizing: border-box; padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); border: 1px solid var(--color-card-border); background: var(--color-card-bg); color: var(--color-card-text); font: inherit; min-height: var(--tap-min); }
.picker-actions { display: flex; justify-content: flex-end; gap: var(--space-2); }
.btn-primary, .btn-secondary {
  min-height: var(--tap-min);
  padding: 0 var(--space-4);
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
}
.btn-primary { background: var(--color-accent); color: var(--color-accent-contrast); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary { background: transparent; color: var(--color-card-text); border-color: var(--color-card-border); }
.import-toast {
  position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%);
  background: var(--color-card-heading); color: var(--color-card-bg);
  padding: var(--space-3) var(--space-4); border-radius: var(--radius-md);
  box-shadow: var(--shadow-2); font-size: var(--text-sm); z-index: 1300;
}
</style>
