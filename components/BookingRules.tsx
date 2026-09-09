import { MAX_ADVANCE_DAYS, MEMBER_BOOKING_LEAD_MINUTES } from "@/lib/config";

export function BookingRules() {
  const leadHours = MEMBER_BOOKING_LEAD_MINUTES / 60;

  return (
    <details className="card collapsible-card">
      <summary>
        <div>
          <strong>Buchungsregeln</strong>
          <span>Wichtige Regeln zur Platzbuchung</span>
        </div>
        <span className="collapse-arrow">⌄</span>
      </summary>

      <div className="collapsible-content rules-list">
        <ul>
          <li>Eine Buchung dauert immer genau 60 Minuten.</li>
          <li>Startzeiten sind zur vollen oder halben Stunde möglich.</li>
          <li>Buchungen sind maximal {MAX_ADVANCE_DAYS} Tage im Voraus möglich.</li>
          <li>
            Eine eigene Buchung ist nur möglich, bis {leadHours} Stunde{leadHours === 1 ? "" : "n"} vor
            Spielbeginn. Danach kann nur noch ein Admin den Platz für Sie eintragen.
          </li>
          <li>Ein Platz kann nicht doppelt gebucht werden – wer zuerst bucht, bekommt die Zeit.</li>
          <li>Eigene kommende Buchungen können bis zum Beginn storniert werden.</li>
          <li>Feste Termine (Training, Verbandsspiele, Turniere, Sperrzeiten) legt ausschließlich ein Admin an.</li>
          <li>Ihr Konto muss von einem Admin freigegeben sein, bevor Sie Plätze buchen können.</li>
        </ul>
      </div>
    </details>
  );
}
