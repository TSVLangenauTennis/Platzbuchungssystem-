import Link from "next/link";
import { signOut } from "@/app/actions";
import { CLUB_NAME } from "@/lib/config";
import type { CalendarView } from "@/lib/types";

export function Header({
  userName,
  isAdmin
}: {
  date: string;
  view: CalendarView;
  userName: string;
  isAdmin: boolean;
}) {
  return (
    <header className="header">
      <div className="brand">
        <p className="eyebrow">Platzbuchung</p>
        <h1>{CLUB_NAME}</h1>
        <p>Hallo {userName}. Wählen Sie Datum, Platz und Uhrzeit aus.</p>
      </div>

      <div className="header-actions" aria-label="Hauptaktionen">
        <Link className="button secondary" href="/account">
          Meine Daten
        </Link>

        {isAdmin ? (
          <Link className="button secondary" href="/admin">
            Adminbereich
          </Link>
        ) : null}

        <form action={signOut}>
          <button className="secondary" type="submit">
            Abmelden
          </button>
        </form>
      </div>
    </header>
  );
}
