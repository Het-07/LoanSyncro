import type React from "react";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

export default function ConfirmSignUpForm() {
  const {
    confirmSignUp,
    resendConfirmationCode,
    pendingEmail,
    loading,
    error,
    clearError,
  } = useAuth();

  const [confirmationCode, setConfirmationCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingEmail && confirmationCode.trim()) {
      await confirmSignUp(pendingEmail, confirmationCode.trim());
    }
  };

  const handleResendCode = async () => {
    if (pendingEmail) {
      await resendConfirmationCode(pendingEmail);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-white/[0.03] bg-[length:40px_40px] z-0"></div>

      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-md w-full space-y-8 transform transition-all duration-500 animate-fadeIn">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-primary-600 flex items-center justify-center shadow-lg">
                <i className="fas fa-envelope text-white text-2xl"></i>
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-2">
              Verify Your Email
            </h2>
            <p className="text-gray-400 text-sm">
              We sent a 6-digit verification code to
            </p>
            <p className="text-accent-400 font-medium">{pendingEmail}</p>
          </div>

          <div className="mt-8 bg-gray-800/70 backdrop-blur-sm rounded-lg shadow-2xl py-8 px-6 ring-1 ring-gray-700">
            {error && (
              <div className="mb-6 bg-red-900/30 border border-red-500 text-red-100 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm">
                <div className="flex justify-between items-center">
                  <span className="block sm:inline">{error}</span>
                  <button
                    onClick={clearError}
                    className="text-red-300 hover:text-red-100 ml-2"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="confirmationCode"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Verification Code
                </label>
                <div className="relative">
                  <input
                    id="confirmationCode"
                    name="confirmationCode"
                    type="text"
                    required
                    value={confirmationCode}
                    onChange={(e) =>
                      setConfirmationCode(
                        e.target.value.replace(/\D/g, "").slice(0, 6)
                      )
                    }
                    className="appearance-none block w-full px-4 py-3 border border-gray-700 bg-gray-800/70 rounded-lg shadow-sm placeholder-gray-500 text-white focus:outline-none focus:ring-accent-400 focus:border-accent-400 transition-colors duration-200 text-center text-2xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                    autoComplete="one-time-code"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <i className="fas fa-shield-alt text-gray-400"></i>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  Enter the 6-digit code from your email
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || confirmationCode.length !== 6}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-accent-600 hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 transition-all duration-300 transform hover:-translate-y-1 ${
                    loading || confirmationCode.length !== 6
                      ? "opacity-70 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {loading ? (
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <i className="fas fa-check mr-2"></i>
                  )}
                  {loading ? "Verifying..." : "Verify Email"}
                </button>
              </div>

              <div className="text-center space-y-3">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="text-sm text-accent-400 hover:text-accent-300 disabled:opacity-50 transition-colors duration-200"
                >
                  <i className="fas fa-redo mr-1"></i>
                  Didn't receive the code? Resend
                </button>

                <div className="text-xs text-gray-500">
                  Check your spam folder if you don't see the email
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
