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
  timeout: 10000,
})

// Request interceptor for adding Cognito access token
api.interceptors.request.use(
  async (config) => {
    // Use idToken instead of accessToken
    const idToken = await cognitoAuthService.getIdToken()
    if (idToken) {
      // Format the token as expected by API Gateway
      config.headers.Authorization = `Bearer ${idToken}`
      console.log(`📡 Using ID token for ${config.method?.toUpperCase()} request to: ${config.url}`)
    } else {
      console.warn(`⚠️ No ID token available for ${config.method?.toUpperCase()} request to: ${config.url}`)
    }
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
  async (error) => {
    // Make this async to await logout
    console.error("❌ API Error:", error.response?.status, error.response?.data)

    if (error.response && error.response.status === 401) {
      // Unauthorized - clear tokens and redirect to login
      console.log("🚪 Unauthorized - redirecting to login")
      await cognitoAuthService.logout() 
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

export default api
