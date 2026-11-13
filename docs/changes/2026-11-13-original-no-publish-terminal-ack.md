# 13 november 2026 — no-publish-veto is een terminale bronbeslissing, geen mislukte publicatie

## Probleem en bronbewijs
Originele #171 `public.powerhouse_content_handoff_receipts_v1` noemde een historische `SKIPPED` met expliciet `evidence.decision=NO_PUBLISH` nog steeds `OVERDUE_PUBLICATION`, zelfs na de gedateerde, door de oorspronkelijke watchdog opgeslagen schone-lei-beslissing van 8 november. Read-only productiecontrole toont 83 oorspronkelijke canonieke skiprecords met volledige veto-reden, geen `external_id`, geen `published_at` en geen `live_proven_at`. Het nieuwe BRAIN-bericht moet **geen** opdracht tot alsnog posten worden en mag geen denkbeeldig provider-, meting- of leersucces zijn.

## Exacte correctie binnen de bestaande keten
De huidige service-role-only, identiteits- en idempotentiebeveiligde originele functie wordt in één migratie opnieuw gedefinieerd. Geen bronstatus gewijzigd. Wanneer status expliciet `SKIPPED` is, originele `NO_PUBLISH` plus actief veto/code/tijd/reason bestaat, en **geen** providerreferentie, eerdere side-effecttijd of conflicterende claim bestaat, krijgt het exacte originele BRAIN-obligationrecord `CANCELLED` en stage `NO_PUBLISH_POLICY_ACK`. Vastlegging omvat oorspronkelijke bronbeslissing, veto en tijd, `producer.verified=false`, `provider_send_allowed=false` en `measurement_or_learning_claimed=false`. Dit is geen `FULFILLED`, externe verzending of vrijbrief om te publiceren.

Het historisch venster van de originele #171 executor stopt met dezelfde ongewijzigde afgehandelde veto's eindeloos te openen, maar heropent een annulering als de originele bronbeslissing wordt ingetrokken of er een provider-side-effect verschijnt. Het eerder beschermde `OVERDUE_PROVIDER_READBACK`-pad voor tegenstrijdige `SKIPPED` met oude providerreferentie heeft nadrukkelijk voorrang. Andere publicaties, analytics, sociale meetvensters, CRO-leertoepassing en originele providerbevestigingen blijven ongewijzigd.

## Onveranderde autoriteit
- Één originele `powerhouse-runtime-scheduler-mux-v1` / #171. Geen tweede cron, publisher, manager, e-mail of mediaprovider.
- Alleen oorspronkelijke Postgres-functie met `REVOKE PUBLIC,anon,authenticated` en `GRANT service_role`.
- Hetzelfde tenant, datum, kanaal, oorspronkelijke owner, revisie en ONE BRAIN-verplichting; bronmetadata blijven behouden.
- Bestaande `agent-reliability`, `agent-data-quality` en `powerhouse-social-cro-funnel`-skill dragen het regressiecontract.

## Acceptatie
Historische, shadow- en canarytests en native migratiepreview verplicht, daarna Protected Required/CodeQL, main, Supabase migratielock/readback en een natuurlijke #171 runtimecontrole. Een statusverbetering in no-publish mag de 6 andere rode loops, de 7 commerciële overdrachten, oude Instagram-provider-onzekerheid, de 181 leerverplichtingen of echte omzet **niet** op groen zetten. De broncorrectie is `SOURCE_CANDIDATE` tot onafhankelijke exacte productie-evidence.

### Nauwkeurige bijstelling voor source-ACK
Aanvullende read-only join op EXACT `content:'||channel + datum + tenant` in originele BRAIN: 82 strikt toegestane no-publish-bronnen zijn daadwerkelijk `OPEN/OVERDUE_PUBLICATION`; één van de 83 records met aanvankelijk passende veto-basiseigenschappen voldoet niet aan de strengere conflictvoorwaarden en wordt **niet** automatisch geannuleerd. Alleen voor de 82 mag de originele #171 na protected release een `CANCELLED`-ACK opnemen.
