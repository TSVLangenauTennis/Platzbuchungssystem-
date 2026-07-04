import Link from "next/link";
import { CLUB_NAME, CLUB_CONTACT_EMAIL } from "@/lib/config";

export default function ImpressumPage() {
  return (
    <main className="page narrow-page">
      <header className="header">
        <div className="brand">
          <h1>Impressum</h1>
          <p>Platzhalter für die Pflichtangaben des Vereins.</p>
        </div>
        <Link className="button secondary" href="/">Zur Buchung</Link>
      </header>
      <section className="card account-card form-stack">
        <p><strong>{CLUB_NAME}</strong></p>
        <p>Bitte Vereinsadresse, vertretungsberechtigten Vorstand, Registerangaben und Kontaktangaben ergänzen.</p>
        <p>Kontakt für Buchungssystem: {CLUB_CONTACT_EMAIL}</p>
      </section>
    </main>
  );
}
