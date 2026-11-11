/**
 * Axios instance stub.
 * baseURL is read from the environment variable VITE_API_URL.
 * This instance is not used in prototype mode (mock services handle all calls),
 * but its existence means Chunk 11 only swaps service implementations — no other changes needed.
 */
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Attach JWT from a secure, in-memory store (not localStorage). */
apiClient.interceptors.request.use((config) => {
  // In production: retrieve token from memory / context, never from localStorage.
  // const token = authStore.getToken();
  // if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Handle 401 → redirect to login. */
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default apiClient;
