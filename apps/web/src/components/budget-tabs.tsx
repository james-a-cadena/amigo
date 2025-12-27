"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@amigo/ui";
import { BudgetCharts } from "@/components/budget-charts";
import { TransactionList } from "@/components/transaction-list";
import { RecurringList } from "@/components/recurring-list";
import type { BudgetAnalytics } from "@amigo/db";

interface BudgetTabsProps {
  analytics: BudgetAnalytics;
}

export function BudgetTabs({ analytics }: BudgetTabsProps) {
  return (
    <Tabs defaultValue="transactions" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="transactions">Transactions</TabsTrigger>
        <TabsTrigger value="recurring">Recurring Rules</TabsTrigger>
      </TabsList>

      <TabsContent value="transactions">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Charts Section */}
          <BudgetCharts
            totalSpending={analytics.totalSpending}
            categoryData={analytics.categoryData}
            monthlyComparison={analytics.monthlyComparison}
          />

          {/* Transaction List Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Recent Transactions</h2>
            <TransactionList />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="recurring">
        <div className="max-w-2xl">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Recurring Rules</h2>
            <p className="text-sm text-muted-foreground">
              Set up automatic transactions that repeat on a schedule.
            </p>
          </div>
          <RecurringList />
        </div>
      </TabsContent>
    </Tabs>
  );
}
