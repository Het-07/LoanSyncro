import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  GetUserCommand,
  GlobalSignOutCommand,
  type AuthenticationResultType,
  type AttributeType,
} from "@aws-sdk/client-cognito-identity-provider"

const region = import.meta.env.VITE_AWS_REGION || "us-east-1"
const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID

// Validate required environment variables
if (!userPoolId) {
  console.log(
    "Available env vars:",
    Object.keys(import.meta.env).filter((key) => key.startsWith("VITE_")),
  )
  throw new Error("VITE_COGNITO_USER_POOL_ID is required")
}

if (!clientId) {
  console.log(
    "Available env vars:",
    Object.keys(import.meta.env).filter((key) => key.startsWith("VITE_")),
  )
  throw new Error("VITE_COGNITO_CLIENT_ID is required")
}

console.log("🔧 Cognito Config:", {
  region,
  userPoolId,
  clientId: clientId.substring(0, 8) + "...",
  env: import.meta.env.MODE,
})

const cognitoClient = new CognitoIdentityProviderClient({
  region: region,
})

export interface CognitoUser {
  id: string
  email: string
  full_name: string
  email_verified: boolean
  created_at: string
}

export interface AuthTokens {
  accessToken: string
  idToken: string
  refreshToken: string
  expiresIn: number
}

class CognitoAuthService {
  // Register new user
  async register(
    email: string,
    password: string,
    fullName: string,
  ): Promise<{ userSub: string; needsConfirmation: boolean }> {
    try {
      console.log("🔐 Registering user:", email)

      // Validate inputs
      if (!email?.trim()) {
        throw new Error("Email is required")
      }
      if (!password?.trim()) {
        throw new Error("Password is required")
      }
      if (!fullName?.trim()) {
        throw new Error("Full name is required")
      }

      const command = new SignUpCommand({
        ClientId: clientId,
        Username: email.trim(),
        Password: password,
        UserAttributes: [
          {
            Name: "email",
            Value: email.trim(),
          },
          {
            Name: "name",
            Value: fullName.trim(),
          },
        ],
      })

      const response = await cognitoClient.send(command)
      console.log("✅ Registration successful:", response.UserSub)
      console.log("📧 Confirmation needed:", !response.UserConfirmed)

      return {
        userSub: response.UserSub!,
        needsConfirmation: !response.UserConfirmed,
      }
    } catch (error: any) {
      console.error("❌ Registration error:", error)
      throw new Error(this.getErrorMessage(error))
    }
  }

  // Confirm user registration with verification code
  async confirmSignUp(email: string, confirmationCode: string): Promise<void> {
    try {
      console.log("📧 Confirming signup for:", email)

      if (!email?.trim()) {
        throw new Error("Email is required")
      }
      if (!confirmationCode?.trim()) {
        throw new Error("Confirmation code is required")
      }

      const command = new ConfirmSignUpCommand({
        ClientId: clientId,
        Username: email.trim(),
        ConfirmationCode: confirmationCode.trim(),
      })

      await cognitoClient.send(command)
      console.log("✅ Email confirmation successful")
    } catch (error: any) {
      console.error("❌ Confirmation error:", error)
      throw new Error(this.getErrorMessage(error))
    }
  }

  // Resend confirmation code
  async resendConfirmationCode(email: string): Promise<void> {
    try {
      console.log("📨 Resending confirmation code to:", email)

      if (!email?.trim()) {
        throw new Error("Email is required")
      }

      const command = new ResendConfirmationCodeCommand({
        ClientId: clientId,
        Username: email.trim(),
      })

      await cognitoClient.send(command)
      console.log("✅ Confirmation code resent")
    } catch (error: any) {
      console.error("❌ Resend confirmation error:", error)
      throw new Error(this.getErrorMessage(error))
    }
  }

  // Login user
  async login(email: string, password: string): Promise<AuthTokens> {
    try {
      console.log("🔐 Logging in user:", email)

      if (!email?.trim()) {
        throw new Error("Email is required")
      }
      if (!password?.trim()) {
        throw new Error("Password is required")
      }

      const command = new InitiateAuthCommand({
        ClientId: clientId,
        AuthFlow: "USER_PASSWORD_AUTH",
        AuthParameters: {
          USERNAME: email.trim(),
          PASSWORD: password,
        },
      })

      const response = await cognitoClient.send(command)

      if (response.ChallengeName) {
        throw new Error(`Authentication challenge required: ${response.ChallengeName}`)
      }

      if (!response.AuthenticationResult) {
        throw new Error("Authentication failed - no tokens received")
      }

      const authResult: AuthenticationResultType = response.AuthenticationResult
      const tokens: AuthTokens = {
        accessToken: authResult.AccessToken!,
        idToken: authResult.IdToken!,
        refreshToken: authResult.RefreshToken!,
        expiresIn: authResult.ExpiresIn || 3600,
      }

      // Store tokens in localStorage
      this.storeTokens(tokens)
      console.log("✅ Login successful")

      return tokens
    } catch (error: any) {
      console.error("❌ Login error:", error)
      throw new Error(this.getErrorMessage(error))
    }
  }

  // Get current user
  async getCurrentUser(): Promise<CognitoUser> {
    try {
      const accessToken = this.getAccessToken()
      if (!accessToken) {
        throw new Error("No access token found")
      }

      console.log("👤 Getting current user")

      const command = new GetUserCommand({
        AccessToken: accessToken,
      })

      const response = await cognitoClient.send(command)

      const email = response.UserAttributes?.find((attr: AttributeType) => attr.Name === "email")?.Value || ""
      const name = response.UserAttributes?.find((attr: AttributeType) => attr.Name === "name")?.Value || ""
      const emailVerified =
        response.UserAttributes?.find((attr: AttributeType) => attr.Name === "email_verified")?.Value === "true"

      const user: CognitoUser = {
        id: response.Username!,
        email: email,
        full_name: name,
        email_verified: emailVerified,
        created_at: new Date().toISOString(), // Cognito doesn't provide this directly
      }

      console.log("✅ User retrieved:", user.email)
      return user
    } catch (error: any) {
      console.error("❌ Get user error:", error)
      this.clearTokens() // Clear invalid tokens
      throw new Error(this.getErrorMessage(error))
    }
  }

  // Global logout (signs out from all devices)
  async logout(): Promise<void> {
    try {
      const accessToken = this.getAccessToken()
      if (accessToken) {
        console.log("🚪 Signing out globally")

        const command = new GlobalSignOutCommand({
          AccessToken: accessToken,
        })

        await cognitoClient.send(command)
      }
    } catch (error) {
      console.error("❌ Logout error:", error)
      // Continue with local logout even if global logout fails
    } finally {
      this.clearTokens()
      console.log("✅ Logout complete")
    }
  }

  // Token management
  private storeTokens(tokens: AuthTokens): void {
    localStorage.setItem("cognito_access_token", tokens.accessToken)
    localStorage.setItem("cognito_id_token", tokens.idToken)
    localStorage.setItem("cognito_refresh_token", tokens.refreshToken)
    localStorage.setItem("cognito_expires_at", (Date.now() + tokens.expiresIn * 1000).toString())
  }

  private clearTokens(): void {
    localStorage.removeItem("cognito_access_token")
    localStorage.removeItem("cognito_id_token")
    localStorage.removeItem("cognito_refresh_token")
    localStorage.removeItem("cognito_expires_at")
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const accessToken = this.getAccessToken()
    const expiresAt = localStorage.getItem("cognito_expires_at")

    if (!accessToken || !expiresAt) {
      return false
    }

    // Check if token is expired
    if (Date.now() > Number.parseInt(expiresAt)) {
      this.clearTokens()
      return false
    }

    return true
  }

  // Get access token for API calls
  getAccessToken(): string | null {
    return localStorage.getItem("cognito_access_token")
  }

  // Get ID token (contains user info)
  getIdToken(): string | null {
    return localStorage.getItem("cognito_id_token")
  }

  // Helper to get user-friendly error messages
  private getErrorMessage(error: any): string {
    const errorCode = error.name || error.__type || "UnknownError"

    switch (errorCode) {
      case "UserNotFoundException":
        return "No account found with this email address"
      case "NotAuthorizedException":
        return "Incorrect email or password"
      case "UserNotConfirmedException":
        return "Please verify your email address before signing in"
      case "CodeMismatchException":
        return "Invalid verification code"
      case "ExpiredCodeException":
        return "Verification code has expired"
      case "LimitExceededException":
        return "Too many attempts. Please try again later"
      case "UsernameExistsException":
        return "An account with this email already exists"
      case "InvalidPasswordException":
        return "Password does not meet requirements"
      case "InvalidParameterException":
        return "Invalid input provided"
      case "TooManyRequestsException":
        return "Too many requests. Please try again later"
      default:
        return error.message || "An unexpected error occurred"
    }
  }
}

export const cognitoAuthService = new CognitoAuthService()
