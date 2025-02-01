<script setup lang="ts">
import router from '@/router';
</script>

<template>
  <div class="grid place-items-center w-full h-screen bg-blue-900">
    <div
      class="w-full sm:w-3/4 lg:w-3/5 m-auto bg-blue-700 rounded-3xl shadow-lg px-4 pt-5 pb-4 sm:p-6 sm:pb-4 space-y-4 text-base"
    >
      <button class="m-auto block text-center" @click="router.push('/')">Back</button>

      <h1 class="text-center">Privacy Policy</h1>
      <p class="text-center">Effective Date: January 1st, 2025</p>
      <br />

      <section>
        <h2>1. Data Controller</h2>
        <p>
          The data controller responsible for your personal data is Pietro Bassi, reachable via
          <a href="https://www.linkedin.com/in/pietro-bassi/" class="text-blue-300">LinkedIn</a>.
        </p>
      </section>

      <section>
        <h2>2. Data We Collect</h2>
        <ul>
          <li><strong>Email Address:</strong> Required for account creation and authentication.</li>
          <li>
            <strong>Username:</strong> Required for account creation and gameplay identification.
          </li>
          <li>
            <strong>Password:</strong> Used for authentication purposes. Passwords are encrypted and
            stored securely.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Purpose of Data Collection</h2>
        <p>Your data is collected and processed solely for:</p>
        <ul>
          <li>Authenticating and managing user accounts.</li>
          <li>Enabling you to log in and play games on Bunnychess.</li>
        </ul>
        <p>We do not use your data for marketing, analytics, or any other purposes.</p>
      </section>

      <section>
        <h2>4. Chat Functionality</h2>
        <p>
          Bunnychess includes a chat feature that allows players to communicate during games. Please
          note:
        </p>
        <ul>
          <li>Chat messages are <strong>not stored</strong> on our servers.</li>
          <li>We do not monitor or moderate chat content.</li>
          <li>Users are solely responsible for the content of their messages.</li>
        </ul>
      </section>

      <section>
        <h2>5. Legal Basis for Processing</h2>
        <p>We process your data based on the legal basis of:</p>
        <ul>
          <li>
            <strong>Consent:</strong> By creating an account, you consent to the processing of your
            personal data for authentication purposes.
          </li>
        </ul>
      </section>

      <section>
        <h2>6. Data Retention</h2>
        <p>
          Your data will be stored only for as long as Bunnychess is active. Once Bunnychess is
          deleted, all user data, including usernames, email addresses, and encrypted passwords,
          will be permanently deleted.
        </p>
      </section>

      <section>
        <h2>7. Data Security</h2>
        <p>
          We implement appropriate technical and organizational measures to protect your data,
          including:
        </p>
        <ul>
          <li>Encrypting passwords using industry-standard techniques.</li>
          <li>Hosting data on secure servers located in the Netherlands.</li>
        </ul>
      </section>

      <section>
        <h2>8. Your Rights</h2>
        <p>Under the GDPR, you have the following rights:</p>
        <ul>
          <li>
            <strong>Right to Access:</strong> Request access to the personal data we hold about you.
          </li>
          <li>
            <strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete
            data.
          </li>
          <li><strong>Right to Erasure:</strong> Request deletion of your personal data.</li>
          <li><strong>Right to Restrict Processing:</strong> Limit how we use your data.</li>
          <li>
            <strong>Right to Data Portability:</strong> Obtain a copy of your data in a portable
            format.
          </li>
          <li><strong>Right to Withdraw Consent:</strong> Withdraw your consent at any time.</li>
        </ul>
        <p>
          To exercise any of these rights, please contact us via
          <a href="https://www.linkedin.com/in/pietro-bassi/" class="text-blue-300">LinkedIn</a>.
        </p>
      </section>

      <section>
        <h2>9. Complaints</h2>
        <p>
          If you believe your data has been processed unlawfully, you have the right to lodge a
          complaint with a data protection authority, such as the Dutch Data Protection Authority
          (Autoriteit Persoonsgegevens).
        </p>
      </section>

      <button class="m-auto block text-center" @click="router.push('/')">Back</button>
    </div>
  </div>
</template>

<style scoped>
h1 {
  font-size: 2rem;
}

h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

section {
  margin-bottom: 2rem !important;
  margin-left: 2rem;
}

section > h2 {
  margin-left: -2rem !important;
}

li {
  margin-left: 2rem;
  list-style-type: circle;
}
</style>
