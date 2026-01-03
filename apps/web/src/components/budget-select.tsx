"use client";

import { useEffect, useState } from "react";
import { getBudgets } from "@/actions/budgets";
import { ChevronDown, Target, Users, User } from "lucide-react";

interface Budget {
  id: string;
  name: string;
  category: string | null;
  limitAmount: string;
  period: "weekly" | "monthly" | "yearly";
  isShared: boolean;
}

interface BudgetSelectProps {
  value: string | null;
  onChange: (budgetId: string | null) => void;
  disabled?: boolean;
}

export function BudgetSelect({ value, onChange, disabled }: BudgetSelectProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function loadBudgets() {
      try {
        const data = await getBudgets();
        setBudgets(data);
      } catch (error) {
        console.error("Failed to load budgets:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadBudgets();
  }, []);

  const selectedBudget = budgets.find((b) => b.id === value);
  const sharedBudgets = budgets.filter((b) => b.isShared);
  const personalBudgets = budgets.filter((b) => !b.isShared);

  const formatLimit = (amount: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  if (isLoading) {
    return (
      <div className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
        Loading budgets...
      </div>
    );
  }

  if (budgets.length === 0) {
    return (
      <div className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
        No budgets created yet
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
      >
        <span className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          {selectedBudget ? (
            <span className="flex items-center gap-1">
              {selectedBudget.name}
              <span className="text-muted-foreground">
                ({formatLimit(selectedBudget.limitAmount)})
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">No budget</span>
          )}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-md border bg-popover shadow-md">
            {/* No budget option */}
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent ${
                value === null ? "bg-accent" : ""
              }`}
            >
              <span className="text-muted-foreground">No budget</span>
            </button>

            {/* Shared Budgets */}
            {sharedBudgets.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground border-t">
                  <Users className="h-3 w-3" />
                  Shared Budgets
                </div>
                {sharedBudgets.map((budget) => (
                  <button
                    key={budget.id}
                    type="button"
                    onClick={() => {
                      onChange(budget.id);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent ${
                      value === budget.id ? "bg-accent" : ""
                    }`}
                  >
                    <span>{budget.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {formatLimit(budget.limitAmount)}/{budget.period}
                    </span>
                  </button>
                ))}
              </>
            )}

            {/* Personal Budgets */}
            {personalBudgets.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground border-t">
                  <User className="h-3 w-3" />
                  Personal Budgets
                </div>
                {personalBudgets.map((budget) => (
                  <button
                    key={budget.id}
                    type="button"
                    onClick={() => {
                      onChange(budget.id);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent ${
                      value === budget.id ? "bg-accent" : ""
                    }`}
                  >
                    <span>{budget.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {formatLimit(budget.limitAmount)}/{budget.period}
                    </span>
                  </button>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
