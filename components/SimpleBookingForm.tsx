import { CLUB_CONTACT_EMAIL, MAX_ADVANCE_DAYS } from "@/lib/config";
import { addDays, bookingStartTimes, formatTime, getSlotLocal, toDateInputValue } from "@/lib/dates";
import type { CalendarView, Court } from "@/lib/types";

type Props = {
  date: string;
  view: CalendarView;
  courts: Court[];
};

export function SimpleBookingForm({ date, view, courts }: Props) {
  const today = toDateInputValue();
  const maxDate = toDateInputValue(addDays(new Date(`${today}T00:00:00`), MAX_ADVANCE_DAYS));
  const activeCourts = courts.filter((court) => court.is_active);
  const startTimes = bookingStartTimes();

  return (
    <section className="quick-booking card" id="einfach-buchen" aria-labelledby="quick-booking-title">
      <div className="quick-booking-intro">
        <p className="eyebrow">Einfach buchen</p>
        <h2 id="quick-booking-title">Platz in 3 Schritten buchen</h2>
        <p>
          Diese Maske ist der einfachste Weg: Datum, Platz und Startzeit auswählen. Die Buchung dauert immer genau eine Stunde.
        </p>
        <ol className="booking-steps" aria-label="Buchungsschritte">
          <li><strong>1</strong><span>Datum wählen</span></li>
          <li><strong>2</strong><span>Platz und Uhrzeit wählen</span></li>
          <li><strong>3</strong><span>Buchung prüfen und bestätigen</span></li>
        </ol>
      </div>

      <form action="/confirm-booking" method="get" className="quick-booking-form">
        <input type="hidden" name="view" value={view} />
        <label>
          <span>Datum</span>
          <input name="date" type="date" defaultValue={date} min={today} max={maxDate} required />
        </label>

        <label>
          <span>Platz</span>
          <select name="courtId" required defaultValue={activeCourts[0]?.id ?? ""}>
            {activeCourts.length === 0 ? <option value="">Kein aktiver Platz verfügbar</option> : null}
            {activeCourts.map((court) => (
              <option key={court.id} value={court.id}>{court.name}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Startzeit</span>
          <select name="startTime" required defaultValue="17:30">
            {startTimes.map((slot) => {
              const { endsAt } = getSlotLocal(date, slot.value);
              return <option key={slot.value} value={slot.value}>{slot.label}–{formatTime(endsAt)}</option>;
            })}
          </select>
        </label>

        <label className="quick-booking-note">
          <span>Spielpartner oder Hinweis <small>optional</small></span>
          <input name="notes" maxLength={120} placeholder="z. B. Max Mustermann" />
        </label>

        <button className="large-primary" type="submit" disabled={activeCourts.length === 0}>Weiter zur Prüfung</button>
        <p className="form-hint">
          Danach sehen Sie die Buchung noch einmal in Klartext und bestätigen verbindlich. Es kann nichts überschrieben werden.
          Bei Problemen: {CLUB_CONTACT_EMAIL}
        </p>
      </form>
    </section>
  );
}
