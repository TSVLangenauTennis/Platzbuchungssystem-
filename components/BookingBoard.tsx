
import { MAX_ADVANCE_DAYS } from "@/lib/config";
import { addDays, bookingStartTimes, compareDateValues, formatDateShort, formatTime, getCalendarDates, getSlotLocal, overlapsSlot, toDateInputValue } from "@/lib/dates";
import type { Booking, CalendarView, Court } from "@/lib/types";

const kindLabel: Record<string, string> = {
  member: "Buchung",
  training: "Training",
  match: "Verbandsspiel",
  tournament: "Turnier",
  maintenance: "Wartung",
  blocked: "Gesperrt"
};

type Props = {
  date: string;
  view: CalendarView;
  courts: Court[];
  bookings: Booking[];
  currentUserId: string;
  isAdmin: boolean;
};

function canBookDate(dateValue: string): boolean {
  const today = toDateInputValue();
  const max = toDateInputValue(addDays(new Date(`${today}T00:00:00`), MAX_ADVANCE_DAYS));
  return compareDateValues(dateValue, today) >= 0 && compareDateValues(dateValue, max) <= 0;
}

function canBookSlot(dateValue: string, startTime: string, court: Court): boolean {
  if (!court.is_active) return false;
  if (!canBookDate(dateValue)) return false;
  return new Date(`${dateValue}T${startTime}:00`).getTime() > Date.now();
}

function bookingForSlot(bookings: Booking[], courtId: number, date: string, startTime: string) {
  const slot = getSlotLocal(date, startTime);
  return bookings.find((candidate) =>
    candidate.court_id === courtId &&
    overlapsSlot(candidate.starts_at, candidate.ends_at, slot.startsAt, slot.endsAt)
  );
}

function isFuture(iso: string): boolean {
  return new Date(iso).getTime() > Date.now();
}

function disabledLabel(dateValue: string, startTime: string, court: Court): string {
  if (!court.is_active) return "Platz deaktiviert";
  if (!canBookDate(dateValue)) return "Nicht buchbar";
  if (new Date(`${dateValue}T${startTime}:00`).getTime() <= Date.now()) return "Vergangen";
  return "Nicht buchbar";
}
function ConflictCell({ booking }: { booking: Booking }) {
  return (
    <div className={`slot-conflict ${booking.kind}`}>
      <strong>Belegt</strong>
      <small>wegen {formatTime(booking.starts_at)}–{formatTime(booking.ends_at)}</small>
    </div>
  );
}

function isExactStart(booking: Booking, startTime: string): boolean {
  return formatTime(booking.starts_at) === startTime;
}
function BookingCell({ booking, dateValue, view, currentUserId, isAdmin }: { booking: Booking; dateValue: string; view: CalendarView; currentUserId: string; isAdmin: boolean }) {
  const canCancel = isAdmin || (booking.kind === "member" && booking.user_id === currentUserId && isFuture(booking.starts_at));

  return (
    <div className={`booking ${booking.kind}`}>
      <div>
        <small>{kindLabel[booking.kind] ?? booking.kind} · {formatTime(booking.starts_at)}–{formatTime(booking.ends_at)}</small>
        <strong>{booking.title}</strong>
        {booking.notes ? <span className="booking-note">{booking.notes}</span> : null}
      </div>
      {canCancel ? (
        <form action="/confirm-cancel" method="get">
          <input type="hidden" name="id" value={booking.id} />
          <input type="hidden" name="date" value={dateValue} />
          <input type="hidden" name="view" value={view} />
          <button className="danger small-button" type="submit">Stornieren</button>
        </form>
      ) : null}
    </div>
  );
}

export function BookingBoard({ date, view, courts, bookings, currentUserId, isAdmin }: Props) {
  const dates = getCalendarDates(date, view);
  const startTimes = bookingStartTimes();

  return (
    <div className="calendar-stack" id="kalender">
      <div className="legend card" aria-label="Legende">
        <span><i className="legend-dot member" />Mitglied</span>
        <span><i className="legend-dot training" />Training</span>
        <span><i className="legend-dot match" />Spiel/Turnier</span>
        <span><i className="legend-dot blocked" />Wartung/Sperre</span>
      </div>

      {dates.map((dateValue) => (
        <section className="day-section" key={dateValue}>
          <div className="day-heading">
            <div>
              <h2>{formatDateShort(dateValue)}</h2>
              <p>Grüne Felder sind frei. Jede Buchung dauert genau 60 Minuten.</p>
            </div>
            <div className="day-pills">
              <span className="pill muted">Start alle 30 Minuten</span>
              {!canBookDate(dateValue) ? <span className="pill muted">außerhalb Buchungsfrist</span> : null}
            </div>
          </div>

          <div className="card board-wrap">
            <table className="board" aria-label={`Platzbuchungskalender ${dateValue}`}>
              <thead>
                <tr>
                  <th>Start</th>
                  {courts.map((court) => (
                    <th key={court.id}>
                      {court.name}
                      {!court.is_active ? <span className="court-inactive">deaktiviert</span> : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {startTimes.map((slot) => (
                  <tr key={slot.value}>
                    <td className="time-cell">{slot.label}</td>
                    {courts.map((court) => {
                      const booking = bookingForSlot(bookings, court.id, dateValue, slot.value);

                     if (booking) {
  return (
    <td key={`${dateValue}-${court.id}-${slot.value}`}>
      {isExactStart(booking, slot.value) ? (
        <BookingCell booking={booking} dateValue={dateValue} view={view} currentUserId={currentUserId} isAdmin={isAdmin} />
      ) : (
        <ConflictCell booking={booking} />
      )}
    </td>
  );
}

                      if (!canBookSlot(dateValue, slot.value, court)) {
                        return (
                          <td key={`${dateValue}-${court.id}-${slot.value}`} className="slot-disabled">
                            <span>{disabledLabel(dateValue, slot.value, court)}</span>
                          </td>
                        );
                      }

                      const endsAt = getSlotLocal(dateValue, slot.value).endsAt;
                      return (
                        <td key={`${dateValue}-${court.id}-${slot.value}`} className="slot-free">
                          <form action="/confirm-booking" method="get" className="slot-form">
                            <input type="hidden" name="date" value={dateValue} />
                            <input type="hidden" name="startTime" value={slot.value} />
                            <input type="hidden" name="courtId" value={court.id} />
                            <input type="hidden" name="view" value={view} />
                            <input className="slot-note-input" name="notes" placeholder="Partner" maxLength={120} aria-label="Spielpartner oder Hinweis optional" />
                            <button className="slot-button" type="submit">
                              <span>Frei – prüfen</span>
                              <small>{slot.label}–{formatTime(endsAt)}</small>
                            </button>
                          </form>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
