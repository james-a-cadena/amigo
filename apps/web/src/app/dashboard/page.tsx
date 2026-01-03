import { db, eq, and, isNull, gte, sql } from "@amigo/db";
import { transactions, groceryItems, debts, assets } from "@amigo/db/schema";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Wallet,
  ShoppingCart,
  CreditCard,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  PiggyBank,
  Scale,
} from "lucide-react";

// Force dynamic rendering - page queries database
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/api/auth/login");
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Fetch all dashboard data in parallel
  const [
    monthlySpendingResult,
    monthlyIncomeResult,
    groceryStats,
    debtStats,
    assetStats,
  ] = await Promise.all([
    // Total spending this month (user-specific)
    db
      .select({
        total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.householdId, session.householdId),
          eq(transactions.userId, session.userId),
          eq(transactions.type, "expense"),
          isNull(transactions.deletedAt),
          gte(transactions.date, startOfMonth)
        )
      ),
    // Total income this month (user-specific)
    db
      .select({
        total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.householdId, session.householdId),
          eq(transactions.userId, session.userId),
          eq(transactions.type, "income"),
          isNull(transactions.deletedAt),
          gte(transactions.date, startOfMonth)
        )
      ),
    // Grocery items stats
    db
      .select({
        total: sql<string>`COUNT(*)`,
        pending: sql<string>`COUNT(*) FILTER (WHERE ${groceryItems.isPurchased} = false)`,
      })
      .from(groceryItems)
      .where(
        and(
          eq(groceryItems.householdId, session.householdId),
          isNull(groceryItems.deletedAt)
        )
      ),
    // Debt stats (user-specific for privacy)
    db
      .select({
        totalDebt: sql<string>`COALESCE(SUM(CASE WHEN ${debts.type} = 'LOAN' THEN ${debts.balanceInitial} - ${debts.balanceCurrent} ELSE 0 END), 0)`,
        totalCreditUsed: sql<string>`COALESCE(SUM(CASE WHEN ${debts.type} = 'CREDIT_CARD' THEN ${debts.balanceInitial} - ${debts.balanceCurrent} ELSE 0 END), 0)`,
        count: sql<string>`COUNT(*)`,
      })
      .from(debts)
      .where(
        and(
          eq(debts.userId, session.userId),
          isNull(debts.deletedAt)
        )
      ),
    // Asset stats (user-specific for privacy)
    db
      .select({
        total: sql<string>`COALESCE(SUM(${assets.balance}), 0)`,
        count: sql<string>`COUNT(*)`,
      })
      .from(assets)
      .where(
        and(
          eq(assets.userId, session.userId),
          isNull(assets.deletedAt)
        )
      ),
  ]);

  const monthlySpending = parseFloat(monthlySpendingResult[0]?.total ?? "0");
  const monthlyIncome = parseFloat(monthlyIncomeResult[0]?.total ?? "0");
  const netCashFlow = monthlyIncome - monthlySpending;
  const pendingGroceries = parseInt(groceryStats[0]?.pending ?? "0", 10);
  const totalDebt = parseFloat(debtStats[0]?.totalDebt ?? "0");
  const creditUsed = parseFloat(debtStats[0]?.totalCreditUsed ?? "0");
  const debtCount = parseInt(debtStats[0]?.count ?? "0", 10);
  const totalAssets = parseFloat(assetStats[0]?.total ?? "0");
  const assetCount = parseInt(assetStats[0]?.count ?? "0", 10);
  const totalLiabilities = totalDebt + creditUsed;
  const netWorth = totalAssets - totalLiabilities;

  const monthName = now.toLocaleDateString("en-US", { month: "long" });

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s your personal overview for {monthName}.
        </p>
      </div>

      {/* Net Worth Card - Full Width */}
      <div className="mb-6 rounded-lg border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
            <Scale className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">My Net Worth</p>
            <p
              className={`text-3xl font-bold ${
                netWorth >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-destructive"
              }`}
            >
              {netWorth < 0 ? "-" : ""}${Math.abs(netWorth).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <Link href="/assets" className="group">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Assets</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <p className="text-xl font-semibold text-green-600 dark:text-green-400">
              ${totalAssets.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">
              {assetCount} account{assetCount !== 1 ? "s" : ""}
            </p>
          </Link>
          <Link href="/debts" className="group">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Liabilities</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <p className="text-xl font-semibold text-red-600 dark:text-red-400">
              ${totalLiabilities.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">
              {debtCount} account{debtCount !== 1 ? "s" : ""}
            </p>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Budget Overview Card */}
        <Link
          href="/budget"
          className="group block rounded-lg border bg-card p-6 shadow-sm transition-colors hover:border-primary hover:bg-accent/50"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">Budget</h2>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Spending</span>
              <div className="flex items-center gap-1 text-destructive">
                <TrendingDown className="h-4 w-4" />
                <span className="font-medium">
                  ${monthlySpending.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Income</span>
              <div className="flex items-center gap-1 text-green-600 dark:text-green-500">
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">
                  ${monthlyIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="border-t pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Net Cash Flow</span>
                <span
                  className={`font-semibold ${
                    netCashFlow >= 0
                      ? "text-green-600 dark:text-green-500"
                      : "text-destructive"
                  }`}
                >
                  {netCashFlow >= 0 ? "+" : ""}$
                  {Math.abs(netCashFlow).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* Assets Card */}
        <Link
          href="/assets"
          className="group block rounded-lg border bg-card p-6 shadow-sm transition-colors hover:border-primary hover:bg-accent/50"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <PiggyBank className="h-5 w-5 text-green-500" />
              </div>
              <h2 className="text-lg font-semibold">Assets</h2>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
          <div className="space-y-2">
            {assetCount > 0 ? (
              <>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${totalAssets.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-muted-foreground">
                  across {assetCount} account{assetCount !== 1 ? "s" : ""}
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold">No assets</p>
                <p className="text-sm text-muted-foreground">
                  Add bank accounts or investments
                </p>
              </>
            )}
          </div>
        </Link>

        {/* Debts Card */}
        <Link
          href="/debts"
          className="group block rounded-lg border bg-card p-6 shadow-sm transition-colors hover:border-primary hover:bg-accent/50"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                <CreditCard className="h-5 w-5 text-violet-500" />
              </div>
              <h2 className="text-lg font-semibold">Debts</h2>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
          <div className="space-y-2">
            {debtCount > 0 ? (
              <>
                <p className="text-2xl font-bold">
                  ${totalLiabilities.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-muted-foreground">
                  total outstanding across {debtCount} account{debtCount !== 1 ? "s" : ""}
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold">No debts</p>
                <p className="text-sm text-muted-foreground">
                  Add loans or credit cards to track
                </p>
              </>
            )}
          </div>
        </Link>

        {/* Groceries Card */}
        <Link
          href="/groceries"
          className="group block rounded-lg border bg-card p-6 shadow-sm transition-colors hover:border-primary hover:bg-accent/50"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                <ShoppingCart className="h-5 w-5 text-orange-500" />
              </div>
              <h2 className="text-lg font-semibold">Groceries</h2>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
          <div className="space-y-2">
            {pendingGroceries > 0 ? (
              <>
                <p className="text-2xl font-bold">{pendingGroceries}</p>
                <p className="text-sm text-muted-foreground">
                  item{pendingGroceries !== 1 ? "s" : ""} on your shopping list
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold">All done!</p>
                <p className="text-sm text-muted-foreground">
                  Your shopping list is empty
                </p>
              </>
            )}
          </div>
        </Link>
      </div>
    </main>
  );
}
