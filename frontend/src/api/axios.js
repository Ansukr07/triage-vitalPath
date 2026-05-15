import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_BASE, withCredentials: false });

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Handle 401: auto-refresh token
api.interceptors.response.use(
    (res) => res,
    async (err) => {
        const original = err.config;
        if (err.response?.status === 401 && !original._retry) {
            original._retry = true;
            const refresh = localStorage.getItem('refreshToken');
            if (refresh) {
                const { data } = await api.post('/auth/refresh', { refreshToken: refresh });
                localStorage.setItem('accessToken', data.data.accessToken);
                original.headers.Authorization = `Bearer ${data.data.accessToken}`;
                return api(original);
            }
            localStorage.clear();
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export default api;
