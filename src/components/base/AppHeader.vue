<template>
  <header class="app-header" :class="{ scrolled }">
    <button v-if="back" type="button" class="header-back" aria-label="Back" @click="goBack">
      <ChevronLeft :size="24" />
    </button>
    <h1 class="header-title" :class="{ 'with-back': back }">
      <slot name="title">{{ title }}</slot>
    </h1>
    <div class="header-action"><slot name="action" /></div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ChevronLeft } from 'lucide-vue-next';

const props = withDefaults(defineProps<{ title?: string; back?: boolean; fallback?: string }>(), { fallback: '/' });
const router = useRouter();
const scrolled = ref(false);

const goBack = () => {
  if (window.history.length > 1) router.back();
  else router.push(props.fallback);
};

const onScroll = () => { scrolled.value = window.scrollY > 4; };
onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }));
onUnmounted(() => window.removeEventListener('scroll', onScroll));
</script>

<style scoped>
.app-header {
  position: sticky; top: 0; z-index: var(--z-sticky);
  display: flex; align-items: center; gap: var(--space-2);
  min-height: 56px; padding: var(--space-3) var(--space-4);
  padding-top: calc(var(--space-3) + var(--safe-top));
  background: var(--surface-base);
  border-bottom: 1px solid transparent;
  transition: border-color var(--duration-base) var(--ease-standard);
}
.app-header.scrolled { border-bottom-color: var(--color-hairline); box-shadow: var(--shadow-1); }
.header-back { min-width: var(--tap-min); min-height: var(--tap-min); display: inline-flex; align-items: center; justify-content: center; background: none; border: none; color: var(--color-heading); cursor: pointer; margin-left: calc(-1 * var(--space-2)); }
.header-title { flex: 1; margin: 0; font-family: var(--font-display); font-size: var(--text-xl); font-weight: var(--weight-black); letter-spacing: var(--tracking-tight); color: var(--color-heading); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.header-title.with-back { font-size: var(--text-lg); font-weight: var(--weight-bold); }
.header-action { display: inline-flex; align-items: center; }
</style>
