"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/budget/budgets", label: "Budgets" },
  { href: "/budget/transactions", label: "Transactions" },
  { href: "/budget/recurring", label: "Recurring Rules" },
];

export default function BudgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Budget</h1>
        <p className="text-muted-foreground">
          Track your spending for{" "}
          {new Date().toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b">
        <nav className="flex gap-1" aria-label="Budget sections">
          {tabs.map((tab) => {
            const isActive =
              pathname === tab.href ||
              (tab.href === "/budget/budgets" && pathname === "/budget");
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {children}
    </main>
  );
}
