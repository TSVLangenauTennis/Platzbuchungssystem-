import Link from "next/link";
import { CLUB_NAME, CLUB_CONTACT_EMAIL } from "@/lib/config";

export default function DatenschutzPage() {
  return (
    <main className="page narrow-page">
      <header className="header">
        <div className="brand">
          <h1>Datenschutz</h1>
          <p>Platzhalter für die Datenschutzhinweise des Vereins.</p>
        </div>
        <Link className="button secondary" href="/">Zur Buchung</Link>
      </header>
      <section className="card account-card form-stack">
        <p><strong>{CLUB_NAME}</strong> verarbeitet für die Platzbuchung insbesondere Name, E-Mail, optional Telefonnummer/Mitgliedsnummer und Buchungsdaten.</p>
        <p>Vor produktivem Einsatz muss der Verein diese Seite rechtlich prüfen und um Verantwortlichen, Rechtsgrundlagen, Speicherdauer, Betroffenenrechte und Supabase/Vercel-Auftragsverarbeitung ergänzen.</p>
        <p>Kontakt für Datenschutz-/Buchungsfragen: {CLUB_CONTACT_EMAIL}</p>
      </section>
    </main>
  );
}
