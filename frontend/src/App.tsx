import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import LoansPage from "./pages/loans/index";
import CreateLoanPage from "./pages/loans/create";
import RepaymentsPage from "./pages/repayments/index";
import Layout from "./components/layout/Layout";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/loans"
        element={
          <ProtectedRoute>
            <Layout>
              <LoansPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/loans/create"
        element={
          <ProtectedRoute>
            <Layout>
              <CreateLoanPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/repayments"
        element={
          <ProtectedRoute>
            <Layout>
              <RepaymentsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* 404 route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
