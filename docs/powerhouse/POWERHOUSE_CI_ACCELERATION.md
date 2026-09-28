# Powerhouse CI Acceleration v1

## Doel

Minimaliseer time-to-terminal-proof zonder exact-head, security, protected merge of productie-readback te verzwakken.

## Canonieke architectuur

1. Eén PR-single-flight `Required test` is de merge-critical aggregator.
2. Cheap admission en classificatie gaan vóór dure build/browser/security-lanes.
3. Alleen geraakte lanes draaien.
4. Superseded runs op dezelfde PR worden automatisch geannuleerd.
5. Node dependency installs gebruiken lockfile-gebonden npm-cache en `npm ci --prefer-offline`.
6. Website-validatie bouwt niet opnieuw voor page/SEO; die controle draait op het al opgebouwde artifact.
7. Browservalidatie gebruikt de exact-SHA Netlify deploy preview wanneer beschikbaar. Alleen bij ontbrekende preview wordt lokaal opnieuw gebouwd.
8. Domeinspecifieke Supabase/Portal-contracten worden niet meer onvoorwaardelijk dubbel in preflight uitgevoerd.
9. Zware scheduled quality/intelligence blijft buiten de noodzakelijke fast path waar dat veilig kan.
10. Powerhouse CI Intelligence meet zeven dagen aan queue time, execution time, failure/cancel/skips en workflow fan-out per SHA.

## KPI's

- queue_wait_seconds_avg / p95
- execution_seconds_avg / p95
- workflow_fanout_per_sha_avg / p95
- failed_jobs
- cancelled_jobs
- skipped_jobs
- time_to_required_green
- time_to_terminal_proof

## Governance

Sneller betekent nooit minder bewijs. Exact-head identiteit, branch hygiene, security contracts, protected landing en productie/provider readback blijven fail-closed. Optimalisatie mag uitsluitend duplicatie, wachtrijwerk, herhaalde installatie/build en niet-relevante fan-out verwijderen.
