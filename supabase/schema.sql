-- TSV Langenau Tennis – Platzbuchungssystem
-- In Supabase im SQL Editor ausführen.
-- Ziel: fünf Plätze, 60-Minuten-Buchungen mit 30-Minuten-Start, Admin-Freigabe,
-- RLS-Sicherheit, Audit-Log und harte Anti-Doppelbuchungs-Regel in PostgreSQL.

create extension if not exists "uuid-ossp";
create extension if not exists btree_gist;

-- 1) Profile: verbindet auth.users mit Vereinsrollen, Kontaktdaten und Admin-Freigabe.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  member_number text,
  is_admin boolean not null default false,
  is_approved boolean not null default false,
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists member_number text;
alter table public.profiles add column if not exists is_approved boolean not null default false;
alter table public.profiles add column if not exists approved_at timestamptz;
alter table public.profiles add column if not exists approved_by uuid references auth.users(id) on delete set null;

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

create index if not exists profiles_approval_idx
  on public.profiles (is_approved, is_admin, created_at desc);

create index if not exists profiles_member_number_idx
  on public.profiles (member_number);

create unique index if not exists profiles_member_number_unique_idx
  on public.profiles (lower(member_number))
  where member_number is not null;

create index if not exists profiles_email_idx
  on public.profiles (email);

alter table public.profiles enable row level security;

-- 2) Fünf Tennisplätze.
create table if not exists public.courts (
  id integer primary key,
  name text not null unique,
  is_active boolean not null default true
);

insert into public.courts (id, name)
values
  (1, 'Platz 1'),
  (2, 'Platz 2'),
  (3, 'Platz 3'),
  (4, 'Platz 4'),
  (5, 'Platz 5')
on conflict (id) do nothing;

alter table public.courts
  drop constraint if exists courts_id_range,
  add constraint courts_id_range check (id between 1 and 5);

alter table public.courts enable row level security;

-- 3) Buchungen und Sperrzeiten laufen über dieselbe Tabelle.
do $$ begin
  create type public.booking_kind as enum ('member', 'training', 'match', 'tournament', 'maintenance', 'blocked');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.bookings (
  id uuid primary key default uuid_generate_v4(),
  court_id integer not null references public.courts(id),
  user_id uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  title text not null,
  kind public.booking_kind not null default 'member',
  starts_at timestamp without time zone not null,
  ends_at timestamp without time zone not null,
  notes text,
  cancelled_at timestamptz,
  cancelled_by uuid references auth.users(id) on delete set null,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  constraint booking_time_valid check (ends_at > starts_at),
  constraint booking_start_on_half_hour check (date_part('minute', starts_at) in (0, 30) and date_part('second', starts_at) = 0),
  constraint booking_end_on_half_hour check (date_part('minute', ends_at) in (0, 30) and date_part('second', ends_at) = 0)
);

alter table public.bookings add column if not exists cancelled_by uuid references auth.users(id) on delete set null;
alter table public.bookings add column if not exists cancellation_reason text;

alter table public.bookings
  drop constraint if exists booking_start_on_hour,
  drop constraint if exists booking_end_on_hour,
  drop constraint if exists booking_start_on_half_hour,
  drop constraint if exists booking_end_on_half_hour;

alter table public.bookings
  add constraint booking_start_on_half_hour check (date_part('minute', starts_at) in (0, 30) and date_part('second', starts_at) = 0),
  add constraint booking_end_on_half_hour check (date_part('minute', ends_at) in (0, 30) and date_part('second', ends_at) = 0);

alter table public.bookings
  drop constraint if exists booking_member_duration_valid,
  drop constraint if exists booking_member_user_valid;

alter table public.bookings
  add constraint booking_member_duration_valid check (kind <> 'member' or ends_at = starts_at + interval '60 minutes'),
  add constraint booking_member_user_valid check ((kind = 'member' and user_id is not null) or (kind <> 'member'));

alter table public.bookings enable row level security;

-- Harte Anti-Überschreib-Regel:
-- Pro Platz darf kein aktiver Zeitraum mit einem anderen aktiven Zeitraum überlappen.
alter table public.bookings
  drop constraint if exists bookings_no_overlap;

alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    court_id with =,
    tsrange(starts_at, ends_at, '[)') with &&
  )
  where (cancelled_at is null);

create index if not exists bookings_day_idx
  on public.bookings (starts_at, ends_at, court_id)
  where cancelled_at is null;

create index if not exists bookings_user_idx
  on public.bookings (user_id, starts_at desc)
  where cancelled_at is null;

create index if not exists bookings_kind_idx
  on public.bookings (kind, starts_at)
  where cancelled_at is null;

create index if not exists bookings_cancelled_idx
  on public.bookings (cancelled_at desc)
  where cancelled_at is not null;

-- 4) Audit-Log für wichtige Vereinsaktionen.
create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_action_idx on public.audit_logs (action, created_at desc);
alter table public.audit_logs enable row level security;

-- 5) Hilfsfunktionen für Admin-/Freigabeprüfung in RLS.
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = uid), false);
$$;

create or replace function public.is_approved_member(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_approved or p.is_admin from public.profiles p where p.id = uid), false);
$$;

create or replace function public.write_audit_log(
  p_action text,
  p_entity_type text,
  p_entity_id uuid default null,
  p_metadata jsonb default '{}'::jsonb,
  p_actor_id uuid default auth.uid()
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (p_actor_id, left(p_action, 120), left(p_entity_type, 80), p_entity_id, coalesce(p_metadata, '{}'::jsonb));
end;
$$;

revoke execute on function public.write_audit_log(text, text, uuid, jsonb, uuid) from public, anon, authenticated;

-- Mitglieder dürfen nur eigene Stammdaten-Felder ändern; keine Rollen/Freigaben.
create or replace function public.update_own_profile(
  p_full_name text,
  p_phone text default null,
  p_member_number text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if length(trim(coalesce(p_full_name, ''))) < 2 then
    raise exception 'full name required';
  end if;

  update public.profiles
  set
    full_name = left(trim(p_full_name), 80),
    phone = nullif(left(trim(coalesce(p_phone, '')), 40), ''),
    member_number = nullif(left(trim(coalesce(p_member_number, '')), 40), '')
  where id = auth.uid();
end;
$$;

revoke execute on function public.update_own_profile(text, text, text) from public, anon;
grant execute on function public.update_own_profile(text, text, text) to authenticated;

-- 6) Neuer Nutzer bekommt automatisch ein Profil, aber noch keine Buchungsfreigabe.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone, member_number, is_approved)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1), 'Mitglied'), 80),
    new.email,
    nullif(left(trim(coalesce(new.raw_user_meta_data->>'phone', '')), 40), ''),
    nullif(left(trim(coalesce(new.raw_user_meta_data->>'member_number', '')), 40), ''),
    false
  )
  on conflict (id) do nothing;

  perform public.write_audit_log('member.registered', 'profile', new.id, jsonb_build_object('email', new.email), new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7) Schutz-Trigger: Mitglieder dürfen eigene Buchungen nur stornieren, nicht verschieben/manipulieren.
create or replace function public.guard_booking_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin(auth.uid()) then
    return new;
  end if;

  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if old.kind <> 'member' or old.user_id is distinct from auth.uid() then
    raise exception 'booking update denied';
  end if;

  if old.cancelled_at is not null then
    raise exception 'cancelled booking cannot be changed';
  end if;

  if new.cancelled_at is null then
    raise exception 'only cancellation is allowed';
  end if;

  if new.id <> old.id
    or new.court_id <> old.court_id
    or new.user_id is distinct from old.user_id
    or new.created_by is distinct from old.created_by
    or new.title <> old.title
    or new.kind <> old.kind
    or new.starts_at <> old.starts_at
    or new.ends_at <> old.ends_at
    or coalesce(new.notes, '') <> coalesce(old.notes, '')
    or new.created_at <> old.created_at then
    raise exception 'booking fields are immutable for members';
  end if;

  if new.cancelled_by is distinct from auth.uid() then
    raise exception 'cancelled_by must be current user';
  end if;

  new.cancellation_reason = left(coalesce(new.cancellation_reason, 'Storniert durch Mitglied'), 160);
  return new;
end;
$$;

drop trigger if exists guard_booking_update_trigger on public.bookings;
create trigger guard_booking_update_trigger
  before update on public.bookings
  for each row execute procedure public.guard_booking_update();

create or replace function public.audit_booking_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.write_audit_log(
      case when new.kind = 'member' then 'booking.created' else 'admin_block.created' end,
      'booking',
      new.id,
      jsonb_build_object('court_id', new.court_id, 'kind', new.kind, 'starts_at', new.starts_at, 'ends_at', new.ends_at, 'title', new.title),
      coalesce(new.created_by, auth.uid())
    );
    return new;
  end if;

  if tg_op = 'UPDATE' and old.cancelled_at is null and new.cancelled_at is not null then
    perform public.write_audit_log(
      case when old.kind = 'member' then 'booking.cancelled' else 'admin_block.cancelled' end,
      'booking',
      new.id,
      jsonb_build_object('court_id', new.court_id, 'kind', new.kind, 'starts_at', new.starts_at, 'ends_at', new.ends_at, 'title', new.title, 'reason', new.cancellation_reason),
      coalesce(new.cancelled_by, auth.uid())
    );
  end if;

  return new;
end;
$$;

drop trigger if exists audit_booking_change_trigger on public.bookings;
create trigger audit_booking_change_trigger
  after insert or update on public.bookings
  for each row execute procedure public.audit_booking_change();

create or replace function public.audit_profile_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.is_approved is distinct from new.is_approved then
    perform public.write_audit_log(
      case when new.is_approved then 'member.approved' else 'member.blocked' end,
      'profile',
      new.id,
      jsonb_build_object('email', new.email, 'full_name', new.full_name),
      auth.uid()
    );
  end if;

  if old.is_admin is distinct from new.is_admin then
    perform public.write_audit_log(
      case when new.is_admin then 'member.admin_granted' else 'member.admin_removed' end,
      'profile',
      new.id,
      jsonb_build_object('email', new.email, 'full_name', new.full_name),
      auth.uid()
    );
  end if;

  return new;
end;
$$;

drop trigger if exists audit_profile_change_trigger on public.profiles;
create trigger audit_profile_change_trigger
  after update on public.profiles
  for each row execute procedure public.audit_profile_change();

-- 8) RLS-Policies.
drop policy if exists "Courts are readable for members" on public.courts;
drop policy if exists "Courts readable for approved members" on public.courts;
create policy "Courts readable for approved members"
  on public.courts for select
  to authenticated
  using (public.is_approved_member());

-- Admins dürfen Platznamen und Aktivstatus verwalten.
drop policy if exists "Admins manage courts" on public.courts;
create policy "Admins manage courts"
  on public.courts for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Profiles readable for members" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Profiles readable own or admin" on public.profiles;
create policy "Profiles readable own or admin"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "Admins update profiles" on public.profiles;
create policy "Admins update profiles"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Bookings readable for members" on public.bookings;
drop policy if exists "Bookings readable for approved members" on public.bookings;
create policy "Bookings readable for approved members"
  on public.bookings for select
  to authenticated
  using (cancelled_at is null and public.is_approved_member());

drop policy if exists "Members can create member bookings" on public.bookings;
create policy "Members can create member bookings"
  on public.bookings for insert
  to authenticated
  with check (
    public.is_approved_member()
    and kind = 'member'
    and user_id = auth.uid()
    and created_by = auth.uid()
    and exists (select 1 from public.courts c where c.id = court_id and c.is_active)
    and starts_at >= localtimestamp - interval '5 minutes'
    and starts_at < date_trunc('day', localtimestamp) + interval '32 days'
    and ends_at = starts_at + interval '60 minutes'
    and date_part('minute', starts_at) in (0, 30)
    and date_part('second', starts_at) = 0
    and starts_at::time >= time '07:00'
    and ends_at::time <= time '22:00'
  );

drop policy if exists "Members can cancel own bookings" on public.bookings;
create policy "Members can cancel own bookings"
  on public.bookings for update
  to authenticated
  using (
    public.is_approved_member()
    and user_id = auth.uid()
    and kind = 'member'
    and starts_at > localtimestamp
    and cancelled_at is null
  )
  with check (
    public.is_approved_member()
    and user_id = auth.uid()
    and kind = 'member'
    and cancelled_at is not null
    and cancelled_by = auth.uid()
  );

drop policy if exists "Admins manage all bookings" on public.bookings;
create policy "Admins manage all bookings"
  on public.bookings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Audit logs readable by admins" on public.audit_logs;
create policy "Audit logs readable by admins"
  on public.audit_logs for select
  to authenticated
  using (public.is_admin());

-- 9) Ersten Admin setzen:
-- Nach der Registrierung einmal die User-ID aus auth.users kopieren und ausführen:
-- update public.profiles
-- set is_admin = true, is_approved = true, approved_at = now()
-- where id = 'HIER-DIE-USER-ID';
