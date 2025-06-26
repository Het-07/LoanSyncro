import axios, { type AxiosInstance } from "axios"
import { cognitoAuthService } from "./congnitoAuth"
import type { Loan, LoanFormData } from "../types/loan"
import type { Repayment, Summary } from "../types/repayment"

// Get API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

console.log("🌐 API_URL:", API_URL)

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 second timeout
})

// Request interceptor for adding Cognito access token
api.interceptors.request.use(
  (config) => {
    const accessToken = cognitoAuthService.getAccessToken()
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }

    console.log(`📡 ${config.method?.toUpperCase()} request to:`, config.url)
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response from ${response.config.url}:`, response.status)
    return response
  },
  (error) => {
    console.error("❌ API Error:", error.response?.status, error.response?.data)

    if (error.response && error.response.status === 401) {
      // Unauthorized - clear tokens and redirect to login
      console.log("🚪 Unauthorized - redirecting to login")
      cognitoAuthService.logout()
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

// Note: Auth service now uses Cognito directly, not API calls
export const authService = {
  // These are kept for backward compatibility but will use Cognito
  login: async (credentials: { email: string; password: string }) => {
    const tokens = await cognitoAuthService.login(credentials.email, credentials.password)
    return { data: { access_token: tokens.accessToken, token_type: "bearer" } }
  },

  register: async (userData: { email: string; password: string; full_name: string }) => {
    const result = await cognitoAuthService.register(userData.email, userData.password, userData.full_name)
    return { data: { userSub: result.userSub, needsConfirmation: result.needsConfirmation } }
  },

  getCurrentUser: async () => {
    const user = await cognitoAuthService.getCurrentUser()
    return { data: user }
  },
}

export default api
