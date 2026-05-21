-- Points-rummy hand recording for group contests

begin;

create table if not exists public.rummy_hands (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  contest_id uuid not null references public.contests (id) on delete cascade,
  hand_no integer not null,
  winner_participant_id uuid not null,
  preset_key text not null default 'points_rummy_standard',
  recorded_by uuid not null,
  correction_of_hand_id uuid references public.rummy_hands (id) on delete set null,
  correction_reason text,
  voided boolean not null default false,
  void_reason text,
  created_at timestamptz not null default now(),
  unique (contest_id, hand_no)
);

create table if not exists public.rummy_hand_players (
  id uuid primary key default gen_random_uuid(),
  hand_id uuid not null references public.rummy_hands (id) on delete cascade,
  participant_id uuid not null,
  drop_type text check (drop_type in ('none', 'first', 'middle', 'full_count')),
  unmelded_points integer,
  computed_points integer not null,
  created_at timestamptz not null default now()
);

create index if not exists rummy_hands_group_id_idx on public.rummy_hands (group_id);
create index if not exists rummy_hands_contest_id_idx on public.rummy_hands (contest_id);

grant select, insert, update on public.rummy_hands to authenticated;
grant select, insert on public.rummy_hand_players to authenticated;

alter table public.rummy_hands enable row level security;
alter table public.rummy_hand_players enable row level security;

create policy rummy_hands_member_select on public.rummy_hands
  for select to authenticated
  using (public.is_active_group_member(group_id));

create policy rummy_hands_scorer_insert on public.rummy_hands
  for insert to authenticated
  with check (
    public.is_active_group_member(group_id)
    and (
      public.is_group_owner(group_id)
      or exists (
        select 1 from public.group_memberships gm
        where gm.group_id = rummy_hands.group_id
          and gm.user_id = auth.uid()
          and gm.is_scorer = true
          and gm.removed_at is null
      )
    )
  );

create policy rummy_hand_players_member_select on public.rummy_hand_players
  for select to authenticated
  using (
    exists (
      select 1 from public.rummy_hands h
      where h.id = hand_id and public.is_active_group_member(h.group_id)
    )
  );

create policy rummy_hand_players_scorer_insert on public.rummy_hand_players
  for insert to authenticated
  with check (
    exists (
      select 1 from public.rummy_hands h
      where h.id = hand_id
        and public.is_active_group_member(h.group_id)
        and (
          public.is_group_owner(h.group_id)
          or exists (
            select 1 from public.group_memberships gm
            where gm.group_id = h.group_id
              and gm.user_id = auth.uid()
              and gm.is_scorer = true
              and gm.removed_at is null
          )
        )
    )
  );

commit;
