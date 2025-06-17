import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loanService } from "../../services/api";
import type { LoanFormData } from "../../types/loan";
import LoanForm from "../../components/loans/LoanForm";

export default function CreateLoanPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialData: LoanFormData = {
    title: "",
    amount: 0,
    interest_rate: 0,
    term_months: 12,
    start_date: new Date().toISOString().split("T")[0],
    description: "",
  };

  const handleSubmit = async (formData: LoanFormData) => {
    try {
      setLoading(true);
      setError(null);

      // Make sure numeric values are properly converted
      const submissionData = {
        ...formData,
        amount: Number(formData.amount),
        interest_rate: Number(formData.interest_rate),
        term_months: Number(formData.term_months),
      };

      await loanService.create(submissionData);
      navigate("/loans");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create loan");
      console.error("Error creating loan:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Add New Loan</h1>
        <p className="mt-1 text-sm text-gray-500">
          Fill in the details to add a new loan to track
        </p>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        {error && (
          <div
            className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <LoanForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/loans")}
          loading={loading}
        />
      </div>
    </div>
  );
}
