<template>
  <div class="legal-view-container">
    <div class="card legal-card">
      <router-link to="/" class="back-link">← Back to Home</router-link>
      <h1>Privacy Policy</h1>
      <p class="effective-date">Effective Date: June 15, 2026</p>

      <section class="legal-section">
        <p>
          Welcome to <strong>LiftLogic</strong>. We respect your privacy and are committed to protecting your personal data. This privacy policy informs you about how we look after your personal data when you visit our application and tells you about your privacy rights and how the law protects you.
        </p>
      </section>

      <section class="legal-section">
        <h2>1. Information We Collect</h2>
        <p>We may collect, use, store, and transfer different kinds of personal data about you which we have grouped together as follows:</p>
        <ul>
          <li><strong>Identity Data:</strong> Includes your name, email, and profile photo provided when signing in via Google Auth or email accounts.</li>
          <li><strong>Workout & Progress Data:</strong> Includes your training logs, routines, sets, reps, weights, history index, and calculated metrics (like estimated 1RM and total volume).</li>
          <li><strong>Third-Party Integration Data (Strava):</strong> If you choose to connect your Strava account, we request authorization tokens to retrieve your cardio activities (to display on your training calendar heatmap) and to push weight training workout logs to your Strava timeline. We do not store or access your Strava credentials directly.</li>
        </ul>
      </section>

      <section class="legal-section">
        <h2>2. How We Use Your Information</h2>
        <p>We use your data only to provide and improve the services offered by LiftLogic, specifically:</p>
        <ul>
          <li>To create and manage your user account.</li>
          <li>To track and display your weight training progression, volume trends, and calendar heatmap.</li>
          <li>To synchronize activities with your Strava account based on your preferences.</li>
          <li>To store backup/sync states securely using Google Firebase services.</li>
        </ul>
      </section>

      <section class="legal-section">
        <h2>3. Data Storage & Security</h2>
        <p>
          All account information, settings, and workout data are stored securely on Google Firebase/Firestore servers located in the United States. We implement industry-standard security measures to prevent unauthorized access, alteration, or disclosure of your data.
        </p>
      </section>

      <section class="legal-section">
        <h2>4. Data Sharing & Third Parties</h2>
        <p>
          We do not sell, rent, or share your personal data with third parties for marketing purposes. Your data is only shared with third-party service providers (Google Firebase and Strava) to the extent necessary to run the core application features you enable.
        </p>
      </section>

      <section class="legal-section">
        <h2>5. Your Rights & Data Deletion</h2>
        <p>
          You have full control over your data. You may review, edit, or delete your workout logs and settings directly within the app. If you wish to delete your account and all associated workout data completely, you can do so in the <strong>Profile</strong> section of the app or contact support.
        </p>
      </section>

      <section class="legal-section">
        <h2>6. Contact Us</h2>
        <p>If you have any questions about this Privacy Policy or your data, you can reach out via our GitHub repository or project email.</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
// Static legal page view
</script>

<style scoped>
.legal-view-container {
  max-width: 800px;
  margin: 40px auto;
  padding: 0 20px;
}

.legal-card {
  background-color: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.back-link {
  color: #007bff;
  text-decoration: none;
  font-size: 0.9em;
  display: inline-block;
  margin-bottom: 25px;
  transition: color 0.2s;
}

.back-link:hover {
  color: #0056b3;
  text-decoration: underline;
}

h1 {
  font-size: 2.2em;
  font-weight: 700;
  margin-top: 0;
  margin-bottom: 10px;
  color: var(--color-card-heading);
}

.effective-date {
  font-size: 0.9em;
  color: var(--color-card-text);
  opacity: 0.7;
  margin-bottom: 30px;
  border-bottom: 1px solid var(--color-card-border);
  padding-bottom: 15px;
}

.legal-section {
  margin-bottom: 25px;
  color: var(--color-card-text);
  line-height: 1.7;
}

.legal-section h2 {
  font-size: 1.3em;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 12px;
  color: var(--color-card-heading);
}

.legal-section p {
  margin-top: 0;
  margin-bottom: 15px;
}

.legal-section ul {
  padding-left: 20px;
  margin-bottom: 15px;
}

.legal-section li {
  margin-bottom: 8px;
}

@media (max-width: 600px) {
  .legal-view-container {
    margin: 20px auto;
    padding: 0 10px;
  }
  .legal-card {
    padding: 25px 20px;
  }
  h1 {
    font-size: 1.8em;
  }
}
</style>
