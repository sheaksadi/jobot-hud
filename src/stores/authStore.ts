import { openUrl } from '@tauri-apps/plugin-opener';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { socket } from '../socket.js'; // We will adjust socket.ts to export a single instance
import { useRouter } from 'vue-router';

export const useAuthStore = defineStore('auth', () => {
    const token = ref<string | null>(localStorage.getItem('jwtToken'));
    const isLoggedIn = ref<boolean>(!!token.value);
    const router = useRouter();

    function setToken(newToken: string | null) {
        token.value = newToken;
        isLoggedIn.value = !!newToken;
        if (newToken) {
            localStorage.setItem('jwtToken', newToken);
        } else {
            localStorage.removeItem('jwtToken');
        }
    }

    function initializeAuthListener() {
        socket.on('auth-token', (data: { token: string }) => {
            if (data.token) {
                console.log('Authentication successful! Received JWT.');
                setToken(data.token);
                // Navigate to the dashboard or home page
                router.push('/');
            } else {
                console.error('Authentication failed: No token received.');
            }
        });

        // Also handle connection events for debugging
        socket.on('connect', () => {
            console.log('Connected to backend with socket ID:', socket.id);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from backend.');
        });
    }

    function handleLogin(provider: 'google' | 'discord') {
        // 1. Tell the server we want to log in
        socket.emit('request-auth-url', { provider });

        // 2. Wait for the server to send back the unique URL
        socket.once('auth-url', async (data: { url: string }) => {
            if (data.url) {
                // 3. Open the URL in the user's default browser
                await openUrl(data.url);
            } else {
                console.error('Did not receive a valid auth URL from the server.');
            }
        });
    }

    function logout() {
        setToken(null);
        router.push('/login');
    }

    return {
        token,
        isLoggedIn,
        handleLogin,
        logout,
        initializeAuthListener,
        setToken,
    };
});
