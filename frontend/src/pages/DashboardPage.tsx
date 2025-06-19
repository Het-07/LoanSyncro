"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { repaymentService } from "../services/api";
import type { Summary } from "../types/repayment";
import type { Loan } from "../types/loan";
import { useLoans } from "../hooks/useLoans";
import LoanDetailModal from "../components/loans/LoanDetailModal";

export default function DashboardPage() {
  const { user } = useAuth();
  const { loans, loading: loansLoading, fetchLoans } = useLoans();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await repaymentService.getSummary();
        setSummary(response.data);
        setError(null);
      } catch (err) {
        setError("Failed to load dashboard data");
        console.error(err);
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

  const handleViewDetails = (loan: Loan) => {
    setSelectedLoan(loan);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLoan(null);
  };

  const handleLoanUpdate = (updatedLoan: Loan) => {
    fetchLoans();
    setSelectedLoan(updatedLoan);
  };

  if (loading || loansLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-red-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-red-400 rounded-full animate-spin animate-pulse-slow"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-dark p-6 border-red-500/20 animate-scale-in">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <i className="fas fa-exclamation-triangle text-red-400 text-xl"></i>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-red-400">
              Error Loading Dashboard
            </h3>
            <p className="text-gray-300 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const summaryCards = [
    {
      title: "Total Loans",
      value: summary?.total_loans || 0,
      icon: "university",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-500/10",
      textColor: "text-blue-400",
      delay: "0s",
    },
    {
      title: "Total Borrowed",
      value: formatCurrency(summary?.total_borrowed || 0),
      icon: "money-bill-wave",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-500/10",
      textColor: "text-purple-400",
      delay: "0.1s",
    },
    {
      title: "Total Repaid",
      value: formatCurrency(summary?.total_repaid || 0),
      icon: "check-circle",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-500/10",
      textColor: "text-green-400",
      delay: "0.2s",
    },
    {
      title: "Outstanding",
      value: formatCurrency(summary?.outstanding_amount || 0),
      icon: "exclamation-circle",
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-500/10",
      textColor: "text-red-400",
      delay: "0.3s",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-4xl font-bold text-white mb-2">
          Welcome back,{" "}
          <span className="text-gradient">{user?.full_name.split(" ")[0]}</span>
        </h1>
        <p className="text-gray-400 text-lg">
          Here's an overview of your loan portfolio
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card, index) => (
          <div
            key={card.title}
            className="card-dark p-6 hover-glow animate-slide-up"
            style={{ animationDelay: card.delay }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-400 mb-1">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-white">{card.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${card.bgColor}`}>
                <i
                  className={`fas fa-${card.icon} text-xl ${card.textColor}`}
                ></i>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <div
                className={`h-1 w-full bg-gradient-to-r ${card.color} rounded-full opacity-20`}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Loans */}
      <div
        className="card-dark animate-slide-up"
        style={{ animationDelay: "0.4s" }}
      >
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-white">Recent Loans</h3>
              <p className="text-gray-400 mt-1">Your latest loan activities</p>
            </div>
            <button
              onClick={() => navigate("/loans")}
              className="btn btn-outline text-sm"
            >
              <i className="fas fa-arrow-right mr-2"></i>
              View All
            </button>
          </div>
        </div>

        <div className="p-6">
          {loans && loans.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {loans.slice(0, 3).map((loan: Loan, index) => (
                <div
                  key={loan.id}
                  className="glass-effect p-6 rounded-xl hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300 hover:-translate-y-1 animate-scale-in"
                  style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white truncate flex-1 mr-2">
                      {loan.title}
                    </h4>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
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

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Principal</p>
                      <p className="text-sm font-semibold text-white">
                        {formatCurrency(loan.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">
                        Interest Rate
                      </p>
                      <p className="text-sm font-semibold text-white">
                        {loan.interest_rate}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">
                        Monthly Payment
                      </p>
                      <p className="text-sm font-semibold text-red-400">
                        {formatCurrency(loan.monthly_payment)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Total</p>
                      <p className="text-sm font-semibold text-white">
                        {formatCurrency(loan.total_amount)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleViewDetails(loan)}
                    className="w-full text-sm text-red-400 hover:text-red-300 font-medium transition-colors duration-200 flex items-center justify-center group"
                  >
                    View Details
                    <i className="fas fa-arrow-right ml-2 transform group-hover:translate-x-1 transition-transform duration-200"></i>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 animate-fade-in">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-800/50 flex items-center justify-center">
                <i className="fas fa-university text-3xl text-gray-500"></i>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No loans yet
              </h3>
              <p className="text-gray-400 mb-6">
                Get started by adding your first loan
              </p>
              <button
                onClick={() => navigate("/loans/create")}
                className="btn btn-primary"
              >
                <i className="fas fa-plus mr-2"></i>
                Add Your First Loan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loan Details Modal */}
      {selectedLoan && (
        <LoanDetailModal
          loan={selectedLoan}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onUpdate={handleLoanUpdate}
        />
      )}
    </div>
  );
}
