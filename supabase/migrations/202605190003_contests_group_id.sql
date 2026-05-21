-- Link generalized contests to private groups

begin;

alter table public.contests
  add column if not exists group_id uuid references public.groups (id) on delete cascade;

create index if not exists contests_group_id_idx on public.contests (group_id);

commit;
