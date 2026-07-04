import Link from "next/link";
import { signOut } from "@/app/actions";
import { CLUB_NAME, MAX_ADVANCE_DAYS, MAX_EXPECTED_MEMBERS } from "@/lib/config";
import { addDays, formatDateLong, getCalendarDates, startOfWeekMonday, toDateInputValue } from "@/lib/dates";
import type { CalendarView } from "@/lib/types";

export function Header({ date, view, userName, isAdmin }: { date: string; view: CalendarView; userName: string; isAdmin: boolean }) {
  const current = new Date(`${date}T12:00:00`);
  const previous = toDateInputValue(addDays(current, view === "week" ? -7 : -1));
  const next = toDateInputValue(addDays(current, view === "week" ? 7 : 1));
  const today = toDateInputValue();
  const maxDate = toDateInputValue(addDays(new Date(`${today}T00:00:00`), MAX_ADVANCE_DAYS));
  const weekDates = getCalendarDates(date, "week");
  const weekLabel = `${formatDateLong(weekDates[0])} – ${formatDateLong(weekDates[6])}`;

  return (
    <>
      <header className="header">
        <div className="brand">
          <p className="eyebrow">Platzbuchung</p>
          <h1>{CLUB_NAME}</h1>
          <p>Hallo {userName}. Wählen Sie einen freien Platz und buchen Sie ihn mit einem Klick.</p>
        </div>
        <div className="header-actions" aria-label="Hauptaktionen">
          <a className="button" href="#einfach-buchen">Platz buchen</a>
          <a className="button secondary" href="#meine-buchungen">Meine Buchungen</a>
          <Link className="button secondary" href="/account">Meine Daten</Link>
          {isAdmin ? <Link className="button secondary" href="/admin">Adminbereich</Link> : null}
          <form action={signOut}>
            <button className="secondary" type="submit">Abmelden</button>
          </form>
        </div>
      </header>

      <section className="toolbar card" aria-label="Kalendernavigation">
        <div className="toolbar-title">
          <span>Aktuelle Ansicht</span>
          <strong>{view === "week" ? weekLabel : formatDateLong(date)}</strong>
          <p>
            60 Minuten pro Buchung · Start zur vollen oder halben Stunde · bis {MAX_ADVANCE_DAYS} Tage im Voraus · für bis zu {MAX_EXPECTED_MEMBERS} Mitglieder ausgelegt.
          </p>
        </div>
        <nav className="date-nav" aria-label="Datum und Ansicht auswählen">
          <Link className="button secondary" href={`/?date=${previous}&view=${view}`}>{view === "week" ? "Vorwoche" : "Vorheriger Tag"}</Link>
          <Link className="button secondary" href={`/?date=${today}&view=${view}`}>Heute</Link>
          <Link className="button secondary" href={`/?date=${next}&view=${view}`}>{view === "week" ? "Nächste Woche" : "Nächster Tag"}</Link>
          <Link className={view === "day" ? "button" : "button secondary"} href={`/?date=${date}&view=day`}>Ein Tag</Link>
          <Link className={view === "week" ? "button" : "button secondary"} href={`/?date=${startOfWeekMonday(date)}&view=week`}>Ganze Woche</Link>
          <form className="date-picker-form">
            <label>
              <span>Datum direkt wählen</span>
              <input type="date" name="date" defaultValue={date} min={today} max={maxDate} aria-label="Datum auswählen" />
            </label>
            <input type="hidden" name="view" value={view} />
            <button type="submit">Datum anzeigen</button>
          </form>
        </nav>
      </section>
    </>
  );
}
