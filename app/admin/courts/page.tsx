import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { updateCourtSettings } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import type { Booking, Court, Profile } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function nowLocalIso(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:00`;
}

export default async function CourtsPage({ searchParams }: { searchParams: SearchParams }) {
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

  const [{ data: courts }, { data: futureBookings }] = await Promise.all([
    supabase.from("courts").select("id, name, is_active").order("id", { ascending: true }).returns<Court[]>(),
    supabase
      .from("bookings")
      .select("id, court_id, user_id, created_by, title, kind, starts_at, ends_at, notes, cancelled_at, cancelled_by, cancellation_reason, created_at")
      .gte("starts_at", nowLocalIso())
      .is("cancelled_at", null)
      .order("starts_at", { ascending: true })
      .returns<Booking[]>()
  ]);

  const success = typeof params.success === "string" ? params.success : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;
  const bookingsByCourt = new Map<number, number>();
  (futureBookings ?? []).forEach((booking) => bookingsByCourt.set(booking.court_id, (bookingsByCourt.get(booking.court_id) ?? 0) + 1));

  return (
    <main className="page">
      <header className="header">
        <div className="brand">
          <h1>Admin: Plätze</h1>
          <p>Platznamen und aktive Buchbarkeit verwalten. Für Wartung besser Sperrzeiten nutzen; Deaktivieren ist für längere Ausfälle gedacht.</p>
        </div>
        <div className="header-actions">
          <Link className="button secondary" href="/">Zur Buchung</Link>
        </div>
      </header>

      <AdminNav />

      {success ? <p className="notice success">{success}</p> : null}
      {error ? <p className="notice error">{error}</p> : null}

      <section className="court-grid">
        {(courts ?? []).map((court) => (
          <article className="card court-card" key={court.id}>
            <div className="court-card-head">
              <span className={court.is_active ? "pill approved" : "pill pending"}>{court.is_active ? "Aktiv" : "Deaktiviert"}</span>
              <small>{bookingsByCourt.get(court.id) ?? 0} kommende aktive Einträge</small>
            </div>
            <form action={updateCourtSettings} className="form-stack">
              <input type="hidden" name="courtId" value={court.id} />
              <label>
                Platzname
                <input name="name" defaultValue={court.name} required minLength={2} maxLength={40} />
              </label>
              <label className="switch-row">
                <input type="checkbox" name="isActive" defaultChecked={court.is_active} />
                <span>Für Mitglieder buchbar</span>
              </label>
              <button type="submit">Platz speichern</button>
            </form>
          </article>
        ))}
      </section>

      <section className="card info-card">
        <strong>Hinweis zur sicheren Platzverwaltung</strong>
        <p>
          Ein Platz kann nicht deaktiviert werden, solange kommende Mitgliedsbuchungen darauf liegen. Für einzelne Trainingseinheiten,
          Pflege oder Turniere verwenden Sie weiter feste Termine/Sperrzeiten auf der Buchungsseite.
        </p>
      </section>
    </main>
  );
}
