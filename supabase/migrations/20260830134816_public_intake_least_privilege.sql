-- Align table privileges with the existing RLS contract: public clients may
-- submit scans/offers but may not read, modify, truncate, or delete raw intake.

revoke all on table public.scan_inzendingen, public.offerte_inzendingen
from anon, authenticated;

grant insert on table public.scan_inzendingen, public.offerte_inzendingen
to anon, authenticated;
