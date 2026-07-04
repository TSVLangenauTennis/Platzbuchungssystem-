export function MemberHelp() {
  return (
    <section className="member-help card" aria-label="Kurze Hilfe zur Platzbuchung">
      <div>
        <p className="eyebrow">Kurze Hilfe</p>
        <h2>So lesen Sie den Kalender</h2>
      </div>
      <div className="help-grid">
        <div><strong>Grün / „Frei“</strong><span>Dieser Platz kann gebucht werden.</span></div>
        <div><strong>Blau</strong><span>Eine normale Mitgliedsbuchung.</span></div>
        <div><strong>Gelb / Lila / Grau</strong><span>Training, Spiel, Turnier, Wartung oder Sperrzeit.</span></div>
        <div><strong>Meine Buchungen</strong><span>Eigene kommende Buchungen stehen oben und können dort storniert werden.</span></div>
      </div>
    </section>
  );
}
