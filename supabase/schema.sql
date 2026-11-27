-- ============================================================================
-- Snip: schema, RLS and RPCs.
-- Paste into Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Safe to re-run: tables use IF NOT EXISTS; functions/policies are replaced.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

create table if not exists public.cards (
  id                uuid primary key default gen_random_uuid(),
  source_url        text not null unique,
  topic_tag         text not null
                    check (topic_tag in ('AI', 'Space', 'Biotech', 'Hardware', 'Physics')),
  hook_headline     text not null,
  hook_body         text not null,
  breakdown_bullets jsonb not null
                    check (jsonb_typeof(breakdown_bullets) = 'array'
                           and jsonb_array_length(breakdown_bullets) between 1 and 5),
  real_world_impact text not null,
  quiz_question     text not null,
  quiz_options      jsonb not null
                    check (jsonb_typeof(quiz_options) = 'array'
                           and jsonb_array_length(quiz_options) between 2 and 4),
  correct_index     smallint not null check (correct_index >= 0),
  quiz_explanation  text not null,
  created_at        timestamptz not null default now(),
  constraint correct_index_in_range check (correct_index < jsonb_array_length(quiz_options))
);

create index if not exists cards_topic_created_idx
  on public.cards (topic_tag, created_at desc);

create table if not exists public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  interests        text[] not null default '{}',
  xp               integer not null default 0 check (xp >= 0),
  streak           integer not null default 0 check (streak >= 0),
  last_active_date date,
  created_at       timestamptz not null default now()
);

create table if not exists public.user_card_progress (
  user_id      uuid not null references auth.users (id) on delete cascade,
  card_id      uuid not null references public.cards (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, card_id)
);

create index if not exists user_card_progress_user_completed_idx
  on public.user_card_progress (user_id, completed_at desc);

-- ---------------------------------------------------------------------------
-- 2. Row-Level Security
-- ---------------------------------------------------------------------------

alter table public.cards              enable row level security;
alter table public.profiles           enable row level security;
alter table public.user_card_progress enable row level security;

-- cards: anyone (signed in or not) can read. No write policies, so only the
-- service role (dashboard / backend ingestion) can insert or edit cards.
drop policy if exists "Cards are readable by everyone" on public.cards;
create policy "Cards are readable by everyone"
  on public.cards for select
  to anon, authenticated
  using (true);

-- profiles: each user can see, create and edit only their own row.
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- user_card_progress: each user can see and add only their own rows.
-- No UPDATE/DELETE policy on purpose: deleting a row would let a user
-- re-complete the card and farm XP.
drop policy if exists "Users can view own progress" on public.user_card_progress;
create policy "Users can view own progress"
  on public.user_card_progress for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own progress" on public.user_card_progress;
create policy "Users can insert own progress"
  on public.user_card_progress for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Column-level lock: RLS limits *which rows* a user can touch; these grants
-- limit *which columns*. Clients may only write `interests`. XP, streak and
-- last_active_date change only through complete_card() below.
revoke insert, update on public.profiles from anon, authenticated;
grant  insert (id, interests) on public.profiles to authenticated;
grant  update (interests)     on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Auto-create a profile for every new user (email and anonymous)
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 4. RPC: complete a card -> award XP + update streak (atomic, server-side)
--    p_local_date is the user's local calendar date; it is clamped to
--    +/- 1 day of the server's date so it can't be used to fake streaks.
-- ---------------------------------------------------------------------------

create or replace function public.complete_card(p_card_id uuid, p_local_date date)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid      uuid := auth.uid();
  v_today    date := least(greatest(p_local_date, current_date - 1), current_date + 1);
  v_inserted integer;
  v_profile  public.profiles;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  insert into public.profiles (id) values (v_uid) on conflict (id) do nothing;

  insert into public.user_card_progress (user_id, card_id)
  values (v_uid, p_card_id)
  on conflict (user_id, card_id) do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted = 0 then
    -- Already completed: no double XP.
    select * into v_profile from public.profiles where id = v_uid;
    return v_profile;
  end if;

  update public.profiles
  set xp = xp + 15,
      streak = case
                 when last_active_date >= v_today     then greatest(streak, 1)
                 when last_active_date  = v_today - 1 then streak + 1
                 else 1
               end,
      last_active_date = greatest(coalesce(last_active_date, v_today), v_today)
  where id = v_uid
  returning * into v_profile;

  return v_profile;
end;
$$;

revoke execute on function public.complete_card(uuid, date) from public, anon;
grant  execute on function public.complete_card(uuid, date) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. RPC: today's deck for the current user
--    = cards finished since p_since (start of the user's local day)
--    + newest unseen cards in the user's interests, up to p_size total.
--    Runs as the caller, so RLS still applies.
-- ---------------------------------------------------------------------------

create or replace function public.get_daily_deck(p_since timestamptz, p_size integer default 5)
returns setof public.cards
language sql
stable
security invoker
set search_path = ''
as $$
  (
    select c.*
    from public.cards c
    join public.user_card_progress p on p.card_id = c.id
    where p.user_id = auth.uid()
      and p.completed_at >= p_since
    order by p.completed_at
    limit p_size
  )
  union all
  (
    select c.*
    from public.cards c
    where c.topic_tag = any (
            coalesce((select pr.interests from public.profiles pr where pr.id = auth.uid()), '{}')
          )
      and not exists (
            select 1 from public.user_card_progress p
            where p.user_id = auth.uid() and p.card_id = c.id
          )
    order by c.created_at desc
    limit greatest(
      p_size - (
        select count(*) from public.user_card_progress p
        where p.user_id = auth.uid() and p.completed_at >= p_since
      ),
      0
    )
  );
$$;

revoke execute on function public.get_daily_deck(timestamptz, integer) from public, anon;
grant  execute on function public.get_daily_deck(timestamptz, integer) to authenticated;
