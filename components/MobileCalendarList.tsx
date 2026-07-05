import { bookingStartTimes, formatTime, getSlotLocal } from "@/lib/dates";
import type { Booking, Court } from "@/lib/types";

type Props = {
  date: string;
  courts: Court[];
  bookings: Booking[];
  currentUserId: string;
};

function overlaps(booking: Booking, startsAt: Date, endsAt: Date) {
  const bookingStart = new Date(booking.starts_at).getTime();
  const bookingEnd = new Date(booking.ends_at).getTime();

  return bookingStart < endsAt.getTime() && bookingEnd > startsAt.getTime();
}

export function MobileCalendarList({ date, courts, bookings, currentUserId }: Props) {
  const activeCourts = courts.filter((court) => court.is_active);
  const startTimes = bookingStartTimes();

  return (
    <section className="mobile-day-calendar card">
      <div className="mobile-day-calendar-head">
        <p className="eyebrow">Handyansicht</p>
        <h2>Freie Zeiten</h2>
        <p>Tippen Sie auf einen freien Platz, um diese Zeit zu buchen.</p>
      </div>

      <div className="mobile-slot-list">
        {startTimes.map((slot) => {
          const { startsAt, endsAt } = getSlotLocal(date, slot.value);

          return (
            <section className="mobile-time-card" key={slot.value}>
              <div className="mobile-time-title">
                {slot.label}–{formatTime(endsAt)}
              </div>

              <div className="mobile-court-grid">
                {activeCourts.map((court) => {
                  const booking = bookings.find(
                    (item) =>
                      item.court_id === court.id &&
                      item.cancelled_at === null &&
                      overlaps(item, startsAt, endsAt)
                  );

                  if (booking) {
                    const isOwnBooking = booking.user_id === currentUserId;

                    return (
                      <div className="mobile-court-pill occupied" key={court.id}>
                        <strong>{court.name}</strong>
                        <span>{isOwnBooking ? "Ihre Buchung" : "Belegt"}</span>
                      </div>
                    );
                  }

                  return (
                    <form action="/confirm-booking" method="get" key={court.id}>
                      <input type="hidden" name="date" value={date} />
                      <input type="hidden" name="startTime" value={slot.value} />
                      <input type="hidden" name="courtId" value={court.id} />
                      <input type="hidden" name="view" value="day" />

                      <button className="mobile-court-pill free" type="submit">
                        <strong>{court.name}</strong>
                        <span>Frei</span>
                      </button>
                    </form>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
