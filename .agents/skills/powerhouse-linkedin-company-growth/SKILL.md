# Skill: Powerhouse LinkedIn Company Growth

Fingerprint: `powerhouse-linkedin-company-growth-v1`

## Doel
Laat de LinkedIn-bedrijfspagina van Bedrijfsgeheugen structureel groeien binnen dezelfde Powerhouse Growth & Revenue OS. De bedrijfspagina is een zakelijke authority- en conversion-surface; bereik, paginaweergaven en volgers zijn tussenmetingen, geen einddoel.

## Canonieke identiteit
- Organisatie: `urn:li:organization:18234216`
- Kanaal: `linkedin_company`
- Runtime: `public.powerhouse_refresh_linkedin_company_growth_v1(date)`
- Dagstaat: `public.powerhouse_linkedin_company_growth_daily_v1`
- Pagina-analytics: `public.powerhouse_linkedin_company_page_metrics_v1`
- Policy: `public.powerhouse_linkedin_company_growth_policy_v1`
- Scheduler-owner: de bestaande `powerhouse_trigger_based_mkb_acquisition_cycle_v1`; er komt geen parallelle scheduler.

## Baseline en doel
De op 4 oktober 2026 geobserveerde LinkedIn-adminbaseline is 12 paginaweergaven in de getoonde periode: 10 desktop en 2 mobiel. De operationele eerste target is 300 paginaweergaven per 30 dagen en 100 relevante nieuwe volgers per 30 dagen.

## Dagelijkse closed loop
page analytics + company-post metrics -> gapdiagnose -> maximaal drie growth-aanbevelingen -> bestaande content-orchestrator/publicatieketen -> provider readback -> website/scan/lead/order/revenue outcome -> learning -> volgende diagnose.

## Contentregels
Bedrijfspaginacontent moet zelfstandig nuttig zijn voor MKB-directie/MT en minimaal één concrete waarde-eenheid leveren: checklist, benchmark, diagnostic, model, template, worked example of andere brongebonden toepassing. Een post krijgt één duidelijke reden om Bedrijfsgeheugen te volgen en, wanneer inhoudelijk passend, één route naar owned value zoals Bedrijfslek, Modelwijzer, benchmark of relevante kenniscontent.

## Kanaalscheiding
Gebruik het persoonlijke LinkedIn-profiel niet als commerciële traffic-bridge voor deze growth-engine. De bestaande persoonlijke kanaalregel blijft leidend: persoonlijk is alleen echte persoonlijke Arthur-context. Groei van de bedrijfspagina mag die identiteitsgrens niet afzwakken.

## Meten en leren
Meet page views, relevante volgers, impressions, reach, engagement en owned-site progression. Optimaliseer uiteindelijk op qualified leads, paid orders en realized revenue. Een stijging in volgers of views zonder downstream commerciële waarde is geen terminale winnaar.

## Guardrails
- geen dubbele of semantisch herhaalde posts;
- geen gefabriceerde social proof, urgency of benchmarks;
- source-backed business claims;
- maximaal één company post per dag vanuit deze growth-policy;
- maximaal drie growth-aanbevelingen per dag;
- provider/readback blijft verplicht;
- bestaand Growth Swarm/content/revenue-systeem wordt uitgebreid, niet gedupliceerd.


## 3 november 2026 — Eigenaar waarschuwen bij menselijke autorisatie

INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1. In ELKE bestaande Powerhouse-/Heartbeat-/ONE BRAIN-uitvoering geldt: bronfouten automatisch repareren zolang de originele agent bevoegd is. Alleen een daadwerkelijk door de originele provider bewezen menselijke grens (nieuwe OAuth-consent, ingetrokken beheerdersrecht, ontbrekend betaaltegoed, expliciete juridische toestemming of de vereiste menselijke goedkeuring) wordt als `OWNER_ACTION_REQUIRED` aan de eigenaar gemeld. Verifieer eerst de LAATSTE native bron; na `linkedin-composio-setup-current-state-v1 = ACTIVE` en `company_oauth_fresh_verified=true` is de eerdere LinkedIn-reauthblokkade vervallen, zelfs wanneer historische incident-403's nog open staan. Duplicaten, redactionele kwaliteitsafwijzingen, gebrek aan mediabewijs en ontbrekend providerreadback zijn primair AGENT-SELF-HEAL, niet standaard toestemming vragen.

Kanoniek: originele `powerhouse-content-loop` bewaart `ownerActionEscalation` via `planOwnerActionEscalations` in `brain_records.content-closed-loop:<business-date>`. Het is een signaleringsPLAN, geen bericht met verzendbewijs. Bestaande dagelijkse `Powerhouse Metingen & Verzending` en `Powerhouse SEO Order Engine` taken lezen de originele status en sturen bij echte eigenaaractie een **ACTIE VAN JOU NODIG**-melding in de bestaande taakconversatie, met oorzaak, impact, één concrete handeling, geldige volledige HTTPS-herautorisatielink (alleen wanneer bron + expiratie bevestigd), originele gebeurtenis-ID, eigenaar en deadline. Een bestaande Gmail-koppeling mag uitsluitend een eigenaarbericht versturen aan de vastgelegde eigenaar en alleen met Gmail-provider-ID als verzendbewijs; mislukte mail wordt expliciet gelogd. Maximaal één melding per fingerprint gedurende 24 uur, opnieuw pas als probleem nog actueel is. Leg herstelbevestiging vast en STOP meldingen zodra provider daadwerkelijk hersteld is. Geen nieuw cron, dubbele executor, generieke marketingmail, valse groene status of omzeilde OAuth.

- LinkedIn distribution: diagnostic_offer posts carry the link to the matching page with utm_source=linkedin&utm_medium=social&utm_campaign=<post-id> in the first comment, never in the post text (evidence speelboek-2026-07-link), at least a third of posts; baseline 3 organic-social sessions in 28 days, cause unverified (5 Nov 2026, fingerprint `seo|visitor-target-skill-sync|20261105-v1`).

- Tags (5 Nov 2026, fingerprint `powerhouse|content-learning|linkedin-tags-not-captured-no-tag-dimension|20261105-v1`): hashtags are a learned variable only inside the existing LinkedIn loop (`bg_social_lus_cyclus`), one variable per post, never a second experiment owner. Capture per post first (`bg_post_kenmerken.tags`; `{}` = no hashtag, NULL = unknown), link text to a post only on a unique channel-day match with a published artifact. Instruction: exactly 3 content hashtags (theme, audience, problem) on their own line, no brand hashtags, never a request to tag, like or share. No tag effect claim before 6 posts per variant and a verified baseline. The migration is applied (provider version 20261105165702) and its lock row is appended in a separate follow-up PR after the migration PR merged; any further migration is applied first, then recorded with the observed version. Evidence: `brain/learning/2026-11-05-linkedin-tags-learning-v1.json`.
