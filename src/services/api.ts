import axios from 'axios';
import NProgress from 'nprogress';
// import { toast } from 'sonner';

// Initialize axios instance
const api = axios.create({
  baseURL: process.env.API_BASE_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Set default tenant header if already stored
const initialTenant = localStorage.getItem('tenant');
if (initialTenant) {
  api.defaults.headers.common['x-tenant'] = initialTenant;
}

api.interceptors.request.use(config => {
  NProgress.start();
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Always attach current tenant header if available
  const tenant = localStorage.getItem('tenant');
  if (tenant) {
    config.headers['x-tenant'] = tenant;
  }
  return config;
});

api.interceptors.response.use(response => {
  NProgress.done();
  // if (response.data.message) {
  //   toast.success(response.data.message);
  // }
  return response;
}, error => {
  NProgress.done();
  if (error.response && error.response.status === 401 && error.config.url !== '/logout') {
    window.dispatchEvent(new Event('logout'));
  }
  // if (error.response?.data?.message) {
  //   toast.error(error.response.data.message);
  // }
  return Promise.reject(error);
});

export default api;
