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

## 15 november 2026 — definitieve scheiding van persoonlijk profiel

`linkedin_company` is het zakelijke kanaal van Bedrijfsgeheugen. Publiceer een aantoonbaar bedrijfsprobleem, feitelijke oorzaak, toepasbare aanpak, concrete waarde en waar passend een eerlijke zakelijke vervolgstap. Vergelijk feitelijke prestaties alleen met gemeten provider/owned-data. Gebruik nimmer de persoonlijke ik-herinneringen, kinderen, huis, sport- of vakantiesituaties van Arthur als bedrijfscontent. Een bedrijfs-LinkedIn-post mag geen dagboek met een commerciële slotzin zijn.

`linkedin_personal` behoort aan de persoon en bevat uitsluitend zijn eigen verifieerbare menselijke verhalen in de ik-vorm, zonder bedrijfsbrug. De twee stromen houden onafhankelijke bronidentiteiten, claims, redactieregels, bronhistorie, provider-URN, metingen, en ONE BRAIN-consumer receipts. Geen kruispublicatie/fallback van bedrijfscontent naar persoonlijk.


## 24 november — Content marketing-variatie en post-learning voor beide LinkedIn-redacties

Bronnen: LinkedIn Pages Best Practices https://business.linkedin.com/advertise/linkedin-pages/best-practices ; LinkedIn organische groei https://www.linkedin.com/business/marketing/blog/social-media-marketing/how-to-grow-your-organic-following-on-linkedin ; CMI contentplan https://contentmarketinginstitute.com/content-marketing-strategy/4-part-guide-to-crafting-a-winning-content-plan ; CMI meting https://contentmarketinginstitute.com/content-distribution-promotion/how-to-measure-content-marketing-the-updated-essential-guide . Richtinggevende methodiek, geen bewijs dat een bepaald format bij dit account causaal wint.

Beide bestaande agents beheersen dezelfde kennisbibliotheek maar selecteren onafhankelijk op eigen kanaal, bron, publiek, doel, funnel, historiek, rechten en beschikbare media. Kern: content pillars, audience/JTBD, buyer journey, thought leadership, originele inzichten, onderzoek, educatie, how-to, checklist, vergelijking, myth-busting, verhaal, bronbewezen case, benchmark, praktische template, contrair standpunt, demonstratie, vraag/antwoord, achter-de-schermen, carrousel/document, visual, video, artikel/nieuwsbrief en gratis kennisproduct. AIDA/PAS/BAB, concrete hook, contrast, bewijs, nieuwsgierigheid, wederkerigheid, duidelijke waarde en natuurlijke CTA alleen waar passend. Geen gefingeerde klantcases, engagementbait, automatisering buiten toegestane providerrechten, kunstmatige schaarste, of geforceerd format. Persoonlijk: brongebonden eigen visie/ervaring, geen zakelijke verkoopbridge of verplichte CTA; bedrijf: doelgroepwaarde, eerlijke oplossing, aantoonbare funnel- en orderuitkomst. De bestaande regels over bron, kanaalidentiteit, media, duplicaten en autorisatie blijven bindend.

Originele creative recipe biedt negen persoonlijke redactionele methoden en twaalf zakelijke families; geschikte formats uitsluitend uit bestaande ondersteunde formats. Persoonlijke 48h vergelijking gebruikt eigen expliciet gelabelde, geverifieerde posts en substantive_comments/impressions; twee opeenvolgende herhalingen van dezelfde beschrijvende kandidaat leiden tot DIVERSITY_CHALLENGER. Exploratie gebruikt de minst gebruikte geschikte methode in maximaal zes unieke recent bewezen posts. Bedrijfsdiagnose roteert de ondersteunde formats op basis van eigen recent bewezen historie; de zakelijke bronhouder moet expliciet geschikte families en media bepalen. Een aanbeveling is geen publicatie, effect of daadwerkelijke methodegebruik. Geen vaste 80/20-formatquota als algoritmeclaim; 20% geplande exploratie is een aanpasbare experimentpolicy. Vergelijk binnen soortgelijke onderwerp/format/doelgroepen, wissel één toetsbare variabele, registreer methode/format/pillar/bron/hash/URN/meetvenster en pas succesvolle lessen aantoonbaar toe in een volgende unieke post. Meet 24/48/72h, 7/30d waar werkelijk beschikbaar; NULL blijft onbekend. Registreer exact consumer-ACK bij de oorspronkelijke redactie en ONE BRAIN/Heartbeat. Geen nieuwe scheduler of publisher. Geen live-claim voor alleen code/CI.


## 24 november 2026 — verplichte KPI's voor beide LinkedIn-agents (gebruikersbesluit)
Dagelijks: impressies en uniek bereik; inhoudelijke reacties; shares en opgeslagen posts; profiel-/paginabezoeken; gekwalificeerde gesprekken. Wekelijks: netto volgersgroei; intakegesprekken; conversie naar klanten. Maandelijks: toegerekende omzet. Per experiment: effect toegepaste groeitechnieken. Originele social analytics eigenaar meet providerdata; Relationship Revenue kwalificeert vrijwillige zakelijke gesprekken en intake, Growth Revenue verifieert klantconversie en betaalde toegerekende omzet, Content Learning verifieert de methode en baseline/challenger. Per kanaal, tenant, meetperiode en bron: waarde of NULL, bron-ID, tijd, volledigheid, baseline, target (alleen door bestaande policy goedgekeurd), afwijking, actie, owner en deadline. Uniek bereik nooit optellen over posts, totale reacties niet gelijk aan inhoudelijke, profiel/pagina onderscheiden, netto volgers op gelijke periodes, intake en klantconversie met unieke consent-gedekte CRM-events, omzet alleen onafhankelijk betaald en herleidbaar; geen commerciële verkoopbrug via persoonlijk. Post-snapshots zijn cumulatief, geen dagelijkse accounttotalen. De oorspronkelijke dagelijkse diagnose levert linkedin_kpi_coverage met alle tien verplichtingen per kanaal, expliciete onbekende waarden en bronowner; daadwerkelijke periodemeting blijft OPEN totdat de originele owner een echte receipt levert. KPI's sturen de volgende inhoud, format, timing, onderzoek en toegestane acties; leg toegepaste verbetering en effect in ONE BRAIN/Heartbeat vast. Geen nieuwe scheduler/agent, geen gefingeerde resultaten, geen KPI-groen op basis van coverage of CI. 


## Bindende contentpillarstrategie — 24 november 2026
Persoonlijk: persoonlijk ondernemerschap, thought leadership, kennisdeling, storytelling, vernieuwing, opinie, persoonlijke reflectie, onderzoek. Bedrijf: herkenning, educatie, product, onderzoek, bewijs, innovatie, conversie, kennisproducten. Formatcatalogus: tekstpost, carrousel, infographic, video, onderzoek, artikel, checklist, magazine/document. De originele `selectLinkedInEditorialStrategy` selecteert alleen expliciet bron- en provider-geschikte opties; zonder geschiktheidsbewijs blijft de keuze NULL en levert de analyse gerangschikte hypotheses. Maximaal zes recente geverifieerde kanaaleigen posts, minst gebruikte geschikte pillar/format, 80/20 geplande optimalisatie/exploratie (aanpasbaar; geen bewezen algoritme-effect), één meetbare variabele per experiment. De bestaande redactie beslist, produceert en laat onafhankelijk controleren, bestaande publisher publiceert, analist vergelijkt echte 24/48/72h, 7/30d KPI's; engineering bouwt en implementeert beschermde verbeteringen; ONE BRAIN en Heartbeat vereisen exact toegepaste volgende-artifact-receipt. Houd persoonlijke feiten/visie brongebonden, geen verkoopbridge, geen gefingeerde cases; unsupported media nooit automatisch publiceren. Geen claim dat een aanbeveling daadwerkelijk is toegepast. Publicatiedagen en bestaande veiligheidsgrenzen blijven ongewijzigd.
