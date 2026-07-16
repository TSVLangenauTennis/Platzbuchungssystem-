import { redirect } from "next/navigation";
import { AdminAnnouncementForm } from "@/components/AdminAnnouncementForm";
import { createClient } from "@/lib/supabase/server";
import type { Announcement, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AnkuendigungenPage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, phone, member_number, is_admin, is_approved, approved_at, approved_by, created_at"
    )
    .eq("id", user.id)
    .single<Profile>();

  if (!profile?.is_approved && !profile?.is_admin) {
    redirect("/");
  }

  const { data: announcements } = await supabase
    .from("announcements")
    .select(
      "id, title, message, created_at, created_by, is_active, expires_at"
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .returns<Announcement[]>();

  return (
    <main className="page">
      <div style={{ marginBottom: "16px" }}>
        <a href="/" className="button secondary">
          Zurück zur Startseite
        </a>
      </div>

      {profile.is_admin ? <AdminAnnouncementForm /> : null}

      <section className="card" style={{ padding: "22px" }}>
        <p className="eyebrow">AKTUELLES</p>
        <h1>Ankündigungen</h1>

        {!announcements || announcements.length === 0 ? (
          <p>Derzeit gibt es keine aktuellen Ankündigungen.</p>
        ) : (
          <div style={{ display: "grid", gap: "14px", marginTop: "18px" }}>
            {announcements.map((announcement) => (
              <article
                key={announcement.id}
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: "16px",
                  padding: "16px",
                  background: "var(--surface-soft)"
                }}
              >
                <h2 style={{ marginTop: 0 }}>
                  {announcement.title}
                </h2>

                <p style={{ whiteSpace: "pre-wrap" }}>
                  {announcement.message}
                </p>

                <small style={{ color: "var(--muted)" }}>
                  Veröffentlicht am{" "}
                  {new Intl.DateTimeFormat("de-DE").format(
                    new Date(announcement.created_at)
                  )}
                </small>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
