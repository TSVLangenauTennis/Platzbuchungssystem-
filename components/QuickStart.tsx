export function QuickStart() {
  return (
    <section className="quick-start card" aria-labelledby="quick-start-title">
      <div>
        <p className="eyebrow">Start</p>
        <h2 id="quick-start-title">Was möchten Sie tun?</h2>
        <p>Die wichtigsten Funktionen sind hier groß und einfach erreichbar.</p>
      </div>
      <div className="quick-start-actions">
        <a className="quick-action primary-action" href="#einfach-buchen">
          <strong>Platz buchen</strong>
          <span>Datum, Platz und Uhrzeit auswählen</span>
        </a>
        <a className="quick-action" href="#meine-buchungen">
          <strong>Meine Buchungen</strong>
          <span>Kommende Termine ansehen oder stornieren</span>
        </a>
        <a className="quick-action" href="#hilfe">
          <strong>Hilfe anzeigen</strong>
          <span>Kurze Erklärung für Mitglieder</span>
        </a>
      </div>
    </section>
  );
}
