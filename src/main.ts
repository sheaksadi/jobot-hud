import { createApp } from "vue";
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import App from "./App.vue";
import ui from '@nuxt/ui/vue-plugin';

// Import stores and components
import { useAuthStore } from './stores/authStore.js';
import Home from './routes/Home.vue';
import Login from './routes/Login.vue';
import Orders from './routes/Orders.vue';
import NotFound from './routes/NotFound.vue';

// --- Vue Router Configuration ---
const routes = [
    { path: '/', name: 'Home', component: Home, meta: { requiresAuth: true } },
    { path: '/login', name: 'Login', component: Login },
    { path: '/orders', name: 'Orders', component: Orders, meta: { requiresAuth: true } },
    // Catch-all route
    { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// --- App Initialization ---
const pinia = createPinia();
const app = createApp(App);

// --- Navigation Guard ---
router.beforeEach((to, from, next) => {
    // We need to initialize the store here to use it
    const authStore = useAuthStore(pinia);

    if (to.meta.requiresAuth && !authStore.isLoggedIn) {
        // If the route requires auth and the user is not logged in, redirect to login
        next({ name: 'Login' });
    } else {
        // Otherwise, proceed as normal
        next();
    }
});

app.use(pinia);
app.use(router); // Use the router
app.use(ui);

app.mount('#app');
