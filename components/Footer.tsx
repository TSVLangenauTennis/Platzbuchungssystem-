import Link from "next/link";
import { CLUB_CONTACT_EMAIL, CLUB_NAME } from "@/lib/config";

export function Footer() {
  return (
    <footer className="footer card">
      <div>
        <strong>{CLUB_NAME}</strong>
        <p>Bei Fragen zur Buchung: {CLUB_CONTACT_EMAIL}</p>
      </div>
      <nav aria-label="Rechtliches und Hilfe">
        <Link href="/datenschutz">Datenschutz</Link>
        <Link href="/impressum">Impressum</Link>
        <a href="#einfach-buchen">Einfach buchen</a>
        <a href="#kalender">Zum Kalender</a>
      </nav>
    </footer>
  );
}
