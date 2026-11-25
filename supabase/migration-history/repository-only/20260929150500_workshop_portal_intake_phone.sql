alter table public.workshop_portal_intakes
  add column if not exists phone text null;

comment on column public.workshop_portal_intakes.phone is
  'Private workshop contact phone number. Service-role only; never aggregate benchmark/growth input.';
