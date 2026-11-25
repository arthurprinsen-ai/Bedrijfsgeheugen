# 2026-10-23 — CI agents rangschikken herhaald bewezen knelpunten

Canonical existing issue: #4661. Fingerprint: `delivery|multi-agent|recurrent-ci-bottleneck-priority|20261023-v1`. Schrijver: exact deze change-lineage, geen tweede owner van GitHub provider issue #4655.

Oorzaak: `routeObservedCiHotspots` rangschikte losse top-5 maxima terwijl `summarizeObservedCiJobs` inmiddels streng gegroepeerde `recurrent_hotspots` rapporteerde. Live steekproef: [Janitor 39926363163](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39926363163), 28 geldige jobs / 13 attempts / p95 wachttijd 3 s / grootste duur 353 s / nul leesfouten. Geen DORA of repeat-effect bewezen.

Wijziging: valideer herhaalde groepen terug tegen ongewijzigd uitgevoerd jobbewijs (SHA/job/run/attempt/workflow), dedupliceer matrices, herbereken p50 en maximale duur, kies daarna één prioriteit per lane op herhaalde p50. Losse pieken zijn tweede orde. Niet-geverifieerde recurrence doet advies geheel falen; geen codeautorisatie, scheduler, providerfouten-omweg of CI-omzeiling. Regressietest bevat een single 100s portal-outlier tegenover drie 30–40s preflightmetingen en drie 25–34s websitemetingen. Gecontroleerde status tot exact-head CI en protected merge: CANDIDATE.
