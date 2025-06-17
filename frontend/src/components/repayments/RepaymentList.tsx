import type { Repayment } from "../../types/repayment";
import type { Loan } from "../../types/loan";

interface RepaymentListProps {
  repayments: Repayment[];
  loans: Record<string, Loan>;
  onRecordRepayment: () => void;
  loading?: boolean;
}

export default function RepaymentList({
  repayments,
  loans,
  onRecordRepayment,
  loading = false,
}: RepaymentListProps) {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (repayments.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg shadow animate-fadeIn">
        <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <i
            className="fas fa-credit-card text-3xl text-gray-400"
            aria-hidden="true"
          ></i>
        </div>
        <h3 className="mt-2 text-lg font-medium text-gray-900">
          No repayments recorded
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by recording your first repayment
        </p>
        <div className="mt-6">
          <button
            onClick={onRecordRepayment}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-150"
          >
            <i className="fas fa-plus mr-2" aria-hidden="true"></i>
            Record Repayment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg animate-fadeIn">
      <ul className="divide-y divide-gray-200">
        {repayments.map((repayment) => (
          <li
            key={repayment.id}
            className="hover:bg-gray-50 transition-colors duration-150"
          >
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-600">
                    {loans[repayment.loan_id]?.title || "Unknown Loan"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Paid on {formatDate(repayment.payment_date)}
                  </p>
                </div>
                <div className="text-sm font-medium text-green-600">
                  {formatCurrency(repayment.amount)}
                </div>
              </div>
              {repayment.notes && (
                <div className="mt-2 text-sm text-gray-500">
                  <p>{repayment.notes}</p>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
