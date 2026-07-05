-- Admin-controlled visibility for tournament forecast prediction stats tab.
-- When false (default), only platform admins can see member forecast picks.
-- When true, all group members can see everyone's tournament forecast predictions.

begin;

alter table public.group_tournament_config
  add column if not exists advanced_bracket_stats_visible_to_members boolean not null default false;

comment on column public.group_tournament_config.advanced_bracket_stats_visible_to_members is
  'When true, all group members can view tournament forecast prediction stats; when false, platform admins only.';

create policy "group_tournament_config_admin_write"
  on public.group_tournament_config for all
  to authenticated
  using (public.is_profile_admin())
  with check (public.is_profile_admin());

commit;
