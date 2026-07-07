import Link from "next/link";
import { bookingStartTimes, getSlotLocal } from "@/lib/dates";
import type { Booking, Court } from "@/lib/types";

type Props = {
  date: string;
  courts: Court[];
  bookings: Booking[];
  currentUserId: string;
  selectedCourtId?: number;
};

function overlaps(booking: Booking, startsAt: string, endsAt: string) {
  const bookingStart = new Date(booking.starts_at).getTime();
  const bookingEnd = new Date(booking.ends_at).getTime();
  const slotStart = new Date(startsAt).getTime();
  const slotEnd = new Date(endsAt).getTime();

  return bookingStart < slotEnd && bookingEnd > slotStart;
}

function startsExactlyAt(booking: Booking, startsAt: string) {
  return new Date(booking.starts_at).getTime() === new Date(startsAt).getTime();
}

function halfHourDisplayLabel(startTime: string) {
  const [hoursRaw, minutesRaw] = startTime.split(":");
  const hours = Number.parseInt(hoursRaw, 10);
  const minutes = Number.parseInt(minutesRaw, 10);

  const startTotal = hours * 60 + minutes;
  const endTotal = startTotal + 30;

  const endHours = Math.floor(endTotal / 60);
  const endMinutes = endTotal % 60;

  return `${startTime}–${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
}

function formatMobileDate(date: string) {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit"
  }).format(new Date(`${date}T00:00:00`));
}

function bookingLabel(booking: Booking, isOwnBooking: boolean) {
  if (booking.kind === "member") {
    return isOwnBooking ? "Ihre Buchung" : "Belegt";
  }

  if (booking.kind === "training") {
    return "Training";
  }

  if (booking.kind === "match") {
    return "Spiel/Turnier";
  }

  return "Gesperrt";
}

function courtHref(date: string, courtId: number) {
  const params = new URLSearchParams({
    date,
    view: "week",
    court: String(courtId)
  });

  return `/kalender?${params.toString()}`;
}

export function MobileCalendarList({ date, courts, bookings, currentUserId, selectedCourtId }: Props) {
  const activeCourts = courts.filter((court) => court.is_active);
  const selectedCourt = activeCourts.find((court) => court.id === selectedCourtId) ?? activeCourts[0];
  const startTimes = bookingStartTimes();
  const now = Date.now();

  if (!selectedCourt) {
    return (
      <section className="mobile-day-calendar card">
        <h2>Kein aktiver Platz verfügbar</h2>
        <p>Aktuell ist kein Platz zur Buchung freigegeben.</p>
      </section>
    );
  }

  const visibleSlots = startTimes.filter((slot) => {
    const { startsAt } = getSlotLocal(date, slot.value);
    return new Date(startsAt).getTime() > now;
  });

  return (
    <section className="mobile-day-calendar card">
      <div className="mobile-day-calendar-head">
        <p className="eyebrow">Buchbare Zeiten</p>
        <h2>{formatMobileDate(date)}</h2>
        <p>Wählen Sie zuerst den Platz und danach eine freie Startzeit.</p>
      </div>

      <div className="mobile-place-tabs" aria-label="Platz auswählen">
        {activeCourts.map((court) => (
          <Link
            key={court.id}
            className={court.id === selectedCourt.id ? "mobile-place-tab active" : "mobile-place-tab"}
            href={courtHref(date, court.id)}
            aria-current={court.id === selectedCourt.id ? "page" : undefined}
          >
            {court.name}
          </Link>
        ))}
      </div>

      <div className="mobile-selected-court">
        <strong>{selectedCourt.name}</strong>
        <span>Grüne Zeiten sind frei. Eine Buchung dauert immer 60 Minuten.</span>
      </div>

      {visibleSlots.length === 0 ? (
        <p className="notice">Für diesen Tag sind keine buchbaren Zeiten mehr verfügbar.</p>
      ) : (
        <div className="mobile-time-list">
          {visibleSlots.map((slot) => {
            const { startsAt, endsAt } = getSlotLocal(date, slot.value);
            const booking = bookings.find(
              (item) =>
                item.court_id === selectedCourt.id &&
                item.cancelled_at === null &&
                overlaps(item, startsAt, endsAt)
            );

            if (booking) {
              const isOwnBooking = booking.user_id === currentUserId;
              const isExactBookingStart = startsExactlyAt(booking, startsAt);

              if (!isExactBookingStart) {
                return (
                  <div className="mobile-time-row blocked" key={slot.value}>
                    <span className="mobile-time-main">
                      {halfHourDisplayLabel(slot.value)}
                    </span>
                    <span>Blockiert</span>
                  </div>
                );
              }

              return (
                <div
                  className={isOwnBooking ? "mobile-time-row occupied own" : "mobile-time-row occupied"}
                  key={slot.value}
                >
                  <span className="mobile-time-main">
                    {halfHourDisplayLabel(slot.value)}
                  </span>
                  <span>{bookingLabel(booking, isOwnBooking)}</span>
                </div>
              );
            }

            return (
              <form action="/confirm-booking" method="get" key={slot.value}>
                <input type="hidden" name="date" value={date} />
                <input type="hidden" name="startTime" value={slot.value} />
                <input type="hidden" name="courtId" value={selectedCourt.id} />
                <input type="hidden" name="view" value="week" />

                <button className="mobile-time-row free" type="submit">
                  <span className="mobile-time-main">
                    {halfHourDisplayLabel(slot.value)}
                  </span>
                  <span>Frei buchen</span>
                </button>
              </form>
            );
          })}
        </div>
      )}
    </section>
  );
}
