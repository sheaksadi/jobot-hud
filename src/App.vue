<script setup lang="ts">
import { onMounted } from "vue";
import { useAuthStore } from "./stores/authStore";

const authStore = useAuthStore();

// Initialize the authentication listener when the app is mounted
onMounted(() => {
  authStore.initializeAuthListener();
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
