import { updatePassword } from "@/app/actions";
import { MIN_PASSWORD_LENGTH } from "@/lib/config";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ResetPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const success = typeof params.success === "string" ? params.success : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;

  return (
    <main className="auth-shell">
      <section className="card reset-card">
        <p className="eyebrow">Passwort ändern</p>
        <h1>Neues Passwort setzen</h1>
        <p>Geben Sie ein neues Passwort ein. Danach können Sie sich wieder normal einloggen.</p>
        {success ? <p className="notice success" role="status">{success}</p> : null}
        {error ? <p className="notice error" role="alert">{error}</p> : null}
        <form action={updatePassword} className="form-stack">
          <label>
            Neues Passwort
            <input name="password" type="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} required />
            <small>Mindestens {MIN_PASSWORD_LENGTH} Zeichen.</small>
          </label>
          <button className="large-primary" type="submit">Passwort speichern</button>
        </form>
      </section>
    </main>
  );
}
