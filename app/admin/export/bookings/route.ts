import { NextRequest, NextResponse } from "next/server";
import { ADMIN_BOOKING_EXPORT_LIMIT, MAX_ADVANCE_DAYS } from "@/lib/config";
import { addDays, toDateInputValue } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { Booking, BookingKind, Court } from "@/lib/types";

function csvCell(value: unknown): string {
  const raw = value == null ? "" : String(value);
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}

function parseDate(value: string | null, fallback: string): string {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback;
}

function parseKind(value: string | null): BookingKind | "all" {
  return value === "member" || value === "training" || value === "match" || value === "tournament" || value === "maintenance" || value === "blocked" ? value : "all";
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return new NextResponse("Nicht angemeldet", { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return new NextResponse("Nur Admins", { status: 403 });

  const today = toDateInputValue();
  const defaultEnd = toDateInputValue(addDays(new Date(`${today}T00:00:00`), MAX_ADVANCE_DAYS + 1));
  const from = parseDate(request.nextUrl.searchParams.get("from"), today);
  const to = parseDate(request.nextUrl.searchParams.get("to"), defaultEnd);
  const kind = parseKind(request.nextUrl.searchParams.get("kind"));

  let bookingQuery = supabase
    .from("bookings")
    .select("id, court_id, user_id, created_by, title, kind, starts_at, ends_at, notes, cancelled_at, cancelled_by, cancellation_reason, created_at")
    .gte("starts_at", `${from}T00:00:00`)
    .lt("starts_at", `${to}T00:00:00`)
    .is("cancelled_at", null)
    .order("starts_at", { ascending: true })
    .limit(ADMIN_BOOKING_EXPORT_LIMIT);

  if (kind !== "all") bookingQuery = bookingQuery.eq("kind", kind);

  const [{ data: courts }, { data: bookings }] = await Promise.all([
    supabase.from("courts").select("id, name, is_active").order("id", { ascending: true }).returns<Court[]>(),
    bookingQuery.returns<Booking[]>()
  ]);

  const byCourt = new Map((courts ?? []).map((court) => [court.id, court.name]));
  const rows = [
    ["Datum", "Start", "Ende", "Platz", "Art", "Titel", "Hinweis", "Erstellt am"],
    ...((bookings ?? []).map((booking) => [
      booking.starts_at.slice(0, 10),
      booking.starts_at.slice(11, 16),
      booking.ends_at.slice(11, 16),
      byCourt.get(booking.court_id) ?? `Platz ${booking.court_id}`,
      booking.kind,
      booking.title,
      booking.notes ?? "",
      booking.created_at
    ]))
  ];

  const csv = rows.map((row) => row.map(csvCell).join(";")).join("\n");
  const filename = `platzbuchungen-${from}-bis-${to}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store"
    }
  });
}
