# Niet-stille dagelijkse publicatie: automatische herstelplicht in bestaande Powerhouse

**Datum:** 31 oktober 2026. **Incident:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198. **Eigenaar:** originele Powerhouse-content-loop, per-kanaal publisher, ONE BRAIN/Heartbeat/Portal V2.

## Bewezen probleem

Om 09:25 lokale tijd bevatten de oorspronkelijke publicatieverplichtingen vier `PLANNED` kanalen met nul externe provider-ID's. De oorspronkelijke LinkedIn-posts van 29 oktober bestaan en mogen niet opnieuw worden verzonden. Op 30 oktober blokkeerde de juiste wereldwijde duplicaatcontrole beide nieuwe LinkedIn-voorstellen; Mira voldeed niet aan definitieve mediale bewijscontrole; blog was alleen `GENERATED` en had `approved_at=null`. De Github-actie van 31 oktober (run 41172685143) eindigde groen als workflow terwijl het uitvoerlog `NO_ACTION:NO_APPROVED_BLOG_ARTIFACT`, `NO_OPEN_DAILY_CANDIDATE` en `NO_MERGED_DAILY_BLOG` verklaarde. Geen van deze technisch afgeronde stappen bewijst publicatie. De originele cron/loop bleef actief; extra trigger #17289 gaf 202 `ALREADY_RUNNING` terug en voorkwam dubbele uitvoering.

## Herstelcontract en beslisboom

1. De **oorspronkelijke** Powerhouse-content-loop leest exact de beslissingen, ingestelde `scheduled_for`, duurzame dagverplichting, provider/public proof en controleert alle afgesproken kanalen. Bij expliciet `FAILED/BLOCKED`, ontbrekend dagbesluit of >30 minuten na tijd zonder terminal bewijs is de status `RECOVERY_DUE` en de bestaande lus ROOD, nooit zwijgend AMBER/groen.
2. Elke getroffen lane krijgt een **bestaande kanaaleigenaar, gerichte oorzaak en herstelactie**. LinkedIn = verse wezenlijk andere en onafhankelijke bron, niet alleen herschrijven; Mira = nieuw definitief gevalideerde video, identiteitscore minimaal 0,940 plus concrete tekst; blog = originele redactionele goedkeuring en beveiligde websitepublicatie; e-mail = werkelijke kanaalmachtiging, opt-in/doelgroep en suppressie. Technisch veilig herstel blijft binnen dezelfde oorspronkelijke scheduler/lease; menselijke OAuth/goedkeuring blijft voor mensen.
3. Alleen echte provider `create/ACK`, exact ID, en waar vereist onafhankelijke platform/browser-readback, of blog main→Netlify→exact URL, maakt resultaat echt. `SKIPPED` is geen aflevergarantie. Elke vertraging wordt met fingerprint, oorzaak, eigenaar, bewijs, herstel, regressietest, portaalstatus en volgende natuurlijke toepassing in origineel ONE BRAIN geborgd.
4. De **bestaande afgeschermde Portal V2** leest dezelfde vijftien-lussen-guardreceipts. Ze geeft direct per gemist kanaal status ‘Herstel nodig’, concrete actie en geplande tijd; geen ruwe providerfouten, accounttokens of nieuwe tabel/monitor.

## Regressie en beveiligde oplevering

`tests/brain-daily-publication-no-silent-gap-20261031.test.mjs` bewijst deadline, onmiddellijke hard boundaries, echte provider-ID stop, ontbrekend besluit, sanitized readback, bestaande originale eigenaar en portaalkaart. Required/BRAIN/CodeQL blijven leidend; geen direct main push. Geen nieuw cron, geen tweede uitvoeringssysteem, geen Make/Buffer, geen foutieve ontvanger, geen versoepeling van provider-/media-/identiteit-/consent-gates. Deze documentatie is een **codekandidaat**; een na-merge Supabase Edge-implementatie en onafhankelijke volgende natuurlijke providerreadback zijn apart noodzakelijk voordat 'live hersteld' gerechtvaardigd is.
