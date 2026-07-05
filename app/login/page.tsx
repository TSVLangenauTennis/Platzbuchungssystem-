import { requestPasswordReset, signIn, signUp } from "@/app/actions";
import { CLUB_CONTACT_EMAIL, CLUB_NAME, MIN_PASSWORD_LENGTH } from "@/lib/config";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const success = first(params.success);
  const error = first(params.error);

  return (
    <main className="auth-shell login-mobile-shell">
      <section className="card login-mobile-card">
        <div className="login-mobile-head">
          <p className="eyebrow">Platzbuchung</p>
          <h1>{CLUB_NAME}</h1>
          <p>Einloggen und Tennisplatz buchen.</p>
        </div>

        {success ? <p className="notice success">{success}</p> : null}
        {error ? <p className="notice error">{error}</p> : null}

        <section className="login-main-box">
          <h2>Einloggen</h2>

          <form action={signIn} className="form-stack">
            <label>
              <span>E-Mail-Adresse</span>
              <input name="email" type="email" autoComplete="email" required />
            </label>

            <label>
              <span>Passwort</span>
              <input name="password" type="password" autoComplete="current-password" required />
            </label>

            <button className="large-primary" type="submit">
              Einloggen
            </button>
          </form>
        </section>

        <details className="login-collapse card">
          <summary>
            <div>
              <strong>Noch kein Konto?</strong>
              <span>Hier registrieren</span>
            </div>
            <span className="login-collapse-button">Öffnen</span>
          </summary>

          <form action={signUp} className="form-stack login-collapse-content">
            <label>
              <span>Vollständiger Name</span>
              <input name="fullName" autoComplete="name" required />
            </label>

            <label>
              <span>E-Mail-Adresse</span>
              <input name="email" type="email" autoComplete="email" required />
            </label>

            <label>
              <span>Telefonnummer <small>optional</small></span>
              <input name="phone" autoComplete="tel" />
            </label>

            <label>
              <span>Mitgliedsnummer <small>optional</small></span>
              <input name="memberNumber" />
            </label>

            <label>
              <span>Passwort</span>
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                required
              />
              <small>Mindestens {MIN_PASSWORD_LENGTH} Zeichen.</small>
            </label>

            <input className="hp-field" name="website" tabIndex={-1} autoComplete="off" />

            <button type="submit">
              Konto erstellen
            </button>

            <p className="form-hint">
              Nach der Registrierung muss ein Admin das Konto freigeben.
            </p>
          </form>
        </details>

        <details className="login-collapse card">
          <summary>
            <div>
              <strong>Passwort vergessen?</strong>
              <span>Link zum Zurücksetzen anfordern</span>
            </div>
            <span className="login-collapse-button">Öffnen</span>
          </summary>

          <form action={requestPasswordReset} className="form-stack login-collapse-content">
            <label>
              <span>E-Mail-Adresse</span>
              <input name="email" type="email" autoComplete="email" required />
            </label>

            <button className="secondary" type="submit">
              Passwort-Link senden
            </button>

            <p className="form-hint">
              Bei Problemen bitte an {CLUB_CONTACT_EMAIL} wenden.
            </p>
          </form>
        </details>
      </section>
    </main>
  );
}
