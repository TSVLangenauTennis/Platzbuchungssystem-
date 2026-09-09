import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { redirect } from "next/navigation";
import { cancelBookingAsAdmin } from "@/app/actions";
import { addDays, formatDateLong, formatTime, toDateInputValue } from "@/lib/dates";
import { ADMIN_BOOKING_EXPORT_LIMIT, MAX_ADVANCE_DAYS } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import type { Booking, BookingKind, Court, Profile } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const kindLabel: Record<string, string> = {
  member: "Mitglied",
  training: "Training",
  match: "Verbandsspiel",
  tournament: "Turnier",
  maintenance: "Wartung",
  blocked: "Gesperrt"
};

function dateValue(iso: string): string {
  return iso.slice(0, 10);
}

function parseDate(value: string | string[] | undefined, fallback: string): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : fallback;
}

function parseKind(value: string | string[] | undefined): BookingKind | "all" {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "member" || raw === "training" || raw === "match" || raw === "tournament" || raw === "maintenance" || raw === "blocked" ? raw : "all";
}

function matchesSearch(booking: Booking, query: string): boolean {
  if (!query) return true;
  const haystack = [booking.title, booking.notes, booking.kind, `Platz ${booking.court_id}`].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export default async function AdminBookingsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, member_number, is_admin, is_approved, approved_at, approved_by, created_at")
    .eq("id", user.id)
    .single<Profile>();

  if (!currentProfile?.is_admin) redirect("/");

  const today = toDateInputValue();
  const defaultEnd = toDateInputValue(addDays(new Date(`${today}T00:00:00`), MAX_ADVANCE_DAYS + 1));
  const from = parseDate(params.from, today);
  const to = parseDate(params.to, defaultEnd);
  const kind = parseKind(params.kind);
  const q = typeof params.q === "string" ? params.q.trim() : "";

  let bookingQuery = supabase
    .from("bookings")
    .select("id, court_id, user_id, created_by, title, kind, starts_at, ends_at, notes, cancelled_at, cancelled_by, cancellation_reason, created_at")
    .gte("starts_at", `${from}T00:00:00`)
    .lt("starts_at", `${to}T00:00:00`)
    .is("cancelled_at", null)
    .order("starts_at", { ascending: true })
    .limit(ADMIN_BOOKING_EXPORT_LIMIT);

  if (kind !== "all") bookingQuery = bookingQuery.eq("kind", kind);

  const [{ data: courts }, { data: bookings }] = await Promise.all([
    supabase.from("courts").select("id, name, is_active").order("id", { ascending: true }).returns<Court[]>(),
    bookingQuery.returns<Booking[]>()
  ]);

  const filteredBookings = (bookings ?? []).filter((booking) => matchesSearch(booking, q));
  const byCourt = new Map((courts ?? []).map((court) => [court.id, court.name]));
  const success = typeof params.success === "string" ? params.success : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;

  const exportParams = new URLSearchParams({ from, to });
  if (kind !== "all") exportParams.set("kind", kind);

  return (
    <main className="page">
      <header className="header">
        <div className="brand">
          <h1>Admin: Buchungen</h1>
          <p>Aktive Buchungen und feste Termine filtern, prüfen und löschen.</p>
        </div>
        <div className="header-actions">
          <Link className="button secondary" href="/">Zur Buchung</Link>
          <Link className="button secondary" href={`/admin/export/bookings?${exportParams.toString()}`}>CSV-Export</Link>
        </div>
      </header>

      <AdminNav />

      {success ? <p className="notice success">{success}</p> : null}
      {error ? <p className="notice error">{error}</p> : null}

      <section className="stats-grid">
        <div className="stat-card card"><span>Gefunden</span><strong>{filteredBookings.length}</strong></div>
        <div className="stat-card card"><span>Mitgliedsbuchungen</span><strong>{filteredBookings.filter((b) => b.kind === "member").length}</strong></div>
        <div className="stat-card card"><span>Feste Termine</span><strong>{filteredBookings.filter((b) => b.kind !== "member").length}</strong></div>
      </section>

      <section className="card filter-card">
        <form className="filter-form">
          <label>
            Von
            <input name="from" type="date" defaultValue={from} />
          </label>
          <label>
            Bis
            <input name="to" type="date" defaultValue={to} />
          </label>
          <label>
            Art
            <select name="kind" defaultValue={kind}>
              <option value="all">Alle</option>
              {Object.entries(kindLabel).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label>
            Suche
            <input name="q" defaultValue={q} placeholder="Titel, Hinweis, Platz" />
          </label>
          <button type="submit">Filtern</button>
          <Link className="button secondary" href="/admin/bookings">Zurücksetzen</Link>
        </form>
      </section>

      <section className="card member-card">
        <div className="member-table-wrap">
          <table className="member-table">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Zeit</th>
                <th>Platz</th>
                <th>Art</th>
                <th>Titel</th>
                <th>Hinweis</th>
                <th>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id}>
                  <td data-label="Datum">{formatDateLong(dateValue(booking.starts_at))}</td>
                  <td data-label="Zeit">{formatTime(booking.starts_at)}–{formatTime(booking.ends_at)}</td>
                  <td data-label="Platz">{byCourt.get(booking.court_id) ?? `Platz ${booking.court_id}`}</td>
                  <td data-label="Art"><span className="pill muted">{kindLabel[booking.kind] ?? booking.kind}</span></td>
                  <td data-label="Titel"><strong>{booking.title}</strong></td>
                  <td data-label="Hinweis">{booking.notes ?? "—"}</td>
                  <td data-label="Aktion">
                    <form action={cancelBookingAsAdmin}>
                      <input type="hidden" name="id" value={booking.id} />
                      <button className="danger small-button" type="submit">Löschen</button>
                    </form>
                  </td>
                </tr>
              ))}
              {filteredBookings.length === 0 ? <tr><td colSpan={7}>Keine Buchungen passend zum Filter gefunden.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
