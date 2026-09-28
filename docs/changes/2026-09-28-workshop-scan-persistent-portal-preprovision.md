# Workshopscan → opgeslagen klantdata → vooraf gevuld klantportaal

## Canonieke keten
`workshop QR/link → /scan → antwoorden + toestemming → scan store → private portal intake → preprovisioned klantportaal → PDF → portal claim → blijvend klantportaal`.

## Opslag
De volledige scan blijft in `scan_inzendingen` met één stabiele `submission_key`. De benchmark/Powerhouse-eventlaag bevat geen naam of e-mailadres.

Persoons- en bedrijfsgegevens die nodig zijn om de klantreis voort te zetten worden apart opgeslagen in `workshop_portal_intakes`:
- bedrijfsnaam
- contactnaam
- e-mailadres
- website
- aantal medewerkers
- sector
- regio
- moment van toestemming
- snapshot van de scan

Deze tabel heeft RLS aan, heeft geen client policies en is expliciet ontoegankelijk gemaakt voor `anon` en `authenticated`; alleen de server-side service role gebruikt hem.

## Vooraf gevuld portaal
Na succesvolle workshopscan wordt onmiddellijk een private portal tenant `scan:<submission_key>` opgebouwd in de bestaande `canonical-brain` portalstate. Daarin staan:
- bedrijfscontext;
- totaalscore;
- domeinscores;
- antwoorden;
- branche en omvang;
- topprioriteiten/hefbomen;
- provenance naar dezelfde scan.

De PDF en het portaal delen dezelfde `submission_key`.

## Claim na inloggen
Wanneer de deelnemer later vanuit dezelfde scan het klantportaal opent en zich authenticeert, claimt de bestaande portal-scanroute dezelfde `submission_key`. De vooraf opgebouwde canonical-brain state wordt dan gekopieerd naar de identity-backed portal tenant. De intake krijgt status `claimed`.

Hiermee verdwijnt de ingevulde data niet wanneer localStorage, browser of sessie verloren gaat.

## Privacygrens
PII is uitsluitend account/portal context en wordt niet gebruikt als benchmarkdimensie of aggregate Powerhouse learning. Benchmark- en growth events houden `privacy_scope: no_pii`.

## Powerhouse-borging voor chats en agents
Deze capability is niet alleen runtimecode maar een vaste Powerhouse-regel. Iedere chat/agent die workshopscan, rapport, PDF, klantdata of klantportaal wijzigt:
- hergebruikt de bestaande submission-lineage;
- leest eerst de huidige scan-, intake- en portalstate;
- bewaart consented invoer duurzaam;
- maakt/preprovisiont het klantportaal met dezelfde scanreferentie;
- bewaakt PII-isolatie;
- voert regressie- én productie-readback uit;
- schrijft learnings en structurele contractwijzigingen terug naar skill, Brain, ledger, documentatie en System Map.

De capability mag dus niet meer terugvallen naar een browser-only scan, los PDF-bestand of een portal dat pas na registratie leeg wordt aangemaakt.
