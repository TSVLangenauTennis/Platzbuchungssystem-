export type BookingKind = "member" | "training" | "match" | "tournament" | "maintenance" | "blocked";
export type CalendarView = "day" | "week";
export type MemberFilter = "all" | "pending" | "approved" | "admin";

export type Court = {
  id: number;
  name: string;
  is_active: boolean;
};

export type Profile = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  member_number: string | null;
  is_admin: boolean;
  is_approved: boolean;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
};

export type Booking = {
  id: string;
  court_id: number;
  user_id: string | null;
  created_by: string | null;
  title: string;
  kind: BookingKind;
  starts_at: string;
  ends_at: string;
  notes: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  created_at: string;
};

export type AuditLog = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};
export type Announcement = {
  id: string;
  title: string;
  message: string;
  created_at: string;
  created_by: string;
  is_active: boolean;
  expires_at: string | null;
};

export type AnnouncementRead = {
  announcement_id: string;
  user_id: string;
  read_at: string;
};

export type Suggestion = {
  id: string;
  message: string;
  created_at: string;
  is_read: boolean;
};
