# Volledige commit-checkset als enige deliverywaarheid

Datum: 5 oktober 2026  
Obligation: `full-commit-checkset-authority-20261005-v1`

De delivery-loop is aangescherpt zodat een kandidaat nooit meer groen kan worden verklaard op basis van alleen de normale workflow of alleen de required checks.

De canonieke volgorde is nu:

1. exact candidate head SHA vastzetten;
2. alle check-runs op die SHA ophalen, inclusief checks van externe GitHub Apps;
3. legacy commit statuses meenemen;
4. security checks fail-closed beoordelen;
5. required checks als verplichte subset valideren;
6. current-main/mergeability opnieuw lezen en via optimistic CAS bewaken;
7. alleen daarna mergen;
8. productie/deploy bewijzen;
9. terminale readback uitvoeren voordat de obligation groen wordt.

Aanleiding was de delivery rond PR #3729: GitHub Advanced Security had een afzonderlijke CodeQL-check die buiten de normale Powerhouse workflow zichtbaar werd. Daardoor was “normale workflow groen” geen volledig bewijs van mergegereedheid.

PR #3735 borgt deze foutklasse in de state machine, workflow en regressietests. Een pending, falende of beleidsmatig niet-geaccepteerde security-check houdt de kandidaat voortaan geblokkeerd. Daarmee is de volledige exact-head commit-checkset — niet een deelverzameling — de bron van waarheid voor terminal delivery.
