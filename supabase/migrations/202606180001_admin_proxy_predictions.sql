-- Allow platform admins to submit or update any member's predictions before lock.

create policy "predictions_admin_insert"
  on public.predictions for insert
  to authenticated
  with check (public.is_profile_admin());

create policy "predictions_admin_update"
  on public.predictions for update
  to authenticated
  using (public.is_profile_admin())
  with check (public.is_profile_admin());

create policy "prediction_bonus_answers_admin_insert"
  on public.prediction_bonus_answers for insert
  to authenticated
  with check (public.is_profile_admin());

create policy "prediction_bonus_answers_admin_update"
  on public.prediction_bonus_answers for update
  to authenticated
  using (public.is_profile_admin())
  with check (public.is_profile_admin());
