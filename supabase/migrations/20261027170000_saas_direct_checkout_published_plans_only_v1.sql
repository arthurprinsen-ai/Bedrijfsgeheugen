-- Alleen pakketten die op /prijzen staan mogen direct online worden afgesloten (besluit 27 okt 2026).
-- Control en Scale zijn historische rijen die niet gepubliceerd zijn; Enterprise loopt via contact.
update public.saas_plans
set direct_checkout = false
where code not in ('starter','pro','groei') and direct_checkout is distinct from false;
