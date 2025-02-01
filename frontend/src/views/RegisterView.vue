<script setup lang="ts">
import ContainerWithTitle from '@/components/ContainerWithTitle.vue';
import { isHttpError } from '@/core/axios';
import { useAuthStore } from '@/stores/auth.store';
import { useVuelidate } from '@vuelidate/core';
import { email, helpers, maxLength, minLength, required } from '@vuelidate/validators';
import { reactive, ref } from 'vue';
import router from '../router';

const authStore = useAuthStore();

const form = reactive({
  email: '',
  username: '',
  password: ''
});
const serverError = ref<string | undefined>();
const isRegistering = ref<boolean>(false);

const rules = {
  email: { required, email },
  username: {
    required,
    regex: helpers.withMessage(
      'Username can only contain letters, numbers and underscores and be 3-16 characters long',
      helpers.regex(/^[a-zA-Z0-9_]{3,16}$/)
    )
  },
  password: { required, minLength: minLength(8), maxLength: maxLength(64) }
};

const v$ = useVuelidate(rules, form);

async function register() {
  isRegistering.value = true;
  serverError.value = undefined;
  try {
    await authStore.register(form.email, form.username, form.password);
    router.push({ path: '/login' });
  } catch (err) {
    if (isHttpError(err)) {
      const message = err.response?.data.message;
      serverError.value = Array.isArray(message) ? message[0] : message;
    }
  } finally {
    isRegistering.value = false;
  }
}
</script>

<template>
  <ContainerWithTitle>
    <form class="bg-blue-700 rounded shadow-lg px-4 pt-5 pb-4 sm:p-6 sm:pb-4 space-y-4 text-center">
      <div>
        <div>Email:</div>
        <input type="text" v-model="form.email" @blur="v$.email.$touch" maxlength="255" />
        <div class="text-red-400" v-for="error in v$.email.$errors" :key="error.$uid">
          {{ error.$message }}
        </div>
      </div>
      <div>
        <div class="mt-4">Username:</div>
        <input type="text" v-model="form.username" @blur="v$.username.$touch" maxlength="16" />
        <div class="text-red-400" v-for="error in v$.username.$errors" :key="error.$uid">
          {{ error.$message }}
        </div>
      </div>
      <div>
        <div class="mt-4">Password:</div>
        <input type="password" v-model="form.password" @blur="v$.password.$touch" maxlength="64" />
        <div class="text-red-400" v-for="error in v$.password.$errors" :key="error.$uid">
          {{ error.$message }}
        </div>
      </div>
      <div>
        <button @click="register()" :disabled="v$.$invalid || isRegistering">Register</button>
      </div>
      <div>
        <button @click="router.push({ path: '/login' })">Go to login</button>
      </div>
      <div class="text-red-400" v-if="serverError">{{ serverError }}</div>
    </form>
  </ContainerWithTitle>
</template>
