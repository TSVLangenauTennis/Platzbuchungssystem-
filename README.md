# TSV Langenau Tennis – Platzbuchungssystem

Vereinsnahe Web-App/PWA für die Platzbuchung eines Tennisvereins mit **5 Plätzen** und bis zu ca. **400 Mitgliedern**.

Diese Version ist keine lose Demo mehr, sondern eine deutlich gehärtete und benutzerfreundliche MVP-Version für einen realistischen Vereinsbetrieb: Admin-Freigabe, Wochen-/Tagesansicht, 60-Minuten-Buchungen mit Start zur vollen oder halben Stunde, Sperrzeiten, Platzverwaltung, CSV-Exporte, Audit-Protokoll, Bestätigungsseiten und Datenbank-Schutz gegen Doppelbuchungen und Manipulation.

## Aktueller Ausbau dieser Version

Diese Version wurde zusätzlich auf einfache Bedienbarkeit für gemischte Vereinsmitglieder optimiert, insbesondere auch für ältere Mitglieder:

- neue einfache Buchungsmaske „Platz in 3 Schritten buchen“
- Mitglieder können ohne Kalenderverständnis direkt Datum, Platz und Startzeit auswählen
- Kalender bleibt vollständig erhalten, wird aber durch Hilfetexte und Legende verständlicher
- größere Buttons und Eingabefelder für bessere Bedienbarkeit am Handy und Tablet
- klarere Begriffe: „Ein Tag“, „Ganze Woche“, „Jetzt buchen“, „Diese Buchung stornieren“
- weniger überladene Kopfzeile; Admin-Funktionen liegen gesammelt im Adminbereich
- sichtbare Kurzhilfe: Farben, freie Felder und eigene Buchungen werden erklärt
- Datenschutz/Impressum in den Fußbereich verschoben, damit normale Mitglieder nicht abgelenkt werden
- bessere Kontraste, stärkere Fokus-Markierung und größere Klickflächen
- Login-/Registrierungsseite verständlicher formuliert
- Verfügbarkeitsübersicht oberhalb des Kalenders
- Legende für Buchungsarten
- bessere Mobile-/Tablet-Darstellung
- Admin-Navigation auf allen Admin-Seiten
- Platzverwaltung unter `/admin/courts`
- Admins können Platznamen ändern und Plätze deaktivieren/reaktivieren
- Mitglieder können nicht auf deaktivierten Plätzen buchen
- vergangene Uhrzeiten werden nicht als freie Buchungsoption angeboten
- zusätzliche Datenbankregeln für exakt 60 Minuten Mitgliedsbuchungsdauer und aktive Plätze
- erweiterte Security Header und Noindex-Metadaten
- neue Startkarte „Was möchten Sie tun?“ mit direkten Wegen zu Buchen, Meine Buchungen und Hilfe
- Buchungen werden nicht mehr sofort erstellt, sondern zuerst auf einer Klartext-Bestätigungsseite geprüft
- Stornierungen werden ebenfalls erst auf einer Klartext-Seite bestätigt
- freie Zeiten werden als große Schnellbuchungs-Karten angezeigt
- Admins können direkt für ein freigegebenes Mitglied buchen, z. B. bei telefonischer Anfrage
- Passwort-vergessen-Hilfe mit Supabase-Reset-Link

## Kernfunktionen

### Buchung

- 5 feste Plätze: Platz 1 bis Platz 5
- einfache Buchungsmaske in 3 Schritten zusätzlich zum Kalender
- zusätzliche Bestätigungsseite vor dem verbindlichen Buchen
- Tagesansicht und Wochenansicht
- moderne Verfügbarkeitsübersicht mit freien Startzeiten
- freie Zeiten als große Schnellbuchungs-Karten
- übersichtliche Legende für Mitgliedsbuchung, Training, Verbandsspiel/Turnier und Sperrzeit
- automatischer Kalender; keine Wochenblätter mehr manuell anlegen
- Öffnungszeit: 07:00 bis 22:00 Uhr
- feste Buchungsdauer: 60 Minuten
- Startzeiten im 30-Minuten-Raster, z. B. 17:00–18:00 oder 17:30–18:30
- Buchungen bis 31 Tage im Voraus
- belegte Zeiten können nicht überschrieben werden
- harte PostgreSQL-Exclusion-Constraint gegen Überschneidungen
- zusätzliche Datenbankregel: Mitgliedsbuchungen müssen exakt 60 Minuten dauern
- zusätzliche Datenbankregel: Mitglieder dürfen nur aktive Plätze buchen
- Schutz auch bei gleichzeitigen Klicks auf denselben Platz/Zeitbereich
- Mitglieder können eigene kommende Buchungen nach Bestätigung stornieren
- Admins können alle aktiven Buchungen und Sperrzeiten löschen
- optionales Feld pro Buchung: Spielpartner/Hinweis
- „Meine nächsten Buchungen“ direkt auf der Startseite
- vergangene Uhrzeiten werden in der Oberfläche nicht mehr als buchbar angezeigt
- deaktivierte Plätze werden sichtbar, aber nicht buchbar dargestellt

### Admin und Vereinsbetrieb

- Admin-Übersicht unter `/admin`
- Mitgliederverwaltung unter `/admin/members`
- Buchungsverwaltung unter `/admin/bookings`
- Audit-Protokoll unter `/admin/audit`
- Platzverwaltung unter `/admin/courts`
- CSV-Export für Buchungen und Mitglieder
- Admin-Navigation auf allen Admin-Seiten
- Filter für Mitglieder nach Status und Suchbegriff
- Filter für Buchungen nach Zeitraum, Art und Suchbegriff
- neue Konten sind zunächst nicht freigegeben
- Admin-Freigabe, bevor ein Mitglied buchen kann
- Admin kann Mitglieder freigeben, sperren und Adminrechte vergeben/entziehen
- Admin kann im Namen eines freigegebenen Mitglieds buchen, z. B. nach Telefonanruf oder persönlicher Nachfrage
- Sammel-Freigabe wartender Mitglieder, falls vorher geprüft
- Platznamen bearbeiten und Plätze bei längeren Ausfällen deaktivieren
- Deaktivierung eines Platzes wird blockiert, solange kommende Mitgliedsbuchungen darauf liegen
- Stammdaten im Profil:
  - Name
  - E-Mail
  - Telefonnummer optional
  - Mitgliedsnummer optional
- Mitglieder können eigene Stammdaten ändern, aber keine Rollen/Freigaben manipulieren

### Feste Termine / Sperrzeiten

Admins können feste Termine eintragen:

- Training
- Verbandsspiel
- Turnier
- Wartung
- Sperrzeit

Möglich sind:

- ein Platz oder mehrere Plätze gleichzeitig
- einmalige Termine
- wöchentliche Wiederholungen
- Start und Ende im 30-Minuten-Raster
- Hinweise für Mitglieder, z. B. „Jugend U15“ oder „Platzpflege“

Diese Termine liegen in derselben Tabelle wie Buchungen und blockieren Plätze technisch genauso hart wie normale Mitgliedsbuchungen.

## Sicherheits- und Stabilitätsfunktionen

### Anti-Doppelbuchung

Die wichtigste Regel sitzt direkt in PostgreSQL:

```sql
alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    court_id with =,
    tsrange(starts_at, ends_at, '[)') with &&
  )
  where (cancelled_at is null);
```

Bedeutung: Auf demselben Platz darf kein aktiver Zeitraum einen anderen aktiven Zeitraum überlappen. Eine Buchung 17:00–18:00 blockiert automatisch auch 17:30–18:30.

### Schutz gegen Buchungsmanipulation

Zusätzlich gibt es einen Datenbank-Trigger `guard_booking_update_trigger`.

Normale Mitglieder dürfen eigene Buchungen **nur stornieren**. Sie können über die öffentliche Supabase-Schnittstelle nicht heimlich:

- den Platz ändern
- die Startzeit ändern
- die Endzeit ändern
- den Titel ändern
- die Art der Buchung ändern
- fremde Buchungen ändern

Das ist wichtig, weil Supabase mit öffentlichem Anon-Key arbeitet und Sicherheit deshalb nicht nur im Frontend liegen darf.

### Row Level Security

Die Datenbank nutzt RLS:

- nur freigegebene Mitglieder sehen Kalenderdaten
- nur freigegebene Mitglieder können buchen
- Mitglieder können nur eigene kommende Buchungen stornieren
- Admins können Buchungen/Sperrzeiten verwalten
- Profile sind nur für das eigene Mitglied oder Admins sichtbar
- Audit-Logs sind nur für Admins sichtbar

### Audit-Protokoll

Wichtige Aktionen werden protokolliert:

- Registrierung
- Mitglied freigegeben/gesperrt
- Adminrecht vergeben/entzogen
- Buchung erstellt
- Buchung storniert
- fester Termin erstellt/gelöscht

Das Protokoll hilft dem Vorstand bei Rückfragen und Missverständnissen.

### Weitere Schutzmaßnahmen

- serverseitige Formularverarbeitung über Server Actions
- Eingabevalidierung mit Zod
- CSV-Export mit Schutz gegen CSV-Formula-Injection
- erweiterte Security Header über `next.config.ts`
- Noindex-Metadaten für Vereins-/Mitgliederbereich
- `robots.txt` blockiert Suchmaschinenindexierung
- Honeypot-Feld gegen einfache Registrierungsbots
- Mindestpasswortlänge: 8 Zeichen
- feste Paketversionen für reproduzierbarere Deployments
- npm audit aktuell ohne bekannte Produktiv-Abhängigkeitslücke

## Technischer Aufbau

- Next.js App Router
- React
- Supabase Auth
- Supabase/PostgreSQL als Datenbank
- PostgreSQL Exclusion Constraint gegen Überschneidungen
- Row Level Security
- Datenbank-Trigger gegen Manipulation
- Audit-Log-Tabelle
- Server Actions für Buchung/Formulare
- Route Handler für CSV-Exporte
- PWA-Grundlage über `public/manifest.webmanifest`

## Projektstruktur

```text
app/page.tsx                         Kalender und Buchung
app/login/page.tsx                   Login/Registrierung
app/account/page.tsx                 Eigene Profildaten
app/admin/page.tsx                   Admin-Dashboard
app/admin/members/page.tsx           Mitgliederverwaltung
app/admin/bookings/page.tsx          Buchungsverwaltung
app/admin/courts/page.tsx            Platzverwaltung
app/admin/audit/page.tsx             Audit-Protokoll
app/admin/export/bookings/route.ts   CSV-Export Buchungen
app/admin/export/members/route.ts    CSV-Export Mitglieder
app/actions.ts                       Server Actions
components/BookingBoard.tsx          Tages-/Wochenkalender
components/SimpleBookingForm.tsx     Einfache Buchung in 3 Schritten
components/MemberHelp.tsx            Kurzhilfe für Mitglieder
components/Footer.tsx                Fußbereich mit Kontakt/Rechtlichem
components/AvailabilitySummary.tsx   Verfügbarkeitsübersicht
components/AdminNav.tsx              Admin-Navigation
components/MyBookings.tsx            Eigene kommende Buchungen
components/AdminBlockForm.tsx        Training/Sperrzeiten/Turniere
components/BookingRules.tsx          Buchungsregeln
lib/config.ts                        Vereinsregeln
supabase/schema.sql                  Datenbank, RLS, Trigger, Audit, Anti-Doppelbuchung
public/manifest.webmanifest          PWA-Grundlage
public/icon.svg                      App-Icon
proxy.ts                             Supabase Session Refresh
next.config.ts                       Security Header
```

## Lokales Setup

### 1. Abhängigkeiten installieren

```bash
npm install
```

### 2. Supabase-Projekt anlegen

In Supabase ein neues Projekt erstellen.

### 3. Datenbank-Schema ausführen

Die Datei `supabase/schema.sql` komplett im Supabase SQL Editor ausführen.

Das legt unter anderem an:

- `profiles`
- `courts`
- `bookings`
- `audit_logs`
- RLS-Policies
- Anti-Doppelbuchungs-Constraint
- Trigger gegen Buchungsmanipulation
- automatische Profil-Erstellung bei Registrierung
- Admin-Freigabe für Mitglieder
- sichere Profil-Update-Funktion `update_own_profile`

### 4. Umgebungsvariablen setzen

`.env.example` kopieren:

```bash
cp .env.example .env.local
```

Dann eintragen:

```env
NEXT_PUBLIC_SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=DEIN-ANON-KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 5. Entwicklungsserver starten

```bash
npm run dev
```

Dann öffnen:

```text
http://localhost:3000
```

### 6. Build prüfen

```bash
npm run typecheck
npm run build
```

## Ersten Admin setzen

1. Auf der Website registrieren.
2. In Supabase unter `Authentication > Users` die User-ID kopieren.
3. Im SQL Editor ausführen:

```sql
update public.profiles
set is_admin = true,
    is_approved = true,
    approved_at = now()
where id = 'HIER-DIE-USER-ID-EINFÜGEN';
```

Danach ausloggen/einloggen. Dann erscheinen die Admin-Bereiche.

## Vereinsregeln ändern

Die wichtigsten Regeln stehen in `lib/config.ts`:

```ts
export const COURT_COUNT = 5;
export const OPENING_HOUR = 7;
export const CLOSING_HOUR = 22;
export const MAX_ADVANCE_DAYS = 31;
export const SLOT_MINUTES = 60;
export const SLOT_STEP_MINUTES = 30;
export const MAX_EXPECTED_MEMBERS = 400;
```

Die Buchungsdauer ist bewusst fest auf 60 Minuten ausgelegt. `SLOT_STEP_MINUTES = 30` bedeutet: Mitglieder können alle 30 Minuten eine 60-Minuten-Buchung starten.

Wichtig: Wenn `OPENING_HOUR`, `CLOSING_HOUR`, `MAX_ADVANCE_DAYS`, `SLOT_MINUTES` oder `SLOT_STEP_MINUTES` geändert werden, müssen die Datenbank-Policies in `supabase/schema.sql` fachlich mitgeprüft werden.

## Datenschutz / Impressum

Die Seiten `/datenschutz` und `/impressum` sind als Platzhalter vorhanden. Vor produktivem Einsatz müssen sie vom Verein ergänzt und geprüft werden, insbesondere:

- Verantwortlicher Verein
- vertretungsberechtigter Vorstand
- Kontaktangaben
- Rechtsgrundlage der Verarbeitung
- Speicherdauer
- Betroffenenrechte
- Auftragsverarbeitung mit Supabase/Vercel
- Lösch-/Archivierungskonzept für alte Buchungen

## Empfohlener Produktivstart im Verein

Vor Freigabe an alle Mitglieder:

1. Supabase Auth-E-Mails konfigurieren.
2. Datenschutz/Impressum fertigstellen.
3. 10–20 Testnutzer registrieren.
4. Admin-Freigabe durchspielen.
5. gleichzeitige Buchungen auf denselben Slot testen.
6. Training/Sperrzeiten für eine echte Woche eintragen.
7. mobile Darstellung auf iPhone/Android prüfen.
8. CSV-Export testen.
9. Backup-/Exportprozess festlegen.
10. Link/QR-Code erst danach vereinsintern verteilen.

## Deployment auf Vercel

1. Projekt zu GitHub hochladen.
2. In Vercel importieren.
3. Environment Variables setzen:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` für Passwort-Reset-Links, z. B. `https://buchung.euer-verein.de`
4. Deploy starten.
5. Domain/Subdomain verbinden, z. B. `buchung.tsv-langenau-tennis.de`.

## Noch nicht enthalten

Bewusst nicht eingebaut, weil es für Version 1 nicht zwingend notwendig ist:

- automatische E-Mail-Benachrichtigung bei Buchung/Stornierung/Freigabe
- Zahlungsfunktion für Gastspieler
- echter CSV-Import mit automatischer Auth-Nutzer-Erstellung
- separate Trainerrolle
- Push-Benachrichtigungen
- Offline-Buchung
- komplexe Buchungskontingente pro Mitglied

Für den Start eines Vereins mit ca. 400 Mitgliedern ist das System damit bewusst einfach, robust und nachvollziehbar gehalten.


## Neue Bedienlogik ab dieser Version

Für normale Mitglieder ist die Seite jetzt stärker geführt:

1. Startseite zeigt zuerst die wichtigsten Wege.
2. Mitglied wählt Datum, Platz und Startzeit.
3. Vor dem Buchen erscheint eine Bestätigungsseite mit Datum, Platz, Uhrzeit und Dauer.
4. Erst „Verbindlich buchen“ erstellt die Buchung.
5. Stornieren läuft ebenfalls über eine Sicherheitsabfrage.

Das reduziert Fehlklicks und ist besonders wichtig für ältere Mitglieder oder Mitglieder, die nur selten online buchen.

Admins können außerdem direkt für ein Mitglied buchen. Dadurch bleibt das System auch zugänglich, wenn jemand telefonisch oder persönlich um eine Buchung bittet.
