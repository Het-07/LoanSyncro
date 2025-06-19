"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLoans } from "../../hooks/useLoans";
import { useAuth } from "../../hooks/useAuth";
import type { Loan } from "../../types/loan";

export default function LoansPage() {
  const { loans, loading, error } = useLoans();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

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

  // Filter loans based on search term
  const filteredLoans = loans.filter((loan) =>
    loan.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-200 mb-2">My Loans</h1>
          <p className="text-gray-400 text-lg">
            Manage and track all your loans
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

  if (error) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-200 mb-2">My Loans</h1>
          <p className="text-gray-400 text-lg">
            Manage and track all your loans
          </p>
        </div>

        <div className="card-dark p-6 border-red-500/20">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i className="fas fa-exclamation-circle text-red-400"></i>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-400">{error}</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-4xl font-bold text-gray-200 mb-2">My Loans</h1>
        <p className="text-gray-400 text-lg">Manage and track all your loans</p>
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
              placeholder="Search loans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={() => navigate("/loans/create")}
          className="btn btn-primary whitespace-nowrap"
        >
          <i className="fas fa-plus mr-2"></i>
          Add New Loan
        </button>
      </div>

      {/* Loans List */}
      {filteredLoans.length > 0 ? (
        <div
          className="card-dark animate-slide-up"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="divide-y divide-gray-700/50">
            {filteredLoans.map((loan: Loan, index) => (
              <div
                key={loan.id}
                className="p-6 hover:bg-gray-700/20 transition-all duration-200 cursor-pointer animate-fade-in"
                style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                onClick={() => navigate(`/loans/${loan.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="sm:flex sm:items-center">
                    <p className="text-lg font-medium text-gray-200 truncate">
                      {loan.title}
                    </p>
                    <div className="mt-2 sm:mt-0 sm:ml-6 flex items-center">
                      <span
                        className={`px-3 py-1 text-xs leading-5 font-semibold rounded-full ${
                          loan.status === "active"
                            ? "status-active"
                            : loan.status === "paid"
                            ? "status-paid"
                            : "status-defaulted"
                        }`}
                      >
                        {loan.status.charAt(0).toUpperCase() +
                          loan.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-400 sm:mt-0">
                    <p>Started {formatDate(loan.start_date)}</p>
                  </div>
                </div>
                <div className="mt-4 sm:flex sm:justify-between">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <div className="text-xs text-gray-400">Principal</div>
                      <div className="text-sm font-medium text-gray-200">
                        {formatCurrency(loan.amount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Interest Rate</div>
                      <div className="text-sm font-medium text-gray-200">
                        {loan.interest_rate}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">
                        Monthly Payment
                      </div>
                      <div className="text-sm font-medium text-red-400">
                        {formatCurrency(loan.monthly_payment)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Total Amount</div>
                      <div className="text-sm font-medium text-gray-200">
                        {formatCurrency(loan.total_amount)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 card-dark animate-scale-in">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-800/50 flex items-center justify-center">
            <i className="fas fa-money-bill-wave text-3xl text-gray-500"></i>
          </div>
          <h3 className="text-xl font-semibold text-gray-200 mb-2">
            {searchTerm ? "No loans found" : "No loans yet"}
          </h3>
          <p className="text-gray-400 mb-6">
            {searchTerm
              ? "Try a different search term"
              : "Get started by creating your first loan"}
          </p>
          <button
            onClick={() => navigate("/loans/create")}
            className="btn btn-primary"
          >
            <i className="fas fa-plus mr-2"></i>
            New Loan
          </button>
        </div>
      )}
    </div>
  );
}
