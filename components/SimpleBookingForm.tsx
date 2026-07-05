"use client";

import { useMemo, useState } from "react";
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
  const startTimes = useMemo(() => bookingStartTimes(), []);

  const [selectedDate, setSelectedDate] = useState(date);

  return (
    <section className="compact-booking card" id="einfach-buchen" aria-labelledby="compact-booking-title">
      <div className="compact-booking-head">
        <p className="eyebrow">Platz buchen</p>
        <h2 id="compact-booking-title">Schnell buchen</h2>
        <p>Datum, Platz und Uhrzeit auswählen. Danach bestätigen Sie die Buchung noch einmal.</p>
      </div>

      <form action="/confirm-booking" method="get" className="compact-booking-form">
        <input type="hidden" name="view" value={view} />

        <label>
          <span>Datum</span>
          <input
            name="date"
            type="date"
            value={selectedDate}
            min={today}
            max={maxDate}
            required
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </label>

        <label>
          <span>Platz</span>
          <select name="courtId" required defaultValue={activeCourts[0]?.id ?? ""}>
            {activeCourts.length === 0 ? (
              <option value="">Kein Platz verfügbar</option>
            ) : null}

            {activeCourts.map((court) => (
              <option key={court.id} value={court.id}>
                {court.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Startzeit</span>
          <select name="startTime" required defaultValue="17:30">
            {startTimes.map((slot) => {
              const { endsAt } = getSlotLocal(selectedDate, slot.value);

              return (
                <option key={slot.value} value={slot.value}>
                  {slot.label}–{formatTime(endsAt)}
                </option>
              );
            })}
          </select>
        </label>

        <label className="compact-booking-note">
          <span>Spielpartner oder Hinweis <small>optional</small></span>
          <input name="notes" maxLength={120} placeholder="z. B. Max Mustermann" />
        </label>

        <button className="large-primary" type="submit" disabled={activeCourts.length === 0}>
          Buchung prüfen
        </button>

        <p className="form-hint">
          Tipp: Im Kalender sehen Sie, welche Zeiten frei oder belegt sind. Bei Problemen: {CLUB_CONTACT_EMAIL}
        </p>
      </form>
    </section>
  );
}
