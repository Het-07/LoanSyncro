"use client";

import { createContext, useState, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { cognitoAuthService, type CognitoUser } from "../services/congnitoAuth";
import type { AuthContextType } from "../types/auth";

// Create context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  needsConfirmation: false,
  pendingEmail: null,
  login: async () => {},
  register: async () => {},
  confirmSignUp: async () => {},
  resendConfirmationCode: async () => {},
  logout: async () => {},
  clearError: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<CognitoUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      setLoading(true);
      console.log("🔍 Checking auth state with Amplify...");

      const isAuthenticated = await cognitoAuthService.isAuthenticated();

      if (isAuthenticated) {
        const currentUser = await cognitoAuthService.getCurrentUser();
        setUser(currentUser);
        console.log("✅ User is authenticated:", currentUser.email);
      } else {
        setUser(null); // Ensure user is null if not authenticated
        console.log("❌ User is not authenticated");
      }
    } catch (error: any) {
      console.error("❌ Auth check failed:", error);
      setUser(null); // Ensure user is null on error
      // The cognitoAuthService.getCurrentUser() now handles internal logout on error
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔐 Attempting login for:", email);

      await cognitoAuthService.login(email, password);
      const currentUser = await cognitoAuthService.getCurrentUser();

      setUser(currentUser);
      console.log("✅ Login successful, redirecting to dashboard");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("❌ Login failed:", error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    fullName: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      console.log("📝 Attempting registration for:", email);

      const result = await cognitoAuthService.register(
        email,
        password,
        fullName
      );

      if (result.needsConfirmation) {
        console.log("📧 Registration successful, needs email confirmation");
        setNeedsConfirmation(true);
        setPendingEmail(email);
        // Navigate to login page, where ConfirmSignUpForm will be rendered
        navigate("/register"); // Navigate to register page to show confirmation form
      } else {
        console.log("✅ Registration successful, auto-confirmed");
        // Auto-login if no confirmation needed (rare for email/password flow)
        await login(email, password);
      }
    } catch (error: any) {
      console.error("❌ Registration failed:", error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmSignUp = async (email: string, code: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log("📧 Confirming signup for:", email);

      await cognitoAuthService.confirmSignUp(email, code);

      // Clear confirmation state
      setNeedsConfirmation(false);
      setPendingEmail(null);

      console.log("✅ Email confirmed, redirecting to login");
      navigate("/login");
    } catch (error: any) {
      console.error("❌ Confirmation failed:", error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmationCode = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log("📨 Resending confirmation code to:", email);

      await cognitoAuthService.resendConfirmationCode(email);
      console.log("✅ Confirmation code resent");
    } catch (error: any) {
      console.error("❌ Resend failed:", error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    console.log("🚪 Logging out...");
    await cognitoAuthService.logout();
    setUser(null);
    setNeedsConfirmation(false);
    setPendingEmail(null);
    setError(null);
    navigate("/login");
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    needsConfirmation,
    pendingEmail,
    login,
    register,
    confirmSignUp,
    resendConfirmationCode,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
