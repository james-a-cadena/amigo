"use client";

import { useState, useTransition } from "react";
import { addDebt } from "@/actions/debts";
import { CurrencySelect } from "@/components/currency-select";
import type { CurrencyCode } from "@amigo/db/schema";

type DebtTab = "LOAN" | "CREDIT_CARD";

export function AddDebtDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DebtTab>("LOAN");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Loan fields
  const [loanName, setLoanName] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [totalPaid, setTotalPaid] = useState("");
  const [loanCurrency, setLoanCurrency] = useState<CurrencyCode>("CAD");

  // Credit card fields
  const [ccName, setCcName] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [availableCredit, setAvailableCredit] = useState("");
  const [ccCurrency, setCcCurrency] = useState<CurrencyCode>("CAD");

  const resetForm = () => {
    setLoanName("");
    setLoanAmount("");
    setTotalPaid("");
    setLoanCurrency("CAD");
    setCcName("");
    setCreditLimit("");
    setAvailableCredit("");
    setCcCurrency("CAD");
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        if (activeTab === "LOAN") {
          await addDebt({
            type: "LOAN",
            name: loanName,
            loanAmount: parseFloat(loanAmount),
            totalPaid: parseFloat(totalPaid) || 0,
            currency: loanCurrency,
          });
        } else {
          await addDebt({
            type: "CREDIT_CARD",
            name: ccName,
            creditLimit: parseFloat(creditLimit),
            availableCredit: parseFloat(availableCredit),
            currency: ccCurrency,
          });
        }
        resetForm();
        setIsOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add debt");
      }
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Add Debt
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl border">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Add Debt</h2>
          <button
            onClick={() => {
              resetForm();
              setIsOpen(false);
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex rounded-lg bg-secondary p-1">
          <button
            type="button"
            onClick={() => setActiveTab("LOAN")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === "LOAN"
                ? "bg-card text-blue-600 dark:text-blue-400 shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Loan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("CREDIT_CARD")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === "CREDIT_CARD"
                ? "bg-card text-purple-600 dark:text-purple-400 shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Credit Card
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === "LOAN" ? (
            <>
              <div>
                <label
                  htmlFor="loanName"
                  className="mb-1 block text-sm font-medium"
                >
                  Loan Name
                </label>
                <input
                  id="loanName"
                  type="text"
                  value={loanName}
                  onChange={(e) => setLoanName(e.target.value)}
                  placeholder="e.g., Car Loan, Mortgage"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="loanCurrency"
                  className="mb-1 block text-sm font-medium"
                >
                  Currency
                </label>
                <CurrencySelect
                  id="loanCurrency"
                  value={loanCurrency}
                  onChange={setLoanCurrency}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label
                  htmlFor="loanAmount"
                  className="mb-1 block text-sm font-medium"
                >
                  Loan Amount
                </label>
                <input
                  id="loanAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="totalPaid"
                  className="mb-1 block text-sm font-medium"
                >
                  Total Paid
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-muted-foreground">$</span>
                  <input
                    id="totalPaid"
                    type="number"
                    min="0"
                    step="0.01"
                    value={totalPaid}
                    onChange={(e) => setTotalPaid(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-md border border-input bg-background py-2 pl-7 pr-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  How much have you paid so far?
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <label
                  htmlFor="ccName"
                  className="mb-1 block text-sm font-medium"
                >
                  Card Name
                </label>
                <input
                  id="ccName"
                  type="text"
                  value={ccName}
                  onChange={(e) => setCcName(e.target.value)}
                  placeholder="e.g., Chase Sapphire, Amex Gold"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="ccCurrency"
                  className="mb-1 block text-sm font-medium"
                >
                  Currency
                </label>
                <CurrencySelect
                  id="ccCurrency"
                  value={ccCurrency}
                  onChange={setCcCurrency}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label
                  htmlFor="creditLimit"
                  className="mb-1 block text-sm font-medium"
                >
                  Credit Limit
                </label>
                <input
                  id="creditLimit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="availableCredit"
                  className="mb-1 block text-sm font-medium"
                >
                  Available Credit
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-muted-foreground">$</span>
                  <input
                    id="availableCredit"
                    type="number"
                    min="0"
                    step="0.01"
                    value={availableCredit}
                    onChange={(e) => setAvailableCredit(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-md border border-input bg-background py-2 pl-7 pr-3 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  How much credit is currently available?
                </p>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsOpen(false);
              }}
              className="flex-1 rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                activeTab === "LOAN"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              {isPending ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
