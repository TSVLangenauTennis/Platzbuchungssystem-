import Link from "next/link";
import { redirect } from "next/navigation";
import { BookingBoard } from "@/components/BookingBoard";
import { MobileCalendarList } from "@/components/MobileCalendarList";
import {
  addDays,
  formatDateLong,
  getRangeForView,
  parseDateParam,
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

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function shortWeekday(date: string) {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short"
  }).format(new Date(`${date}T00:00:00`)).replace(".", "");
}

function shortDate(date: string) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit"
  }).format(new Date(`${date}T00:00:00`));
}

function calendarHref(date: string, courtId?: number) {
  const params = new URLSearchParams({
    date,
    view: "week"
  });

  if (courtId) {
    params.set("court", String(courtId));
  }

  return `/kalender?${params.toString()}`;
}

export default async function CalendarPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const date = parseDateParam(params.date);
  const view = "week" as const;
  const selectedCourtRaw = Number.parseInt(first(params.court), 10);
  const selectedCourtId = Number.isFinite(selectedCourtRaw) ? selectedCourtRaw : undefined;

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
  const maxDate = toDateInputValue(addDays(new Date(`${today}T00:00:00`), MAX_ADVANCE_DAYS));
  const weekStart = startOfWeekMonday(date);
  const weekStartDate = new Date(`${weekStart}T00:00:00`);
  const previousWeek = toDateInputValue(addDays(weekStartDate, -7));
  const nextWeek = toDateInputValue(addDays(weekStartDate, 7));

  const weekDays = Array.from({ length: 7 }, (_, index) =>
    toDateInputValue(addDays(weekStartDate, index))
  );

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
      <section className="calendar-mobile-header card">
        <Link className="calendar-back-danger" href="/">
          ← Zurück zur Buchung
        </Link>

        <div>
          <p className="eyebrow">Kalender</p>
          <h1>{formatDateLong(date)}</h1>
          <p>Wählen Sie einen Tag,anschließend einen Platz und dann eine freie Uhrzeit.</p>
        </div>
      </section>

      <section className="calendar-mobile-controls card">
        <div className="calendar-week-status">
          <span>Wochenansicht</span>
          <strong>{shortDate(weekDays[0])} – {shortDate(weekDays[6])}</strong>
        </div>

        <div className="calendar-week-buttons">
          <Link className="button secondary" href={calendarHref(previousWeek, selectedCourtId)}>
            ← Vorwoche
          </Link>

          <Link className="button" href={calendarHref(today, selectedCourtId)}>
            Heute
          </Link>

          <Link className="button secondary" href={calendarHref(nextWeek, selectedCourtId)}>
            Nächste Woche →
          </Link>
        </div>

        <div className="calendar-day-strip" aria-label="Tage dieser Woche">
          {weekDays.map((day) => (
            <Link
              key={day}
              className={day === date ? "calendar-day-pill active" : "calendar-day-pill"}
              href={calendarHref(day, selectedCourtId)}
              aria-current={day === date ? "page" : undefined}
            >
              <strong>{shortWeekday(day)}</strong>
              <span>{shortDate(day)}</span>
            </Link>
          ))}
        </div>

        <details className="calendar-date-details">
          <summary>Anderes Datum wählen</summary>

          <form className="calendar-date-form" action="/kalender">
            <label>
              <span>Datum</span>
              <input type="date" name="date" defaultValue={date} min={today} max={maxDate} />
            </label>

            <input type="hidden" name="view" value="week" />

            {selectedCourtId ? (
              <input type="hidden" name="court" value={selectedCourtId} />
            ) : null}

            <button type="submit">Anzeigen</button>
          </form>
        </details>
      </section>

      <div className="mobile-calendar-list">
        <MobileCalendarList
          date={date}
          courts={courts ?? []}
          bookings={bookings ?? []}
          currentUserId={user.id}
          selectedCourtId={selectedCourtId}
        />
      </div>

      <div className="desktop-calendar-table mobile-calendar-wrap">
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
