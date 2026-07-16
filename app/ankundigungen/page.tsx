import { redirect } from "next/navigation";
import { AdminAnnouncementForm } from "@/components/AdminAnnouncementForm";
import { createClient } from "@/lib/supabase/server";
import type { Announcement, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type SearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

export default async function AnkuendigungenPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
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

  if (!profile) {
    redirect("/");
  }

  if (!profile.is_approved && !profile.is_admin) {
    redirect("/");
  }

  const { data: announcements, error: announcementsError } =
    await supabase
      .from("announcements")
      .select(
        "id, title, message, created_at, created_by, is_active, expires_at"
      )
      .eq("is_active", true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order("created_at", { ascending: false })
      .returns<Announcement[]>();

  /*
   * Sobald diese Seite geöffnet wird, werden alle momentan
   * sichtbaren Ankündigungen für diesen Benutzer als gelesen gespeichert.
   */
  if (announcements && announcements.length > 0) {
    const { data: existingReads } = await supabase
      .from("announcement_reads")
      .select("announcement_id")
      .eq("user_id", user.id);

    const alreadyReadIds = new Set(
      (existingReads ?? []).map((item) => item.announcement_id)
    );

    const unreadAnnouncements = announcements.filter(
      (announcement) => !alreadyReadIds.has(announcement.id)
    );

    if (unreadAnnouncements.length > 0) {
      await supabase.from("announcement_reads").insert(
        unreadAnnouncements.map((announcement) => ({
          announcement_id: announcement.id,
          user_id: user.id,
          read_at: new Date().toISOString()
        }))
      );
    }
  }

  const success =
    typeof params.success === "string"
      ? params.success
      : undefined;

  const actionError =
    typeof params.error === "string"
      ? params.error
      : undefined;

  return (
    <main className="page">
      <div className="announcements-page-top">
        <a href="/" className="button secondary">
          Zurück zur Platzbuchung
        </a>
      </div>

      {success ? (
        <p className="notice success">
          {success}
        </p>
      ) : null}

      {actionError ? (
        <p className="notice error">
          {actionError}
        </p>
      ) : null}

      {announcementsError ? (
        <p className="notice error">
          Die Ankündigungen konnten nicht geladen werden.
        </p>
      ) : null}

      {profile.is_admin ? (
        <AdminAnnouncementForm />
      ) : null}

      <section className="card announcements-section">
        <div className="announcements-title">
          <p className="eyebrow">AKTUELLES</p>
          <h1>Ankündigungen</h1>
          <p>
            Hier finden Sie aktuelle Informationen des Vereins.
          </p>
        </div>

        {!announcements || announcements.length === 0 ? (
          <div className="announcements-empty-state">
            <strong>Keine aktuellen Ankündigungen</strong>
            <p>
              Momentan liegen keine neuen Vereinsmitteilungen vor.
            </p>
          </div>
        ) : (
          <div className="announcements-list">
            {announcements.map((announcement) => (
              <article
                key={announcement.id}
                className="announcement-card"
              >
                <h2>{announcement.title}</h2>

                <p className="announcement-message">
                  {announcement.message}
                </p>

                <small className="announcement-date">
                  Veröffentlicht am{" "}
                  {new Intl.DateTimeFormat("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                  }).format(new Date(announcement.created_at))}
                </small>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
