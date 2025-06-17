import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { repaymentService } from "../services/api";
import type { Summary } from "../types/repayment";
import type { Loan } from "../types/loan";
import { useLoans } from "../hooks/useLoans";

export default function DashboardPage() {
  const { user } = useAuth();
  const { loans, loading: loansLoading } = useLoans();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      currency: "CAD",
    }).format(value);
  };

  if (loading || loansLoading) {
    return (
      <div className="flex justify-center items-center h-full py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 mt-4">
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.full_name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here's an overview of your loan portfolio
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg border-t-4 border-blue-500">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <i className="fas fa-university text-blue-600"></i>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Loans
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {summary?.total_loans || 0}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border-t-4 border-indigo-500">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                <i className="fas fa-money-bill-wave text-indigo-600"></i>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Borrowed
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(summary?.total_borrowed || 0)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border-t-4 border-green-500">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <i className="fas fa-check-circle text-green-600"></i>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Repaid
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(summary?.total_repaid || 0)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border-t-4 border-red-500">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                <i className="fas fa-exclamation-circle text-red-600"></i>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Outstanding
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(summary?.outstanding_amount || 0)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Loans */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recent Loans
          </h3>
          <button
            onClick={() => navigate("/loans")}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            View all
          </button>
        </div>

        <div className="px-4 py-5 sm:p-6">
          {loans && loans.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {loans.slice(0, 3).map((loan: Loan) => (
                <div
                  key={loan.id}
                  className="bg-gray-50 overflow-hidden shadow rounded-lg"
                >
                  <div className="px-4 py-5 sm:p-6">
                    <h4 className="text-lg font-medium text-gray-900 truncate">
                      {loan.title}
                    </h4>
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-500">
                          Principal
                        </div>
                        <div className="mt-1 text-lg font-semibold text-gray-900">
                          {formatCurrency(loan.amount)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500">
                          Interest Rate
                        </div>
                        <div className="mt-1 text-lg font-semibold text-gray-900">
                          {loan.interest_rate}%
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500">
                          Monthly Payment
                        </div>
                        <div className="mt-1 text-lg font-semibold text-gray-900">
                          {formatCurrency(loan.monthly_payment)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500">
                          Total
                        </div>
                        <div className="mt-1 text-lg font-semibold text-gray-900">
                          {formatCurrency(loan.total_amount)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={() => navigate(`/loans/${loan.id}`)}
                        className="text-sm text-primary-600 hover:text-primary-900"
                      >
                        View details &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <i className="fas fa-money-bill-wave text-4xl text-gray-300 mb-3"></i>
              <p className="text-gray-500 mb-4">You don't have any loans yet</p>
              <button
                onClick={() => navigate("/loans/create")}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Add Your First Loan
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
