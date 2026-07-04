import { NextResponse } from "next/server";
import { MEMBER_LIST_LIMIT } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

function csvCell(value: unknown): string {
  const raw = value == null ? "" : String(value);
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}

function status(profile: Profile): string {
  if (profile.is_admin) return "Admin";
  if (profile.is_approved) return "Freigegeben";
  return "Wartet";
}

export async function GET() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return new NextResponse("Nicht angemeldet", { status: 401 });

  const { data: currentProfile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!currentProfile?.is_admin) return new NextResponse("Nur Admins", { status: 403 });

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, member_number, is_admin, is_approved, approved_at, approved_by, created_at")
    .order("created_at", { ascending: false })
    .limit(MEMBER_LIST_LIMIT)
    .returns<Profile[]>();

  const rows = [
    ["Name", "E-Mail", "Telefon", "Mitgliedsnummer", "Status", "Registriert", "Freigegeben"],
    ...((profiles ?? []).map((profile) => [
      profile.full_name,
      profile.email ?? "",
      profile.phone ?? "",
      profile.member_number ?? "",
      status(profile),
      profile.created_at,
      profile.approved_at ?? ""
    ]))
  ];

  const csv = rows.map((row) => row.map(csvCell).join(";")).join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mitglieder.csv"`,
      "Cache-Control": "no-store"
    }
  });
}
