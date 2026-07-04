import Link from "next/link";
import { redirect } from "next/navigation";
import { updateOwnProfile } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AccountPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, member_number, is_admin, is_approved, approved_at, approved_by, created_at")
    .eq("id", user.id)
    .single<Profile>();

  const success = typeof params.success === "string" ? params.success : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;

  return (
    <main className="page narrow-page">
      <header className="header">
        <div className="brand">
          <h1>Meine Daten</h1>
          <p>Name, Telefonnummer und Mitgliedsnummer für die Vereinsverwaltung.</p>
        </div>
        <Link className="button secondary" href="/">Zur Buchung</Link>
      </header>

      {success ? <p className="notice success">{success}</p> : null}
      {error ? <p className="notice error">{error}</p> : null}

      <section className="card account-card account-status">
        <strong>Status</strong>
        <p>{profile?.is_admin ? "Admin" : profile?.is_approved ? "Freigegebenes Mitglied" : "Wartet auf Admin-Freigabe"}</p>
      </section>

      <section className="card account-card">
        <form action={updateOwnProfile} className="form-stack">
          <label>
            Name
            <input name="fullName" defaultValue={profile?.full_name ?? ""} required minLength={2} maxLength={80} />
          </label>
          <label>
            E-Mail
            <input value={profile?.email ?? user.email ?? ""} disabled />
            <small>Die Login-E-Mail wird über Supabase Auth verwaltet.</small>
          </label>
          <label>
            Telefonnummer optional
            <input name="phone" defaultValue={profile?.phone ?? ""} maxLength={40} placeholder="z. B. 0176 ..." />
          </label>
          <label>
            Mitgliedsnummer optional
            <input name="memberNumber" defaultValue={profile?.member_number ?? ""} maxLength={40} placeholder="z. B. 123" />
          </label>
          <button type="submit">Profil speichern</button>
        </form>
      </section>
    </main>
  );
}
