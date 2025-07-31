import { createApp } from "vue";
import App from "./App.vue";
import { createPinia } from 'pinia'
import ui from '@nuxt/ui/vue-plugin'
import { createRouter, createWebHistory } from 'vue-router'

// Example in frontend JavaScript using tauri-plugin-deep-link or similar
import { onOpenUrl } from 'tauri-plugin-deep-link';

onOpenUrl((url) => {
    // The URL will be "jobot-auth://callback?token=ey..."
    const urlObject = new URL(url);
    const token = urlObject.searchParams.get('token');

    if (token) {
        // You have the token!
        console.log('Received JWT:', token);
        // 1. Save the token to secure storage (e.g., tauri-plugin-store).
        // 2. Update your application's state to reflect that the user is logged in.
        // 3. Navigate to the main part of your application.
    }
});
const pinia = createPinia()
const app = createApp(App)


const router = createRouter({
    routes: [],
    history: createWebHistory()
})

app.use(pinia)
app.use(ui)

app.mount('#app')



