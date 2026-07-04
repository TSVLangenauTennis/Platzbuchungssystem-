import Link from "next/link";
import { redirect } from "next/navigation";
import { cancelBooking } from "@/app/actions";
import { formatDateLong, formatTime, parseDateParam, parseViewParam } from "@/lib/dates";
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

function dateValue(iso: string): string {
  return iso.slice(0, 10);
}

export default async function ConfirmCancelPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const id = first(params.id);
  const date = parseDateParam(params.date);
  const view = parseViewParam(params.view);
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect(backHref(date, view));

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

 const [{ data: profile }, { data: booking }, { data: approvedViaRpc }, { data: adminViaRpc }] = await Promise.all([
  supabase
    .from("profiles")
    .select("id, full_name, email, phone, member_number, is_admin, is_approved, approved_at, approved_by, created_at")
    .eq("id", user.id)
    .single<Profile>(),

  supabase
    .from("bookings")
    .select("id, court_id, user_id, created_by, title, kind, starts_at, ends_at, notes, cancelled_at, cancelled_by, cancellation_reason, created_at")
    .eq("id", id)
    .single<Booking>(),

  supabase.rpc("is_approved_member"),
  supabase.rpc("is_admin")
]);

  if (!booking || booking.cancelled_at) redirect(backHref(date, view));

  const { data: court } = await supabase.from("courts").select("id, name, is_active").eq("id", booking.court_id).single<Court>();
  const isAdmin = Boolean(profile?.is_admin || adminViaRpc);
const isApproved = Boolean(profile?.is_approved || profile?.is_admin || approvedViaRpc || adminViaRpc);
  const ownsMemberBooking = booking.kind === "member" && booking.user_id === user.id;
  const isFutureBooking = new Date(booking.starts_at).getTime() > Date.now();
const canCancel = isAdmin || (isApproved && ownsMemberBooking && isFutureBooking);
  const bookingDate = dateValue(booking.starts_at);

  return (
    <main className="auth-shell">
      <section className="card confirm-card">
        <p className="eyebrow">Stornierung prüfen</p>
        <h1>Buchung wirklich stornieren?</h1>
        <p className="confirm-intro">Bitte prüfen Sie die Angaben. Erst der rote Button storniert die Buchung.</p>

        <dl className="confirm-details">
          <div><dt>Datum</dt><dd>{formatDateLong(bookingDate)}</dd></div>
          <div><dt>Platz</dt><dd>{court?.name ?? `Platz ${booking.court_id}`}</dd></div>
          <div><dt>Uhrzeit</dt><dd>{formatTime(booking.starts_at)}–{formatTime(booking.ends_at)}</dd></div>
          <div><dt>Name</dt><dd>{booking.title}</dd></div>
          {booking.notes ? <div><dt>Hinweis</dt><dd>{booking.notes}</dd></div> : null}
        </dl>

        {!canCancel ? <p className="notice error">Diese Buchung können Sie nicht stornieren.</p> : null}

        <div className="confirm-actions">
          <Link className="button secondary" href={backHref(bookingDate, view)}>Nein, behalten</Link>
          <form action={cancelBooking}>
            <input type="hidden" name="id" value={booking.id} />
            <input type="hidden" name="date" value={bookingDate} />
            <input type="hidden" name="view" value={view} />
            <button className="danger large-danger" type="submit" disabled={!canCancel}>Ja, stornieren</button>
          </form>
        </div>
      </section>
    </main>
  );
}
