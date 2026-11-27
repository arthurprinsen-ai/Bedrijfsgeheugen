# PW jeugddata — security activity ledger — 20 november 2026

- Vondst: historische RLS policies `USING(true)` en `WITH CHECK(true)` op `public.pw_beoordelingen` en `public.pw_opstellingen`; privacyrisico voor minderjarigen. Geen ongeautoriseerde inzage is bewezen; dit is een toegangsconfiguratiebevinding.
- Uitvoering: bestaande Supabase production migration `20261120134537` trekt anon en authenticated grants in en verwijdert permissieve policies; service_role blijft bruikbaar.
- Read-only na-test: beide tabellen RLS=true, policies=0, anon_select=false, anon_insert=false, authenticated_select=false, authenticated_insert=false, service_select=true.
- Bestaande Netlify PW zaal/veldcoach gebruikt localStorage en behoudt eigen staat. Geen directe client-Google/Supabase-sync vereist om de plannen te gebruiken.
- Correctie bronmerge-conflict: originele `supabase/migration-history.lock.json` en de reeds op main geregistreerde identieke migratie zijn exact naar huidige hoofdbranch gesynchroniseerd; daarmee wordt geen tweede migration-apply gestart of bronhistorie vervalst.
- Correctie GitHub kwaliteit: expliciete Obligation-ID, Delivery-Lane, Candidate-Type en oorspronkelijke Base-SHA in PR; security learning-evaluation verwijst nu naar echte `tests/brain-*.test.mjs` voor historische/shadow/CI-canary. Menselijk document en ledger toegevoegd binnen oorspronkelijke PR.
- Bewijsscheiding: provider ACL is LIVE_VERIFIED, repository PR blijft OPEN tot protected merge en required CI. Geen volledige beveiligingsgarantie of bewijs van datadiefstal claimen.
