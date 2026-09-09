export function MemberHelp() {
  return (
    <details className="card collapsible-card">
      <summary>
        <div>
          <strong>Kurzanleitung</strong>
          <span>So funktioniert die Platzbuchung</span>
        </div>
        <span className="collapse-arrow">⌄</span>
      </summary>

      <div className="collapsible-content help-grid">
        <div>
          <strong>1. Platz buchen</strong>
          <span>Datum, Platz und Uhrzeit im Formular auswählen und bestätigen – fertig.</span>
        </div>

        <div>
          <strong>2. Frei</strong>
          <span>Freie Felder im Kalender können gebucht werden.</span>
        </div>

        <div>
          <strong>3. Belegt</strong>
          <span>Diese Zeit ist bereits reserviert und kann nicht gebucht werden.</span>
        </div>

        <div>
          <strong>4. Wischen</strong>
          <span>Am Handy den Kalender seitlich schieben, um weitere Plätze/Zeiten zu sehen.</span>
        </div>

        <div>
          <strong>5. Andere Woche/Datum</strong>
          <span>Über die Wochenpfeile blättern oder den roten Button „Anderes Datum wählen" nutzen.</span>
        </div>

        <div>
          <strong>6. Meine Buchungen</strong>
          <span>Unter „Meine Buchungen" sehen Sie alle eigenen kommenden Termine.</span>
        </div>

        <div>
          <strong>7. Stornieren</strong>
          <span>Eigene kommende Buchungen können dort bis zum Beginn wieder gelöscht werden.</span>
        </div>

        <div>
          <strong>8. Kurzfristig?</strong>
          <span>Weniger als 2 Stunden vor Spielbeginn können Sie selbst nicht mehr buchen – dann hilft ein Admin.</span>
        </div>
      </div>
    </details>
  );
}
