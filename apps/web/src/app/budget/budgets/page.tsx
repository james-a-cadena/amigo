import { BudgetList } from "@/components/budget-list";

// Force dynamic rendering - page queries database
export const dynamic = "force-dynamic";

export default function BudgetsPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Spending Budgets</h2>
        <p className="text-sm text-muted-foreground">
          Set spending limits and track your progress. Link transactions to
          budgets to monitor your spending.
        </p>
      </div>
      <BudgetList />
    </div>
  );
}
