import axios from 'axios';
import { serverUrl } from "./socket.js";
import { useAuthStore } from './stores/authStore.js';

// Create a new Axios instance
const axiosInstance = axios.create({
    baseURL: `${serverUrl}/api/v1`,
});

// Add a request interceptor to include the JWT token
axiosInstance.interceptors.request.use(config => {
    // Pinia is not available yet when this module is first imported.
    // So, we must dynamically import and use the store inside the interceptor.
    const authStore = useAuthStore();
    const token = authStore.token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

export default axiosInstance;