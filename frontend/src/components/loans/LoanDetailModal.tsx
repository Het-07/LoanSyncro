"use client";

import type React from "react";

import { useState, useEffect } from "react";
import type { Loan, LoanFormData } from "../../types/loan";
import { loanService } from "../../services/api";

interface LoanDetailsModalProps {
  loan: Loan;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedLoan: Loan) => void;
}

export default function LoanDetailsModal({
  loan,
  isOpen,
  onClose,
  onUpdate,
}: LoanDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<LoanFormData>({
    title: loan.title,
    amount: loan.amount,
    interest_rate: loan.interest_rate,
    term_months: loan.term_months,
    start_date: loan.start_date.split("T")[0], // Convert to YYYY-MM-DD format
    description: loan.description || "",
  });

  // Update form data when loan changes
  useEffect(() => {
    setFormData({
      title: loan.title,
      amount: loan.amount,
      interest_rate: loan.interest_rate,
      term_months: loan.term_months,
      start_date: loan.start_date.split("T")[0],
      description: loan.description || "",
    });
  }, [loan]);

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await loanService.update(loan.id, formData);
      onUpdate(response.data);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update loan");
      console.error("Error updating loan:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original loan values
    setFormData({
      title: loan.title,
      amount: loan.amount,
      interest_rate: loan.interest_rate,
      term_months: loan.term_months,
      start_date: loan.start_date.split("T")[0],
      description: loan.description || "",
    });
    setIsEditing(false);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {isEditing ? "Edit Loan Details" : "Loan Details"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {error && (
          <div
            className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="mt-4">
          {isEditing ? (
            // Edit Form
            <form>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="col-span-2">
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Loan Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="amount"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Loan Amount ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    min="0"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="interest_rate"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Interest Rate (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="interest_rate"
                    name="interest_rate"
                    min="0"
                    step="0.01"
                    required
                    value={formData.interest_rate}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="term_months"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Term (Months) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="term_months"
                    name="term_months"
                    min="1"
                    required
                    value={formData.term_months}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="start_date"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    required
                    value={formData.start_date}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>

                <div className="col-span-2">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description || ""}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>
            </form>
          ) : (
            // View Mode
            <div className="space-y-6">
              {/* Loan Status */}
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-semibold text-gray-900">
                  {loan.title}
                </h4>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                    loan.status === "active"
                      ? "bg-green-100 text-green-800"
                      : loan.status === "paid"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                </span>
              </div>

              {/* Loan Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Principal Amount
                    </label>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {formatCurrency(loan.amount)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Interest Rate
                    </label>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {loan.interest_rate}%
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Term
                    </label>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {loan.term_months} months
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Monthly Payment
                    </label>
                    <p className="mt-1 text-lg font-semibold text-primary-600">
                      {formatCurrency(loan.monthly_payment)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Total Amount
                    </label>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {formatCurrency(loan.total_amount)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Start Date
                    </label>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {formatDate(loan.start_date)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {loan.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Description
                  </label>
                  <p className="mt-1 text-gray-900">{loan.description}</p>
                </div>
              )}

              {/* Created Date */}
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Created On
                </label>
                <p className="mt-1 text-sm text-gray-600">
                  {formatDate(loan.created_at)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end space-x-3">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className={`px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
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
                    Saving...
                  </div>
                ) : (
                  "Save Changes"
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <i className="fas fa-edit mr-2"></i>
                Edit Loan
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
