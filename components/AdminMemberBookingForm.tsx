import { bookCourtForMember } from "@/app/actions";
import { MAX_ADVANCE_DAYS } from "@/lib/config";
import { addDays, bookingStartTimes, formatTime, getSlotLocal, toDateInputValue } from "@/lib/dates";
import type { CalendarView, Court, Profile } from "@/lib/types";

type Props = {
  date: string;
  view: CalendarView;
  courts: Court[];
  members: Profile[];
};

function memberLabel(member: Profile): string {
  const details = [member.member_number ? `Nr. ${member.member_number}` : null, member.email].filter(Boolean).join(" · ");
  return details ? `${member.full_name} (${details})` : member.full_name;
}

export function AdminMemberBookingForm({ date, view, courts, members }: Props) {
  const today = toDateInputValue();
  const maxDate = toDateInputValue(addDays(new Date(`${today}T00:00:00`), MAX_ADVANCE_DAYS));
  const activeCourts = courts.filter((court) => court.is_active);
  const startTimes = bookingStartTimes();

  return (
    <section className="card admin-member-booking" aria-labelledby="admin-member-booking-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Admin-Hilfe</p>
          <h2 id="admin-member-booking-title">Für ein Mitglied buchen</h2>
          <p>Für Mitglieder, die nicht gut mit Handy oder Computer zurechtkommen. Die Buchung erscheint normal im Kalender.</p>
        </div>
      </div>

      <form action={bookCourtForMember} className="admin-member-grid">
        <input type="hidden" name="view" value={view} />
        <label className="wide">
          <span>Mitglied</span>
          <select name="memberId" required defaultValue="">
            <option value="" disabled>Mitglied auswählen</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>{memberLabel(member)}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Datum</span>
          <input name="date" type="date" defaultValue={date} min={today} max={maxDate} required />
        </label>

        <label>
          <span>Platz</span>
          <select name="courtId" required defaultValue={activeCourts[0]?.id ?? ""}>
            {activeCourts.length === 0 ? <option value="">Kein aktiver Platz verfügbar</option> : null}
            {activeCourts.map((court) => <option key={court.id} value={court.id}>{court.name}</option>)}
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

        <label className="wide">
          <span>Hinweis optional</span>
          <input name="notes" maxLength={120} placeholder="z. B. telefonisch gebucht" />
        </label>

        <button className="large-primary" type="submit" disabled={activeCourts.length === 0 || members.length === 0}>Für Mitglied buchen</button>
      </form>
    </section>
  );
}
