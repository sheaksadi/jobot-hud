
<template>
  <div class="flex flex-col items-center justify-center min-h-screen">
    <div class="p-8 bg-gray-800 rounded-lg shadow-lg">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold text-white">Login</h1>
        <router-link to="/">
          <UButton icon="i-heroicons-x-mark-20-solid" color="gray" variant="ghost" />
        </router-link>
      </div>
      <div class="flex flex-col space-y-4">
        <UButton @click="handleLogin('google')" color="primary" variant="solid">Login with Google</UButton>
        <UButton @click="handleLogin('discord')" color="primary" variant="solid">Login with Discord</UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/authStore.js';

const authStore = useAuthStore();

const handleLogin = (provider: 'google' | 'discord') => {
  authStore.handleLogin(provider);
};
</script>
