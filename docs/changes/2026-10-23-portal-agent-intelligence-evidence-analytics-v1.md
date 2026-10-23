# Powerhouse Control Center — Leerintelligentie

## Welke verandering?

In het bestaande beveiligde Powerhouse Control Center verschijnt een nieuw tabblad
**Leerintelligentie**. Het maakt agentactiviteit, fouten, leer-/skillsignalen
en herleidbare waarnemingen uit GitHub, Supabase, Notion en Netlify inzichtelijk
met dagelijkse grafieken. De bron is uitsluitend de bestaande beveiligde
Powerhouse observability-API, niet een alternatieve database of tweede scheduler.

## Wat betekent een getal?

Een gebeurtenis is een waarneming, niet automatisch een succesvol verbeterde
klantuitkomst. Een ontbrekende bronwaarneming wordt 'niet waargenomen' en niet
'gezond'. Grafieken gebruiken uitsluitend geladen, deduplicated UTC-dagen,
met een venster van maximaal 30 dagen. Het product moet de beperkingen van die
steekproef expliciet tonen.

Alleen bronbewijzen met de combinatie `PROVEN`, productie-verificatie en
een goedgekeurde HTTPS-bronverwijzing tellen als productiebevestigde kennis.
Commerciële omzetlift, snellere workflows en verbeterde modelkalibratie
vereisen zelfstandige outcome-meting en een vergelijkbare nulmeting.

## Hoe worden agents daadwerkelijk slimmer?

Elke agent start met bestaande gestructureerde bronwaarnemingen, dedupliceert
incidenten op canonical fingerprint, hergebruikt skills, kiest gecontroleerde
experimenten en controleert een meetbaar resultaat. De bestaande Brain/Heartbeat
looptaken en hun writer leases blijven gezaghebbend. Agenten mogen geen
ongeautoriseerde mutaties, OAuth-overrides, privacydoorbreking of gemaskeerde
statusgroenen introduceren.

## Release en veiligheid

De wijziging staat aanvankelijk uitsluitend in
https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4747.
Vereist zijn exact-head kwaliteitscontroles, CodeQL, beschermd mergen,
Netlify provider readback op exact dezelfde productiecommit, echte
browseracceptatie en bewijsgecontroleerde registratie.

Het afzonderlijke migratieherstel in
https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4733
mag niet worden omzeild. Bestaande toegang tot het beheerdersscherm
blijft behouden; gewone klanten krijgen geen toegang tot de technische
operationele gegevens van andere tenants.

## Toekomstige intelligente uitbreidingen — nog niet geïmplementeerd

- OpenTelemetry GenAI-traces met tools, latency, tokens, gevalideerde causaliteit
  en privacyvriendelijke metadata.
  Bron: https://opentelemetry.io/blog/2026/genai-observability/
- Hybrid retrieval over bestaande canonieke skills met full-text + pgvector;
  uitsluitend na bestaande toestemming, tenantisolatie en index-/kostenproef.
  Bron: https://supabase.com/docs/guides/ai/hybrid-search
- Gekalibreerde voorspellingen, control/treatment-experimenten,
  falsificatie door tegenbewijs en daadwerkelijk bewezen klantwaarde.
- Online adaptatie alleen via begrensde canary/experimentbeleid,
  zonder zelf-promotie van modellen naar productie.


## 23 oktober 2026 — bijgewerkt bron- en validatiebewijs

De afzonderlijke migratieherstel-PR #4733 is succesvol in beschermd `main`
samengevoegd. Supabase `main` rapporteert weer `FUNCTIONS_DEPLOYED`.
De oorspronkelijke portal-PR werd bij een eerdere CI-poging nog beoordeeld
tegen basiscommit `52fe3f2af9de304353ec4dcb263962518a970fb9` en telde daardoor
twaalf andere systeemwijzigingen mee: `SCOPE_CONTAMINATED`. De bestaande
PR-basis is daarna bijgewerkt naar de actuele hoofdbranch, zonder een nieuwe PR,
scheduler, agent of opslag te introduceren. De PR-diff bevat precies negen
bedoelde wijzigingsbestanden. De exacte nieuwe commit heeft opnieuw volledige
Required-, Browser-, Portal- en CodeQL-validatie nodig.

Onafhankelijke Supabase-meetbasis op 2026-10-23 (geen omzetclaim):
`powerhouse_daily_compound_learning_control_v1` meldt 332 uitgevoerde acties,
291 met uitkomstkoppeling (87,65% dekking). De bestaande
`powerhouse_action_learning_readiness_v1` meldt 61 achterstallige
verplichtingen, 46 zonder uitkomstbewijs en 338 zonder feedbackbewijs.
Deze categorieën en verschillende meetvensters mogen niet worden opgeteld
alsof het onafhankelijke klantresultaten zijn. Voer geen extra klantenmutaties
uit om een dashboardteller kunstmatig te verhogen.

Concreet vervolg binnen de bestaande Brain/Heartbeat-owner: verbetering
sturen op gemeten outcome-dekking, eerste-keer-goed, versheid van bronbewijs,
betrouwbaarheid en bewezen klantdoelen; met baseline, controleconditie,
risicogrenzen, onafhankelijke production-readback en rollbackbewijs.
