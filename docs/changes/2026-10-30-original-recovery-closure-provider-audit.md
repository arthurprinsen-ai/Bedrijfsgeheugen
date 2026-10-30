# 30 oktober 2026 — bestaande recovery-lus: bewijs vóór afsluiten
Parent P0: #4198. Geen extra scheduler, schrijver, incidentfamilie, CRO-funnel of eigen herstelplatform.

## Onafhankelijke diagnose
De bestaande ONE BRAIN-registratie bevat herhaalde meldingen zoals `brein-status|pg_cron|FOUT` (1162 occurrences), `brein-status|bg-experimentcyclus|NOOIT_BEWEZEN` (799) en `brein-status|bg-native-content-generate|NOOIT_BEWEZEN` (89) zonder ingevulde `root_cause`, `proven_fix` en `regression_ref` (productie-SQL, 30 oktober rond 17:37 UTC). Het bestaan van een herstelactie of nieuwe cronrun is nog geen onafhankelijk bewezen effect.

## Aanpassing binnen de originele eigenaar
De bestaande admin-only `/api/powerhouse-cro-other-data` leest de laatste twintig originele failure fingerprints, zonder PII/evidence-payload in de browser terug te geven. De zuivere `projectRecoveryClosureAudit` controleert acht expliciete schakels: oorzaak, bewezen reparatie, preventieregel, regressietest, productieproviderreadback, volgende natuurlijke agentrun, onafhankelijk uitkomstbewijs en latere hercontrole. Ontbrekend bewijs blijft EVIDENCE_DUE; ook een volledig ingevulde registerverklaring is nog geen externe providerverificatie. Het originele `Andere data`-portaal toont ontbrekende schakels, aantallen en werkelijke bronstatus. Geen status of registerrij wordt gewijzigd.

## Agents: verplicht slot van iedere reparatie
Exacte fingerprint en originele owner → veilige idempotente fix → Required/BRAIN/CodeQL/System Map → exacte productie-SHA/providereffect → volgende natuurlijke run/readback → latere (minstens een uur) terugvalcontrole → toepassingsbewijs leerregel → onderscheid technisch hersteld, klantimpact en betaalde omzet. Nooit groen op enkel een databaseveld. Los een ontbrekende veilige recovery-handler niet op door een externe side effect blind opnieuw uit te voeren. De originele agents kunnen dit als fail-closed audit raadplegen; het creëert geen zelfstandig uitvoeringsrecht.

## Groeidoelen
Vergelijk likes, views, reacties, reposts, e-mailantwoorden, lead- en CTA-conversie per kanaal, identieke postleeftijd en afgesloten meetperioden. Rangschik betaalde aantoonbare omzet en gekwalificeerde voortgang boven ruwe engagement. Leg iedere toegepaste verbetering vast met bron, hypothese, cohort, baseline, uitvoeringsidentiteit, provider-ID, uitkomst en volgende meetdatum. Geobserveerde stijging is geen garantie op voortgaande stijging. Gebruik de bestaande commerciële funnel en Heartbeat: geen extra marketingtrackers, identificatie van views of ongevraagde e-mails.

## Release- en meetbewijs
Regressie: `tests/brain-recovery-closure-audit-20261030.test.mjs`.
Pas live na exact-head Required/BRAIN/CodeQL, beschermd mergen, Netlify productie- of beargumenteerde DEPLOY_NOT_REQUIRED-status, geauthenticeerde portal-readback en echte volgende eigenarun. De nieuwe kaart is een OBSERVABILITY-contract, geen automatisch bewijs dat alle incidenten zijn opgelost.

## Origineel geautoriseerd herstelregister / CAS
Bestaande veilige schrijver: `public.brain_promote_failure(p_fingerprint,p_expected_version,p_maturity,p_root_cause,p_proven_fix,p_prevention_rule,p_regression_ref,p_evidence)`. Alleen de oorspronkelijke service-role-bevoegde agent gebruikt hem na exact register-readback en controle van versie, bronbewijzen en eigenaarschap; `anon` en `authenticated` hebben geen EXECUTE. De functie vervangt `evidence` wanneer `p_evidence` gevuld is: eerst het bestaande volledige JSON-evidence lezen en met de nieuwe `recovery_closure_v1` samenvoegen, nooit de oude payload wegschrijven. Bij `FAILURE_VERSION_CONFLICT` niet herhalen met oude versie: herlezen en inhoudelijk vergelijken. `OBSERVED` naar `VALIDATED/PROVEN` uitsluitend bij werkelijk bewezen criteria, niet op basis van ingevulde velden of deze nieuwe kaart. Er zijn op 30 oktober 368 bestaande fingerprints, 102 zonder oorzaak, 187 zonder bewezen fix en nul met `recovery_closure_v1`; dit is bewijsachterstand, geen vrijbrief om alle 368 kunstmatig af te sluiten.
