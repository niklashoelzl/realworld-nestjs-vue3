<!--
Login.vue

Login Formular für bestehende Nutzer.
Nutzt `useForm` für reaktive Formular und Fehlerzustände.
Nach erfolgreichem Login wird der Nutzer zur Startseite weitergeleitet.
Fehler aus dem `authStore` werden im Formular angezeigt.
-->

<template>
  <div class="flex min-h-screen flex-col justify-start px-6 py-12 lg:px-8 bg-gray-900">
    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <h2 class="mt-10 text-center text-2xl font-bold tracking-tight text-white">
        Sign in to your account
      </h2>
    </div>

    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
      <div class="space-y-6">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-100">
            Email address
          </label>

          <div class="mt-2">
            <input id="email" v-model="form.email" type="email" placeholder="Email" :disabled="loading"
              class="block w-full rounded-md bg-white/5 px-3 py-2 text-white outline outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:outline-indigo-500" />
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between">
            <label for="password" class="block text-sm font-medium text-gray-100">
              Password
            </label>

            <div class="text-sm">
              <a href="#" class="font-semibold text-indigo-400 hover:text-indigo-300">
                Forgot password?
              </a>
            </div>
          </div>

          <div class="mt-2">
            <input id="password" v-model="form.password" type="password" placeholder="Password" :disabled="loading"
              class="block w-full rounded-md bg-white/5 px-3 py-2 text-white outline outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:outline-indigo-500" />
          </div>
        </div>

        <div v-if="error" class="rounded-md bg-red-500/10 p-3">
          <p class="text-sm text-red-400">{{ error }}</p>
        </div>

        <div>
          <button @click="handleLogin" :disabled="loading"
            class="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50">
            <span v-if="loading" class="loading loading-spinner loading-sm mr-2"></span>
            {{ loading ? 'Logging in...' : 'Login' }}
          </button>
        </div>
      </div>

      <p class="mt-10 text-center text-sm text-gray-400">
        Don't have an account?
        <RouterLink to="/SignUp" class="font-semibold text-indigo-400 hover:text-indigo-300">Sign up</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useForm } from '@/composables/use-form';
import { RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';

const authStore = useAuthStore();
const router = useRouter();

const { form, loading, error, setLoading, handleError, clearError } = useForm({
  email: '',
  password: '',
});

/**
 * Führt den Login Vorgang durch.
 * Leitet bei Erfolg zur Startseite weiter.
 * Fehler werden über `handleError` in `error.value` gesetzt.
 */
async function handleLogin() {
  clearError();
  setLoading(true);

  try {
    await authStore.login(form.value.email, form.value.password);
    await router.push('/');
  } catch (err: any) {
    handleError(err);
  } finally {
    setLoading(false);
  }
}
</script>
