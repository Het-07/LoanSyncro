import { useState } from "react";
import type { Loan } from "../../types/loan";
import LoanCard from "./LoanCard";

interface LoanListsProps {
  loans: Loan[];
  loading?: boolean;
  error?: string | null;
}

export default function LoanLists({
  loans,
  loading = false,
  error = null,
}: LoanListsProps) {
  const [filter, setFilter] = useState<"all" | "active" | "paid">("all");

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

  // Filter loans based on selected filter
  const filteredLoans =
    filter === "all" ? loans : loans.filter((loan) => loan.status === filter);

  return (
    <div>
      {/* Filter tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setFilter("all")}
            className={`${
              filter === "all"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
          >
            All Loans ({loans.length})
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`${
              filter === "active"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
          >
            Active ({loans.filter((loan) => loan.status === "active").length})
          </button>
          <button
            onClick={() => setFilter("paid")}
            className={`${
              filter === "paid"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
          >
            Paid ({loans.filter((loan) => loan.status === "paid").length})
          </button>
        </nav>
      </div>

      {filteredLoans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLoans.map((loan) => (
            <LoanCard key={loan.id} loan={loan} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <i className="fas fa-search text-5xl text-gray-300 mb-4"></i>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No loans found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter !== "all"
              ? `You don't have any ${filter} loans.`
              : "You haven't added any loans yet."}
          </p>
        </div>
      )}
    </div>
  );
}
