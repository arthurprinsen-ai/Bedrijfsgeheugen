-- Zonder deze regel kan iemand zijn eigen gegevens niet wissen; dat hoort wel te kunnen.
drop policy if exists eigen_stand_wissen on public.portaal_stand;
create policy eigen_stand_wissen on public.portaal_stand
  for delete to authenticated using (gebruiker_id = auth.uid());
