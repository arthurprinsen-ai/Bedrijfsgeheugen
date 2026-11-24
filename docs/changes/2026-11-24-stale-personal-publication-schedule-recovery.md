# Voorkom foutieve PUBLICATION_SCHEDULE_MISSING bij latere originele kanaalbeslissing

**Incident:** 24 november 2026, persoonlijk LinkedIn. De ene originele `content_publication_obligations`-rij kreeg omstreeks 00:04 Nederlandse tijd een alarm over een ontbrekende publicatieplanning. De geldige `powerhouse_channel_decisions`-beslissing werd circa 00:24 vastgelegd, met `scheduled_for=2026-11-24T07:00:00Z` (08:00 NL). De inhoudelijke bronselectie en review waren later klaar. Het oude alarm bleef staan omdat de oorspronkelijke terugschrijver alleen *nieuwe* blokkades afhandelde.

**Oplossing:** de bestaande pure planner `planOriginalPublicationHandoffs` produceert op het volgende originele content-loop-tick óók een CAS-update wanneer de oude foutmelding exact `PUBLICATION_SCHEDULE_MISSING` is, de enige originele beslissing een geldige, nog niet verstreken deadline heeft, en de kanaalverplichting nog `PLANNED` is zonder provider-ID. De bestaande oorspronkelijke database-writer verwerkt die update. Er wordt niets gepubliceerd, geen tijd gewijzigd en geen goedkeuring omzeild.

**Test:** ontbrekende planning → originele recovery-waarschuwing → oorspronkelijke kanaalbeslissing arriveert → waarschuwing wordt op één bestaande tick veilig hersteld; idempotent op herhaling, onmogelijk bij provider-ID of gemiste deadline.

**Eigenaren:** `powerhouse-content-orchestrator` beheert bron en gedateerde beslissing; `powerhouse-content-loop` herstelt de statusoverdracht; `powerhouse-social-publisher` publiceert uitsluitend bij geldige bestaande autorisatie, eerlijke tekst en na provider-readback.

**Afzonderlijke inhoudscontrole:** de 24-novemberversie bevat ongeverifieerde terugkerende eigen klantobservaties (‘ik zie wekelijks’, ‘waar ik vaak tegenaan loop’). De oorspronkelijke redactie en kwaliteitscontrole moeten zulke ik-claims aan de echte gebruikersbron toetsen en indien onwaar of onbewezen corrigeren vóór verzending.

Incidentele registry-reparatie voor de 24-novemberrij uitgevoerd; werkelijke LinkedIn-create/GET niet als bewezen geclaimd. Zie https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
