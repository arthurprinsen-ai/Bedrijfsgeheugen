-- Preserve exact own-row RLS semantics while allowing PostgreSQL to initialize
-- auth.uid() once per statement instead of re-evaluating it for every row.

drop policy if exists eigen_stand_lezen on public.portaal_stand;
create policy eigen_stand_lezen on public.portaal_stand
  for select to authenticated
  using (gebruiker_id = (select auth.uid()));

drop policy if exists eigen_stand_maken on public.portaal_stand;
create policy eigen_stand_maken on public.portaal_stand
  for insert to authenticated
  with check (gebruiker_id = (select auth.uid()));

drop policy if exists eigen_stand_wijzigen on public.portaal_stand;
create policy eigen_stand_wijzigen on public.portaal_stand
  for update to authenticated
  using (gebruiker_id = (select auth.uid()))
  with check (gebruiker_id = (select auth.uid()));

drop policy if exists eigen_stand_wissen on public.portaal_stand;
create policy eigen_stand_wissen on public.portaal_stand
  for delete to authenticated
  using (gebruiker_id = (select auth.uid()));
