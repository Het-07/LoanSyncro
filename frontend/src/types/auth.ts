export interface User {
  id: string 
  email: string
  full_name: string
  created_at: string 
  email_verified: boolean 
}

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  full_name: string
}

export interface AuthTokens {
  accessToken: string
  idToken?: string 
  refreshToken?: string 
  expiresIn: number
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  needsConfirmation: boolean
  pendingEmail: string | null

  // Auth methods
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName: string) => Promise<void>
  confirmSignUp: (email: string, code: string) => Promise<void>
  resendConfirmationCode: (email: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}
