import { redirect } from "next/navigation";

// Redirect /budget to /budget/budgets
export default function BudgetPage() {
  redirect("/budget/budgets");
}
