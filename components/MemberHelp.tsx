export function MemberHelp() {
  return (
    <details className="card collapsible-card">
      <summary>
        <div>
          <strong>Kurze Hilfe</strong>
          <span>So lesen Sie den Kalender</span>
        </div>
        <span className="collapse-arrow">⌄</span>
      </summary>

      <div className="collapsible-content help-grid">
        <div>
          <strong>Frei</strong>
          <span>Freie Felder können gebucht werden.</span>
        </div>

        <div>
          <strong>Belegt</strong>
          <span>Diese Zeit ist bereits reserviert.</span>
        </div>

        <div>
          <strong>Wischen</strong>
          <span>Am Handy den Kalender seitlich schieben.</span>
        </div>

        <div>
          <strong>Stornieren</strong>
          <span>Eigene kommende Buchungen können gelöscht werden.</span>
        </div>
      </div>
    </details>
  );
}
