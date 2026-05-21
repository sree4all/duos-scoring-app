-- Seed standard points-rummy game type (idempotent)

begin;

insert into public.game_types (key, name, mode)
values ('points_rummy_standard', 'Points rummy', 'score_entry')
on conflict (key) do nothing;

commit;
