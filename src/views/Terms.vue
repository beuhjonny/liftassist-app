<template>
  <div class="legal-view-container">
    <div class="card legal-card">
      <router-link to="/" class="back-link">← Back to Home</router-link>
      <h1>Terms of Service</h1>
      <p class="effective-date">Effective Date: June 15, 2026</p>

      <section class="legal-section">
        <p>
          Welcome to <strong>LiftLogic</strong>. By using our web application, you agree to be bound by these Terms of Service. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
        </p>
      </section>

      <section class="legal-section">
        <h2>1. Account Registration and Security</h2>
        <p>
          To access the full features of LiftLogic, you must register for an account using Google Auth or email login. You are solely responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. We reserve the right to suspend or terminate accounts that provide inaccurate information or violate these terms.
        </p>
      </section>

      <section class="legal-section">
        <h2>2. Permitted Use & Restrictions</h2>
        <p>
          LiftLogic is provided for your personal, non-commercial use to log workouts, structure routines, and analyze strength progress. You agree not to:
        </p>
        <ul>
          <li>Abuse or overload database APIs or authentication systems.</li>
          <li>Scrape, reverse-engineer, or attempt to extract the source code of this application.</li>
          <li>Use the app to store or transmit any malicious code, bots, or scripts.</li>
        </ul>
      </section>

      <section class="legal-section">
        <h2>3. Physical Activity Disclaimer</h2>
        <p style="color: var(--color-warning); font-weight: 600;">
          ⚠️ IMPORTANT HEALTH & SAFETY WARNING:
        </p>
        <p>
          Weight training and physical exercise can be strenuous and carry inherent risks of injury or health complications. LiftLogic is a tracking tool and does not provide professional medical advice, diagnosis, or treatment. 
        </p>
        <p>
          You agree that you are performing all exercises at your own risk. Consult a physician or qualified fitness professional before starting any new training program. LiftLogic and its creators are not liable for any injury, health problems, or damages resulting from your use of the application.
        </p>
      </section>

      <section class="legal-section">
        <h2>4. Third-Party Services (Strava)</h2>
        <p>
          LiftLogic offers integration with Strava. By enabling these integrations, you grant us permissions to read and write activity data on your behalf. You acknowledge that your use of third-party platforms is governed by their respective terms of service and privacy policies, and that LiftLogic is not responsible for any issues arising on third-party systems.
        </p>
      </section>

      <section class="legal-section">
        <h2>5. Disclaimer of Warranties & Limitation of Liability</h2>
        <p>
          LiftLogic is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, either express or implied. We do not guarantee that the service will be uninterrupted, error-free, or that your workout history data will be permanently preserved without loss. In no event shall LiftLogic or its creators be liable for any data loss, service interruptions, or consequential damages.
        </p>
      </section>

      <section class="legal-section">
        <h2>6. Changes to Terms</h2>
        <p>
          We reserve the right to modify or replace these Terms of Service at any time. Your continued use of the application after changes are posted constitutes your acceptance of the updated terms.
        </p>
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
