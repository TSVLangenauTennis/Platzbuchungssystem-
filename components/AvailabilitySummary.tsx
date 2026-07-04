import Link from "next/link";
import { MAX_ADVANCE_DAYS } from "@/lib/config";
import { addDays, bookingStartTimes, compareDateValues, formatTime, getCalendarDates, getSlotLocal, overlapsSlot, toDateInputValue } from "@/lib/dates";
import type { Booking, CalendarView, Court } from "@/lib/types";

type Props = {
  date: string;
  view: CalendarView;
  courts: Court[];
  bookings: Booking[];
};

function isSlotFree(bookings: Booking[], courtId: number, date: string, startTime: string): boolean {
  const slot = getSlotLocal(date, startTime);
  return !bookings.some((booking) => (
    booking.court_id === courtId && overlapsSlot(booking.starts_at, booking.ends_at, slot.startsAt, slot.endsAt)
  ));
}

function canBookSlot(dateValue: string, startTime: string): boolean {
  const today = toDateInputValue();
  const max = toDateInputValue(addDays(new Date(`${today}T00:00:00`), MAX_ADVANCE_DAYS));
  if (compareDateValues(dateValue, today) < 0 || compareDateValues(dateValue, max) > 0) return false;
  return new Date(`${dateValue}T${startTime}:00`).getTime() > Date.now();
}

function weekdayShort(dateValue: string): string {
  return new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" }).format(new Date(`${dateValue}T12:00:00`));
}

function weekdayLong(dateValue: string): string {
  return new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "2-digit", month: "2-digit" }).format(new Date(`${dateValue}T12:00:00`));
}

export function AvailabilitySummary({ date, view, courts, bookings }: Props) {
  const dates = getCalendarDates(date, view);
  const activeCourts = courts.filter((court) => court.is_active);
  const slots = bookingStartTimes();
  const totalPerDay = activeCourts.length * slots.length;

  const summaries = dates.map((dateValue) => {
    const free = activeCourts.reduce((count, court) => (
      count + slots.filter((slot) => canBookSlot(dateValue, slot.value) && isSlotFree(bookings, court.id, dateValue, slot.value)).length
    ), 0);
    return { dateValue, free, booked: Math.max(totalPerDay - free, 0) };
  });

  const suggestions = dates.flatMap((dateValue) => (
    slots.flatMap((slot) => (
      activeCourts
        .filter((court) => canBookSlot(dateValue, slot.value) && isSlotFree(bookings, court.id, dateValue, slot.value))
        .map((court) => {
          const { endsAt } = getSlotLocal(dateValue, slot.value);
          const params = new URLSearchParams({ date: dateValue, startTime: slot.value, courtId: String(court.id), view });
          return { dateValue, slot, court, endsAt, href: `/confirm-booking?${params.toString()}` };
        })
    ))
  )).slice(0, 12);

  const totalFree = summaries.reduce((sum, item) => sum + item.free, 0);
  const totalSlots = totalPerDay * dates.length;

  return (
    <section className="availability card" aria-label="Verfügbarkeitsübersicht">
      <div className="availability-main">
        <span>Freie Buchungsstarts</span>
        <strong>{totalFree} / {totalSlots}</strong>
        <small>{activeCourts.length} aktive Plätze · {slots.length} Startzeiten pro Tag</small>
      </div>
      <div className="availability-days">
        {summaries.map((item) => (
          <div key={item.dateValue} className="availability-day">
            <span>{weekdayShort(item.dateValue)}</span>
            <strong>{item.free}</strong>
            <small>frei</small>
          </div>
        ))}
      </div>

      <div className="free-starts">
        <div>
          <h3>Schnell freie Zeiten buchen</h3>
          <p>Eine passende freie Zeit anklicken und danach die Buchung bestätigen.</p>
        </div>
        {suggestions.length === 0 ? (
          <p className="empty-state">Für die aktuelle Ansicht sind keine freien, buchbaren Zeiten mehr sichtbar.</p>
        ) : (
          <div className="free-start-grid">
            {suggestions.map((item) => (
              <Link className="free-start-card" key={`${item.dateValue}-${item.court.id}-${item.slot.value}`} href={item.href}>
                <strong>{weekdayLong(item.dateValue)}</strong>
                <span>{item.court.name}</span>
                <small>{item.slot.label}–{formatTime(item.endsAt)}</small>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
