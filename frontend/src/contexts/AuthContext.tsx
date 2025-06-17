import { createContext, useState, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/api";
import type { User, AuthContextType } from "../types/auth";

// Create context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (token) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await authService.getCurrentUser();
      setUser(response.data);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.login({ email, password });

      const { access_token } = response.data;
      localStorage.setItem("token", access_token);

      await fetchUserData();
      navigate("/dashboard");
    } catch (error: any) {
      setError(error.response?.data?.detail || "Failed to login");
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

      await authService.register({
        email,
        password,
        full_name: fullName,
      });

      await login(email, password);
    } catch (error: any) {
      setError(error.response?.data?.detail || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
