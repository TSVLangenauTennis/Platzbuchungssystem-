import { createAdminBlock } from "@/app/actions";
import { adminEndTimes, adminStartTimes } from "@/lib/dates";
import type { CalendarView, Court } from "@/lib/types";

export function AdminBlockForm({ courts, date, view }: { courts: Court[]; date: string; view: CalendarView }) {
  const startTimes = adminStartTimes();
  const endTimes = adminEndTimes();

  return (
    <section className="card" aria-label="Admin feste Termine">
      <form action={createAdminBlock} className="admin-grid">
        <input type="hidden" name="view" value={view} />

        <label className="wide">
          Titel
          <input name="title" placeholder="z. B. Jugendtraining" required minLength={2} maxLength={80} />
        </label>

        <label className="wide">
          Hinweis optional
          <input name="notes" placeholder="z. B. Platz 1–3 nur Jugend U15" maxLength={180} />
        </label>

        <label>
          Art
          <select name="kind" defaultValue="training">
            <option value="training">Training</option>
            <option value="match">Verbandsspiel</option>
            <option value="tournament">Turnier</option>
            <option value="maintenance">Wartung</option>
            <option value="blocked">Gesperrt</option>
          </select>
        </label>

        <label>
          Datum
          <input name="date" type="date" defaultValue={date} required />
        </label>

        <label>
          Von
          <select name="startsTime" defaultValue="18:00">
            {startTimes.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label>
          Bis
          <select name="endsTime" defaultValue="20:00">
            {endTimes.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label>
          Wiederholung
          <select name="repeat" defaultValue="once">
            <option value="once">Einmalig</option>
            <option value="weekly">Wöchentlich</option>
          </select>
        </label>

        <label>
          Bis Datum
          <input name="untilDate" type="date" />
        </label>

        <div className="full">
          <strong>Plätze</strong>
          <div className="court-checks">
            {courts.map((court) => (
              <label key={court.id}>
                <input type="checkbox" name="courtIds" value={court.id} />
                {court.name}
              </label>
            ))}
          </div>
        </div>

        <div className="full form-hint">
          Feste Termine können ebenfalls im 30-Minuten-Raster beginnen und enden. Sie blockieren den Zeitraum technisch genauso wie normale Buchungen.
        </div>

        <div className="full">
          <button type="submit">Festen Termin eintragen</button>
        </div>
      </form>
    </section>
  );
}
