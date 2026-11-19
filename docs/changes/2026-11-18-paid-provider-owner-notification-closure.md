# 18 november 2026 — betaalde providers, gemiste eigenaarmelding

**Oorspronkelijk incident:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

De oorspronkelijke nieuwscron #20 gaf SQL `succeeded`, maar de echte providerresponse was HTTP500 `TAVILY_432` (nieuwste bedrijfsnieuwsbron 8 november). De persoonlijke LinkedIn-artifactgenerator gaf `429 insufficient_quota` `PROVIDER_BILLING` zonder provider-ID. Beide accounts zijn volgens de eigenaar betaald. Dat is niet hetzelfde als onafhankelijk gecontroleerde API-workspace, credit balance, project budget, maandlimiet of autorisatie.

Het bestaande ONE BRAIN had al `ownerActionEscalation=OWNER_ACTION_REQUIRED` met `notification_sent=false` opgenomen, maar de oorspronkelijke taak Metingen & Verzending faalde tijdens de uitvoering op 18 november. Daardoor ontbrak bewezen eigenaarcommunicatie.

**Implementatie:** de enige oorspronkelijke #171 Result Guardian krijgt exact native bron-/persoonlijke-API-evidence, `owner_action_due` en maximaal één herhaalveilig `owner_action_required` event per providerfingerprint per dag onder het bestaande `powerhouse_runtime_events`. Elk event draagt `notification_sent=false`; het verstuurt **geen** bericht. De twee al bestaande ChatGPT Powerhouse-automations kregen in-place notificatie-instructies (18 november), en moeten bij hun natuurlijke volgende run onafhankelijk een echte gebruikerzichtbare melding produceren. Geen tweede agent, cron, mailer, webhook, providerfee, ongeautoriseerde modelwissel of bron-/afmeldingsgate-omzeiling.

**Borging:** `tests/brain-original-provider-owner-notification-20261118.test.mjs`, de oorspronkelijke relatie- en persoonlijke LinkedIn-skills, `brain/learning/2026-11-18-original-paid-provider-owner-notification-v1.json`. Een opgeslagen event is niet bewezen afleveringsbewijs; verdere externe API-recovery, e-mails en persoonlijke LinkedIn-post blijven open totdat exact oorspronkelijke providerreadback en onafhankelijke delivery/metrics bewezen zijn.
