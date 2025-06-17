import { useState, useEffect } from "react";
import type { LoanFormData } from "../../types/loan";

interface LoanFormProps {
  initialData?: LoanFormData;
  onSubmit: (data: LoanFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const defaultFormData: LoanFormData = {
  title: "",
  amount: 0,
  interest_rate: 0,
  term_months: 12,
  start_date: new Date().toISOString().split("T")[0],
  description: "",
};

export default function LoanForm({
  initialData = defaultFormData,
  onSubmit,
  onCancel,
  loading = false,
}: LoanFormProps) {
  const [formData, setFormData] = useState<LoanFormData>(initialData);
  const [displayAmount, setDisplayAmount] = useState(
    initialData.amount.toString()
  );
  const [displayInterestRate, setDisplayInterestRate] = useState(
    initialData.interest_rate.toString()
  );
  const [displayTermMonths, setDisplayTermMonths] = useState(
    initialData.term_months.toString()
  );

  // Update display values when initialData changes
  useEffect(() => {
    setDisplayAmount(initialData.amount.toString());
    setDisplayInterestRate(initialData.interest_rate.toString());
    setDisplayTermMonths(initialData.term_months.toString());
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // Update display values for the numeric fields
    if (name === "amount") {
      setDisplayAmount(value);
      setFormData({
        ...formData,
        amount: value === "" ? 0 : Number(value),
      });
    } else if (name === "interest_rate") {
      setDisplayInterestRate(value);
      setFormData({
        ...formData,
        interest_rate: value === "" ? 0 : Number(value),
      });
    } else if (name === "term_months") {
      setDisplayTermMonths(value);
      setFormData({
        ...formData,
        term_months: value === "" ? 0 : Number(value),
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
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fadeIn">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="col-span-2">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Loan Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            placeholder="e.g., Home Mortgage, Car Loan"
          />
        </div>

        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-gray-700"
          >
            Loan Amount ($) <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500">$</span>
            </div>
            <input
              type="number"
              id="amount"
              name="amount"
              min="0"
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
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(formData.amount)}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="interest_rate"
            className="block text-sm font-medium text-gray-700"
          >
            Interest Rate (%) <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="number"
              id="interest_rate"
              name="interest_rate"
              min="0"
              step="0.01"
              required
              value={displayInterestRate}
              onChange={handleChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="0.00"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500">%</span>
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="term_months"
            className="block text-sm font-medium text-gray-700"
          >
            Term (Months) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="term_months"
            name="term_months"
            min="1"
            required
            value={displayTermMonths}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            placeholder="12"
          />
        </div>

        <div>
          <label
            htmlFor="start_date"
            className="block text-sm font-medium text-gray-700"
          >
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="start_date"
            name="start_date"
            required
            value={formData.start_date}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>

        <div className="col-span-2">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formData.description || ""}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            placeholder="Optional details about this loan"
          />
        </div>
      </div>

      <div className="mt-8 flex items-center justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {loading ? (
            <div className="flex items-center">
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
            </div>
          ) : (
            "Save Loan"
          )}
        </button>
      </div>
    </form>
  );
}
