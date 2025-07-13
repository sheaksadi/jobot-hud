<script setup lang="ts">
import { ref, computed } from "vue";
import { invoke } from "@tauri-apps/api/core";
import Home from "./routes/Home.vue"
import Orders from "./routes/Orders.vue"
import NotFound from "./routes/NotFound.vue"


const routes = {
  '/': Home,
  '/orders': Orders,
}

const currentPath = ref(window.location.hash)

window.addEventListener('hashchange', () => {
  currentPath.value = window.location.hash
})

const currentView = computed(() => {
  return routes[currentPath.value.slice(1) || '/'] || NotFound
})






const greetMsg = ref("");
const name = ref("");

async function greet() {
  // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
  greetMsg.value = await invoke("greet", { name: name.value });
}
</script>

<template>
  <main class=" h-screen w-full">
    <component :is="currentView" />
  </main>
</template>

<style scoped></style>
