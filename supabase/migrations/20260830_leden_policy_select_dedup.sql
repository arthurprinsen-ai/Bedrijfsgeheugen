-- Preserve leden authorization semantics while removing overlapping permissive SELECT policies.
-- leden_lezen remains the sole SELECT policy; owner management is split into write-only policies.

drop policy if exists leden_beheren on public.leden;

drop policy if exists leden_toevoegen on public.leden;
create policy leden_toevoegen on public.leden
  for insert to authenticated
  with check (intern.is_eigenaar(organisatie_id));

drop policy if exists leden_wijzigen on public.leden;
create policy leden_wijzigen on public.leden
  for update to authenticated
  using (intern.is_eigenaar(organisatie_id))
  with check (intern.is_eigenaar(organisatie_id));

drop policy if exists leden_verwijderen on public.leden;
create policy leden_verwijderen on public.leden
  for delete to authenticated
  using (intern.is_eigenaar(organisatie_id));
