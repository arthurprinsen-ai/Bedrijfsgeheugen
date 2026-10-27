# Commercial closed loop canonicalized — 5 oktober 2026

Obligation: `one-commercial-closed-loop-v1`.

## Aanleiding

De runtime-loop werkte al grotendeels, maar delivery en runtime waren nog niet als één terminal bewijsbare keten gesloten. PR #3737 liet drie concrete gaten zien: verplichte machine-readable PR metadata ontbrak, privileged databasefuncties misten expliciete EXECUTE-revocation, en een oude Supabase previewbranch van een reeds gemergede PR bezette branchcapaciteit.

## Structurele wijziging

De commerciële keten heeft één canonical candidate owner en één closed-loop contract. Zware enrichment wordt uit de latency-kritieke heartbeat gehouden; provider-executie blijft achter bestaande consent-, pressure-, dedupe-, quality- en provider-ack-gates. Terminal acties krijgen outcome-lineage en voeden attribution/learning.

De databasegrens is fail-closed gemaakt door `EXECUTE` op alle nieuwe `SECURITY DEFINER`-functies in deze migratie te revoken voor `PUBLIC`, `anon` en `authenticated`, met expliciete server-only grant aan `service_role`.

## Delivery closure

Dezelfde candidate scope bevat nu:
- de canonieke Supabase-migratie;
- Brain learning evidence;
- menselijke change-documentatie;
- deze activity-ledger entry.

De stale Supabase previewbranch van gemergede PR #3280 is verwijderd; de previewbranch van nog open PR #3307 is behouden. Daardoor is branchcapaciteit vrijgemaakt zonder actief werk te vernietigen.

PR #3737 mag pas als terminal groen gelden wanneer de volledige checkset op exact dezelfde HEAD policy-groen is en merge + productie + terminal readback aantoonbaar zijn afgerond.
