"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { repaymentService, loanService } from "../../services/api";
import type { Repayment } from "../../types/repayment";
import type { Loan } from "../../types/loan";

export default function RepaymentsPage() {
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
  const filteredRepayments = repayments.filter((repayment) =>
    loans[repayment.loan_id]?.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
          Repayments
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <i className="fas fa-plus mr-2"></i> Record Repayment
        </button>
      </div>

      <div className="mb-6">
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="fas fa-search text-gray-400"></i>
          </div>
          <input
            type="text"
            className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
            placeholder="Search repayments by loan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div
          className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Repayment Form */}
      {showForm && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Record New Repayment
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="loan_id"
                  className="block text-sm font-medium text-gray-700"
                >
                  Select Loan <span className="text-red-500">*</span>
                </label>
                <select
                  id="loan_id"
                  name="loan_id"
                  required
                  value={formData.loan_id}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
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
                  className="block text-sm font-medium text-gray-700"
                >
                  Payment Amount ($) <span className="text-red-500">*</span>
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div>
                <label
                  htmlFor="payment_date"
                  className="block text-sm font-medium text-gray-700"
                >
                  Payment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="payment_date"
                  name="payment_date"
                  required
                  value={formData.payment_date}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700"
                >
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={2}
                  value={formData.notes}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Any additional details about this payment"
                ></textarea>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                  loading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "Saving..." : "Save Payment"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Repayments List - Card Style */}
      {Object.keys(groupedRepayments).length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {Object.entries(groupedRepayments).map(
              ([loanId, loanRepayments]) => {
                const loan = loans[loanId];
                const totalRepaid = getTotalRepaidForLoan(loanId);
                const remainingBalance = getRemainingBalance(loanId);

                return (
                  <li key={loanId}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="sm:flex sm:items-center">
                          <p className="text-lg font-medium text-primary-600 truncate">
                            {loan?.title || "Unknown Loan"}
                          </p>
                          <div className="mt-2 sm:mt-0 sm:ml-6 flex items-center">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                loan?.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : loan?.status === "paid"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {loan?.status?.charAt(0).toUpperCase() +
                                loan?.status?.slice(1) || "Unknown"}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>
                            {loanRepayments.length} payment
                            {loanRepayments.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                          <div>
                            <div className="text-xs text-gray-500">
                              Total Repaid
                            </div>
                            <div className="text-sm font-medium text-green-600">
                              {formatCurrency(totalRepaid)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">
                              Remaining Balance
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(remainingBalance)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">
                              Last Payment
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatDate(loanRepayments[0].payment_date)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">
                              Progress
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {loan
                                ? Math.round(
                                    (totalRepaid / loan.total_amount) * 100
                                  )
                                : 0}
                              %
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
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
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Recent Payments:
                        </h4>
                        <div className="space-y-2">
                          {loanRepayments.slice(0, 3).map((repayment) => (
                            <div
                              key={repayment.id}
                              className="flex justify-between items-center text-sm"
                            >
                              <div>
                                <span className="text-gray-600">
                                  {formatDate(repayment.payment_date)}
                                </span>
                                {repayment.notes && (
                                  <span className="text-gray-400 ml-2">
                                    - {repayment.notes}
                                  </span>
                                )}
                              </div>
                              <span className="font-medium text-green-600">
                                {formatCurrency(repayment.amount)}
                              </span>
                            </div>
                          ))}
                          {loanRepayments.length > 3 && (
                            <div className="text-xs text-gray-500">
                              ... and {loanRepayments.length - 3} more payment
                              {loanRepayments.length - 3 !== 1 ? "s" : ""}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              }
            )}
          </ul>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <i className="fas fa-credit-card text-5xl text-gray-300 mb-4"></i>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No repayments recorded
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm
              ? "Try a different search term"
              : "Get started by recording your first repayment"}
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <i className="fas fa-plus mr-2"></i>
              Record Repayment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
