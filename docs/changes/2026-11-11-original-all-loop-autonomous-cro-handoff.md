# 11 november 2026 — één oorspronkelijke Powerhouse-keten: geen stille overdracht, autonome CRO-beslissing

Fingerprint: `powerhouse|all-loops|one-owner-receipt-cro-autonomous-decision-continuity|20261111-v1`. Incidenteigenaars: [#4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198) en [#4215](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215).

## Werkelijke broncontrole

De productiebron meldt 15 actieve lussen: **8 GREEN, 7 RED**. Eén originele cron #171 blijft actief; 433 `CONTENT_HANDOFF` verplichtingen zijn OPEN, 403 OVERDUE, 12 reeds FULFILLED en twee historische `RESULT_UNKNOWN` hersteljobs staan ESCALATED zonder veilige providerreplay. Voor CRO vermeldt `powerhouse_autonomous_experiment_readiness_v1`: `LATENT_WAITING_FOR_ELIGIBLE_ACTION`, **0 treatment / holdout assignments**. Dat zijn geen bewezen conversie-experimenten. De onderliggende exacte oorzaak van ontbrekende echte downstream ontvangsten is per kanaal nog niet onafhankelijk vastgesteld; bronregels mogen nooit massaal afgesloten worden.

## Structurele rolverdeling — bestaande agents, geen nieuw systeem

De bestaande 14 agent-specialisten blijven geregistreerd, met extra taken voor betrouwbaarheid (15 lussen/open ouderdom, één herstelowner), datakwaliteit (exacte tenant+sourceRevision+provider/consumer ACK), Portal UX (toon bronstatus en vervolgactie), Growth (rangschik veilige CRO-kandidaten, beslis zelf binnen bevoegdheid), SEO (meetbare oorspronkelijke site/CTA-ingreep) en social (kanaalproducer→meetconsument→leren). Er komen geen nieuwe agents of cronjobs, geen tweede publisher/Brain, geen Make/Buffer bypass.

Elke oorspronkelijke overdracht bevat een immutable causale sleutel, originele uitvoerder+lease, write-readback, claim `RECEIVED_NOT_PROCESSED`, daadwerkelijke acceptatie, measurement/analysis/experiment-ID, causale page/model-updates, einduitkomst en pas na onafhankelijke readback `FULFILLED`. De bestaande uitvoerders proberen veilige herstelbare gaten bounded/idempotent opnieuw en blijven draaien wanneer een ander kanaal ontbreekt. Onbekende provider-output nooit blind resend. Geen oplossing is stilzwijgend weggooien, negeren of groen kleuren.

## Autonoom CRO: werkelijke beslissing boven lege belofte

De bestaande eigenaar selecteert één eligible, veilig omkeerbare, evidence-backed CRO-hypothese met consent, bron/freshness, tenant-isolatie, risico, baseline, eigenaar/lease, random treatment/holdout en meetbare funnelconversie. Bij alle vereiste groene beveiligingschecks gaat de wijziging autonoom door de bestaande beschermde CI/CD-route met onafhankelijke provider- en productie-readback; geen extra livegangvraag. Echte uplift wordt alleen verklaard na volwassen meetdata, daadwerkelijke resultaten versus control en in een volgende oorspronkelijke run aantoonbaar toegepaste ONE BRAIN/Heartbeat learning. Is niemand eligible, dan `NO_SAFE_CHANGE_WITH_EVIDENCE`, `REVIEW_REQUIRED` met brongebrek en concrete oorspronkelijke herstelactor. Nul experiment-toewijzingen is niet 'voltooid'.

## Releaseherstel en acceptatie

De native Supabase-productie registreert **826** werkelijke migratieparen. Eerste originele 09:35 bron/lock werd door beschermde PR #5605 geaccepteerd, tweede 09:42 exacte SQL-bron door PR #5607. Deze oorspronkelijke source-lockcorrectie brengt de historische Git-bron van 825 naar 826 zonder een derde databaseapply, native history overwrite of verandering aan originele SQL/cron. Test originele 825-prefix ongewijzigd, byte-identieke 09:35 en 09:42 source, dezelfde 14 agents en beide skills in Required/CodeQL. Alleen na beschermde merge, actuele Supabase 826/826 en natuurlijke #171-readback heet **bronpariteit** live.

Voor volledige bedrijfsvoering blijven geauthenticeerde twee-tenant klantformulieren→Portal→Brain→Powerhouse/Heartbeat→omkeerbare CRO behandeling/holdout→echte conversie/omzet→volgende-run learning **EVIDENCE_DUE**. Dit contract introduceert geen runtime scheduler en bewijst nog geen gegarandeerd continu beschikbare volledige bedrijfslus.
