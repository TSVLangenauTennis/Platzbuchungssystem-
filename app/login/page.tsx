import { redirect } from "next/navigation";
import { requestPasswordReset, signIn, signUp } from "@/app/actions";
import { CLUB_CONTACT_EMAIL, CLUB_NAME, MIN_PASSWORD_LENGTH } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/");

  const success = typeof params.success === "string" ? params.success : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;

  return (
    <main className="auth-shell">
      <section className="auth-card card">
        <div className="auth-panel login-intro">
          <p className="eyebrow">Platzbuchung</p>
          <h1>{CLUB_NAME}</h1>
          <p>
            Melden Sie sich mit Ihrer E-Mail-Adresse an. Nach der Registrierung muss ein Admin Ihr Konto einmal freigeben.
          </p>
          <div className="login-help-box">
            <strong>Hilfe für Mitglieder</strong>
            <span>Sie brauchen nur E-Mail und Passwort. Bei Problemen wenden Sie sich an {CLUB_CONTACT_EMAIL}.</span>
          </div>
          {success ? <p className="notice success" role="status">{success}</p> : null}
          {error ? <p className="notice error" role="alert">{error}</p> : null}
        </div>

        <div className="auth-panel">
          <h2>Einloggen</h2>
          <form action={signIn} className="form-stack">
            <label>
              E-Mail-Adresse
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              Passwort
              <input name="password" type="password" autoComplete="current-password" required minLength={MIN_PASSWORD_LENGTH} />
            </label>
            <button className="large-primary" type="submit">Einloggen</button>
          </form>

          <details className="password-help">
            <summary>Passwort vergessen?</summary>
            <p>Geben Sie Ihre E-Mail-Adresse ein. Sie erhalten dann einen Link zum Zurücksetzen des Passworts.</p>
            <form action={requestPasswordReset} className="form-stack compact-form">
              <label>
                E-Mail-Adresse
                <input name="email" type="email" autoComplete="email" required />
              </label>
              <button className="secondary" type="submit">Link anfordern</button>
            </form>
          </details>

          <hr style={{ margin: "28px 0", border: 0, borderTop: "1px solid var(--line)" }} />

          <h2>Neu registrieren</h2>
          <p className="form-hint">Nur für Vereinsmitglieder. Nach dem Absenden prüft ein Admin die Registrierung und schaltet das Konto frei.</p>
          <form action={signUp} className="form-stack">
            <label>
              Vorname und Nachname
              <input name="fullName" type="text" autoComplete="name" placeholder="Vorname Nachname" required />
            </label>
            <label>
              E-Mail-Adresse
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              Telefonnummer optional
              <input name="phone" type="tel" autoComplete="tel" maxLength={40} />
            </label>
            <label>
              Mitgliedsnummer optional
              <input name="memberNumber" type="text" maxLength={40} />
            </label>
            <label>
              Neues Passwort
              <input name="password" type="password" autoComplete="new-password" required minLength={MIN_PASSWORD_LENGTH} />
              <small>Mindestens {MIN_PASSWORD_LENGTH} Zeichen.</small>
            </label>
            <label className="hp-field" aria-hidden="true">
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
            <button type="submit">Registrierung abschicken</button>
          </form>
        </div>
      </section>
    </main>
  );
}
