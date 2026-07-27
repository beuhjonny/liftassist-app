<template>
  <!-- The expedition backdrop. Two modes, one scrim contract:
       - `plate` set   -> a cleared photographic plate (public/vistas/*)
       - `plate` unset -> the owned SVG ridgeline world, no assets, a few KB
       The source plates are monochrome, so a single download covers every band:
       the readiness band is applied as a color grade, not a separate image.
       Purely decorative - always aria-hidden, always behind a scrim. -->
  <div class="vista" :class="[`band-${band}`, plate ? 'is-photo' : 'is-painted']" aria-hidden="true">
    <picture v-if="plate" class="vista-photo">
      <source :srcset="`/vistas/${plate}.avif`" type="image/avif" />
      <img :src="`/vistas/${plate}.webp`" alt="" decoding="async" fetchpriority="low" />
    </picture>

    <svg v-else class="vista-svg" viewBox="0 0 400 220" preserveAspectRatio="xMidYMax slice">
      <defs>
        <linearGradient :id="`sky-${uid}`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" class="sky-top" />
          <stop offset="55%" class="sky-mid" />
          <stop offset="100%" class="sky-bot" />
        </linearGradient>
        <radialGradient :id="`glow-${uid}`" cx="0.72" cy="0.62" r="0.5">
          <stop offset="0%" class="glow-in" />
          <stop offset="100%" class="glow-out" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="400" height="220" :fill="`url(#sky-${uid})`" />
      <!-- light source: sun/moon bloom low on the horizon -->
      <circle cx="288" cy="136" r="90" :fill="`url(#glow-${uid})`" class="bloom" />

      <!-- drifting haze bands (the living layer) -->
      <g class="haze">
        <ellipse cx="120" cy="120" rx="170" ry="12" />
        <ellipse cx="300" cy="140" rx="140" ry="9" />
      </g>

      <!-- ridgelines: far -> near, atmospheric depth via opacity -->
      <path class="ridge ridge-4" d="M0,150 L48,120 L92,142 L140,104 L188,138 L236,112 L290,146 L340,120 L400,148 L400,220 L0,220 Z" />
      <path class="ridge ridge-3" d="M0,168 L60,140 L108,162 L164,126 L214,158 L268,134 L322,164 L400,138 L400,220 L0,220 Z" />
      <path class="ridge ridge-2" d="M0,186 L54,164 L118,184 L176,152 L232,182 L296,160 L356,186 L400,170 L400,220 L0,220 Z" />
      <path class="ridge ridge-1" d="M0,206 L70,188 L132,204 L198,180 L262,202 L330,186 L400,204 L400,220 L0,220 Z" />
    </svg>

    <!-- band grade: turns one monochrome plate into the hour of day -->
    <div v-if="plate" class="vista-grade"></div>
    <!-- scrim: content always sits on near-black, AA never at risk -->
    <div class="vista-scrim"></div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    band?: 'push' | 'steady' | 'recover' | 'summit';
    /** Basename of a plate in public/vistas/ (expects .avif + .webp). */
    plate?: string;
  }>(),
  { band: 'steady', plate: undefined },
);
// Unique gradient ids so multiple vistas on one page never collide.
const uid = Math.random().toString(36).slice(2, 8);
</script>

<style scoped>
.vista {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;
}
.vista-svg { width: 100%; height: 100%; display: block; }

.vista-photo { position: absolute; inset: 0; }
.vista-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* Plates are cut to roughly the card's aspect, so centre holds the frame. */
  object-position: 50% 46%;
  display: block;
}

/* Light per band: same world, different hour. */
.band-push    { --sky-t: #1d3157; --sky-m: #3d4a72; --sky-b: #121212; --ridge: #0a1018; --bloom-c: rgba(255,168,104,0.50); --grade-c: rgba(255,164,96,0.42); }
.band-steady  { --sky-t: #223047; --sky-m: #33405a; --sky-b: #121212; --ridge: #0c1016; --bloom-c: rgba(170,196,232,0.28); --grade-c: rgba(146,180,224,0.34); }
.band-recover { --sky-t: #2c2049; --sky-m: #453160; --sky-b: #121212; --ridge: #0f0c18; --bloom-c: rgba(198,142,232,0.34); --grade-c: rgba(176,140,224,0.36); }
.band-summit  { --sky-t: #3a2618; --sky-m: #6b4622; --sky-b: #121212; --ridge: #120e0a; --bloom-c: rgba(255,190,110,0.60); --grade-c: rgba(255,188,104,0.55); }

.sky-top { stop-color: var(--sky-t); }
.sky-mid { stop-color: var(--sky-m); }
.sky-bot { stop-color: var(--sky-b); }
.glow-in { stop-color: var(--bloom-c); }
.glow-out { stop-color: transparent; }

.ridge { fill: var(--ridge); }
.ridge-4 { opacity: 0.34; }
.ridge-3 { opacity: 0.52; }
.ridge-2 { opacity: 0.74; }
.ridge-1 { opacity: 1; }

.haze ellipse { fill: rgba(255, 255, 255, 0.045); }

/* soft-light tints the plate without flattening its tonal range. */
.vista-grade {
  position: absolute;
  inset: 0;
  background: var(--grade-c);
  mix-blend-mode: soft-light;
}

/* Scrim: bottom two-thirds resolve to the app surface. */
.vista-scrim {
  position: absolute;
  inset: 0;
  /* Light at the top so the ridgelines actually read; resolves to the card
     surface by the time it reaches the CTA so text contrast is never at risk. */
  background: linear-gradient(
    to bottom,
    rgba(18, 18, 18, 0.06) 0%,
    rgba(18, 18, 18, 0.34) 46%,
    rgba(18, 18, 18, 0.82) 72%,
    var(--surface-raised) 100%
  );
}
/* A photograph earns a band of its own: near-clear across the sky and peaks,
   then a hard fall-off so every word sits on flat colour, never on the image.
   The 32% break is measured against where hero copy actually starts (~35%);
   moving text in the hero means re-checking these stops. */
.is-photo .vista-scrim {
  background: linear-gradient(
    to bottom,
    rgba(18, 18, 18, 0.08) 0%,
    rgba(18, 18, 18, 0.16) 26%,
    rgba(18, 18, 18, 0.72) 40%,
    rgba(18, 18, 18, 0.94) 56%,
    var(--surface-raised) 68%
  );
}

/* The living layer: one slow drift, nothing that draws the eye. */
@media (prefers-reduced-motion: no-preference) {
  .haze { animation: vista-drift 52s linear infinite; }
  .bloom { animation: vista-breathe 30s ease-in-out infinite; }
  .vista-photo img {
    transform-origin: 50% 38%;
    animation: vista-push-in 72s ease-in-out infinite;
  }
  @keyframes vista-drift {
    from { transform: translateX(-22px); }
    50%  { transform: translateX(22px); }
    to   { transform: translateX(-22px); }
  }
  @keyframes vista-breathe {
    0%, 100% { opacity: 0.85; }
    50%      { opacity: 1; }
  }
  @keyframes vista-push-in {
    0%, 100% { transform: scale(1.03); }
    50%      { transform: scale(1.09); }
  }
}
</style>
