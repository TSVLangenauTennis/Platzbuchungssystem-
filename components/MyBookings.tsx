import { formatDateLong, formatTime } from "@/lib/dates";
import type { Booking, CalendarView, Court } from "@/lib/types";

type Props = {
  bookings: Booking[];
  courts: Court[];
  view: CalendarView;
};

function dateValue(iso: string): string {
  return iso.slice(0, 10);
}

export function MyBookings({ bookings, courts, view }: Props) {
  const byCourt = new Map(courts.map((court) => [court.id, court.name]));

  return (
    <section className="card my-bookings" id="meine-buchungen" aria-label="Meine nächsten Buchungen">
      <div className="section-heading">
        <div>
          <h2>Meine nächsten Buchungen</h2>
          <p>Hier sehen Mitglieder ihre kommenden Buchungen und können sie vor Beginn stornieren.</p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <p className="empty-state">Sie haben aktuell keine kommenden Buchungen.</p>
      ) : (
        <div className="booking-list">
          {bookings.slice(0, 8).map((booking) => (
            <article className="booking-list-item" key={booking.id}>
              <div>
                <strong>{formatDateLong(dateValue(booking.starts_at))}</strong>
                <span>{formatTime(booking.starts_at)}–{formatTime(booking.ends_at)} · {byCourt.get(booking.court_id) ?? `Platz ${booking.court_id}`}</span>
                {booking.notes ? <small>{booking.notes}</small> : null}
              </div>
              <form action="/confirm-cancel" method="get">
                <input type="hidden" name="id" value={booking.id} />
                <input type="hidden" name="date" value={dateValue(booking.starts_at)} />
                <input type="hidden" name="view" value={view} />
                <button className="danger small-button" type="submit">Diese Buchung stornieren</button>
              </form>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
