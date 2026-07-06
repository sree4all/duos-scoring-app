-- Auto-generated odd-match bonus prompts (feature 009).

alter table public.bonus_prompts
  add column if not exists generation_source text not null default 'owner'
    check (generation_source in ('owner', 'auto_odd'));

grant select, insert, update, delete on public.bonus_prompts to authenticated;
grant select, insert, update, delete on public.bonus_prompts to service_role;
