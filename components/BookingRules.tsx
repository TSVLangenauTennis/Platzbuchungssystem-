import { MAX_ADVANCE_DAYS } from "@/lib/config";

export function BookingRules() {
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
          <li>Eigene kommende Buchungen können vor Beginn storniert werden.</li>
        </ul>
      </div>
    </details>
  );
}
