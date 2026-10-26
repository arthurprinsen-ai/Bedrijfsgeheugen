# Portal EU gateway — begrensde fan-out voor productie

Obligation-ID: `powerhouse-portal-eu-bounded-read-fanout-20261015-v1`  
Issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4410

## Geïmplementeerde wijziging
De bestaande `supabase/functions/portal-state-eu/index.ts` verwerkt ondernemersintelligence met tien afzonderlijke bronnen. Voorheen begon `readRows` op tien querybuilders tegelijk met `Promise.all`. Nu zijn ze lazy en worden maximaal drie tegelijk uitgevoerd via `boundedReads` in vier batches.

Resultaat bij succes is **exact dezelfde inhoud** en volgorde als voorheen, zonder cache of alternatieve databron. Bij een fout is de volledige response nog steeds non-200; er is geen kunstmatige positieve productiecontrole. Tenantbeperkingen, Supabase autorisatie en EU-datalocatie blijven intact.

## Regressie en bewijs
- `tests/brain-portal-eu-bounded-reads.test.mjs`: werkelijk piekconcurrentieniveau, volgorde, failure abort en invalide configuratie.
- Beschermde Required + CodeQL, merge, EU Edge Function deployment, Netlify exact-head, geauthenticeerde productie-readback nodig voor terminale acceptatie.
- Dit is een beheersmaatregel voor één fan-out. Het onderzoek naar SQL-last van cron 171, 116 en 130 en de 504-rootcause blijft open; deze wijziging bewijst niet dat alle databaseproblemen opgelost zijn.

## Existing-main refresh

After independent Ready/CodeQL/Preview checks, protected merge still rejected an out-of-date base. Candidate replayed on main `c40bddc1018b7923f2c10371c4191547b28a5ea4`; the declaration `Base-SHA` has been updated to that exact current-main lineage. New source check runs, not pre-rebase check outputs, remain authoritative. No production deployment or customer readback is asserted by this bookkeeping.
