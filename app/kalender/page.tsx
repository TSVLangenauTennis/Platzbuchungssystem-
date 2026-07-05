import Link from "next/link";
import { redirect } from "next/navigation";
import { BookingBoard } from "@/components/BookingBoard";
import {
  addDays,
  formatDateLong,
  getRangeForView,
  parseDateParam,
  parseViewParam,
  startOfWeekMonday,
  toDateInputValue
} from "@/lib/dates";
import { MAX_ADVANCE_DAYS } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import type { Booking, Court, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CalendarPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const date = parseDateParam(params.date);
  const view = parseViewParam(params.view);
  const { startsOn, endsBefore } = getRangeForView(date, view);

  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, member_number, is_admin, is_approved, approved_at, approved_by, created_at")
    .eq("id", user.id)
    .single<Profile>();

  const [{ data: approvedViaRpc }, { data: adminViaRpc }] = await Promise.all([
    supabase.rpc("is_approved_member"),
    supabase.rpc("is_admin")
  ]);

  const isAdmin = Boolean(profile?.is_admin || adminViaRpc);
  const isApproved = Boolean(profile?.is_approved || profile?.is_admin || approvedViaRpc || adminViaRpc);

  if (!isApproved) {
    redirect("/");
  }

  const today = toDateInputValue();
  const currentDate = new Date(`${date}T00:00:00`);
  const previousDate = toDateInputValue(addDays(currentDate, view === "week" ? -7 : -1));
  const nextDate = toDateInputValue(addDays(currentDate, view === "week" ? 7 : 1));
  const maxDate = toDateInputValue(addDays(new Date(`${today}T00:00:00`), MAX_ADVANCE_DAYS));

  const [{ data: courts }, { data: bookings }] = await Promise.all([
    supabase
      .from("courts")
      .select("id, name, is_active")
      .eq("is_active", true)
      .order("id", { ascending: true })
      .returns<Court[]>(),

    supabase
      .from("bookings")
      .select("id, court_id, user_id, created_by, title, kind, starts_at, ends_at, notes, cancelled_at, cancelled_by, cancellation_reason, created_at")
      .gte("starts_at", `${startsOn}T00:00:00`)
      .lt("starts_at", `${endsBefore}T00:00:00`)
      .is("cancelled_at", null)
      .order("starts_at", { ascending: true })
      .returns<Booking[]>()
  ]);

  return (
    <main className="page calendar-only-page">
      <section className="card calendar-only-header">
        <div>
          <p className="eyebrow">Kalender</p>
          <h1>{view === "week" ? "Wochenübersicht" : formatDateLong(date)}</h1>
          <p>Hier sehen Sie freie und belegte Zeiten. Freie Felder können direkt gebucht werden.</p>
        </div>

        <Link className="button secondary" href={`/?date=${date}&view=${view}`}>
          Zurück zur Buchung
        </Link>
      </section>

      <section className="calendar-control card">
        <div className="calendar-control-actions">
          <Link className="button secondary" href={`/kalender?date=${previousDate}&view=${view}`}>
            {view === "week" ? "Vorwoche" : "Vorheriger Tag"}
          </Link>

          <Link className="button secondary" href={`/kalender?date=${today}&view=${view}`}>
            Heute
          </Link>

          <Link className="button secondary" href={`/kalender?date=${nextDate}&view=${view}`}>
            {view === "week" ? "Nächste Woche" : "Nächster Tag"}
          </Link>

          <Link className={view === "day" ? "button" : "button secondary"} href={`/kalender?date=${date}&view=day`}>
            Tagesansicht
          </Link>

          <Link className={view === "week" ? "button" : "button secondary"} href={`/kalender?date=${startOfWeekMonday(date)}&view=week`}>
            Wochenansicht
          </Link>
        </div>

        <form className="calendar-date-form">
          <label>
            <span>Datum direkt wählen</span>
            <input type="date" name="date" defaultValue={date} min={today} max={maxDate} />
          </label>

          <input type="hidden" name="view" value={view} />

          <button type="submit">Anzeigen</button>
        </form>
      </section>

      <div className="mobile-calendar-wrap">
        <BookingBoard
          date={date}
          view={view}
          courts={courts ?? []}
          bookings={bookings ?? []}
          currentUserId={user.id}
          isAdmin={isAdmin}
        />
      </div>
    </main>
  );
}
