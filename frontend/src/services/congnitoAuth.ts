import {
  signIn,
  signUp,
  confirmSignUp,
  resendSignUpCode,
  fetchUserAttributes,
  signOut,
  fetchAuthSession,
  getCurrentUser,
  type AuthUser,
} from "@aws-amplify/auth"
import type { AuthTokens } from "../types/auth"

export interface CognitoUser {
  id: string
  email: string
  full_name: string
  email_verified: boolean
  created_at: string
}

class CognitoAuthService {
  async register(
    email: string,
    password: string,
    fullName: string,
  ): Promise<{ userSub: string; needsConfirmation: boolean }> {
    try {
      if (!email?.trim() || !password?.trim() || !fullName?.trim()) {
        throw new Error("All fields are required for registration.")
      }

      const { userId, nextStep } = await signUp({
        username: email.trim(),
        password: password,
        options: {
          userAttributes: {
            email: email.trim(),
            name: fullName.trim(),
          },
        },
      })
      console.log("Sign up response:", { userId, nextStep })
      return {
        userSub: userId!,
        needsConfirmation: nextStep.signUpStep === "CONFIRM_SIGN_UP",
      }
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error))
    }
  }

  async confirmSignUp(email: string, confirmationCode: string): Promise<void> {
    try {
      if (!email?.trim() || !confirmationCode?.trim()) {
        throw new Error("Email and confirmation code are required.")
      }

      const { isSignUpComplete, nextStep } = await confirmSignUp({
        username: email.trim(),
        confirmationCode: confirmationCode.trim(),
      })

      if (!isSignUpComplete) {
        throw new Error(`Confirmation not complete. Next step: ${nextStep.signUpStep}`)
      }
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error))
    }
  }

  async resendConfirmationCode(email: string): Promise<void> {
    try {
      if (!email?.trim()) {
        throw new Error("Email is required.")
      }

      await resendSignUpCode({ username: email.trim() })
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error))
    }
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    try {
      if (!email?.trim() || !password?.trim()) {
        throw new Error("Email and password are required.")
      }

      const { isSignedIn, nextStep } = await signIn({ username: email.trim(), password: password })

      if (!isSignedIn) {
        throw new Error(`Sign in not complete. Next step: ${nextStep.signInStep}`)
      }

      const session = await fetchAuthSession()
      if (!session.tokens) {
        throw new Error("Authentication failed: No tokens received.")
      }

      const tokens: AuthTokens = {
        accessToken: session.tokens.accessToken.toString(),
        idToken: session.tokens.idToken?.toString(),
        expiresIn: session.tokens.accessToken.payload?.exp || 7200, // Use payload expiration or default to 0
      }

      return tokens
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error))
    }
  }

  async getCurrentUser(): Promise<CognitoUser> {
    try {
      const userAttributes = await fetchUserAttributes()
      const amplifyUser: AuthUser = await getCurrentUser()

      if (!userAttributes || !amplifyUser) {
        throw new Error("No current user found or attributes missing.")
      }

      const user: CognitoUser = {
        id: amplifyUser.userId,
        email: userAttributes.email || "",
        full_name: userAttributes.name || "",
        email_verified: userAttributes.email_verified === "true",
        created_at: new Date().toISOString(),
      }

      return user
    } catch (error: any) {
      await this.logout()
      throw new Error(this.getErrorMessage(error))
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut()
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error))
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const { tokens } = await fetchAuthSession()
      return !!tokens?.accessToken
    } catch (error) {
      return false
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      const session = await fetchAuthSession()
      
      // Debug the available tokens to see what's happening
      console.debug("Available tokens:", {
        hasAccessToken: !!session.tokens?.accessToken,
        hasIdToken: !!session.tokens?.idToken,
      })
      
      // Make sure you're specifically using the ACCESS token
      return session.tokens?.accessToken?.toString() || null
    } catch (error) {
      console.error("Error getting access token:", error)
      return null
    }
  }

  async getIdToken(): Promise<string | null> {
    try {
      const session = await fetchAuthSession()
      return session.tokens?.idToken?.toString() || null
    } catch (error) {
      console.error("Error getting ID token:", error)
      return null
    }
  }

  
  async compareTokens(): Promise<void> {
    try {
      const session = await fetchAuthSession()
      
      if (!session.tokens) {
        console.error("No tokens available")
        return
      }
      
      const accessToken = session.tokens.accessToken?.toString()
      const idToken = session.tokens.idToken?.toString()
      
      if (accessToken) {
        const accessPayload = JSON.parse(atob(accessToken.split('.')[1]))
        console.debug("Access Token payload:", {
          token_use: accessPayload.token_use,
          client_id: accessPayload.client_id,
          username: accessPayload.username,
          exp: new Date(accessPayload.exp * 1000).toLocaleString(),
          iss: accessPayload.iss
        })
      }
      
      if (idToken) {
        const idPayload = JSON.parse(atob(idToken.split('.')[1]))
        console.debug("ID Token payload:", {
          token_use: idPayload.token_use,
          client_id: idPayload.client_id,
          email: idPayload.email,
          exp: new Date(idPayload.exp * 1000).toLocaleString(),
          iss: idPayload.iss
        })
      }
    } catch (error) {
      console.error("Error comparing tokens:", error)
    }
  }

  private getErrorMessage(error: any): string {
    const errorMessage = error.message || "An unexpected error occurred"

    if (errorMessage.includes("UserNotFoundException")) {
      return "No account found with this email address."
    }
    if (errorMessage.includes("NotAuthorizedException")) {
      return "Incorrect email or password."
    }
    if (errorMessage.includes("UserNotConfirmedException")) {
      return "Please verify your email address before signing in."
    }
    if (errorMessage.includes("CodeMismatchException")) {
      return "Invalid verification code."
    }
    if (errorMessage.includes("ExpiredCodeException")) {
      return "Verification code has expired."
    }
    if (errorMessage.includes("LimitExceededException")) {
      return "Too many attempts. Please try again later."
    }
    if (errorMessage.includes("UsernameExistsException")) {
      return "An account with this email already exists."
    }
    if (errorMessage.includes("InvalidPasswordException")) {
      return "Password does not meet requirements."
    }
    if (errorMessage.includes("InvalidParameterException")) {
      return "Invalid input provided."
    }
    if (errorMessage.includes("TooManyRequestsException")) {
      return "Too many requests. Please try again later."
    }
    if (errorMessage.includes("Network Error")) {
      return "Network error. Please check your internet connection."
    }
    return errorMessage
  }
}

export const cognitoAuthService = new CognitoAuthService()
