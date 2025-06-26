import type React from "react";
import { useState, useEffect } from "react";

interface RegisterFormProps {
  onSubmit: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<void>;
  loading: boolean;
  error?: string | null;
}

export default function RegisterForm({
  onSubmit,
  loading,
  error,
}: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [formError, setFormError] = useState("");

  // Password validation states
  const [isLengthValid, setIsLengthValid] = useState(false);
  const [hasUpperCase, setHasUpperCase] = useState(false);
  const [hasSymbol, setHasSymbol] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(true);

  // Validate email format
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check password requirements
  useEffect(() => {
    setIsLengthValid(password.length >= 8);
    setHasUpperCase(/[A-Z]/.test(password));
    setHasSymbol(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password));
    setHasNumber(/[0-9]/.test(password));
  }, [password]);

  // Name handler - convert to uppercase
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullName(e.target.value.toUpperCase());
  };

  // Email handler with validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setIsEmailValid(validateEmail(newEmail) || newEmail === "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setFormError("");

    // Form validation
    if (!fullName.trim()) {
      setFormError("Full name is required");
      return;
    }

    if (!validateEmail(email)) {
      setFormError("Please enter a valid email address");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords don't match");
      return;
    }

    if (password.length < 8 || !hasUpperCase || !hasNumber || !hasSymbol) {
      setFormError("Password doesn't meet requirements");
      return;
    }

    // Call the onSubmit function with trimmed values
    await onSubmit(email.trim(), password, fullName.trim());
  };

  return (
    <>
      {(formError || error) && (
        <div
          className="mb-6 bg-red-900/30 border border-red-500 text-red-100 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 animate-fadeIn"
          role="alert"
        >
          <span className="block sm:inline">{formError || error}</span>
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="transition-all duration-200 ease-in-out hover:translate-y-[-2px]">
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-gray-300"
          >
            Full Name
          </label>
          <div className="mt-1 relative rounded-md">
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              value={fullName}
              onChange={handleNameChange}
              className="appearance-none block w-full px-3 py-2 border border-gray-700 bg-gray-800/70 rounded-md shadow-sm placeholder-gray-500 text-white focus:outline-none focus:ring-accent-400 focus:border-accent-400 transition-colors duration-200 sm:text-sm"
              placeholder="YOUR NAME"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <i className="fas fa-user text-gray-400"></i>
            </div>
          </div>
        </div>

        <div className="transition-all duration-200 ease-in-out hover:translate-y-[-2px]">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-300"
          >
            Email address
          </label>
          <div className="mt-1 relative rounded-md">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={handleEmailChange}
              className={`appearance-none block w-full px-3 py-2 border ${
                isEmailValid ? "border-gray-700" : "border-red-500"
              } bg-gray-800/70 rounded-md shadow-sm placeholder-gray-500 text-white focus:outline-none focus:ring-accent-400 focus:border-accent-400 transition-colors duration-200 sm:text-sm`}
              placeholder="you@example.com"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <i
                className={`fas ${
                  isEmailValid
                    ? "fa-envelope"
                    : "fa-exclamation-circle text-red-500"
                } text-gray-400`}
              ></i>
            </div>
          </div>
          {!isEmailValid && (
            <p className="mt-1 text-sm text-red-400 animate-pulse">
              Please enter a valid email address
            </p>
          )}
        </div>

        <div className="transition-all duration-200 ease-in-out hover:translate-y-[-2px]">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-300"
          >
            Password
          </label>
          <div className="mt-1 relative rounded-md">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-700 bg-gray-800/70 rounded-md shadow-sm placeholder-gray-500 text-white focus:outline-none focus:ring-accent-400 focus:border-accent-400 transition-colors duration-200 sm:text-sm"
              placeholder="••••••••"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <i className="fas fa-lock text-gray-400"></i>
            </div>
          </div>
          {password && (
            <div className="mt-2 space-y-2 text-xs animate-fadeIn">
              <p className="text-gray-400">Password requirements:</p>
              <ul className="grid grid-cols-2 gap-1">
                <li
                  className={`flex items-center ${
                    isLengthValid ? "text-green-400" : "text-gray-400"
                  }`}
                >
                  <i
                    className={`fas ${
                      isLengthValid ? "fa-check" : "fa-times"
                    } mr-2`}
                  ></i>
                  At least 8 characters
                </li>
                <li
                  className={`flex items-center ${
                    hasUpperCase ? "text-green-400" : "text-gray-400"
                  }`}
                >
                  <i
                    className={`fas ${
                      hasUpperCase ? "fa-check" : "fa-times"
                    } mr-2`}
                  ></i>
                  1 uppercase letter
                </li>
                <li
                  className={`flex items-center ${
                    hasNumber ? "text-green-400" : "text-gray-400"
                  }`}
                >
                  <i
                    className={`fas ${
                      hasNumber ? "fa-check" : "fa-times"
                    } mr-2`}
                  ></i>
                  1 number
                </li>
                <li
                  className={`flex items-center ${
                    hasSymbol ? "text-green-400" : "text-gray-400"
                  }`}
                >
                  <i
                    className={`fas ${
                      hasSymbol ? "fa-check" : "fa-times"
                    } mr-2`}
                  ></i>
                  1 special symbol
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="transition-all duration-200 ease-in-out hover:translate-y-[-2px]">
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-300"
          >
            Confirm Password
          </label>
          <div className="mt-1 relative rounded-md">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-700 bg-gray-800/70 rounded-md shadow-sm placeholder-gray-500 text-white focus:outline-none focus:ring-accent-400 focus:border-accent-400 transition-colors duration-200 sm:text-sm"
              placeholder="••••••••"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <i
                className={`fas ${
                  confirmPassword && password === confirmPassword
                    ? "fa-check text-green-400"
                    : confirmPassword
                    ? "fa-times text-red-500"
                    : "fa-lock text-gray-400"
                }`}
              ></i>
            </div>
          </div>
          {confirmPassword && password !== confirmPassword && (
            <p className="mt-1 text-sm text-red-400 animate-pulse">
              Passwords don't match
            </p>
          )}
        </div>

        <div className="pt-3">
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-lg text-sm font-medium text-white bg-accent-600 hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 transition-all duration-300 transform hover:-translate-y-1 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
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
              <>
                <i className="fas fa-user-plus mr-2"></i>
                Create Account
              </>
            )}
          </button>
        </div>
      </form>
    </>
  );
}
