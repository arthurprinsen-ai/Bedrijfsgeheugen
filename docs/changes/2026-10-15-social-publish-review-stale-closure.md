# Socialpublicaties herstellen zonder kwaliteitscontroles te omzeilen

Datum: 15 oktober 2026.

## Vastgesteld

De dagrun stond op `degraded`: drie publicatievoornemens, nul aangetoonde socialpublicaties. LinkedIn persoonlijk had een concept, maar de onafhankelijke reviewer gaf HTTP 503 terug; `violations=[]`, publicatie bleef `blocked`. De reviewer selecteerde de 24 schrijfregels met de hoogste vertrouwensscore, waardoor weliswaar actuele regels van 15 oktober in de database aanwezig waren, maar niet werden geselecteerd. De nieuwste geselecteerde regel dateerde van 9 oktober, ouder dan de bestaande 96-uursgrens.

Daarnaast bewaarde de publisher tijdelijke reviewerfouten als permanente blokkade. De geplande dispatch las uitsluitend `content_ready`, zodat de dagpost onbereikbaar bleef.

## Technische correcties

1. De onafhankelijke reviewer selecteert **actieve regels met vertrouwensscore minimaal 0,85**, gesorteerd op meest recente echte wijziging. De maximale leeftijd van 96 uur blijft ongewijzigd; identiteitscontracten, tekstcontrole en bronwaarheid blijven verplicht.
2. Een tijdelijke provider-reviewfout (429, 500, 502, 503, 504 of onbereikbare reviewer) wordt een herhaalbare, niet gepubliceerde poging op exact dezelfde originele claim. Er vindt geen verzending plaats tot reviewerstatus 200, `identity_gate_decision=PASS` en exacte teksthash overeenkomen.
3. Regressietests vangen beide fouten af. Geen bestaande providerclaims, hashes of toestemmingen worden kunstmatig opgehoogd.

## Blijvende, afzonderlijke blokkades

- DM: SalesRobot-abonnement `TRIAL_EXPIRED`, bestaande campagne `PAUSED` en kan niet worden gestart.
- LinkedIn bedrijf: organisatie-ACL API 403; ontbrekende `r_organization_admin`-scope en niet bewezen schrijfrechten.
- E-mail: `NO_AUTHORIZED_CANONICAL_EMAIL_EXECUTOR`; gekoppelde persoonlijke mailbox vervangt geen gemachtigde autonome productieverzender.
- Instagram: `EXACT_FINAL_MEDIA_PROOF_REQUIRED`; geen definitief gevalideerde Mira Reel.
- Blog: alleen `content_ready`, geen bevestigde productie-URL.

## Acceptatie

Dit is **een kandidaatcorrectie in GitHub**, niet automatisch een productieoplossing. Pas na geslaagde Required/CodeQL, beschermde merge, beide Edge Function-deployments en aangetoonde provider-URL/readback mag een post als `published` worden beschouwd.

PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4379
