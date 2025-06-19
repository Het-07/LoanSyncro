"use client"

import { useState, useEffect } from "react"
import { loanService } from "../services/api"
import type { Loan } from "../types/loan"

export function useLoans() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLoans = async () => {
    try {
      setLoading(true)
      const response = await loanService.getAll()
      setLoans(response.data)
      setError(null)
    } catch (err) {
      setError("Failed to fetch loans")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLoans()
  }, [])

  const createLoan = async (
    loanData: Omit<Loan, "id" | "user_id" | "created_at" | "total_amount" | "monthly_payment" | "status">,
  ) => {
    try {
      setLoading(true)
      await loanService.create(loanData)
      await fetchLoans() // Refresh the loans list
      return true
    } catch (err) {
      setError("Failed to create loan")
      console.error(err)
      return false
    } finally {
      setLoading(false)
    }
  }

  return { loans, loading, error, fetchLoans, createLoan }
}
