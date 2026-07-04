import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { redirect } from "next/navigation";
import { approveAllPendingMembers, approveMember, grantAdmin, removeAdmin, revokeMemberApproval } from "@/app/actions";
import { MAX_EXPECTED_MEMBERS, MEMBER_LIST_LIMIT } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import type { MemberFilter, Profile } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function StatusPill({ profile }: { profile: Profile }) {
  if (profile.is_admin) return <span className="pill admin">Admin</span>;
  if (profile.is_approved) return <span className="pill approved">Freigegeben</span>;
  return <span className="pill pending">Wartet</span>;
}

function parseStatus(value: string | string[] | undefined): MemberFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "pending" || raw === "approved" || raw === "admin" ? raw : "all";
}

function matchesSearch(profile: Profile, query: string): boolean {
  if (!query) return true;
  const haystack = [profile.full_name, profile.email, profile.phone, profile.member_number].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function matchesStatus(profile: Profile, status: MemberFilter): boolean {
  if (status === "all") return true;
  if (status === "pending") return !profile.is_approved && !profile.is_admin;
  if (status === "approved") return profile.is_approved && !profile.is_admin;
  return profile.is_admin;
}

export default async function MembersPage({ searchParams }: { searchParams: SearchParams }) {
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

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, member_number, is_admin, is_approved, approved_at, approved_by, created_at")
    .order("is_approved", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(MEMBER_LIST_LIMIT)
    .returns<Profile[]>();

  const list = profiles ?? [];
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const status = parseStatus(params.status);
  const visibleList = list.filter((profile) => matchesSearch(profile, q) && matchesStatus(profile, status));

  const success = typeof params.success === "string" ? params.success : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;
  const pendingCount = list.filter((profile) => !profile.is_approved && !profile.is_admin).length;
  const approvedCount = list.filter((profile) => profile.is_approved || profile.is_admin).length;
  const adminCount = list.filter((profile) => profile.is_admin).length;

  return (
    <main className="page">
      <header className="header">
        <div className="brand">
          <h1>Mitgliederverwaltung</h1>
          <p>{approvedCount} freigegeben · {pendingCount} wartend · {adminCount} Admins · Auslegung: {MAX_EXPECTED_MEMBERS} Mitglieder.</p>
        </div>
        <div className="header-actions">
          <Link className="button secondary" href="/admin">Admin-Übersicht</Link>
          <Link className="button secondary" href="/">Zur Buchung</Link>
          <Link className="button secondary" href="/admin/bookings">Buchungen</Link>
          <Link className="button secondary" href="/admin/courts">Plätze</Link>
          <Link className="button secondary" href="/admin/audit">Protokoll</Link>
          <Link className="button secondary" href="/admin/export/members">Mitglieder-CSV</Link>
        </div>
      </header>

      <AdminNav />

      {success ? <p className="notice success">{success}</p> : null}
      {error ? <p className="notice error">{error}</p> : null}

      <section className="stats-grid">
        <div className="stat-card card"><span>Wartend</span><strong>{pendingCount}</strong></div>
        <div className="stat-card card"><span>Freigegeben</span><strong>{approvedCount}</strong></div>
        <div className="stat-card card"><span>Admins</span><strong>{adminCount}</strong></div>
        <div className="stat-card card"><span>Angezeigt</span><strong>{visibleList.length}</strong></div>
      </section>

      <section className="card filter-card">
        <form className="filter-form">
          <label>
            Suche
            <input name="q" defaultValue={q} placeholder="Name, E-Mail, Telefon, Mitgliedsnummer" />
          </label>
          <label>
            Status
            <select name="status" defaultValue={status}>
              <option value="all">Alle</option>
              <option value="pending">Wartend</option>
              <option value="approved">Freigegeben</option>
              <option value="admin">Admins</option>
            </select>
          </label>
          <button type="submit">Filtern</button>
          <Link className="button secondary" href="/admin/members">Zurücksetzen</Link>
        </form>
      </section>

      {pendingCount > 0 ? (
        <section className="card admin-action-card">
          <div>
            <strong>{pendingCount} Konto/Konten warten auf Freigabe</strong>
            <p>Vor Freigabe bitte Namen/E-Mail mit der Mitgliederliste abgleichen. Die Sammelfreigabe eignet sich nur, wenn die Registrierungen vorher geprüft wurden.</p>
          </div>
          <form action={approveAllPendingMembers}>
            <button type="submit">Alle wartenden freigeben</button>
          </form>
        </section>
      ) : null}

      <section className="card member-card">
        <div className="member-table-wrap">
          <table className="member-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Kontakt</th>
                <th>Status</th>
                <th>Registriert</th>
                <th>Freigegeben</th>
                <th>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {visibleList.map((profile) => (
                <tr key={profile.id}>
                  <td>
                    <strong>{profile.full_name}</strong>
                    {profile.member_number ? <small>Mitgliedsnummer: {profile.member_number}</small> : null}
                    {profile.id === user.id ? <small>Sie selbst</small> : null}
                  </td>
                  <td>
                    <strong>{profile.email ?? "—"}</strong>
                    {profile.phone ? <small>{profile.phone}</small> : null}
                  </td>
                  <td><StatusPill profile={profile} /></td>
                  <td>{formatDateTime(profile.created_at)}</td>
                  <td>{formatDateTime(profile.approved_at)}</td>
                  <td>
                    <div className="member-actions">
                      {!profile.is_approved && !profile.is_admin ? (
                        <form action={approveMember}>
                          <input type="hidden" name="profileId" value={profile.id} />
                          <button type="submit">Freigeben</button>
                        </form>
                      ) : null}

                      {profile.is_approved && !profile.is_admin && profile.id !== user.id ? (
                        <form action={revokeMemberApproval}>
                          <input type="hidden" name="profileId" value={profile.id} />
                          <button className="danger" type="submit">Sperren</button>
                        </form>
                      ) : null}

                      {!profile.is_admin ? (
                        <form action={grantAdmin}>
                          <input type="hidden" name="profileId" value={profile.id} />
                          <button className="secondary" type="submit">Admin geben</button>
                        </form>
                      ) : null}

                      {profile.is_admin && profile.id !== user.id ? (
                        <form action={removeAdmin}>
                          <input type="hidden" name="profileId" value={profile.id} />
                          <button className="danger" type="submit">Admin entziehen</button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {visibleList.length === 0 ? (
                <tr><td colSpan={6}>Keine Mitglieder passend zum Filter gefunden.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
