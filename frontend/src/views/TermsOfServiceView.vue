<script setup lang="ts">
import router from '@/router';
</script>

<template>
  <div class="grid place-items-center w-full h-screen bg-blue-900">
    <div
      class="w-full sm:w-3/4 lg:w-3/5 m-auto bg-blue-700 rounded-3xl shadow-lg px-4 pt-5 pb-4 sm:p-6 sm:pb-4 space-y-4 text-base"
    >
      <button class="m-auto block text-center" @click="router.push('/')">Back</button>

      <h1 class="text-center">Terms of Service</h1>
      <p class="text-center">Effective Date: January 1st, 2025</p>
      <br />

      <section>
        <h2>1. Service Description</h2>
        <p>
          Bunnychess is a demo platform for playing chess games, created as a GitHub project. It is
          not intended as a commercial product and is hosted on servers located in the Netherlands.
        </p>
      </section>

      <section>
        <h2>2. User Accounts</h2>
        <ul>
          <li>
            <strong>Registration:</strong> To use Bunnychess, you must create an account by
            providing a username, email address, and password.
          </li>
          <li>
            <strong>Responsibility:</strong> You are responsible for maintaining the confidentiality
            of your account credentials and all activities conducted under your account.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Chat Functionality</h2>
        <p>
          Bunnychess includes a chat feature that allows players to communicate during games. By
          using this feature, you agree that:
        </p>
        <ul>
          <li>You are solely responsible for the content of your messages.</li>
          <li>Chat messages are not stored and cannot be retrieved.</li>
          <li>We disclaim all responsibility for any content shared in chat by users.</li>
        </ul>
      </section>

      <section>
        <h2>4. Acceptable Use</h2>
        <p>By using Bunnychess, you agree to:</p>
        <ul>
          <li>Use the Service for its intended purpose of playing chess games.</li>
          <li>
            Refrain from engaging in any activity that disrupts or harms the Service, other users,
            or the hosting server.
          </li>
          <li>Not use the Service for illegal activities or to distribute malicious content.</li>
        </ul>
      </section>

      <section>
        <h2>5. Termination</h2>
        <p>We reserve the right to suspend or terminate your account if you:</p>
        <ul>
          <li>Violate these Terms of Service.</li>
          <li>Engage in activities that harm or disrupt the Service or its users.</li>
        </ul>
      </section>

      <section>
        <h2>6. Disclaimer of Warranties</h2>
        <p>
          Bunnychess is provided "as is" without any guarantees or warranties. We do not guarantee
          the availability, reliability, or performance of the Service.
        </p>
      </section>

      <section>
        <h2>7. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, we are not liable for any damages, losses, or
          disputes arising from your use of Bunnychess or the chat feature.
        </p>
      </section>

      <section>
        <h2>8. Changes to These Terms</h2>
        <p>
          We reserve the right to modify these Terms of Service at any time. Continued use of the
          Service after changes are made constitutes acceptance of the revised terms.
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
