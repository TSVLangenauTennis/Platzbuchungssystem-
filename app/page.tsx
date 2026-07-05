import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminBlockForm } from "@/components/AdminBlockForm";
import { AvailabilitySummary } from "@/components/AvailabilitySummary";
import { BookingBoard } from "@/components/BookingBoard";
import { BookingRules } from "@/components/BookingRules";
import { Header } from "@/components/Header";
import { SimpleBookingForm } from "@/components/SimpleBookingForm";
import { MemberHelp } from "@/components/MemberHelp";
import { Footer } from "@/components/Footer";
import { MyBookings } from "@/components/MyBookings";
import { AdminMemberBookingForm } from "@/components/AdminMemberBookingForm";
import { signOut } from "@/app/actions";
import { addDays, formatDateLong, getRangeForView, parseDateParam, parseViewParam, startOfWeekMonday, toDateInputValue } from "@/lib/dates";
import { MAX_ADVANCE_DAYS, MEMBER_LIST_LIMIT } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import type { Booking, Court, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function PendingApproval({ userName }: { userName: string }) {
  return (
    <main className="auth-shell">
      <section className="card pending-card">
        <h1>Konto wartet auf Freigabe</h1>
        <p>
          Hallo {userName}, Ihr Konto ist registriert, aber noch nicht durch einen Admin freigegeben.
          Sobald ein Admin Sie freigibt, können Sie Plätze buchen und den Kalender sehen.
        </p>
        <form action={signOut}>
          <button className="secondary" type="submit">Abmelden</button>
        </form>
      </section>
    </main>
  );
}

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const date = parseDateParam(params.date);
  const view = parseViewParam(params.view);
  const { startsOn, endsBefore } = getRangeForView(date, view);
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, member_number, is_admin, is_approved, approved_at, approved_by, created_at")
    .eq("id", user.id)
    .single<Profile>();

const [{ data: approvedViaRpc }, { data: adminViaRpc }] = await Promise.all([
  supabase.rpc("is_approved_member"),
  supabase.rpc("is_admin")
]);

const userName = profile?.full_name || user.email || "Mitglied";
const isAdmin = Boolean(profile?.is_admin || adminViaRpc);
const isApproved = Boolean(profile?.is_approved || profile?.is_admin || approvedViaRpc || adminViaRpc);

  if (!isApproved) return <PendingApproval userName={userName} />;

  const today = toDateInputValue();
  const myBookingsEnd = toDateInputValue(addDays(new Date(`${today}T00:00:00`), MAX_ADVANCE_DAYS + 1));

  const [{ data: courts }, { data: bookings }, { data: myBookings }] = await Promise.all([
    supabase.from("courts").select("id, name, is_active").order("id", { ascending: true }).returns<Court[]>(),
    supabase
      .from("bookings")
      .select("id, court_id, user_id, created_by, title, kind, starts_at, ends_at, notes, cancelled_at, cancelled_by, cancellation_reason, created_at")
      .gte("starts_at", `${startsOn}T00:00:00`)
      .lt("starts_at", `${endsBefore}T00:00:00`)
      .is("cancelled_at", null)
      .order("starts_at", { ascending: true })
      .returns<Booking[]>(),
    supabase
      .from("bookings")
      .select("id, court_id, user_id, created_by, title, kind, starts_at, ends_at, notes, cancelled_at, cancelled_by, cancellation_reason, created_at")
      .eq("user_id", user.id)
      .eq("kind", "member")
      .gte("starts_at", `${today}T00:00:00`)
      .lt("starts_at", `${myBookingsEnd}T00:00:00`)
      .is("cancelled_at", null)
      .order("starts_at", { ascending: true })
      .limit(8)
      .returns<Booking[]>()
  ]);

  const approvedMembers = isAdmin
    ? (await supabase
        .from("profiles")
        .select("id, full_name, email, phone, member_number, is_admin, is_approved, approved_at, approved_by, created_at")
        .or("is_approved.eq.true,is_admin.eq.true")
        .order("full_name", { ascending: true })
        .limit(MEMBER_LIST_LIMIT)
        .returns<Profile[]>()).data ?? []
    : [];

  const success = typeof params.success === "string" ? params.success : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;
const currentDate = new Date(`${date}T00:00:00`);
const previousDate = toDateInputValue(addDays(currentDate, view === "week" ? -7 : -1));
const nextDate = toDateInputValue(addDays(currentDate, view === "week" ? 7 : 1));
const maxDate = toDateInputValue(addDays(new Date(`${today}T00:00:00`), MAX_ADVANCE_DAYS));
  const calendarOpen = params.calendar === "open";
  return (
    <main className="page">
      <Header date={date} view={view} userName={userName} isAdmin={isAdmin} />
      <nav className="mobile-quick-nav" aria-label="Schnellnavigation">
  <a href="#einfach-buchen">Platz buchen</a>
  <a href="#meine-buchungen">Meine Buchungen</a>
  <a href="#kalender">Kalender</a>
</nav>

      {success ? <p className="notice success">{success}</p> : null}
      {error ? <p className="notice error">{error}</p> : null}

    <details id="kalender" className="calendar-overview-section calendar-accordion" open={calendarOpen}>
<summary className="calendar-summary">
  <div className="calendar-summary-text">
    <p className="eyebrow">Kalenderübersicht</p>
    <strong>{view === "week" ? "Wochenübersicht" : formatDateLong(date)}</strong>
    <span>Antippen, um freie und belegte Zeiten anzusehen</span>
  </div>
</summary>

  <span className="calendar-summary-button">Kalender öffnen</span>
</summary>

  <div className="calendar-panel">
    <div className="calendar-control card">
      <div className="calendar-control-actions">
        <Link className="button secondary" href={`/?date=${previousDate}&view=${view}&calendar=open#kalender`}>
          {view === "week" ? "Vorwoche" : "Vorheriger Tag"}
        </Link>

        <Link className="button secondary" href={`/?date=${today}&view=${view}&calendar=open#kalender`}>
          Heute
        </Link>

        <Link className="button secondary" href={`/?date=${nextDate}&view=${view}&calendar=open#kalender`}>
          {view === "week" ? "Nächste Woche" : "Nächster Tag"}
        </Link>

        <Link className={view === "day" ? "button" : "button secondary"} href={`/?date=${date}&view=day&calendar=open#kalender`}>
          Tagesansicht
        </Link>

        <Link className={view === "week" ? "button" : "button secondary"} href={`/?date=${startOfWeekMonday(date)}&view=week&calendar=open#kalender`}>
          Wochenansicht
        </Link>
      </div>

      <form className="calendar-date-form">
        <label>
          <span>Datum direkt wählen</span>
          <input type="date" name="date" defaultValue={date} min={today} max={maxDate} />
        </label>
        <input type="hidden" name="view" value={view} />
        <input type="hidden" name="calendar" value="open" />
        <button type="submit">Anzeigen</button>
      </form>
    </div>

    <div className="mobile-calendar-wrap">
      <BookingBoard
        date={date}
        view={view}
        courts={courts ?? []}
        bookings={bookings ?? []}
        currentUserId={user.id}
        isAdmin={isAdmin}
      />
    </div>
  </div>
</details>

<SimpleBookingForm date={date} view={view} courts={courts ?? []} />

<section id="meine-buchungen">
  <MyBookings bookings={myBookings ?? []} courts={courts ?? []} view={view} />
</section>

<MemberHelp />

<BookingRules />

{isAdmin ? (
  <AvailabilitySummary date={date} view={view} courts={courts ?? []} bookings={bookings ?? []} />
) : null}

      {isAdmin ? (
        <>
          <AdminMemberBookingForm date={date} view={view} courts={courts ?? []} members={approvedMembers} />
          <div className="admin-form-section">
          <div className="section-heading no-pad"><div><h2>Admin: Training, Sperrzeiten und Turniere</h2><p>Mehrere Plätze auswählen, Zeitraum setzen und bei Bedarf wöchentlich wiederholen.</p></div></div>
          <AdminBlockForm courts={courts ?? []} date={date} view={view} />
          </div>
        </>
      ) : null}

      <Footer />
    </main>
  );
}
