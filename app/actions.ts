"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { MAX_ADVANCE_DAYS, MAX_WEEKLY_REPEAT_OCCURRENCES, MIN_PASSWORD_LENGTH, SITE_URL } from "@/lib/config";
import { addDays, adminEndTimes, adminStartTimes, bookingStartTimes, createWeeklyDates, getSlotLocal, getTimeRangeLocal, isValidTimeOption, parseViewParam, timeToMinutes, toDateInputValue } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { Booking, BookingKind, CalendarView } from "@/lib/types";

function redirectToCalendar(date: string, view: CalendarView, type: "success" | "error", message: string): never {
  const params = new URLSearchParams({ date, view, [type]: message });
  redirect(`/?${params.toString()}`);
}

function redirectToMembers(type: "success" | "error", message: string): never {
  const params = new URLSearchParams({ [type]: message });
  redirect(`/admin/members?${params.toString()}`);
}

function redirectToAccount(type: "success" | "error", message: string): never {
  const params = new URLSearchParams({ [type]: message });
  redirect(`/account?${params.toString()}`);
}

function redirectToAdminBookings(type: "success" | "error", message: string): never {
  const params = new URLSearchParams({ [type]: message });
  redirect(`/admin/bookings?${params.toString()}`);
}

function redirectToCourts(type: "success" | "error", message: string): never {
  const params = new URLSearchParams({ [type]: message });
  redirect(`/admin/courts?${params.toString()}`);
}
function redirectToAnnouncements(
  type: "success" | "error",
  message: string
): never {
  const params = new URLSearchParams({ [type]: message });
  redirect(`/ankundigungen?${params.toString()}`);
}
function assertBookableDate(dateValue: string) {
  const today = new Date();
  const earliest = new Date(`${toDateInputValue(today)}T00:00:00`);
  const latest = addDays(earliest, MAX_ADVANCE_DAYS);
  const selected = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(selected.getTime())) throw new Error("Ungültiges Datum.");
  if (selected < earliest) throw new Error("Vergangene Tage können nicht gebucht werden.");
  if (selected > latest) throw new Error(`Buchungen sind maximal ${MAX_ADVANCE_DAYS} Tage im Voraus möglich.`);
}

function assertBookableSlot(dateValue: string, startTime: string) {
  assertBookableDate(dateValue);
  const startsAt = new Date(`${dateValue}T${startTime}:00`);
  if (Number.isNaN(startsAt.getTime())) throw new Error("Ungültige Startzeit.");
  if (startsAt.getTime() <= Date.now()) throw new Error("Vergangene Uhrzeiten können nicht gebucht werden.");
}

async function getCurrentUserOrRedirect() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");
  return { supabase, user };
}

async function assertAdmin() {
  const { supabase, user } = await getCurrentUserOrRedirect();
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) redirect("/");
  return { supabase, user };
}

const bookingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  courtId: z.coerce.number().int().min(1).max(5),
  notes: z.string().trim().max(120).optional().or(z.literal("")),
  view: z.enum(["day", "week"]).optional()
});

export async function bookCourt(formData: FormData) {
  const view = parseViewParam(String(formData.get("view") ?? "day"));
  const parsed = bookingSchema.safeParse({
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    courtId: formData.get("courtId"),
    notes: formData.get("notes") || "",
    view: formData.get("view") || "day"
  });

  if (!parsed.success) redirectToCalendar(String(formData.get("date") ?? toDateInputValue()), view, "error", "Ungültige Buchungsdaten.");

  const { date, startTime, courtId, notes } = parsed.data;

  try {
    assertBookableSlot(date, startTime);
  } catch (error) {
    redirectToCalendar(date, view, "error", error instanceof Error ? error.message : "Buchung nicht möglich.");
  }

  const { supabase, user } = await getCurrentUserOrRedirect();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, is_approved, is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_approved && !profile?.is_admin) {
    redirectToCalendar(date, view, "error", "Ihr Konto ist noch nicht freigegeben.");
  }

  if (!isValidTimeOption(startTime, bookingStartTimes())) {
    redirectToCalendar(date, view, "error", "Diese Startzeit ist nicht buchbar.");
  }

  const { data: court } = await supabase
    .from("courts")
    .select("id, is_active")
    .eq("id", courtId)
    .single();

  if (!court?.is_active) redirectToCalendar(date, view, "error", "Dieser Platz ist aktuell nicht aktiv buchbar.");

  const { startsAt, endsAt } = getSlotLocal(date, startTime);
  const title = profile?.full_name || user.email || "Mitglied";

  const { error } = await supabase.from("bookings").insert({
    court_id: courtId,
    user_id: user.id,
    created_by: user.id,
    title,
    kind: "member",
    starts_at: startsAt,
    ends_at: endsAt,
    notes: notes?.trim() ? notes.trim() : null
  });

  if (error) redirectToCalendar(date, view, "error", "Dieser Platz ist zu dieser Zeit bereits belegt.");

  revalidatePath("/");
  redirectToCalendar(date, view, "success", "Platz gebucht.");
}


const adminMemberBookingSchema = z.object({
  memberId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  courtId: z.coerce.number().int().min(1).max(5),
  notes: z.string().trim().max(120).optional().or(z.literal("")),
  view: z.enum(["day", "week"]).optional()
});

export async function bookCourtForMember(formData: FormData) {
  const view = parseViewParam(String(formData.get("view") ?? "day"));
  const parsed = adminMemberBookingSchema.safeParse({
    memberId: formData.get("memberId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    courtId: formData.get("courtId"),
    notes: formData.get("notes") || "",
    view: formData.get("view") || "day"
  });

  if (!parsed.success) redirectToCalendar(String(formData.get("date") ?? toDateInputValue()), view, "error", "Admin-Buchung unvollständig.");
  const { memberId, date, startTime, courtId, notes } = parsed.data;

  try {
    assertBookableSlot(date, startTime);
  } catch (error) {
    redirectToCalendar(date, view, "error", error instanceof Error ? error.message : "Buchung nicht möglich.");
  }

  if (!isValidTimeOption(startTime, bookingStartTimes())) {
    redirectToCalendar(date, view, "error", "Diese Startzeit ist nicht buchbar.");
  }

  const { supabase, user } = await assertAdmin();

  const [{ data: member }, { data: court }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, is_approved, is_admin")
      .eq("id", memberId)
      .single(),
    supabase
      .from("courts")
      .select("id, is_active")
      .eq("id", courtId)
      .single()
  ]);

  if (!member || (!member.is_approved && !member.is_admin)) redirectToCalendar(date, view, "error", "Dieses Mitglied ist nicht freigegeben.");
  if (!court?.is_active) redirectToCalendar(date, view, "error", "Dieser Platz ist aktuell nicht aktiv buchbar.");

  const { startsAt, endsAt } = getSlotLocal(date, startTime);
  const { error } = await supabase.from("bookings").insert({
    court_id: courtId,
    user_id: member.id,
    created_by: user.id,
    title: member.full_name || member.email || "Mitglied",
    kind: "member",
    starts_at: startsAt,
    ends_at: endsAt,
    notes: notes?.trim() ? notes.trim() : "Durch Admin gebucht"
  });

  if (error) redirectToCalendar(date, view, "error", "Dieser Platz ist zu dieser Zeit bereits belegt.");

  revalidatePath("/");
  revalidatePath("/admin/bookings");
  redirectToCalendar(date, view, "success", "Buchung für Mitglied erstellt.");
}

const cancelSchema = z.object({
  id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  view: z.enum(["day", "week"]).optional()
});

export async function cancelBooking(formData: FormData) {
  const parsed = cancelSchema.safeParse({
    id: formData.get("id"),
    date: formData.get("date"),
    view: formData.get("view") || "day"
  });

  if (!parsed.success) {
    redirectToCalendar(toDateInputValue(), "day", "error", "Buchung konnte nicht gelesen werden.");
  }

  const view = parsed.data.view ?? "day";
  const { supabase } = await getCurrentUserOrRedirect();

  const { error } = await supabase.rpc("cancel_own_booking", {
    p_booking_id: parsed.data.id
  });

  if (error) {
    redirectToCalendar(parsed.data.date, view, "error", "Buchung konnte nicht gelöscht werden.");
  }

  revalidatePath("/");
  revalidatePath("/admin/bookings");

  redirectToCalendar(parsed.data.date, view, "success", "Buchung gelöscht.");
}

export async function cancelBookingAsAdmin(formData: FormData) {
  const parsed = z.object({ id: z.string().uuid() }).safeParse({ id: formData.get("id") });
  if (!parsed.success) redirectToAdminBookings("error", "Buchung konnte nicht gelesen werden.");

  const { supabase, user } = await assertAdmin();
  const { error } = await supabase
    .from("bookings")
    .update({ cancelled_at: new Date().toISOString(), cancelled_by: user.id, cancellation_reason: "Gelöscht durch Admin" })
    .eq("id", parsed.data.id);

  if (error) redirectToAdminBookings("error", "Buchung konnte nicht gelöscht werden.");

  revalidatePath("/");
  revalidatePath("/admin/bookings");
  redirectToAdminBookings("success", "Buchung gelöscht.");
}

const adminBlockSchema = z.object({
  title: z.string().trim().min(2).max(80),
  kind: z.enum(["training", "match", "tournament", "maintenance", "blocked"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startsTime: z.string().regex(/^\d{2}:\d{2}$/),
  endsTime: z.string().regex(/^\d{2}:\d{2}$/),
  repeat: z.enum(["once", "weekly"]),
  untilDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  notes: z.string().trim().max(180).optional().or(z.literal("")),
  view: z.enum(["day", "week"]).optional()
});

export async function createAdminBlock(formData: FormData) {
  const dateForRedirect = String(formData.get("date") ?? toDateInputValue());
  const view = parseViewParam(String(formData.get("view") ?? "day"));
  const courtIds = formData.getAll("courtIds").map(Number).filter((id) => Number.isInteger(id) && id >= 1 && id <= 5);

  const parsed = adminBlockSchema.safeParse({
    title: formData.get("title"),
    kind: formData.get("kind"),
    date: formData.get("date"),
    startsTime: formData.get("startsTime"),
    endsTime: formData.get("endsTime"),
    repeat: formData.get("repeat"),
    untilDate: formData.get("untilDate") || "",
    notes: formData.get("notes") || "",
    view: formData.get("view") || "day"
  });

  if (!parsed.success || courtIds.length === 0) redirectToCalendar(dateForRedirect, view, "error", "Admin-Termin unvollständig.");

  const { title, kind, date, startsTime, endsTime, repeat, untilDate, notes } = parsed.data;

  if (!isValidTimeOption(startsTime, adminStartTimes()) || !isValidTimeOption(endsTime, adminEndTimes())) {
    redirectToCalendar(date, view, "error", "Admin-Termine müssen im 30-Minuten-Raster innerhalb der Öffnungszeit liegen.");
  }

  if (timeToMinutes(endsTime) <= timeToMinutes(startsTime)) redirectToCalendar(date, view, "error", "Endzeit muss nach der Startzeit liegen.");
  if (repeat === "weekly" && !untilDate) redirectToCalendar(date, view, "error", "Bei wöchentlicher Wiederholung muss ein Bis-Datum gesetzt werden.");

  const { supabase, user } = await assertAdmin();

  const dates = repeat === "weekly" ? createWeeklyDates(date, untilDate || date) : [date];
  if (dates.length > MAX_WEEKLY_REPEAT_OCCURRENCES) redirectToCalendar(date, view, "error", `Bitte maximal ${MAX_WEEKLY_REPEAT_OCCURRENCES} Wiederholungen auf einmal eintragen.`);

  const rows = dates.flatMap((dateValue) => {
    const { startsAt, endsAt } = getTimeRangeLocal(dateValue, startsTime, endsTime);
    return courtIds.map((courtId) => ({
      court_id: courtId,
      user_id: null,
      created_by: user.id,
      title,
      kind: kind as BookingKind,
      starts_at: startsAt,
      ends_at: endsAt,
      notes: notes?.trim() ? notes.trim() : null
    }));
  });

  const { error } = await supabase.from("bookings").insert(rows);
  if (error) redirectToCalendar(date, view, "error", "Der feste Termin überschneidet sich mit einer vorhandenen Buchung.");

  revalidatePath("/");
  revalidatePath("/admin/bookings");
  redirectToCalendar(date, view, "success", "Fester Termin eingetragen.");
}

const memberSchema = z.object({ profileId: z.string().uuid() });

export async function approveMember(formData: FormData) {
  const parsed = memberSchema.safeParse({ profileId: formData.get("profileId") });
  if (!parsed.success) redirectToMembers("error", "Mitglied konnte nicht gelesen werden.");

  const { supabase, user } = await assertAdmin();
  const { error } = await supabase
    .from("profiles")
    .update({ is_approved: true, approved_at: new Date().toISOString(), approved_by: user.id })
    .eq("id", parsed.data.profileId);

  if (error) redirectToMembers("error", "Mitglied konnte nicht freigegeben werden.");
  revalidatePath("/admin/members");
  redirectToMembers("success", "Mitglied freigegeben.");
}

export async function approveAllPendingMembers() {
  const { supabase, user } = await assertAdmin();
  const { error } = await supabase
    .from("profiles")
    .update({ is_approved: true, approved_at: new Date().toISOString(), approved_by: user.id })
    .eq("is_approved", false)
    .eq("is_admin", false);

  if (error) redirectToMembers("error", "Ausstehende Mitglieder konnten nicht gesammelt freigegeben werden.");
  revalidatePath("/admin/members");
  redirectToMembers("success", "Alle wartenden Mitglieder wurden freigegeben.");
}

export async function revokeMemberApproval(formData: FormData) {
  const parsed = memberSchema.safeParse({ profileId: formData.get("profileId") });
  if (!parsed.success) redirectToMembers("error", "Mitglied konnte nicht gelesen werden.");

  const { supabase, user } = await assertAdmin();
  if (parsed.data.profileId === user.id) redirectToMembers("error", "Sie können Ihre eigene Freigabe nicht entfernen.");

  const { error } = await supabase
    .from("profiles")
    .update({ is_approved: false, approved_at: null, approved_by: null, is_admin: false })
    .eq("id", parsed.data.profileId);

  if (error) redirectToMembers("error", "Freigabe konnte nicht entfernt werden.");
  revalidatePath("/admin/members");
  redirectToMembers("success", "Freigabe entfernt.");
}

export async function grantAdmin(formData: FormData) {
  const parsed = memberSchema.safeParse({ profileId: formData.get("profileId") });
  if (!parsed.success) redirectToMembers("error", "Mitglied konnte nicht gelesen werden.");

  const { supabase, user } = await assertAdmin();
  const { error } = await supabase
    .from("profiles")
    .update({ is_admin: true, is_approved: true, approved_at: new Date().toISOString(), approved_by: user.id })
    .eq("id", parsed.data.profileId);

  if (error) redirectToMembers("error", "Admin-Recht konnte nicht vergeben werden.");
  revalidatePath("/admin/members");
  redirectToMembers("success", "Admin-Recht vergeben.");
}

export async function removeAdmin(formData: FormData) {
  const parsed = memberSchema.safeParse({ profileId: formData.get("profileId") });
  if (!parsed.success) redirectToMembers("error", "Mitglied konnte nicht gelesen werden.");

  const { supabase, user } = await assertAdmin();
  if (parsed.data.profileId === user.id) redirectToMembers("error", "Sie können sich nicht selbst die Admin-Rechte entziehen.");

  const { error } = await supabase.from("profiles").update({ is_admin: false }).eq("id", parsed.data.profileId);

  if (error) redirectToMembers("error", "Admin-Recht konnte nicht entfernt werden.");
  revalidatePath("/admin/members");
  redirectToMembers("success", "Admin-Recht entfernt.");
}

const courtSettingsSchema = z.object({
  courtId: z.coerce.number().int().min(1).max(5),
  name: z.string().trim().min(2).max(40),
  isActive: z.string().optional()
});

export async function updateCourtSettings(formData: FormData) {
  const parsed = courtSettingsSchema.safeParse({
    courtId: formData.get("courtId"),
    name: formData.get("name"),
    isActive: formData.get("isActive") || ""
  });

  if (!parsed.success) redirectToCourts("error", "Platzdaten sind ungültig.");

  const { supabase } = await assertAdmin();
  const shouldBeActive = parsed.data.isActive === "on";

  if (!shouldBeActive) {
    const now = new Date();
    const localNow = `${toDateInputValue(now)}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;
    const { count, error: countError } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("court_id", parsed.data.courtId)
      .eq("kind", "member")
      .is("cancelled_at", null)
      .gte("starts_at", localNow);

    if (countError) redirectToCourts("error", "Aktive Buchungen konnten nicht geprüft werden.");
    if ((count ?? 0) > 0) {
      redirectToCourts("error", "Platz kann erst deaktiviert werden, wenn keine kommenden Mitgliedsbuchungen mehr darauf liegen.");
    }
  }

  const { error } = await supabase
    .from("courts")
    .update({ name: parsed.data.name, is_active: shouldBeActive })
    .eq("id", parsed.data.courtId);

  if (error) redirectToCourts("error", "Platz konnte nicht gespeichert werden.");

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/courts");
  redirectToCourts("success", "Platz gespeichert.");
}

export async function updateOwnProfile(formData: FormData) {
  const parsed = z.object({
    fullName: z.string().trim().min(2).max(80),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
    memberNumber: z.string().trim().max(40).optional().or(z.literal(""))
  }).safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone") || "",
    memberNumber: formData.get("memberNumber") || ""
  });

  if (!parsed.success) redirectToAccount("error", "Profilangaben sind unvollständig oder zu lang.");

  const { supabase } = await getCurrentUserOrRedirect();
  const { error } = await supabase.rpc("update_own_profile", {
    p_full_name: parsed.data.fullName,
    p_phone: parsed.data.phone || null,
    p_member_number: parsed.data.memberNumber || null
  });

  if (error) redirectToAccount("error", "Profil konnte nicht gespeichert werden.");
  revalidatePath("/");
  revalidatePath("/account");
  redirectToAccount("success", "Profil gespeichert.");
}

export async function signIn(formData: FormData) {
  const parsed = z.object({
    email: z.string().trim().email(),
    password: z.string().min(1)
  }).safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) redirect(`/login?error=${encodeURIComponent("Bitte E-Mail und Passwort prüfen.")}`);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) redirect(`/login?error=${encodeURIComponent("Login fehlgeschlagen.")}`);
  redirect("/");
}

export async function signUp(formData: FormData) {
  const parsed = z.object({
    fullName: z.string().trim().min(2).max(80),
    email: z.string().trim().email(),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
    memberNumber: z.string().trim().max(40).optional().or(z.literal("")),
    password: z.string().min(MIN_PASSWORD_LENGTH),
    website: z.string().optional().or(z.literal(""))
  }).safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone") || "",
    memberNumber: formData.get("memberNumber") || "",
    password: formData.get("password"),
    website: formData.get("website") || ""
  });

  if (!parsed.success) {
    redirect(`/login?error=${encodeURIComponent(`Registrierung unvollständig. Passwort mindestens ${MIN_PASSWORD_LENGTH} Zeichen.`)}`);
  }

  if (parsed.data.website) redirect(`/login?error=${encodeURIComponent("Registrierung fehlgeschlagen.")}`);

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        phone: parsed.data.phone || null,
        member_number: parsed.data.memberNumber || null
      }
    }
  });

  if (error) redirect(`/login?error=${encodeURIComponent("Registrierung fehlgeschlagen. Eventuell existiert diese E-Mail bereits.")}`);
  redirect(`/login?success=${encodeURIComponent("Registrierung angelegt. Ein Admin muss das Konto freigeben, bevor Plätze gebucht werden können.")}`);
}


export async function requestPasswordReset(formData: FormData) {
  const parsed = z.object({ email: z.string().trim().email() }).safeParse({ email: formData.get("email") });
  if (!parsed.success) redirect(`/login?error=${encodeURIComponent("Bitte geben Sie eine gültige E-Mail-Adresse ein.")}`);

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${SITE_URL.replace(/\/$/, "")}/reset-password`
  });

  redirect(`/login?success=${encodeURIComponent("Wenn die E-Mail-Adresse registriert ist, wurde eine Nachricht zum Zurücksetzen des Passworts verschickt.")}`);
}

export async function updatePassword(formData: FormData) {
  const parsed = z.object({ password: z.string().min(MIN_PASSWORD_LENGTH) }).safeParse({ password: formData.get("password") });
  if (!parsed.success) redirect(`/reset-password?error=${encodeURIComponent(`Passwort mindestens ${MIN_PASSWORD_LENGTH} Zeichen.`)}`);

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) redirect(`/reset-password?error=${encodeURIComponent("Passwort konnte nicht gespeichert werden. Bitte fordern Sie den Link erneut an.")}`);

  redirect(`/login?success=${encodeURIComponent("Passwort gespeichert. Sie können sich jetzt einloggen.")}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
const announcementSchema = z.object({
  title: z.string().trim().min(2).max(100),
  message: z.string().trim().min(2).max(1000),
  expiresAt: z.string().optional().or(z.literal(""))
});
export async function createAnnouncement(formData: FormData) {
  const parsed = announcementSchema.safeParse({
    title: formData.get("title"),
    message: formData.get("message"),
    expiresAt: formData.get("expiresAt") || ""
  });

  if (!parsed.success) {
    redirectToAnnouncements(
      "error",
      "Bitte Titel und Mitteilung vollständig ausfüllen."
    );
  }

  const { supabase, user } = await assertAdmin();

  const { error } = await supabase
    .from("announcements")
    .insert({
      title: parsed.data.title,
      message: parsed.data.message,
      created_by: user.id,
      is_active: true,
      expires_at: parsed.data.expiresAt
        ? `${parsed.data.expiresAt}T23:59:59`
        : null
    });

 if (error) {
  redirectToAnnouncements(
    "error",
    `${error.message}`
  );
}

  revalidatePath("/");
  revalidatePath("/ankundigungen");

  redirectToAnnouncements(
    "success",
    "Ankündigung veröffentlicht."
  );
}
