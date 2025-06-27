"use client";

import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import RegisterForm from "../components/auth/RegisterForm";
import ConfirmSignUpForm from "../components/auth/ConfirmSignUpForm";

export default function RegisterPage() {
  const { user, needsConfirmation } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  if (needsConfirmation) {
    return <ConfirmSignUpForm />;
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        <div className="absolute -bottom-8 right-20 w-72 h-72 bg-accent-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-white/[0.03] bg-[length:40px_40px] z-0"></div>

      {/* Header */}
      <header className="relative z-10 w-full flex justify-between items-center py-4 px-6 border-b border-gray-800 bg-gray-900/60 backdrop-blur-md">
        <Link to="/" className="flex items-center space-x-2 group">
          <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">LS</span>
          </div>
          <span className="text-white font-bold text-2xl tracking-tight group-hover:text-accent-400 transition-colors duration-300">
            Loan
            <span className="text-accent-400 group-hover:text-white transition-colors duration-300">
              Syncro
            </span>
          </span>
        </Link>
        <Link
          to="/login"
          className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center space-x-1"
        >
          <i className="fas fa-sign-in-alt"></i>
          <span>Sign In</span>
        </Link>
      </header>

      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-md w-full space-y-8 transform transition-all duration-500 animate-fadeIn">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
              Create your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-400">
              Or{" "}
              <Link
                to="/login"
                className="font-medium text-accent-400 hover:text-accent-300 transition-colors duration-200"
              >
                sign in to your account
              </Link>
            </p>
          </div>

          <div className="mt-8 bg-gray-800/70 backdrop-blur-sm rounded-lg shadow-2xl py-8 px-6 ring-1 ring-gray-700 transform transition-all duration-500 hover:shadow-accent-500/10">
            <RegisterForm /> {/* Error and loading are passed via context */}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 px-6 bg-gray-900/60 backdrop-blur-md border-t border-gray-800">
        <div className="text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} LoanSyncro. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
