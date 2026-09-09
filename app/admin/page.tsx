import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { redirect } from "next/navigation";
import { addDays, formatDateLong, formatTime, toDateInputValue } from "@/lib/dates";
import { MAX_ADVANCE_DAYS, MAX_EXPECTED_MEMBERS } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import type { Booking, Profile } from "@/lib/types";

const kindLabel: Record<string, string> = {
  member: "Mitgliedsbuchungen",
  training: "Training",
  match: "Verbandsspiele",
  tournament: "Turniere",
  maintenance: "Wartung",
  blocked: "Sperrzeiten"
};

function dateValue(iso: string): string {
  return iso.slice(0, 10);
}

export default async function AdminDashboard() {
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
  const tomorrow = toDateInputValue(addDays(new Date(`${today}T00:00:00`), 1));
  const end = toDateInputValue(addDays(new Date(`${today}T00:00:00`), MAX_ADVANCE_DAYS + 1));

  const [{ data: profiles }, { data: todayBookings }, { data: upcomingBookings }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, phone, member_number, is_admin, is_approved, approved_at, approved_by, created_at").limit(MAX_EXPECTED_MEMBERS + 75).returns<Profile[]>(),
    supabase
      .from("bookings")
      .select("id, court_id, user_id, created_by, title, kind, starts_at, ends_at, notes, cancelled_at, cancelled_by, cancellation_reason, created_at")
      .gte("starts_at", `${today}T00:00:00`)
      .lt("starts_at", `${tomorrow}T00:00:00`)
      .is("cancelled_at", null)
      .order("starts_at", { ascending: true })
      .returns<Booking[]>(),
    supabase
      .from("bookings")
      .select("id, court_id, user_id, created_by, title, kind, starts_at, ends_at, notes, cancelled_at, cancelled_by, cancellation_reason, created_at")
      .gte("starts_at", `${today}T00:00:00`)
      .lt("starts_at", `${end}T00:00:00`)
      .is("cancelled_at", null)
      .order("starts_at", { ascending: true })
      .limit(500)
      .returns<Booking[]>()
  ]);

  const members = profiles ?? [];
  const pendingMembers = members.filter((profile) => !profile.is_approved && !profile.is_admin).length;
  const approvedMembers = members.filter((profile) => profile.is_approved || profile.is_admin).length;
  const adminCount = members.filter((profile) => profile.is_admin).length;
  const bookings = upcomingBookings ?? [];
  const bookingCount = bookings.filter((booking) => booking.kind === "member").length;
  const blockCount = bookings.filter((booking) => booking.kind !== "member").length;
  const countsByKind = bookings.reduce<Record<string, number>>((acc, booking) => {
    acc[booking.kind] = (acc[booking.kind] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <main className="page">
      <header className="header">
        <div className="brand">
          <h1>Admin-Übersicht</h1>
          <p>Schneller Betriebsüberblick für Platzbuchung, Mitglieder und Sperrzeiten.</p>
        </div>
        <div className="header-actions">
          <Link className="button secondary" href="/">Zur Buchung</Link>
        </div>
      </header>

      <AdminNav />

      <section className="stats-grid">
        <div className="stat-card card"><span>Freigegebene Mitglieder</span><strong>{approvedMembers}</strong></div>
        <div className="stat-card card"><span>Warten auf Freigabe</span><strong>{pendingMembers}</strong></div>
        <div className="stat-card card"><span>Admins</span><strong>{adminCount}</strong></div>
        <div className="stat-card card"><span>Buchungen im Zeitraum</span><strong>{bookingCount}</strong></div>
        <div className="stat-card card"><span>Feste Termine</span><strong>{blockCount}</strong></div>
        <div className="stat-card card"><span>Auslegung</span><strong>{MAX_EXPECTED_MEMBERS}</strong></div>
      </section>

      <section className="dashboard-grid">
        <article className="card quick-card">
          <h2>Wichtige Admin-Wege</h2>
          <div className="quick-links">
            <Link className="button" href="/admin/members?status=pending">Wartende Mitglieder prüfen</Link>
            <Link className="button secondary" href="/admin/bookings">Buchungen verwalten</Link>
            <Link className="button secondary" href="/admin/vorschlaege">Vorschläge lesen</Link>
            <Link className="button secondary" href="/admin/export/bookings">Buchungen exportieren</Link>
            <Link className="button secondary" href="/admin/export/members">Mitglieder exportieren</Link>
          </div>
        </article>

        <article className="card quick-card">
          <h2>Aufteilung nächste {MAX_ADVANCE_DAYS} Tage</h2>
          <div className="kind-list">
            {Object.entries(kindLabel).map(([kind, label]) => (
              <div key={kind}>
                <span>{label}</span>
                <strong>{countsByKind[kind] ?? 0}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="card member-card">
        <div className="section-heading">
          <div>
            <h2>Heute: {formatDateLong(today)}</h2>
            <p>Alle aktiven Buchungen und Sperrzeiten des heutigen Tages.</p>
          </div>
        </div>
        <div className="member-table-wrap">
          <table className="member-table">
            <thead>
              <tr><th>Zeit</th><th>Platz</th><th>Art</th><th>Titel</th><th>Hinweis</th></tr>
            </thead>
            <tbody>
              {(todayBookings ?? []).map((booking) => (
                <tr key={booking.id}>
                  <td data-label="Zeit">{formatTime(booking.starts_at)}–{formatTime(booking.ends_at)}</td>
                  <td data-label="Platz">Platz {booking.court_id}</td>
                  <td data-label="Art"><span className="pill muted">{kindLabel[booking.kind] ?? booking.kind}</span></td>
                  <td data-label="Titel"><strong>{booking.title}</strong></td>
                  <td data-label="Hinweis">{booking.notes ?? "—"}</td>
                </tr>
              ))}
              {(todayBookings ?? []).length === 0 ? <tr><td colSpan={5}>Heute sind keine Buchungen oder Sperrzeiten eingetragen.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
