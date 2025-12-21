"use client";

import { useState, useTransition } from "react";
import { updateDebt } from "@/actions/debts";
import type { Debt } from "@amigo/db";

type DebtTab = "LOAN" | "CREDIT_CARD";

interface EditDebtDialogProps {
  debt: Debt;
  isOpen: boolean;
  onClose: () => void;
}

function EditDebtForm({ debt, onClose }: { debt: Debt; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<DebtTab>(debt.type as DebtTab);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Initialize form values from debt prop
  const [loanName, setLoanName] = useState(
    debt.type === "LOAN" ? debt.name : ""
  );
  const [loanAmount, setLoanAmount] = useState(
    debt.type === "LOAN" ? debt.balanceInitial : ""
  );
  const [totalPaid, setTotalPaid] = useState(
    debt.type === "LOAN" ? debt.balanceCurrent : ""
  );

  const [ccName, setCcName] = useState(
    debt.type === "CREDIT_CARD" ? debt.name : ""
  );
  const [creditLimit, setCreditLimit] = useState(
    debt.type === "CREDIT_CARD" ? debt.balanceInitial : ""
  );
  const [availableCredit, setAvailableCredit] = useState(
    debt.type === "CREDIT_CARD" ? debt.balanceCurrent : ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        if (activeTab === "LOAN") {
          await updateDebt(debt.id, {
            type: "LOAN",
            name: loanName,
            loanAmount: parseFloat(loanAmount),
            totalPaid: parseFloat(totalPaid) || 0,
          });
        } else {
          await updateDebt(debt.id, {
            type: "CREDIT_CARD",
            name: ccName,
            creditLimit: parseFloat(creditLimit),
            availableCredit: parseFloat(availableCredit),
          });
        }
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update debt");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl border">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Edit Debt</h2>
          <button
            onClick={onClose}
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
                  htmlFor="editLoanName"
                  className="mb-1 block text-sm font-medium"
                >
                  Loan Name
                </label>
                <input
                  id="editLoanName"
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
                  htmlFor="editLoanAmount"
                  className="mb-1 block text-sm font-medium"
                >
                  Loan Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-muted-foreground">
                    $
                  </span>
                  <input
                    id="editLoanAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-md border border-input bg-background py-2 pl-7 pr-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="editTotalPaid"
                  className="mb-1 block text-sm font-medium"
                >
                  Total Paid
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-muted-foreground">
                    $
                  </span>
                  <input
                    id="editTotalPaid"
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
                  htmlFor="editCcName"
                  className="mb-1 block text-sm font-medium"
                >
                  Card Name
                </label>
                <input
                  id="editCcName"
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
                  htmlFor="editCreditLimit"
                  className="mb-1 block text-sm font-medium"
                >
                  Credit Limit
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-muted-foreground">
                    $
                  </span>
                  <input
                    id="editCreditLimit"
                    type="number"
                    min="0"
                    step="0.01"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-md border border-input bg-background py-2 pl-7 pr-3 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="editAvailableCredit"
                  className="mb-1 block text-sm font-medium"
                >
                  Available Credit
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-muted-foreground">
                    $
                  </span>
                  <input
                    id="editAvailableCredit"
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
              onClick={onClose}
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
              {isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EditDebtDialog({ debt, isOpen, onClose }: EditDebtDialogProps) {
  if (!isOpen) {
    return null;
  }

  // Using key to reset form state when debt changes
  return <EditDebtForm key={debt.id} debt={debt} onClose={onClose} />;
}
