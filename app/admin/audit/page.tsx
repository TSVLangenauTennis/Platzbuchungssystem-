import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AuditLog, Profile } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const actionLabel: Record<string, string> = {
  "member.registered": "Registrierung",
  "member.approved": "Mitglied freigegeben",
  "member.blocked": "Mitglied gesperrt",
  "member.admin_granted": "Adminrecht vergeben",
  "member.admin_removed": "Adminrecht entzogen",
  "booking.created": "Buchung erstellt",
  "booking.cancelled": "Buchung storniert",
  "admin_block.created": "Fester Termin erstellt",
  "admin_block.cancelled": "Fester Termin gelöscht"
};

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function metadataSummary(metadata: Record<string, unknown> | null): string {
  if (!metadata) return "—";
  const parts = [
    metadata.title ? String(metadata.title) : null,
    metadata.kind ? String(metadata.kind) : null,
    metadata.court_id ? `Platz ${metadata.court_id}` : null,
    metadata.starts_at ? String(metadata.starts_at).slice(0, 16).replace("T", " ") : null,
    metadata.email ? String(metadata.email) : null,
    metadata.reason ? String(metadata.reason) : null
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
}

export default async function AuditPage({ searchParams }: { searchParams: SearchParams }) {
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

  const q = typeof params.action === "string" ? params.action.trim() : "";
  let query = supabase
    .from("audit_logs")
    .select("id, actor_id, action, entity_type, entity_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(120);

  if (q) query = query.eq("action", q);

  const { data: logs } = await query.returns<AuditLog[]>();

  return (
    <main className="page">
      <header className="header">
        <div className="brand">
          <h1>Admin-Protokoll</h1>
          <p>Nachvollziehbarkeit für Buchungen, Stornierungen, Freigaben und Adminrechte.</p>
        </div>
        <div className="header-actions">
          <Link className="button secondary" href="/admin">Admin-Übersicht</Link>
          <Link className="button secondary" href="/">Zur Buchung</Link>
          <Link className="button secondary" href="/admin/members">Mitglieder</Link>
          <Link className="button secondary" href="/admin/bookings">Buchungen</Link>
          <Link className="button secondary" href="/admin/courts">Plätze</Link>
        </div>
      </header>

      <AdminNav />

      <section className="card filter-card">
        <form className="filter-form">
          <label>
            Aktion
            <select name="action" defaultValue={q}>
              <option value="">Alle Aktionen</option>
              {Object.entries(actionLabel).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <button type="submit">Filtern</button>
          <Link className="button secondary" href="/admin/audit">Zurücksetzen</Link>
        </form>
      </section>

      <section className="card member-card">
        <div className="member-table-wrap">
          <table className="member-table">
            <thead>
              <tr>
                <th>Zeitpunkt</th>
                <th>Aktion</th>
                <th>Objekt</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {(logs ?? []).map((log) => (
                <tr key={log.id}>
                  <td>{formatDateTime(log.created_at)}</td>
                  <td><span className="pill muted">{actionLabel[log.action] ?? log.action}</span></td>
                  <td>{log.entity_type}</td>
                  <td>{metadataSummary(log.metadata)}</td>
                </tr>
              ))}
              {(logs ?? []).length === 0 ? <tr><td colSpan={4}>Keine Protokolleinträge gefunden.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
