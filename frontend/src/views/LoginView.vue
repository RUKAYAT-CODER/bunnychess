<script setup lang="ts">
import ContainerWithTitle from '@/components/ContainerWithTitle.vue';
import PlayAgainstAi from '@/components/PlayAgainstAi.vue';
import { isHttpError } from '@/core/axios';
import { useAuthStore } from '@/stores/auth.store';
import { useVuelidate } from '@vuelidate/core';
import { email, required } from '@vuelidate/validators';
import { reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import router from '../router';

const authStore = useAuthStore();
const route = useRoute();

const form = reactive({
  email: '',
  password: ''
});
const serverError = ref<string | undefined>(undefined);
const isLoggingIn = ref<boolean>(false);

const rules = {
  email: { required, email },
  password: { required }
};

const v$ = useVuelidate(rules, form);

async function login(): Promise<void> {
  isLoggingIn.value = true;
  serverError.value = undefined;
  try {
    await authStore.login(form.email, form.password);
    if (route.query.redirect) {
      router.replace(route.query.redirect as string);
    } else {
      router.push({ path: '/' });
    }
  } catch (err) {
    if (isHttpError(err)) {
      const message = err.response?.data.message;
      serverError.value = Array.isArray(message) ? message[0] : message;
    }
  } finally {
    isLoggingIn.value = false;
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
        <div>Password:</div>
        <input type="password" v-model="form.password" @blur="v$.password.$touch" maxlength="64" />
        <div class="text-red-400" v-for="error in v$.password.$errors" :key="error.$uid">
          {{ error.$message }}
        </div>
      </div>
      <div>
        <button @click="login()" :disabled="v$.$invalid || isLoggingIn">Login</button>
      </div>
      <div>
        <button @click="router.push({ path: '/register' })">Go to register</button>
      </div>
      <div class="text-red-400">{{ serverError }}</div>
      <!-- 10+0 demo game for unregistered users -->
      <PlayAgainstAi :game-type="'10+0'" class="!mt-8"></PlayAgainstAi>
    </form>
  </ContainerWithTitle>
</template>
