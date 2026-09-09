import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { redirect } from "next/navigation";
import { markSuggestionRead } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Suggestion } from "@/lib/types";

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export default async function SuggestionsPage() {
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

  const { data: suggestions } = await supabase
    .from("suggestions")
    .select("id, message, created_at, is_read")
    .order("created_at", { ascending: false })
    .limit(200)
    .returns<Suggestion[]>();

  const list = suggestions ?? [];
  const unreadCount = list.filter((item) => !item.is_read).length;

  return (
    <main className="page">
      <header className="header">
        <div className="brand">
          <h1>Verbesserungsvorschläge</h1>
          <p>{list.length} Vorschläge insgesamt · {unreadCount} ungelesen. Anonym eingereicht – kein Absender sichtbar.</p>
        </div>
        <div className="header-actions">
          <Link className="button secondary" href="/admin">Admin-Übersicht</Link>
          <Link className="button secondary" href="/">Zur Buchung</Link>
        </div>
      </header>

      <AdminNav />

      <section className="suggestion-list">
        {list.map((item) => (
          <article key={item.id} className={item.is_read ? "card suggestion-card" : "card suggestion-card unread"}>
            <p className="suggestion-message">{item.message}</p>
            <div className="suggestion-meta">
              <span>{formatDateTime(item.created_at)}</span>
              {item.is_read ? (
                <span className="pill muted">Gelesen</span>
              ) : (
                <form action={markSuggestionRead}>
                  <input type="hidden" name="id" value={item.id} />
                  <button className="secondary" type="submit">Als gelesen markieren</button>
                </form>
              )}
            </div>
          </article>
        ))}

        {list.length === 0 ? (
          <p className="card suggestion-card">Noch keine Vorschläge eingereicht.</p>
        ) : null}
      </section>
    </main>
  );
}
