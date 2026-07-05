import Link from "next/link";
import { redirect } from "next/navigation";
import { bookCourt } from "@/app/actions";
import { MAX_ADVANCE_DAYS } from "@/lib/config";
import { addDays, bookingStartTimes, compareDateValues, formatDateLong, formatTime, getSlotLocal, isValidTimeOption, parseDateParam, parseViewParam, toDateInputValue } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { Booking, Court, Profile } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function backHref(date: string, view: string): string {
  const params = new URLSearchParams({ date, view });
  return `/?${params.toString()}`;
}

function canBookDate(dateValue: string): boolean {
  const today = toDateInputValue();
  const max = toDateInputValue(addDays(new Date(`${today}T00:00:00`), MAX_ADVANCE_DAYS));
  return compareDateValues(dateValue, today) >= 0 && compareDateValues(dateValue, max) <= 0;
}

export default async function ConfirmBookingPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const date = parseDateParam(params.date);
  const view = parseViewParam(params.view);
  const startTime = first(params.startTime);
  const notes = first(params.notes).slice(0, 120);
  const courtId = Number(first(params.courtId));

  if (!Number.isInteger(courtId) || courtId < 1 || courtId > 5 || !isValidTimeOption(startTime, bookingStartTimes())) {
    redirect(`/?date=${encodeURIComponent(date)}&view=${view}&error=${encodeURIComponent("Buchung konnte nicht geprüft werden.")}`);
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, member_number, is_admin, is_approved, approved_at, approved_by, created_at")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile?.is_approved && !profile?.is_admin) redirect("/");

  const { startsAt, endsAt } = getSlotLocal(date, startTime);
  const startsInFuture = new Date(startsAt).getTime() > Date.now();

  const [{ data: court }, { data: conflicts }] = await Promise.all([
    supabase.from("courts").select("id, name, is_active").eq("id", courtId).single<Court>(),
    supabase
      .from("bookings")
      .select("id, court_id, user_id, created_by, title, kind, starts_at, ends_at, notes, cancelled_at, cancelled_by, cancellation_reason, created_at")
      .eq("court_id", courtId)
      .is("cancelled_at", null)
      .lt("starts_at", endsAt)
      .gt("ends_at", startsAt)
      .limit(1)
      .returns<Booking[]>()
  ]);

  const conflict = conflicts?.[0];
  const isBookable = Boolean(court?.is_active && canBookDate(date) && startsInFuture && !conflict);

  return (
    <main className="auth-shell">
      <section className="card confirm-card">
        <p className="eyebrow">Buchung kontrollieren</p>
        <h1>Stimmt alles?</h1>
        <p className="confirm-intro">Bitte kontrollieren Sie Datum, Platz und Uhrzeit. Erst mit dem grünen Button wird der Platz gebucht.</p>

        <dl className="confirm-details">
          <div><dt>Datum</dt><dd>{formatDateLong(date)}</dd></div>
          <div><dt>Platz</dt><dd>{court?.name ?? `Platz ${courtId}`}</dd></div>
          <div><dt>Uhrzeit</dt><dd>{formatTime(startsAt)}–{formatTime(endsAt)}</dd></div>
          <div><dt>Dauer</dt><dd>60 Minuten</dd></div>
          {notes ? <div><dt>Hinweis</dt><dd>{notes}</dd></div> : null}
        </dl>

        {!court?.is_active ? <p className="notice error">Dieser Platz ist aktuell nicht aktiv buchbar.</p> : null}
        {!canBookDate(date) ? <p className="notice error">Dieses Datum liegt außerhalb der Buchungsfrist.</p> : null}
        {!startsInFuture ? <p className="notice error">Vergangene Uhrzeiten können nicht gebucht werden.</p> : null}
        {conflict ? <p className="notice error">Diese Zeit ist bereits belegt durch: {conflict.title}.</p> : null}

        <div className="confirm-actions">
          <Link className="button secondary" href={backHref(date, view)}>Zurück</Link>
          <form action={bookCourt}>
            <input type="hidden" name="date" value={date} />
            <input type="hidden" name="startTime" value={startTime} />
            <input type="hidden" name="courtId" value={courtId} />
            <input type="hidden" name="notes" value={notes} />
            <input type="hidden" name="view" value={view} />
            <button className="large-primary" type="submit" disabled={!isBookable}>Jetzt Platz buchen</button>
          </form>
        </div>
      </section>
    </main>
  );
}
