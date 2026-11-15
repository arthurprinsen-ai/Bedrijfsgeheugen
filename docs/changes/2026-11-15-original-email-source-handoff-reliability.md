# P0 #4198 — de vier bestaande commerciële e-mailverrijkingstaken

Datum: 2026-11-15. Fingerprint: `powerhouse|email|four-workstream-source-handoff-safe-send-measurement|20261115-v1`.

## Uitvoering (bestaande eigenaren, geen tweede keten)

1. **Brononderzoek:** `powerhouse-relationship-public-research` blijft exclusieve schrijver van due-only publieke bedrijfsbronkandidaten onder originele cron #116. Een bedrijfswebsite met meer dan 160 kB HTML mocht eerder helemaal niet worden gecontroleerd; nu leest de worker maximaal 160 kB en kan een strikt persoon/bedrijf/werk-`mailto:`-bewijs in dat beperkte deel vinden. Is die pagina afgekapt en ontbreekt zo'n bewijs, dan is de status `SOURCE_HTML_TRUNCATED_UNVERIFIED` en blijft dezelfde originele actie retriable. Geen bulkdownload, afgedwongen toegang, gekochte lookup of nieuw e-mailadres zonder bewijs.
2. **Overdracht:** `powerhouse-commercial-message-composer` keek maar naar de eerste vijftig source-held acties met een wachtrijfilter. Die kan geldige opvolgende acties laten verhongeren. Dezelfde originele view wordt nu stabiel gesorteerd op prioriteit en actie-ID en in hoogstens vier pagina's van vijftig gecontroleerd. Alleen de al bestaande `sourceVerifiedComposerHandoff` met exact research-action/person/company/news-bron, actualiteit en kwaliteit laat vervolg toe. Een verlopen actie blijft verlopen: geen stilzwijgende verlenging.
3. **Autorisatie en verzending:** De reeds bestaande composer- en outreachpoorten blijven ongewijzigd. Een adreskandidaat is geen contacttoestemming. Verzend alleen via de oorspronkelijke Gmail-agent bij rechtmatige, per-ontvanger geverifieerde autoriteit, suppression-/contactdruk- en kwaliteitscontroles. Provideronzekerheid vereist readback, nooit blind resend. Deze wijziging verstuurt zelf geen e-mail.
4. **Effectmeting en leren:** De bestaande `powerhouse_commercial_handoff_scorecard_v1`, `powerhouse_sales_outcomes`, provider-ID/readback, replies, afspraken en gerealiseerde omzet zijn de autoriteit. ONE BRAIN sluit alleen na precieze producer/consumer-correlatie, werkelijke zakelijke uitkomst en onafhankelijke leer-ACK. Een geslaagde bronlezing of handoff is geen omzetbewijs.

## Productiebeeld bij aanvang

- 23.295 contacten, waarvan 605 met bestaand canoniek e-mailadres.
- Tien openstaande originele publieke bronherpogingen. Geobserveerde falen: `SOURCE_HTML_TOO_LARGE`, `SOURCE_HTTP_NON_SUCCESS` en `REDIRECT_UNSAFE_OR_CROSS_HOST`.
- Vier onbewijsbare of verlopen commerciële overdrachten in de 7-dagen-scorecard: `BROKEN_RESEARCH_TO_COMPOSER_SLA` (1), `BROKEN_RESEARCH_TO_COMPOSER_EXPIRED` (1), `EXPIRED_WITHOUT_DELIVERY` (2).
- Een brononderzoek dat `done` heet kan nog altijd geen matchende geverifieerde bedrijfnieuwsbron hebben; zo'n actie mag niet naar verzending.
- Reeds bestaande crons #116, #138 en #171 staan aan en recente runs waren technisch geslaagd; geen bewijs van vier herstelde zakelijke overdrachten.

## Regressie, bewijspoorten en herstel

Nieuwe test: `tests/brain-original-email-research-handoff-20261115.test.mjs`. Controleert bytebegrenzing, fail-closed truncated-bronnen, oorspronkelijke due-only replay, onafhankelijke concrete `mailto:`-evidence, stabiele gebonden handoff-paginering en bestaande provider/consent/outcome-guards. Deze test is een *contractregressie*, geen live eind-tot-eind bewijs.

Release uitsluitend na exact-head Required, CodeQL, bestaande CI/Preview waar toepasselijk, beschermde merge, werkelijke native Edge-versie en exacte GitHub bronpariteit, natuurlijke #116/#138 verwerking, origineel consumer `PROCESSED`, rechtmatige provider-ID/readback en daadwerkelijke meetuitkomst. Indien een daarvan niet bewezen is: originele `COMMERCIAL_EXECUTION` in #4198 OPEN/DEGRADED laten. Geen groen claimen op alleen deze code. Ontstane CI- of productiefouten in de oorspronkelijke `brain_failure_registry` met herstel, owner, regressie en preventie; geen tweede engine.

Rollback: revert de twee originele Edge-wijzigingen via beschermde PR, niet via directe runtime-mutie; behoud originele actie-ID's, nog open source retry-timestamps, toestemming, provider ID's en ONE BRAIN historie.

## Aanvulling — daadwerkelijke sender- en outcome-hardening (vierde werkstroom)

De oorspronkelijke Gmail-Edge `powerhouse-autonomous-outreach` claimt een `prepared`-actie nu atomair met originele `updated_at` en het duurzame `PROVIDER_OUTCOME_UNKNOWN`-pre-send checkpoint. Een procesuitval tussen claim en Gmail kan niet tot een automatische tweede verzending leiden; de originele readback-owner moet eerst de externe werkelijkheid vaststellen. Bij ontbrekend provider-ID blijft het resultaat UNKNOWN, zonder automatisch resend. Een expliciet gepinde Gmail-verbinding die niet ACTIVE blijkt, wordt niet vervangen door een willekeurige andere Gmail-account.

Voor het claimen worden onafhankelijke, echt geregistreerde verzenduitkomsten in het laatste 14-daagse venster en lopende onbewezen verzendpogingen van dezelfde persoon gelezen. Bij druk of onzekerheid blijft `prepared` met een origineel HELD-reason. Er worden geen nieuwe adressen en geen toestemmingen gefabriceerd.

De bestaande `powerhouse_sales_outcomes` is nu idempotent insert-only op verzend-dedupe en krijgt een onafhankelijke exact provider-ID/action-ID/readbackcontrole vóór de actie terminal kan worden. Replay mag eerdere `occurred_at` niet wijzigen. Bron van providerverzendtijd blijft expliciet UNKNOWN waar alleen een gecontroleerde attempt timestamp bekend is. Meet `attempted_now`, `verified_new_sends`, `prior_readbacks_settled`, `held` en `unverified` gescheiden; een oude readback is geen nieuwe verzending. Alle eerdere consent/suppressions/quality gates blijven bestaan. Test: `tests/brain-original-email-atomic-send-and-outcome-20261115.test.mjs`.

Nog niet bewezen: werkelijke nieuwe publieke kandidaten, het afwerken van alle vier historisch onafgesloten overdrachten, nieuwe legitieme providerverzending, replies, afspraken, omzet en leereffect. De originele P0 blijft OPEN. Rollback alleen via beschermde één-eigenaar release; nooit rechtstreeks de scheduler, contact- of providerhistorie muteren.
