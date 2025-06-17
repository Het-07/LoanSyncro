import { useState, useEffect } from "react";
import { loanService } from "../../services/api";
import type { Loan } from "../../types/loan";

interface RepaymentFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function RepaymentForm({
  onSubmit,
  onCancel,
  loading = false,
}: RepaymentFormProps) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(true);
  const [formData, setFormData] = useState({
    loan_id: "",
    amount: 0,
    payment_date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [displayAmount, setDisplayAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setLoadingLoans(true);
        const response = await loanService.getAll();
        setLoans(response.data);
        setError(null);
      } catch (err) {
        setError("Failed to load loans");
        console.error("Error fetching loans:", err);
      } finally {
        setLoadingLoans(false);
      }
    };

    fetchLoans();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "amount") {
      setDisplayAmount(value);
      setFormData({
        ...formData,
        amount: value === "" ? 0 : Number(value),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Convert amount to number explicitly
    const dataToSubmit = {
      ...formData,
      amount: Number(formData.amount),
    };

    await onSubmit(dataToSubmit);
  };

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 animate-fadeIn">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">
          Record New Repayment
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-500 focus:outline-none"
          aria-label="Close form"
        >
          <i className="fas fa-times" aria-hidden="true"></i>
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

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
              disabled={loadingLoans}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-100"
            >
              <option value="">-- Select a loan --</option>
              {loans.map((loan) => (
                <option key={loan.id} value={loan.id}>
                  {loan.title} - {formatCurrency(loan.amount)}
                </option>
              ))}
            </select>
            {loadingLoans && (
              <p className="mt-1 text-xs text-gray-500">Loading loans...</p>
            )}
          </div>

          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700"
            >
              Payment Amount ($) <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">$</span>
              </div>
              <input
                type="number"
                id="amount"
                name="amount"
                min="0.01"
                step="0.01"
                required
                value={displayAmount}
                onChange={handleChange}
                className="pl-8 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="0.00"
              />
            </div>
            {formData.amount > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                {formatCurrency(formData.amount)}
              </p>
            )}
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
              value={formData.notes || ""}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="Any additional details about this payment"
            ></textarea>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || loadingLoans}
            className={`px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
              loading || loadingLoans ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </span>
            ) : (
              "Save Payment"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
