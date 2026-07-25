import { ref, onMounted, onUnmounted } from 'vue';

export interface ChartTheme {
  grid: string;
  axis: string;
  tooltipBg: string;
  tooltipFg: string;
  tooltipMuted: string;
  track: string;
  series1: string;
  series2: string;
  hairline: string;
  cardBg: string;
  up: string;
  down: string;
  zoneUnder: string;
  zoneOptimal: string;
  zoneHigh: string;
}

const read = (): ChartTheme => {
  const cs = getComputedStyle(document.documentElement);
  const t = (n: string, fb: string) => cs.getPropertyValue(n).trim() || fb;
  return {
    grid: t('--chart-grid', 'rgba(60,60,60,0.1)'),
    axis: t('--chart-axis', 'rgba(60,60,60,0.66)'),
    tooltipBg: t('--chart-tooltip-bg', '#ffffff'),
    tooltipFg: t('--text-primary', '#18181b'),
    tooltipMuted: t('--text-secondary', 'rgba(0,0,0,0.66)'),
    track: t('--surface-sunken', '#f4f4f5'),
    series1: t('--color-accent', '#2563eb'),
    series2: t('--chart-series-2', '#7c8798'),
    hairline: t('--color-hairline', 'rgba(0,0,0,0.08)'),
    cardBg: t('--surface-raised', '#ffffff'),
    up: t('--color-success-fg', '#0f7a3d'),
    down: t('--color-danger-fg', '#b42318'),
    zoneUnder: t('--color-warning-fg', '#8a5a00'),
    zoneOptimal: t('--color-success-fg', '#0f7a3d'),
    zoneHigh: t('--color-accent', '#2563eb'),
  };
};

/**
 * Theme-aware Chart.js chrome. Resolves the --chart-* tokens once on mount and
 * re-resolves whenever the app theme changes (data-theme attribute or OS
 * scheme), so charts recolor live instead of hardcoding a dark-only palette.
 */
export function useChartTheme() {
  const theme = ref<ChartTheme>(
    typeof document !== 'undefined' ? read() : ({} as ChartTheme),
  );

  let observer: MutationObserver | null = null;
  let media: MediaQueryList | null = null;
  const refresh = () => { theme.value = read(); };

  onMounted(() => {
    refresh();
    observer = new MutationObserver(refresh);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener?.('change', refresh);
  });
  onUnmounted(() => {
    observer?.disconnect();
    media?.removeEventListener?.('change', refresh);
  });

  return { theme, refresh };
}
