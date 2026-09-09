import { submitSuggestion } from "@/app/actions";

export function SuggestionBox() {
  return (
    <details className="card collapsible-card">
      <summary>
        <div>
          <strong>Verbesserungsvorschlag</strong>
          <span>Anonym an den Vorstand schreiben</span>
        </div>
        <span className="collapse-arrow">⌄</span>
      </summary>

      <div className="collapsible-content">
        <form action={submitSuggestion} className="form-stack">
          <label>
            <span>Ihr Vorschlag</span>
            <textarea
              name="message"
              rows={4}
              maxLength={1000}
              placeholder="Was können wir am Platzbuchungssystem oder im Vereinsleben besser machen?"
              required
            />
          </label>

          <p className="form-hint">
            Der Vorschlag wird anonym gespeichert – Admins sehen nicht, wer ihn geschrieben hat.
          </p>

          <button type="submit">Anonym absenden</button>
        </form>
      </div>
    </details>
  );
}
