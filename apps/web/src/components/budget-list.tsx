"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Target,
  Users,
  User,
  AlertCircle,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Loading } from "@/components/loading";
import { CurrencySelect } from "@/components/currency-select";
import { formatCurrency } from "@/lib/currency";
import {
  getBudgetsWithSpending,
  createBudget,
  updateBudget,
  deleteBudget,
  type BudgetWithSpending,
  type BudgetInput,
} from "@/actions/budgets";
import type { CurrencyCode as _CurrencyCode } from "@amigo/db/schema";

function getProgressColor(percentUsed: number): string {
  if (percentUsed >= 90) return "bg-red-500";
  if (percentUsed >= 75) return "bg-yellow-500";
  return "bg-green-500";
}

function getProgressTextColor(percentUsed: number): string {
  if (percentUsed >= 90) return "text-red-600 dark:text-red-400";
  if (percentUsed >= 75) return "text-yellow-600 dark:text-yellow-400";
  return "text-green-600 dark:text-green-400";
}

interface BudgetFormProps {
  initialData?: BudgetWithSpending | null;
  onSubmit: (data: BudgetInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

function BudgetForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: BudgetFormProps) {
  const [formData, setFormData] = useState<BudgetInput>({
    name: initialData?.name ?? "",
    category: initialData?.category ?? "",
    limitAmount: initialData ? parseFloat(initialData.limitAmount) : 0,
    period: initialData?.period ?? "monthly",
    isShared: initialData?.isShared ?? false,
    currency: initialData?.currency ?? "CAD",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFormData((prev) => ({ ...prev, isShared: false }))}
          className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
            !formData.isShared
              ? "bg-primary/10 text-primary"
              : "bg-secondary text-muted-foreground"
          }`}
        >
          <User className="h-4 w-4" />
          Personal
        </button>
        <button
          type="button"
          onClick={() => setFormData((prev) => ({ ...prev, isShared: true }))}
          className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
            formData.isShared
              ? "bg-primary/10 text-primary"
              : "bg-secondary text-muted-foreground"
          }`}
        >
          <Users className="h-4 w-4" />
          Shared
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        {formData.isShared
          ? "Shared budgets track spending from all household members"
          : "Personal budgets only track your own spending"}
      </p>

      <input
        type="text"
        placeholder="Budget Name (e.g., Monthly Groceries)"
        value={formData.name}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, name: e.target.value }))
        }
        className="w-full rounded-md border border-input bg-background px-3 py-2"
        required
      />

      <input
        type="text"
        placeholder="Category (optional - for filtering)"
        value={formData.category || ""}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, category: e.target.value }))
        }
        className="w-full rounded-md border border-input bg-background px-3 py-2"
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-muted-foreground">Limit</label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Amount"
            value={formData.limitAmount || ""}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                limitAmount: parseFloat(e.target.value) || 0,
              }))
            }
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Currency</label>
          <CurrencySelect
            value={formData.currency ?? "CAD"}
            onChange={(currency) =>
              setFormData((prev) => ({ ...prev, currency }))
            }
            className="w-full rounded-md border border-input bg-background px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="text-sm text-muted-foreground">Period</label>
        <select
          value={formData.period}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              period: e.target.value as "weekly" | "monthly" | "yearly",
            }))
          }
          className="w-full rounded-md border border-input bg-background px-3 py-2"
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-md border border-input px-3 py-2 text-muted-foreground hover:bg-accent"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !formData.name || !formData.limitAmount}
          className="flex-1 rounded-md bg-primary px-3 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : initialData ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}

export function BudgetList() {
  const [budgets, setBudgets] = useState<BudgetWithSpending[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithSpending | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadBudgets = async () => {
    try {
      setIsLoading(true);
      const data = await getBudgetsWithSpending();
      setBudgets(data);
      setError(null);
    } catch (err) {
      setError("Failed to load budgets");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, []);

  const handleCreate = async (data: BudgetInput) => {
    setIsSubmitting(true);
    try {
      await createBudget(data);
      setShowAddForm(false);
      await loadBudgets();
    } catch (err) {
      console.error("Failed to create budget:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data: BudgetInput) => {
    if (!editingBudget) return;
    setIsSubmitting(true);
    try {
      await updateBudget(editingBudget.id, data);
      setEditingBudget(null);
      await loadBudgets();
    } catch (err) {
      console.error("Failed to update budget:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBudget(id);
      await loadBudgets();
    } catch (err) {
      console.error("Failed to delete budget:", err);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        {error}
      </div>
    );
  }

  const sharedBudgets = budgets.filter((b) => b.isShared);
  const personalBudgets = budgets.filter((b) => !b.isShared);

  return (
    <div className="space-y-6">
      {/* Add Budget Button/Form */}
      {showAddForm ? (
        <BudgetForm
          onSubmit={handleCreate}
          onCancel={() => setShowAddForm(false)}
          isSubmitting={isSubmitting}
        />
      ) : editingBudget ? (
        <BudgetForm
          initialData={editingBudget}
          onSubmit={handleUpdate}
          onCancel={() => setEditingBudget(null)}
          isSubmitting={isSubmitting}
        />
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-3 text-muted-foreground hover:border-muted-foreground hover:text-foreground"
        >
          <Plus className="h-5 w-5" />
          Create Budget
        </button>
      )}

      {budgets.length === 0 ? (
        <EmptyState message="No budgets created yet. Create one to start tracking your spending." />
      ) : (
        <div className="space-y-6">
          {/* Shared Budgets */}
          {sharedBudgets.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Users className="h-4 w-4" />
                Shared Budgets
              </div>
              <div className="space-y-3">
                {sharedBudgets.map((budget) => (
                  <BudgetCard
                    key={budget.id}
                    budget={budget}
                    onEdit={() => setEditingBudget(budget)}
                    onDelete={() => handleDelete(budget.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Personal Budgets */}
          {personalBudgets.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" />
                Personal Budgets
              </div>
              <div className="space-y-3">
                {personalBudgets.map((budget) => (
                  <BudgetCard
                    key={budget.id}
                    budget={budget}
                    onEdit={() => setEditingBudget(budget)}
                    onDelete={() => handleDelete(budget.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface BudgetCardProps {
  budget: BudgetWithSpending;
  onEdit: () => void;
  onDelete: () => void;
}

function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const percentCapped = Math.min(budget.percentUsed, 100);
  const isOverBudget = budget.percentUsed > 100;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="font-medium">{budget.name}</h3>
            {budget.category && (
              <p className="text-sm text-muted-foreground">{budget.category}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground capitalize">
            {budget.period}
          </span>
          <button
            onClick={onEdit}
            className="text-muted-foreground hover:text-foreground p-1"
            aria-label="Edit budget"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="text-muted-foreground hover:text-destructive p-1"
            aria-label="Delete budget"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-secondary rounded-full overflow-hidden mb-2">
        <div
          className={`h-full ${getProgressColor(budget.percentUsed)} transition-all duration-300`}
          style={{ width: `${percentCapped}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex justify-between text-sm">
        <span className={getProgressTextColor(budget.percentUsed)}>
          {formatCurrency(budget.currentSpending, budget.currency, { compact: true })} spent
        </span>
        <span className="text-muted-foreground">
          {formatCurrency(budget.limitAmount, budget.currency, { compact: true })} limit
        </span>
      </div>

      {isOverBudget && (
        <div className="mt-2 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="h-3 w-3" />
          Over budget by {formatCurrency(budget.currentSpending - parseFloat(budget.limitAmount), budget.currency, { compact: true })}
        </div>
      )}

      {!isOverBudget && budget.remainingAmount > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          {formatCurrency(budget.remainingAmount, budget.currency, { compact: true })} remaining
        </p>
      )}
    </div>
  );
}
