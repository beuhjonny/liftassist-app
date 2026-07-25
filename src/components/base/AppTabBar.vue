<template>
  <nav class="tab-bar" aria-label="Primary">
    <RouterLink v-for="tab in tabs" :key="tab.name" :to="tab.to" class="tab-item" :class="{ active: activeTab === tab.tab }" :aria-current="activeTab === tab.tab ? 'page' : undefined">
      <component :is="tab.icon" :size="24" :stroke-width="2" aria-hidden="true" />
      <span class="tab-label">{{ tab.label }}</span>
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { House, TrendingUp, ClipboardList, CircleUser } from 'lucide-vue-next';

const route = useRoute();
const tabs = [
  { name: 'home', tab: 'home', to: '/', label: 'Home', icon: House },
  { name: 'progress', tab: 'progress', to: '/history', label: 'Progress', icon: TrendingUp },
  { name: 'routines', tab: 'routines', to: '/routines', label: 'Routines', icon: ClipboardList },
  { name: 'profile', tab: 'profile', to: '/profile', label: 'Profile', icon: CircleUser },
];
const activeTab = computed(() => (route.meta.tab as string) || 'home');
</script>

<style scoped>
.tab-bar {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: var(--z-nav);
  display: flex; height: calc(56px + var(--safe-bottom)); padding-bottom: var(--safe-bottom);
  background: var(--surface-raised); border-top: 1px solid var(--color-hairline);
  box-shadow: var(--edge-highlight);
}
.tab-item {
  flex: 1 1 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: var(--space-1); min-height: var(--tap-min); padding: var(--space-2) 0;
  color: var(--color-text); opacity: 0.62; font-weight: var(--weight-medium);
  text-decoration: none; position: relative;
  transition: opacity var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-standard);
}
.tab-item:active { transform: scale(0.96); }
.tab-label { font-size: var(--text-xs); line-height: 1; letter-spacing: 0.2px; }
.tab-item.active { color: var(--color-accent-line); opacity: 1; font-weight: var(--weight-semibold); }
.tab-item.active::before {
  content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%);
  width: 20px; height: 2px; border-radius: var(--radius-full); background: var(--color-accent-line);
}
@media (hover: hover) { .tab-item:not(.active):hover { opacity: 0.85; } }
</style>
