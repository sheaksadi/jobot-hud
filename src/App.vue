<script setup lang="ts">
import { onMounted } from "vue";
import { useAuthStore } from "./stores/authStore";
import { useExchangeStore } from "./stores/exchangesStore.js";

const authStore = useAuthStore();
const exchangeStore = useExchangeStore();

onMounted(() => {
  // If the user is already logged in (e.g., from a previous session with a stored JWT),
  // fetch the initial data immediately.

  if (authStore.isLoggedIn) {
                    console.log('authStore.isLoggedIn:', authStore.isLoggedIn);

    exchangeStore.initialize();
          exchangeStore.initializeData()

  } else {
    // Otherwise, initialize the authentication listener to wait for a new login event.
    authStore.initializeAuthListener();
  }
});
</script>

<template>
  <main class="h-screen w-full bg-gray-900 text-white">
    <UApp>
      <RouterView />
    </UApp>
  </main>
</template>

<style scoped></style>
