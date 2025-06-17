import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLoans } from "../../hooks/useLoans";
import type { Loan } from "../../types/loan";

export default function LoansPage() {
  const { loans, loading, error } = useLoans();
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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <i className="fas fa-exclamation-circle text-red-400"></i>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{error}</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
          My Loans
        </h1>
        <button
          onClick={() => navigate("/loans/create")}
          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <i className="fas fa-plus mr-2"></i> Add New Loan
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
            placeholder="Search loans..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredLoans.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredLoans.map((loan: Loan) => (
              <li key={loan.id}>
                <div
                  className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/loans/${loan.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="sm:flex sm:items-center">
                      <p className="text-lg font-medium text-primary-600 truncate">
                        {loan.title}
                      </p>
                      <div className="mt-2 sm:mt-0 sm:ml-6 flex items-center">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            loan.status === "active"
                              ? "bg-green-100 text-green-800"
                              : loan.status === "paid"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {loan.status.charAt(0).toUpperCase() +
                            loan.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>Started {formatDate(loan.start_date)}</p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                      <div>
                        <div className="text-xs text-gray-500">Principal</div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(loan.amount)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">
                          Interest Rate
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {loan.interest_rate}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">
                          Monthly Payment
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(loan.monthly_payment)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">
                          Total Amount
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(loan.total_amount)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <i className="fas fa-money-bill-wave text-5xl text-gray-300 mb-4"></i>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No loans found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm
              ? "Try a different search term"
              : "Get started by creating a new loan"}
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate("/loans/create")}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <i className="fas fa-plus mr-2"></i>
              New Loan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
