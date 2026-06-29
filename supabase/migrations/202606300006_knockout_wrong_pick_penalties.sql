-- Knockout wrong-pick penalties were often left at schema default 0 (or NULL).
-- Scoring treated 0 as intentional "no penalty", so wrong R32 picks earned nothing
-- while correct picks still got +3 (matches 73+ / sinds.v / Sumesh Raj symptom).

begin;

update public.contest_stage_scoring_rules as r
set
  incorrect_penalty = d.incorrect_penalty,
  updated_at = now()
from (
  values
    ('round_of_32', -1),
    ('round_of_16', -2),
    ('quarter_finals', -3),
    ('semi_finals', -4),
    ('third_place', -3),
    ('final', -10)
) as d(stage_key, incorrect_penalty)
where r.stage_key = d.stage_key
  and coalesce(r.incorrect_penalty, 0) = 0;

commit;
