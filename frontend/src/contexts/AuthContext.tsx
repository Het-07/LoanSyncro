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

      const isAuthenticated = await cognitoAuthService.isAuthenticated();

      if (isAuthenticated) {
        const currentUser = await cognitoAuthService.getCurrentUser();
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch (error: any) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      await cognitoAuthService.login(email, password);
      const currentUser = await cognitoAuthService.getCurrentUser();

      setUser(currentUser);
      navigate("/dashboard");
    } catch (error: any) {
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

      const result = await cognitoAuthService.register(
        email,
        password,
        fullName
      );

      if (result.needsConfirmation) {
        setNeedsConfirmation(true);
        setPendingEmail(email);
        navigate("/register");
      } else {
        await login(email, password);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmSignUp = async (email: string, code: string) => {
    try {
      setLoading(true);
      setError(null);

      await cognitoAuthService.confirmSignUp(email, code);

      // Clear confirmation state
      setNeedsConfirmation(false);
      setPendingEmail(null);

      navigate("/login");
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmationCode = async (email: string) => {
    try {
      setLoading(true);
      setError(null);

      await cognitoAuthService.resendConfirmationCode(email);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
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
