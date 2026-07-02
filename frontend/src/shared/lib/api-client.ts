import axios from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const apiClient = axios.create({ baseURL: BASE_URL });

apiClient.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const refreshToken = Cookies.get('refreshToken');
    if (!refreshToken) {
      clearSessionAndRedirect();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(apiClient(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
      const newAccessToken: string = data.accessToken;
      const newRefreshToken: string = data.refreshToken;

      Cookies.set('accessToken', newAccessToken);
      Cookies.set('refreshToken', newRefreshToken);

      apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      pendingRequests.forEach((cb) => cb(newAccessToken));
      pendingRequests = [];

      return apiClient(originalRequest);
    } catch {
      clearSessionAndRedirect();
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

function clearSessionAndRedirect() {
  Cookies.remove('accessToken');
  Cookies.remove('refreshToken');
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}
