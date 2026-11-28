# Ontwikkellog — originele bloggoedkeuring hersteld, 23-11-2026

- Eerste mislukking: original `powerhouse-daily-blog.yml` run [45142661254](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/45142661254), HTTP401 bij GitHub→Supabase REST-bron `powerhouse_content_artifacts`
- Origineel artikel 23 november: `GENERATED`, `content_ready`, `publish`, bron-ID/slug geldig, zes uur verstreken, geen veto; feitelijke subsidiepoort niet van toepassing op Twinfield-inhoud
- Actieve oorspronkelijke bronfunctionaliteit: `powerhouse-blog-queue` is al server-token-authenticated en wordt uit bestaande content-loop/cron #140 aangeroepen
- Eenmalige bewezen herstelroute: dezelfde `record_content_publication_state` functie leverde `APPROVED` + oorspronkelijk bewijs op 09:31 UTC; originele GH writer maakte PR [#6123](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/6123)
- Bronfix: pure veto helper + RPC + onafhankelijk readback naar oorspronkelijke queue. Origineel GitHub-schema vervangt alleen de zwakke PostgREST goedkeuringswriter door onafhankelijk leesbewijs via oorspronkelijke privé-exporter
- Tests: oorspronkelijk `tests/brain-blog-auto-approval-veto-window-20261105.test.mjs`, nieuw `tests/brain-blog-original-queue-auto-approval-recovery-20261123.test.mjs`
- Geen nieuwe cron/sender, geen bypass, geen RLS- of providerkeywijziging; oude GH service-key is verdachte foutoorzaak, niet zonder afzonderlijke verificatie als ingetrokken beschouwd
- Status bij commit: `SOURCE_CANDIDATE_NOT_LIVE`; alleen echte volgende autonome uurcyclus + beschermd productiebewijs mag vervolg groen maken
