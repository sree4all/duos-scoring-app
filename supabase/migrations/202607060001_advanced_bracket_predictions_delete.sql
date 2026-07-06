-- Allow members to delete their own tournament forecast row (invalidate selection).

begin;

create policy "advanced_bracket_predictions_delete_self"
  on public.advanced_bracket_predictions for delete
  to authenticated
  using (user_id = auth.uid() and public.is_contest_group_member(contest_id));

grant delete on public.advanced_bracket_predictions to authenticated;

commit;
