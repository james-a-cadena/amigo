import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Calendar } from "@/components/calendar";
import { getCalendarEvents } from "@/actions/calendar";

// Force dynamic rendering - page queries database
export const dynamic = "force-dynamic";

function getWsUrl(): string {
  return "/ws";
}

export default async function CalendarPage() {
  const session = await getSession();

  if (!session) {
    redirect("/api/auth/login");
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const { events } = await getCalendarEvents(year, month);

  const wsUrl = getWsUrl();

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Calendar</h1>
        <p className="text-muted-foreground">
          View recurring transactions, purchases, and more
        </p>
      </div>

      <Calendar
        initialYear={year}
        initialMonth={month}
        initialEvents={events}
        wsUrl={wsUrl}
      />
    </main>
  );
}
