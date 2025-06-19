import axios, { type AxiosInstance } from "axios"
import type { Loan, LoanFormData } from "../types/loan"
import type { Repayment, Summary } from "../types/repayment"
import type { User } from "../types/auth"

const API_URL = "http://localhost:8000"

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
})

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

// API services
export const loanService = {
  getAll: () => api.get<Loan[]>("/loans"),
  getById: (id: string) => api.get<Loan>(`/loans/${id}`),
  create: (data: LoanFormData) => api.post<Loan>("/loans", data),
  update: (id: string, data: LoanFormData) => api.put<Loan>(`/loans/${id}`, data),
  delete: (id: string) => api.delete(`/loans/${id}`),
}

export const repaymentService = {
  getAll: () => api.get<Repayment[]>("/repayments"),
  create: (data: Partial<Repayment>) => api.post<Repayment>("/repayments", data),
  getForLoan: (loanId: string) => api.get<Repayment[]>(`/repayments/loan/${loanId}`),
  getSummary: () => api.get<Summary>("/repayments/summary"),
}

export const authService = {
  login: (credentials: { email: string; password: string }) => {
    const params = new URLSearchParams()
    params.append("username", credentials.email)
    params.append("password", credentials.password)

    return api.post<{ access_token: string; token_type: string }>("/auth/login", params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
  },
  register: (userData: { email: string; password: string; full_name: string }) =>
    api.post<User>("/auth/register", userData),
  getCurrentUser: () => api.get<User>("/users/me"),
}

export default api
