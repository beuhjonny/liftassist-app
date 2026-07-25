<template>
  <div class="gallery">
    <h1>Base Components</h1>
    <p class="muted">Dev-only gallery for visual QA of the design-system primitives.</p>

    <section>
      <h2>Buttons</h2>
      <div class="row">
        <BaseButton variant="primary">Primary</BaseButton>
        <BaseButton variant="secondary">Secondary</BaseButton>
        <BaseButton variant="ghost">Ghost</BaseButton>
        <BaseButton variant="danger">Danger</BaseButton>
        <BaseButton variant="success">Success</BaseButton>
        <BaseButton :loading="true">Loading</BaseButton>
        <BaseButton :disabled="true">Disabled</BaseButton>
      </div>
      <div class="row">
        <BaseButton size="sm">sm</BaseButton>
        <BaseButton size="md">md</BaseButton>
        <BaseButton size="lg">lg</BaseButton>
        <BaseButton size="xl">xl</BaseButton>
      </div>
      <div class="row">
        <BaseButton variant="success" size="xl" block><template #trailing><Check :size="20" /></template>DONE</BaseButton>
      </div>
    </section>

    <section>
      <h2>Cards</h2>
      <div class="grid">
        <BaseCard><strong>Default card</strong><p class="muted">Hairline + shadow-1</p></BaseCard>
        <BaseCard variant="elevated"><strong>Elevated</strong><p class="muted">shadow-2</p></BaseCard>
        <BaseCard variant="interactive" interactive><strong>Interactive</strong><p class="muted">Hover + press</p></BaseCard>
      </div>
    </section>

    <section>
      <h2>Badges & Chips</h2>
      <div class="row">
        <BaseBadge tone="success">PR</BaseBadge>
        <BaseBadge tone="warning">Skipped</BaseBadge>
        <BaseBadge tone="danger">Failed</BaseBadge>
        <BaseBadge tone="accent">Next</BaseBadge>
        <BaseBadge tone="neutral" dot>Done</BaseBadge>
      </div>
      <div class="row">
        <BaseChip>All</BaseChip>
        <BaseChip :selected="true">Push</BaseChip>
        <BaseChip>Pull</BaseChip>
        <BaseChip>Legs</BaseChip>
      </div>
    </section>

    <section>
      <h2>Inputs</h2>
      <div class="grid">
        <BaseInput v-model="text" label="Routine name" placeholder="e.g. Push Day" />
        <BaseInput v-model="num" label="Weight" type="number" inputmode="decimal" />
        <BaseInput v-model="bad" label="With error" error="Reps must be at least 1" />
        <BaseSelect v-model="sel" label="Choose day">
          <option value="a">Push</option><option value="b">Pull</option><option value="c">Legs</option>
        </BaseSelect>
      </div>
      <div class="row">
        <BaseStepper v-model="reps" :min="1" :max="20" aria-label="reps" suffix="reps" />
        <BaseStepper v-model="weight" :step="5" :min="0" aria-label="weight" suffix="lb" />
      </div>
    </section>

    <section>
      <h2>Banners & Empty states</h2>
      <BaseBanner tone="info"><template #icon><Info :size="18" /></template>Informational banner</BaseBanner>
      <BaseBanner tone="warning"><template #icon><AlertTriangle :size="18" /></template>Unfinished workout</BaseBanner>
      <BaseBanner tone="danger" dismissible>Could not save</BaseBanner>
      <BaseCard>
        <BaseEmptyState title="Not enough data yet" body="Log a few workouts to see your trend.">
          <template #icon><TrendingUp :size="48" /></template>
          <template #action><BaseButton>Start a workout</BaseButton></template>
        </BaseEmptyState>
      </BaseCard>
    </section>

    <section>
      <h2>List rows</h2>
      <BaseCard flush>
        <BaseListRow interactive><template #leading><span class="dot" style="background: var(--day-1)"></span></template><div><strong>Push Day</strong><div class="muted">4 exercises</div></div><template #trailing><ChevronRight :size="18" /></template></BaseListRow>
        <BaseListRow interactive selected><template #leading><span class="dot" style="background: var(--day-2)"></span></template><div><strong>Pull Day</strong><div class="muted">selected</div></div><template #trailing><ChevronRight :size="18" /></template></BaseListRow>
      </BaseCard>
    </section>

    <section>
      <h2>Overlays & Toasts</h2>
      <div class="row">
        <BaseButton @click="modal = true">Open modal</BaseButton>
        <BaseButton @click="sheet = true">Open sheet</BaseButton>
        <BaseButton variant="secondary" @click="t.success('Saved to your routine')">Toast success</BaseButton>
        <BaseButton variant="secondary" @click="t.error('Could not save')">Toast error</BaseButton>
      </div>
      <BaseModal :open="modal" title="Edit prescription" @close="modal = false">
        <p>Modal body content.</p>
        <template #footer><BaseButton variant="secondary" @click="modal = false">Cancel</BaseButton><BaseButton @click="modal = false">Save</BaseButton></template>
      </BaseModal>
      <BaseSheet :open="sheet" title="Add to routine" @close="sheet = false">
        <p>Bottom sheet content.</p>
        <BaseButton block @click="sheet = false">Done</BaseButton>
      </BaseSheet>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Check, Info, AlertTriangle, TrendingUp, ChevronRight } from 'lucide-vue-next';
import BaseButton from '../components/base/BaseButton.vue';
import BaseCard from '../components/base/BaseCard.vue';
import BaseBadge from '../components/base/BaseBadge.vue';
import BaseChip from '../components/base/BaseChip.vue';
import BaseInput from '../components/base/BaseInput.vue';
import BaseSelect from '../components/base/BaseSelect.vue';
import BaseStepper from '../components/base/BaseStepper.vue';
import BaseBanner from '../components/base/BaseBanner.vue';
import BaseEmptyState from '../components/base/BaseEmptyState.vue';
import BaseListRow from '../components/base/BaseListRow.vue';
import BaseModal from '../components/base/BaseModal.vue';
import BaseSheet from '../components/base/BaseSheet.vue';
import { useToast } from '../composables/useToast';

const text = ref(''); const num = ref(100); const bad = ref(''); const sel = ref('a');
const reps = ref(8); const weight = ref(135);
const modal = ref(false); const sheet = ref(false);
const t = useToast();
</script>

<style scoped>
.gallery { max-width: 720px; margin: 0 auto; padding: var(--space-5) var(--space-4) var(--space-8); display: flex; flex-direction: column; gap: var(--space-6); }
h1 { font-family: var(--font-display); font-size: var(--text-2xl); color: var(--color-heading); margin: 0; }
h2 { font-family: var(--font-display); font-size: var(--text-lg); color: var(--color-heading); margin: 0 0 var(--space-3); border-bottom: 1px solid var(--color-hairline); padding-bottom: var(--space-2); }
.muted { color: var(--color-text); opacity: 0.7; font-size: var(--text-sm); margin: 0; }
.row { display: flex; flex-wrap: wrap; gap: var(--space-3); align-items: center; margin-bottom: var(--space-3); }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-3); }
.dot { width: 12px; height: 12px; border-radius: var(--radius-full); display: inline-block; }
section { display: flex; flex-direction: column; gap: var(--space-2); }
</style>
