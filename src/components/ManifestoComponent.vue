<template>
  <div class="manifesto-content">
    <p style="margin-top: 0;">
      Lift Logic is your no-nonsense digital training partner, built on the science that steady, methodical overload is the true key to consistent growth and hypertrophy. We cut through the clutter to provide a streamlined tool that manages your progression so you can focus entirely on the effort.
    </p>

    <h3>What is Lift Logic?</h3>
    <ul>
      <li><strong>Customizable.</strong> Define your own splits, exercises, rep ranges, and progression steps to fit your specific goals. Or get an AI to help you import your favorite routine.</li>
      <li><strong>Prepared.</strong> Your workout pre-populates with exact targets based on previous performance—no guesswork, just clear goals.</li>
      <li><strong>Automated.</strong> The engine handles double progression math instantly: hit your targets, and the app automatically increases reps or load for the next session.</li>
      <li><strong>Focused.</strong> Integrated rest timers and a distraction-free interface keep you on track between sets without the noise.</li>
    </ul>

    <h3>What It Isn’t</h3>
    <p>
      Lift Logic is not a general fitness tracker, a nutrition guide, or a library of tutorial videos. It is not a social network chasing engagement. It is a specialized tool designed to do one thing exceptionally well: make you stronger.
    </p>

    <h3>Who It’s For</h3>
    <p>
      This is for the self-reliant lifter. You know your way around a squat rack and understand that results come from consistency, not shortcuts. If you believe that training should be measured, tracked, and treated with seriousness, Lift Logic is for you.
    </p>

    <p><strong>Consistent, intelligent progression guarantees results.</strong></p>
  </div>
</template>

<script setup lang="ts">
// No script logic needed for this simple display component
</script>

<style scoped>
.manifesto-content {
  padding: 10px 0;
  text-align: left;
  line-height: 1.6;
  color: var(--color-card-text);
}
.manifesto-content h2 {
  text-align: center;
  margin-top: 0;
  margin-bottom: 25px;
  font-size: 1.7em;
  color: var(--color-card-heading);
}
.manifesto-content h3 {
  margin-top: 25px;
  margin-bottom: 10px;
  font-size: 1.3em;
  font-weight: 800;
  color: var(--color-card-heading);
}
.manifesto-content p,
.manifesto-content ul {
  margin-bottom: 15px;
}
.manifesto-content ul {
  padding-left: 20px;
}
.manifesto-content ul ul {
  margin-top: 5px;
  margin-bottom: 10px;
}
.manifesto-content li {
  margin-bottom: 15px; /* Increased from 8px for readability */
}
.manifesto-content strong {
  color: #007bff;
  font-weight: 700;
}
</style>