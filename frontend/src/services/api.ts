import axios, { type AxiosInstance } from 'axios';
import type { Loan } from '../types/loan';
import type { Repayment, Summary } from '../types/repayment';
import type { User } from '../types/auth';

const API_URL = 'http://localhost:8000';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Generic API service creator
function createApiService<T, C = Partial<T>>(resourcePath: string) {
  return {
    getAll: (params?: object) => 
      api.get<T[]>(`/${resourcePath}`, { params }),
    getById: (id: string) => 
      api.get<T>(`/${resourcePath}/${id}`),
    create: (data: C) => 
      api.post<T>(`/${resourcePath}`, data),
    update: (id: string, data: Partial<C>) => 
      api.put<T>(`/${resourcePath}/${id}`, data),
    delete: (id: string) => 
      api.delete(`/${resourcePath}/${id}`),
  };
}

// API services
export const loanService = {
  ...createApiService<Loan>('loans'),
};

export const repaymentService = {
  ...createApiService<Repayment>('repayments'),
  getForLoan: (loanId: string) => 
    api.get<Repayment[]>(`/repayments/loan/${loanId}`),
  getSummary: () => 
    api.get<Summary>('/repayments/summary'),
};

export const authService = {
  login: (credentials: { email: string; password: string }) => {
    const params = new URLSearchParams();
    params.append('username', credentials.email);
    params.append('password', credentials.password);
    
    return api.post<{ access_token: string; token_type: string }>('/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  },
  register: (userData: { email: string; password: string; full_name: string }) => 
    api.post<User>('/auth/register', userData),
  getCurrentUser: () => 
    api.get<User>('/users/me'),
};

export default api;