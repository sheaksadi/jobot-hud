import { createApp } from "vue";
import App from "./App.vue";
import { createPinia } from 'pinia'
import ui from '@nuxt/ui/vue-plugin'
import { createRouter, createWebHistory } from 'vue-router'

const pinia = createPinia()
const app = createApp(App)


const router = createRouter({
    routes: [],
    history: createWebHistory()
})

app.use(pinia)
app.use(ui)

app.mount('#app')



