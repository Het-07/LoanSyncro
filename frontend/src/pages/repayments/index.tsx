"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { repaymentService, loanService } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import type { Repayment } from "../../types/repayment";
import type { Loan } from "../../types/loan";

export default function RepaymentsPage() {
  const { user } = useAuth();
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [loans, setLoans] = useState<Record<string, Loan>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    loan_id: "",
    amount: 0,
    payment_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Fetch repayments and loans data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [repaymentsRes, loansRes] = await Promise.all([
          repaymentService.getAll(),
          loanService.getAll(),
        ]);

        setRepayments(repaymentsRes.data);

        // Convert loans array to an object for easier lookup
        const loansMap: Record<string, Loan> = {};
        loansRes.data.forEach((loan: Loan) => {
          loansMap[loan.id] = loan;
        });
        setLoans(loansMap);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(
          err.response?.data?.detail || "Failed to load repayments data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      month: "short",
      day: "numeric",
    });
  };

  // Calculate total repaid for a loan
  const getTotalRepaidForLoan = (loanId: string): number => {
    return repayments
      .filter((repayment) => repayment.loan_id === loanId)
      .reduce((total, repayment) => total + repayment.amount, 0);
  };

  // Calculate remaining balance for a loan
  const getRemainingBalance = (loanId: string): number => {
    const loan = loans[loanId];
    if (!loan) return 0;
    const totalRepaid = getTotalRepaidForLoan(loanId);
    return Math.max(0, loan.total_amount - totalRepaid);
  };

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "amount" ? Number.parseFloat(value) || 0 : value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      await repaymentService.create(formData);

      // Refresh both repayments and loans (to get updated status)
      const [repaymentsRes, loansRes] = await Promise.all([
        repaymentService.getAll(),
        loanService.getAll(),
      ]);

      setRepayments(repaymentsRes.data);

      const loansMap: Record<string, Loan> = {};
      loansRes.data.forEach((loan: Loan) => {
        loansMap[loan.id] = loan;
      });
      setLoans(loansMap);

      // Reset form
      setFormData({
        loan_id: "",
        amount: 0,
        payment_date: new Date().toISOString().split("T")[0],
        notes: "",
      });

      setShowForm(false);
    } catch (err: any) {
      console.error("Error creating repayment:", err);
      setError(err.response?.data?.detail || "Failed to create repayment");
    } finally {
      setLoading(false);
    }
  };

  // Filter repayments based on search term
  const filteredRepayments =
    repayments.length > 0
      ? repayments.filter((repayment) =>
          loans[repayment.loan_id]?.title
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
      : [];

  // Group repayments by loan
  const groupedRepayments = filteredRepayments.reduce((acc, repayment) => {
    const loanId = repayment.loan_id;
    if (!acc[loanId]) {
      acc[loanId] = [];
    }
    acc[loanId].push(repayment);
    return acc;
  }, {} as Record<string, Repayment[]>);

  if (loading && !repayments.length) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-200 mb-2">Repayments</h1>
          <p className="text-gray-400 text-lg">
            Track and manage your loan repayments
          </p>
        </div>

        <div className="flex justify-center items-center h-64">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-gray-700 border-t-red-500 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-4xl font-bold text-gray-200 mb-2">Repayments</h1>
        <p className="text-gray-400 text-lg">
          Track and manage your loan repayments
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 animate-slide-up">
        <div className="w-full sm:w-96">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fas fa-search text-gray-400"></i>
            </div>
            <input
              type="text"
              className="input pl-10"
              placeholder="Search repayments by loan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary whitespace-nowrap"
        >
          <i className="fas fa-plus mr-2"></i>
          Record Repayment
        </button>
      </div>

      {error && (
        <div
          className="card-dark p-6 border-red-500/20 animate-scale-in"
          role="alert"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i className="fas fa-exclamation-triangle text-red-400 text-xl"></i>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-red-400">Error</h3>
              <p className="text-gray-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Repayment Form */}
      {showForm && (
        <div className="card-dark p-6 animate-scale-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-200">
              Record New Repayment
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-300 transition-colors"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="loan_id"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Select Loan <span className="text-red-400">*</span>
                </label>
                <select
                  id="loan_id"
                  name="loan_id"
                  required
                  value={formData.loan_id}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">-- Select a loan --</option>
                  {Object.values(loans)
                    .filter((loan) => loan.status === "active")
                    .map((loan: Loan) => (
                      <option key={loan.id} value={loan.id}>
                        {loan.title} - Remaining:{" "}
                        {formatCurrency(getRemainingBalance(loan.id))}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="amount"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Payment Amount ($) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  min="0.01"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={handleChange}
                  className="input"
                />
              </div>

              <div>
                <label
                  htmlFor="payment_date"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Payment Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  id="payment_date"
                  name="payment_date"
                  required
                  value={formData.payment_date}
                  onChange={handleChange}
                  className="input"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  className="input resize-none"
                  placeholder="Any additional details about this payment"
                ></textarea>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
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
                {loading ? "Saving..." : "Save Payment"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Repayments List */}
      {Object.keys(groupedRepayments).length > 0 ? (
        <div
          className="card-dark animate-slide-up"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="divide-y divide-gray-700/50">
            {Object.entries(groupedRepayments).map(
              ([loanId, loanRepayments], index) => {
                const loan = loans[loanId];
                const totalRepaid = getTotalRepaidForLoan(loanId);
                const remainingBalance = getRemainingBalance(loanId);

                return (
                  <div
                    key={loanId}
                    className="p-6 animate-fade-in"
                    style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="sm:flex sm:items-center">
                        <p className="text-lg font-medium text-gray-200 truncate">
                          {loan?.title || "Unknown Loan"}
                        </p>
                        <div className="mt-2 sm:mt-0 sm:ml-6 flex items-center">
                          <span
                            className={`px-3 py-1 text-xs leading-5 font-semibold rounded-full ${
                              loan?.status === "active"
                                ? "status-active"
                                : loan?.status === "paid"
                                ? "status-paid"
                                : "status-defaulted"
                            }`}
                          >
                            {loan?.status?.charAt(0).toUpperCase() +
                              loan?.status?.slice(1) || "Unknown"}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-400 sm:mt-0">
                        <p>
                          {loanRepayments.length} payment
                          {loanRepayments.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-xs text-gray-400">
                          Total Repaid
                        </div>
                        <div className="text-sm font-medium text-green-400">
                          {formatCurrency(totalRepaid)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">
                          Remaining Balance
                        </div>
                        <div className="text-sm font-medium text-gray-200">
                          {formatCurrency(remainingBalance)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">
                          Last Payment
                        </div>
                        <div className="text-sm font-medium text-gray-200">
                          {formatDate(loanRepayments[0].payment_date)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Progress</div>
                        <div className="text-sm font-medium text-gray-200">
                          {loan
                            ? Math.round(
                                (totalRepaid / loan.total_amount) * 100
                              )
                            : 0}
                          %
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="progress-bar h-2">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${
                              loan
                                ? Math.min(
                                    100,
                                    (totalRepaid / loan.total_amount) * 100
                                  )
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Individual Payments */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-3">
                        Recent Payments:
                      </h4>
                      <div className="space-y-2">
                        {loanRepayments.slice(0, 3).map((repayment) => (
                          <div
                            key={repayment.id}
                            className="flex justify-between items-center text-sm p-3 bg-gray-700/20 rounded-lg"
                          >
                            <div>
                              <span className="text-gray-300">
                                {formatDate(repayment.payment_date)}
                              </span>
                              {repayment.notes && (
                                <span className="text-gray-400 ml-2">
                                  - {repayment.notes}
                                </span>
                              )}
                            </div>
                            <span className="font-medium text-green-400">
                              {formatCurrency(repayment.amount)}
                            </span>
                          </div>
                        ))}
                        {loanRepayments.length > 3 && (
                          <div className="text-xs text-gray-400 text-center py-2">
                            ... and {loanRepayments.length - 3} more payment
                            {loanRepayments.length - 3 !== 1 ? "s" : ""}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 card-dark animate-scale-in">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-800/50 flex items-center justify-center">
            <i className="fas fa-credit-card text-3xl text-gray-500"></i>
          </div>
          <h3 className="text-xl font-semibold text-gray-200 mb-2">
            No repayments recorded
          </h3>
          <p className="text-gray-400 mb-6">
            {searchTerm
              ? "Try a different search term"
              : "Get started by recording your first repayment"}
          </p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            <i className="fas fa-plus mr-2"></i>
            Record Repayment
          </button>
        </div>
      )}
    </div>
  );
}
