import { CLUB_CONTACT_EMAIL, MAX_ADVANCE_DAYS, SLOT_MINUTES, SLOT_STEP_MINUTES } from "@/lib/config";

export function BookingRules() {
  return (
    <section className="card rules-card" aria-label="Buchungsregeln">
      <strong>Buchungsregeln</strong>
      <ul>
        <li>{SLOT_MINUTES} Minuten pro Buchung.</li>
        <li>Start alle {SLOT_STEP_MINUTES} Minuten, also auch z. B. 17:30–18:30.</li>
        <li>Buchbar bis {MAX_ADVANCE_DAYS} Tage im Voraus.</li>
        <li>Eigene kommende Buchungen können selbst storniert werden.</li>
        <li>Training, Verbandsspiele, Turniere und Wartung blockiert der Admin.</li>
      </ul>
      <span>Bei Problemen: {CLUB_CONTACT_EMAIL}</span>
    </section>
  );
}
