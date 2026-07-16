import { createAnnouncement } from "@/app/actions";

export function AdminAnnouncementForm() {
  return (
    <section className="card announcement-admin-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">ADMIN</p>
          <h2>Neue Ankündigung</h2>
          <p>
            Diese Mitteilung wird allen freigegebenen Mitgliedern angezeigt.
          </p>
        </div>
      </div>

      <form
        action={createAnnouncement}
        className="announcement-admin-form"
      >
        <label>
          Titel
          <input
            name="title"
            placeholder="z. B. Platz 3 gesperrt"
            required
            minLength={2}
            maxLength={100}
          />
        </label>

        <label>
          Mitteilung
          <textarea
            name="message"
            placeholder="z. B. Platz 3 ist wegen Reparaturarbeiten bis einschließlich Sonntag gesperrt."
            required
            minLength={2}
            maxLength={1000}
            rows={5}
          />
        </label>

        <label>
          Sichtbar bis, optional
          <input
            name="expiresAt"
            type="date"
          />
        </label>

        <div className="form-hint">
          Ohne Enddatum bleibt die Ankündigung sichtbar, bis sie von einem
          Admin gelöscht wird.
        </div>

        <button type="submit">
          Ankündigung veröffentlichen
        </button>
      </form>
    </section>
  );
}
