import { useState, useEffect } from "react";
import { repaymentService, loanService } from "../../services/api";
import type { Repayment } from "../../types/repayment";
import type { Loan } from "../../types/loan";
import RepaymentForm from "../../components/repayments/RepaymentForm";
import RepaymentList from "../../components/repayments/RepaymentList";

export default function RepaymentsPage() {
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [loans, setLoans] = useState<Record<string, Loan>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Fetch repayments and loans data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
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

      setError(null);
    } catch (err) {
      setError("Failed to load repayments data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      await repaymentService.create(data);

      // Refresh data after successful creation
      await fetchData();

      // Close the form
      setShowForm(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create repayment");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
          Repayments
        </h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-150"
          >
            <i className="fas fa-plus mr-2" aria-hidden="true"></i> Record
            Repayment
          </button>
        )}
      </div>

      {error && (
        <div
          className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Repayment Form */}
      {showForm ? (
        <RepaymentForm
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
          loading={loading}
        />
      ) : (
        <RepaymentList
          repayments={repayments}
          loans={loans}
          onRecordRepayment={() => setShowForm(true)}
          loading={loading}
        />
      )}
    </div>
  );
}
