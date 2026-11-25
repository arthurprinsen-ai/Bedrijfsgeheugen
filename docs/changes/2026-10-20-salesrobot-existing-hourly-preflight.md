# 2026-10-20 — Autonoom herstel van SalesRobot-providerzichtbaarheid
P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Productieoorzaak
De eerdere SalesRobot/LinkedIn-herstelketen draaide in Supabase Edge v24, maar het bestaande `powerhouse_dispatch_linkedin_sales_machine_v1`-SQL had geen actieve `cron.job`-aanroep. De bestaande SalesRobot-capabilityrecords waren ouder dan hun TTL. Composio leverde nog het etiket ACTIVE voor de adapter, terwijl echte SalesRobot-readback DISCONNECTED, verlopen cookie, TRIAL_EXPIRED, 0 resterende dagen en geen actieve campagne liet zien. De LinkedIn dry-run meldde tien DM-kandidaten, maar alle tien waren niet individueel goedgekeurd of adresseerbaar.

## Structureel end-to-end statusherstel
De bestaande `powerhouse-linkedin-sales-machine` heeft een mode `provider_preflight` die uitsluitend de bestaande SalesRobot-providerstatus uitleest en die tweemaal in de canonieke capabilityregistry vastlegt. Geen composer, AI, berichten, likes, events of kandidaatmaterialisatie. Het nieuwe kleine SQL-dispatchhulpmiddel wordt idempotent aan het bestaande uurlijkse assurance-Cron-jobcommando gekoppeld, zonder nieuwe `cron.job`. Het is niet publiek uitvoerbaar en gebruikt het bestaande canonieke scheduler-token. Een read-only `dry_run` laat nu zien hoeveel van de voorgestelde DM's goedgekeurd en adresseerbaar zijn; voorgestelde acties zijn geen werkende verzending.

## Belangrijke grens
De providerlicentie, login/cookie en campagne kunnen niet zonder externe accountautoriteit worden gerepareerd; CRM-goedkeuring mag niet worden gefabriceerd. De commerciële keten blijft rood zolang die eisen en onafhankelijke bericht- en learningbewijzen ontbreken. Tests, security, protected main, native Supabase preview, live source/code-readback en schema/cron readback vereist.
