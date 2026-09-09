export const CLUB_NAME = "TSV Langenau Tennis";
export const COURT_COUNT = 5;
export const OPENING_HOUR = 7;
export const CLOSING_HOUR = 22;
export const MAX_ADVANCE_DAYS = 31;
export const SLOT_MINUTES = 60;
export const SLOT_STEP_MINUTES = 30;
export const MAX_EXPECTED_MEMBERS = 400;
export const MAX_WEEKLY_REPEAT_OCCURRENCES = 40;
// Normale Mitglieder können ab wie vielen Minuten vor Spielbeginn nicht mehr buchen.
// Admins sind davon ausgenommen (siehe app/actions.ts: bookCourtForMember).
export const MEMBER_BOOKING_LEAD_MINUTES = 120;
export const CLUB_CONTACT_EMAIL = "tsvlangenau.tennis@gmail.com";
export const MIN_PASSWORD_LENGTH = 8;
export const MEMBER_LIST_LIMIT = MAX_EXPECTED_MEMBERS + 75;
export const ADMIN_BOOKING_EXPORT_LIMIT = 1500;

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
