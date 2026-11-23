# Originele CRO-agents lezen drie diagnostische bronnen (17 november 2026)

De originele ONE BRAIN / CRO-consumer `public.powerhouse_daily_source_consume_v1(date)` wordt vanuit het bestaande #140-pad uitgevoerd en behoudt de oorspronkelijke bronrevisie, producer-ACK en idempotente dagverplichting. Deze verbetering leest nu de al live zijnde en beveiligde `powerhouse_cro_site_signal_v1`, `powerhouse_cro_post_signal_v1` en `powerhouse_cro_email_signal_v1` bij iedere oorspronkelijke uitvoering.

Geen nieuwe agent, scheduler, verzending, datatabel, bronhouder of duplicaten. Dezelfde bestaande `GROWTH_SOURCE_DAILY_HANDOFF`-obligation krijgt `analysis.cro_diagnostic_readback` en de bestaande `original_daily_growth_source_consumer`-event bevat de privacyarme observaties (geen emailadressen/tekst). Uurgranulariteit voorkomt onnodige herhaalde obligation-versies; bronfouten worden zichtbaar als `SOURCE_READBACK_UNVERIFIED` met SQLSTATE en de originele source ACK blijft afzonderlijk.

De originele acties zijn gescheiden: website CTA/toestemming herstellen, provider-postmetrics en gecontroleerde experimenten, toegestane e-mailverzending en providerreadback herstellen. Geen automatische externe mail, Instagram-post, commercieel effect of betaling wordt hieruit afgeleid. De 14 bestaande innovatieverplichtingen blijven OPEN totdat echte agentimplementatie, protected release en effectmeting bewezen zijn.

De bronfunctie is met productiedatabase `BEGIN/SELECT/ROLLBACK` getest zonder persistente DDL: drie bronnen vanuit dezelfde consumer, waarna de oorspronkelijke transactie is teruggedraaid. Verplichte vrijgave: protected CI/CodeQL/Supabase Preview, exact main-merge, productieschema-readback en de eerstvolgende **natuurlijke** #140-consumer- en Heartbeat-ACK. Preview is niet het bewijs van runtimecontinuïteit.

Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4900 en https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
