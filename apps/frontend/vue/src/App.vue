<!--
App.vue
 
Wurzelkomponente der Applikation.
Enthält die globale Navigationsleiste mit Avatar Dropdown und
bindet den RouterView für die aktive Route ein.
 
Das Dropdown zeigt für eingeloggte Nutzer Profilbild (oder Initial),
Benutzername, E-Mail, einen Link zum eigenen Profil sowie einen Logout Button.
Nicht eingeloggte Nutzer sehen Login und Registrierungslinks.
 
Das Dropdown wird durch einen globalen Click Listener geschlossen,
sobald außerhalb des Dropdown Bereichs geklickt wird.
-->

<template>
  <div class="min-h-screen bg-gray-900">
    <div class="navbar bg-gray-800 border-b border-gray-600 px-5 py-5">
      <div class="navbar-start ml-12">
        <span class="text-xl font-semibold text-primary">
          <RouterLink to="/">The Article Platform</RouterLink>
        </span>
      </div>

      <div class="navbar-center">
        <nav class="flex gap-2 items-center">
          <RouterLink to="/"
            class="px-3 py-1.5 rounded-full text-base font-semibold text-white hover:bg-white/20 transition-colors"
            active-class="bg-indigo-500 text-white">Home</RouterLink>
          <RouterLink to="/about"
            class="px-3 py-1.5 rounded-full text-base font-semibold text-white hover:bg-white/20 transition-colors"
            active-class="bg-indigo-500 text-white">About</RouterLink>
        </nav>
      </div>

      <div class="navbar-end mr-12">
        <!-- Avatar Button mit Dropdown -->
        <div ref="dropdownRef" class="relative">
          <button @click="isDropdownOpen = !isDropdownOpen"
            class="w-10 h-10 rounded-full bg-indigo-500 hover:bg-indigo-600 transition-colors flex items-center justify-center overflow-hidden"
            :title="authStore.isAuthenticated ? authStore.user?.username : 'Profil'">

            <!-- Profilbild wenn vorhanden, sonst Icon -->
            <img v-if="authStore.user?.image" :src="authStore.user.image" :alt="authStore.user.username"
              class="w-full h-full object-cover">
            <span v-else-if="authStore.isAuthenticated" class="text-white text-lg font-bold">
              {{ (authStore.user?.username?.charAt(0) || '?').toUpperCase() }}
            </span>
            <User v-else class="text-white" />
          </button>

          <!-- Dropdown Menu -->
          <div v-if="isDropdownOpen" @click.outside="isDropdownOpen = false"
            class="absolute right-0 mt-2 w-48 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-50">

            <!-- Authenticated User -->
            <div v-if="authStore.isAuthenticated">
              <div class="px-4 py-3 border-b border-gray-600">
                <p class="text-sm text-white font-semibold">{{ authStore.user?.username }}</p>
                <p class="text-xs text-gray-400">{{ authStore.user?.email }}</p>
              </div>

              <RouterLink to="/profile"
                class="flex items-center gap-2 w-full px-4 py-2 text-sm text-white hover:bg-gray-600 transition-colors"
                @click="isDropdownOpen = false">
                <UserPen class="text-white w-4 h-4" />Profile
              </RouterLink>

              <button @click="handleLogout"
                class="flex items-center gap-2 w-full px-4 py-2 text-sm text-indigo-400 hover:bg-gray-600 transition-colors">
                <LogOut class="text-white w-4 h-4" />Logout
              </button>
            </div>

            <!-- Not Authenticated -->
            <div v-else>
              <RouterLink to="/login"
                class="flex items-center gap-2 w-full px-4 py-2 text-sm text-white hover:bg-gray-600 transition-colors"
                @click="isDropdownOpen = false">
                <KeyRound class="text-white w-4 h-4" />Login
              </RouterLink>

              <RouterLink to="/SignUp"
                class="flex items-center gap-2 w-full px-4 py-2 text-sm text-indigo-400 hover:bg-gray-600 transition-colors border-t border-gray-600 font-semibold"
                @click="isDropdownOpen = false">
                <LogIn class="text-white w-4 h-4" />Sign up
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <main class="container mx-auto px-4 py-8 max-w-6xl">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { RouterLink, RouterView, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { User, UserPen, LogOut, KeyRound, LogIn } from 'lucide-vue-next';

const authStore = useAuthStore();
const router = useRouter();

const isDropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

/**
 * Meldet den Nutzer ab, schließt das Dropdown und leitet zur Startseite weiter.
 */
function handleLogout() {
  authStore.logout();
  isDropdownOpen.value = false;
  router.push('/');
}

/**
 * Schließt das Dropdown, wenn außerhalb des Dropdown Elements geklickt wird.
 *
 * @param event Das native MouseEvent
 */
function handleClickOutside(event: MouseEvent) {
  if (
    dropdownRef.value &&
    !dropdownRef.value.contains(event.target as Node)
  ) {
    isDropdownOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
