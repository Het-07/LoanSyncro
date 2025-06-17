import { useNavigate } from "react-router-dom";
import type { Loan } from "../../types/loan";

interface LoanCardProps {
  loan: Loan;
  showDetails?: boolean;
}

export default function LoanCard({ loan, showDetails = true }: LoanCardProps) {
  const navigate = useNavigate();

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

  // Calculate progress percentage
  const calculateProgress = () => {
    if (loan.total_amount === 0) return 0;
    // This is a simplified calculation. In a real app, you'd track actual payments
    // For now we'll make up a value
    return Math.floor(Math.random() * 100);
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
      onClick={() => navigate(`/loans/${loan.id}`)}
    >
      <div className="p-5">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-gray-900 mb-1 truncate">
            {loan.title}
          </h3>
          <span
            className={`px-2 py-1 text-xs leading-none rounded-full ${
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

        <p className="text-sm text-gray-500 mb-4">
          Started {formatDate(loan.start_date)}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500">Principal</p>
            <p className="text-md font-semibold">
              {formatCurrency(loan.amount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Interest Rate</p>
            <p className="text-md font-semibold">{loan.interest_rate}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Term</p>
            <p className="text-md font-semibold">{loan.term_months} months</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Monthly Payment</p>
            <p className="text-md font-semibold">
              {formatCurrency(loan.monthly_payment)}
            </p>
          </div>
        </div>

        {showDetails && (
          <>
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs text-gray-500">Progress</p>
                <p className="text-xs font-medium text-gray-700">
                  {calculateProgress()}%
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full"
                  style={{ width: `${calculateProgress()}%` }}
                ></div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">Total to Pay</p>
                <p className="text-md font-semibold">
                  {formatCurrency(loan.total_amount)}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/loans/${loan.id}`);
                }}
                className="text-primary-600 text-sm hover:text-primary-800"
              >
                View Details →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
