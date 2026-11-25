# CRO event processing, experiments and independently evidenced commercial results

**Owner:** existing Powerhouse Growth/SEO + ONE BRAIN + Heartbeat. **Scope:** canonical.
**Root-cause fingerprint:** `powerhouse|cro|cta-event-alias-mismatch|20261029`.
**Related existing incident/owner:** #4446. **Implementation:** current protected PR; not live by writing a branch.

## Observed production evidence — 2026-10-29
- `growth_events` 222,770 rows, of which 12,144 observed within 7 days and 7,786 without the bot flag. A non-bot flag is **not** independent human identity verification.
- `commercial_leads` 0 rows. `powerhouse_experiment_assignments` 1 row. `powerhouse_experiment_policies` 1 active policy for revenue messaging, **not** consent to start arbitrary website experiments.
- `growth_outcomes` contains 1 historical `lead` and 0 `won_order` outcomes; the last 30 days of `powerhouse_sales_outcomes` were dominated by `not_executed` (6758) and `execution_completed` (404), with no positive revenue. These are NOT 7,186 proven orders.
- The website emits `primary_cta_click`, `money_link_click`, and `secondary_cta_click`, while existing `bg_growth_ingest_event` counts only `cta_click` and two other aliases in `growth_page_daily`. This directly explains at least part of the zero-CTA dashboard discrepancy. Historical events remain governed by exact persisted IDs.

## Implemented in branch
1. Migrate the **existing** `bg_growth_ingest_event` aggregation to include these event types, without changing the sole ingestion RPC, producer, or scheduling.
2. Reconcile historical non-robot event IDs conservatively with `GREATEST` rather than counting a duplicate twice or erasing independent existing metrics.
3. Require an exact datahub table, event/outcome ID, queue ID, and mutually exclusive stored/deduped flags before marking a Netlify growth receipt persisted. HTTP success alone is not evidence. Failure retains the durable queue for bounded retry.
4. Project aggregated existing source data in service-role-only, security-invoker views `powerhouse_cro_conversion_evidence_v1` and `powerhouse_cro_experiment_evidence_v1`. No parallel event table or scheduler.
5. Keep `form_submit_intent` separate from an actual form submission, consented contact, qualified lead, signed order and paid invoice. An order with metadata only is not independently confirmed until source/provider readback.

## Remaining release and business proof obligations
- Exact-head protected Required, BRAIN, CodeQL and migration verification; no privilege or merge bypass.
- Merge on main, Netlify exact deployed SHA, Supabase migration ledger, browser consent-denied/consent-granted event, Netlify durable receipt AND independently fetched Supabase `growth_events.event_id` matching the same event.
- Validate two authenticated portal tenants (owner visibility and forbidden cross-tenant read). New views are service-role-only; do not hand keys to browsers.
- During the following natural measurement run, verify emitted click -> persisted event -> corrected daily CTA counter, bot filters and event timestamps. No synthetic test traffic counted in business metrics.
- Before experiment promotion: preregister hypothesis, success metric, exclusion/guardrails, 50/50 (or stated) random assignment, sample ratio mismatch test, minimum matured samples for both arms, measurement window, statistical uncertainty, and independent order/lead outcomes. Keep inconclusive experiments `INSUFFICIENT_EVIDENCE`.
- A real commercial lead requires a successful valid-contact record plus linked outcome and real permission; paid order requires corresponding contract/invoice/payment-provider evidence and independent provider readback. No fabricated conversions or revenue.
- After verified readback, update the existing portal **Data & intelligence → Andere data** (PR #5140), Brain record and skill runbooks. This PR does not attest that PR #5140 is merged/live.

**Rollback:** revert protected migration/code via new PR and run tests; do not delete event receipts, rewrite historical evidence, create a new scheduler, reclassify failed ACKs as successful, or reset consent.

## CI admission correction
The initial #5143 Required run was rejected by the preflight parser with `PR_MACHINE_METADATA_INVALID:BASE_SHA_INVALID,BASE_SHA_MISSING`; this was a missing machine header in the PR description, not evidence that the actual datahub tests had failed. The exact original branch parent is `1a7dbb3ddacef863f4fcb58b91868edd2cb0676c`. The PR metadata now includes this immutable base. Admission, conflicts, lease, protected checks, PostgreSQL migration, and deployment remain separate gates requiring fresh validation.

## Menselijk herstel- en overdrachtsprotocol (Brain-registratie geverifieerd)

**Voor wie:** Powerhouse-operator, ontwikkelaar, CRO-specialist en toekomstige herstelagent. **Beheerder:** huidige Powerhouse Growth/SEO-eigenaar; er komt geen parallelle scheduler, writer, CRM of CRO-register. **Incident:** `powerhouse|cro|cta-event-alias-mismatch|20261029` in `public.brain_failure_registry`, op 29 oktober 2026 via de bestaande `public.brain_observe_failure` vastgelegd. Teruglezing: `maturity=OBSERVED`, `occurrence_count=1`, `proven_fix=NULL`, oorzaak, preventieregel en regressietest ingevuld. De feiten bewijzen dat het incident is geregistreerd, **niet** dat de oplossing live staat.

**Symptoom:** website-interacties komen binnen, maar in `growth_page_daily` kan de CTA-teller 0 blijven. Read-only vergelijking van persistente events op 29 oktober toont voor 1 oktober op `/over-ons` één `primary_cta_click` tegenover `daily_cta_counter=0`. Een duurzaam geaccepteerd HTTP-event is bovendien niet noodzakelijk hetzelfde als een succesvolle Supabase-write. **Oorzaak:** de client- en SQL-eventnamen liepen uiteen; de Netlify-drain valideerde de exacte RPC-receipt niet.

**Voorgestelde correctie in PR #5143:** één bron-RPC telt alle relevante CTA-eventtypen; conservatieve backfill telt alleen bestaande, unieke, niet als robot gemarkeerde event-ID's; Netlify eist exact `datahub`, `event_id` of `outcome_id`, `queue_id`, en eenduidig `stored` óf `deduped`. Security-aanvulling behoudt de production ACL: `anon=false`, `authenticated=false`, `service_role=true`. Status blijft `SOURCE_COMMITTED / RELEASE_PENDING` totdat exact-head Required, BRAIN, CodeQL en beveiligingscontrole slagen, beschermd gemerged is, de migratie officieel is uitgevoerd en de browser + Supabase + portal readback hetzelfde bewijs tonen.

**Gebruiksaanwijzing bij een volgende storing:**

1. Lees de actuele canonieke Supabase-tabellen `growth_events`, `growth_page_daily`, `commercial_leads`, `growth_outcomes`, `powerhouse_experiment_assignments`, `powerhouse_sales_outcomes` en het bestaande Brain-fingerprint; werk nooit uitsluitend vanuit een dashboard dat 0 toont.
2. Vergelijk daadwerkelijk verzonden `event_type` met SQL-rollup-typen; controleer consent en robotfiltering. Zoek een *werkelijk* event-ID in de durable queue én in de database. Geen kunstmatig customer event of order gebruiken als succesbewijs.
3. Controleer hypothese, controlegroep, verdeling, meetvenster, minimumsteekproef en onafhankelijke uitkomst. Een formulierintentie is niet gelijk aan een gekwalificeerde lead; een `sent` outcome niet aan een betaalde order.
4. Herstel via dezelfde protected-PR- en release-lineage. Geef geen OAuth-, RLS- of CodeQL-bypass; geen duur betaalde providerretry of nieuwe scheduler. Leg per mislukte gate oorzaak, commit-SHA, provider-/eventbewijs, fix, regressietest en nieuwe readback vast in **dezelfde** fingerprint.
5. Publiceer pas `LIVE` wanneer main-SHA, Netlify deployed SHA, Supabase-migratie, browserconsent, persistente event-ID, afgeleide CTA-teller en tenant-afgeschermde portaalprojectie overeenkomen. Pas de status `REAL_CUSTOMER_OUTCOME_VERIFIED` uitsluitend toe bij onafhankelijke daadwerkelijke lead-, order- en betaalbewijzen.

**Borging bij elke toekomstige wijziging:** `AGENTS.md` bevat de verplichte voorcontrole voor alle betrokken agents. `.agents/skills/powerhouse-seo-conversion-orders/SKILL.md` definieert de event-, experiment- en providerbewijsregels. `brain/learning/2026-10-29-cro-event-ack-cta-conversion-v1.json` is de regressie- en leerbron; `docs/development-ledger-events/2026-10-29-cro-event-ack-cta-conversion.md` beschrijft activiteiten en overdracht. Portaalontwikkeling blijft bij de afzonderlijke bestaande PR #5140, waarvan volledige geauthenticeerde twee-tenant productie-readback vereist blijft.

**Wat uitdrukkelijk nog niet is vastgesteld:** een volledige verse consented eventverwerking, voldoende randomized/volwassen CRO-experimenten, daadwerkelijk gekwalificeerde leads, betaalde orders, onafhankelijk bewezen omzet of een afgeronde productie-release. Rapporteer dit als `PENDING/UNVERIFIED`, niet als nul werkelijk resultaat.
