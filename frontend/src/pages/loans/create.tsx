"use client";

import type React from "react";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loanService } from "../../services/api";
import type { LoanFormData } from "../../types/loan";

export default function CreateLoanPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<LoanFormData>({
    title: "",
    amount: 0,
    interest_rate: 0,
    term_months: 12,
    start_date: new Date().toISOString().split("T")[0],
    description: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]:
        name === "amount" || name === "interest_rate" || name === "term_months"
          ? Number.parseFloat(value) || 0
          : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      await loanService.create(formData);
      navigate("/loans");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create loan");
      console.error("Error creating loan:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-4xl font-bold text-gray-200 mb-2">Add New Loan</h1>
        <p className="text-gray-400 text-lg">
          Fill in the details to add a new loan to track
        </p>
      </div>

      {/* Form Container */}
      <div className="card-dark p-8 animate-slide-up">
        {error && (
          <div className="mb-6 card-dark p-4 border-red-500/20" role="alert">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <i className="fas fa-exclamation-triangle text-red-400"></i>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-400">
                  Error Creating Loan
                </h3>
                <p className="text-gray-300 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="col-span-2">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Loan Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Home Mortgage, Car Loan"
                className="input"
              />
            </div>

            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Loan Amount ($) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">$</span>
                </div>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  min="0"
                  step="0.01"
                  required
                  value={formData.amount || ""}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="input pl-8"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="interest_rate"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Interest Rate (%) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="interest_rate"
                  name="interest_rate"
                  min="0"
                  step="0.01"
                  required
                  value={formData.interest_rate || ""}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="input pr-8"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">%</span>
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="term_months"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Term (Months) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                id="term_months"
                name="term_months"
                min="1"
                required
                value={formData.term_months || ""}
                onChange={handleChange}
                placeholder="12"
                className="input"
              />
            </div>

            <div>
              <label
                htmlFor="start_date"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Start Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                required
                value={formData.start_date}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div className="col-span-2">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description || ""}
                onChange={handleChange}
                placeholder="Optional details about this loan..."
                className="input resize-none"
              />
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate("/loans")}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`btn btn-primary ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Creating...
                </div>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  Create Loan
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Help Section */}
      <div
        className="card-dark p-6 animate-slide-up"
        style={{ animationDelay: "0.2s" }}
      >
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <i className="fas fa-info-circle text-blue-400"></i>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-200 mb-2">
              Loan Calculation Info
            </h3>
            <div className="text-sm text-gray-400 space-y-1">
              <p>
                • <strong className="text-gray-300">Monthly Payment:</strong>{" "}
                Automatically calculated based on principal, interest rate, and
                term
              </p>
              <p>
                • <strong className="text-gray-300">Total Amount:</strong> The
                total you'll pay over the life of the loan (principal +
                interest)
              </p>
              <p>
                • <strong className="text-gray-300">Interest Rate:</strong>{" "}
                Enter as annual percentage rate (APR)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
