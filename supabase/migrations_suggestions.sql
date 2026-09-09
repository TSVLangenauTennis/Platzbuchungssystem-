-- Migration: Anonyme Verbesserungsvorschläge
-- Im Supabase SQL-Editor ausführen (Projekt -> SQL Editor -> New query -> einfügen -> Run).
--
-- Wichtig zur Anonymität: Es wird bewusst KEINE user_id gespeichert, damit
-- Admins beim Lesen der Vorschläge nicht sehen, wer sie geschrieben hat.
-- Nur freigegebene, eingeloggte Mitglieder dürfen einen Vorschlag einreichen
-- (verhindert Spam durch nicht angemeldete Personen), der Inhalt selbst
-- bleibt aber anonym.

create table if not exists public.suggestions (
  id uuid primary key default uuid_generate_v4(),
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.suggestions enable row level security;

-- Freigegebene Mitglieder dürfen Vorschläge einreichen (aber nicht lesen).
drop policy if exists "Approved members can submit suggestions" on public.suggestions;
create policy "Approved members can submit suggestions"
  on public.suggestions for insert
  to authenticated
  with check (public.is_approved_member());

-- Nur Admins dürfen Vorschläge lesen und als gelesen markieren.
drop policy if exists "Admins read suggestions" on public.suggestions;
create policy "Admins read suggestions"
  on public.suggestions for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins update suggestions" on public.suggestions;
create policy "Admins update suggestions"
  on public.suggestions for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Server-Funktion für das anonyme Einreichen (Länge/Leerinhalt wird geprüft,
-- läuft mit security definer, damit auch bei knapper RLS alles sauber greift).
create or replace function public.submit_suggestion(p_message text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_approved_member() then
    raise exception 'not allowed';
  end if;

  if length(trim(coalesce(p_message, ''))) < 3 then
    raise exception 'message too short';
  end if;

  insert into public.suggestions (message)
  values (left(trim(p_message), 1000));
end;
$$;

revoke execute on function public.submit_suggestion(text) from public, anon;
grant execute on function public.submit_suggestion(text) to authenticated;
