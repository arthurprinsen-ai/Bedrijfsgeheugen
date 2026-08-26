# MO14-1 Multi-Rater Position Engine — Design

## Doel
Bouw de bestaande PW MO14-1 Coach Playbook uit tot een centrale beoordelings- en opstellingshub waarin alle 14 speelsters door vijf begeleiders onafhankelijk kunnen worden beoordeeld, waarna een algoritme met hockeypositieprofielen de beste individuele posities en teamopstellingen berekent.

## Scope
De bestaande live functies blijven behouden: homepage met motto en ambitie, teamcultuur, coachwoorden, wedstrijdcultuur, winnende kracht, balbezit/balverlies, succesmeting, speelsterspagina's, 1–5-scores, automatische positie-fit, 4-3-3/3-4-3/4-4-2, Make en Netlify.

Nieuwe scope:
1. Centrale lijst met 14 speelsters.
2. Centrale lijst met 5 beoordelaars/begeleiders.
3. Iedere beoordeling is uniek per `beoordelaar + speelster + beoordelingsmoment`.
4. Geen beoordelaar overschrijft de invoer van een ander.
5. Teambeeld per speelster met gemiddelde scores, aantal beoordelingen, spreiding en conflictmarkering.
6. Positieprofielen op basis van hockeykennis: techniek, spelinzicht, verdedigen, snelheid, loopvermogen, rust aan de bal, aanvallend instinct en communicatie, uitgebreid met balbezit, niet-balbezit, omschakeling, moed/winnende kracht en teamgedrag.
7. Automatische fit per speelster voor keeper, back, centraal achter, buitenmidden, centraal midden, buitenspits en centrumspits.
8. Automatische sterkste 4-3-3, 3-4-3 en 4-4-2 op basis van gezamenlijke data.
9. Resultaten terugschrijven naar Notion Hub.

## Beoordelaars
De eerste vijf beoordelaars worden als configuratiedata opgeslagen. De UI mag later zonder codewijziging extra beoordelaars ondersteunen. De implementatie gebruikt een `reviewer_id`, `reviewer_name` en actieve status. De gebruiker kiest bij openen wie hij/zij is; deze keuze wordt lokaal onthouden.

## Datamodel in Notion
Gebruik één centrale Hub met minimaal drie logische datasets:

### 1. Spelers
- player_id
- naam
- actief
- huidige beste positie
- tweede positie
- ontwikkelpositie
- positie-confidence
- laatste teambeeld-moment

### 2. Beoordelaars
- reviewer_id
- naam
- actief

### 3. Beoordelingen
Iedere rij representeert één volledige beoordeling van één speelster door één beoordelaar.
- assessment_id
- player_id / relatie naar speler
- reviewer_id / relatie naar beoordelaar
- moment
- techniek
- spelinzicht
- verdedigen
- snelheid
- loopvermogen
- rust_aan_de_bal
- aanvallend_instinct
- communicatie
- balbezit
- niet_balbezit
- omschakeling
- moed
- winnende_kracht
- teamgedrag
- observatie
- bron

### 4. Opstellingen
- formatie
- moment
- lineup_json
- teamfit
- gebruikte_beoordelingen
- confidence
- bron

## Teambeeld
Per speelster wordt per kenmerk het gemiddelde van de meest recente actieve beoordelingen berekend. Daarnaast wordt de spreiding berekend. Bij een verschil van 2 of meer punten tussen minimum en maximum op een kenmerk toont de UI `Bespreken`.

Het teambeeld toont:
- aantal beoordelaars
- gemiddelde per kenmerk
- min/max per kenmerk
- conflictmarkeringen
- beste positie + fit
- tweede positie + fit
- ontwikkelpositie
- confidence

## Positieprofielen
De algoritmelaag gebruikt gewichten per positie. Gewichten moeten als configuratie in JavaScript staan zodat ze uitlegbaar en aanpasbaar blijven.

Basisprofielen:
- Keeper: communicatie, rust, verdedigen, spelinzicht.
- Back: 1-tegen-1, snelheid, techniek, omschakeling, niet-balbezit.
- Centraal achter: verdedigen, spelinzicht, rust, communicatie, niet-balbezit.
- Buitenmidden: loopvermogen, snelheid, techniek, omschakeling, balbezit.
- Centraal midden: spelinzicht, techniek, rust, loopvermogen, balbezit.
- Buitenspits: snelheid, techniek, aanvallend instinct, balbezit, moed.
- Centrumspits: aanvallend instinct, vrijloop-/balbezitgedrag, moed, techniek, winnende kracht.

## Positieberekening
Voor ieder positieprofiel:
`fit = som(score_kenmerk × gewicht_kenmerk) / maximale_gewogen_score × 100`.

De scorebron is het teambeeld als minimaal twee beoordelaars beschikbaar zijn. Bij slechts één beoordeling wordt die gebruikt met lagere confidence. Bij nul beoordelingen is geen automatische positie mogelijk.

Confidence:
- 1 beoordelaar: laag
- 2 beoordelaars: middel
- 3+ beoordelaars: hoog
- conflict op meerdere kernkenmerken verlaagt confidence één niveau

## Teamoptimizer
Voor 4-3-3, 3-4-3 en 4-4-2 wordt een maximum-weight assignment gebruikt waarbij iedere speelster maximaal één basispositie krijgt.

De optimizer maximaliseert totale positie-fit met aanvullende zachte correcties voor:
- team-breedte tussen verdediging, middenveld en aanval
- minimaal voldoende verdediging in achterste lijn
- voldoende spelinzicht/rust centraal
- voldoende snelheid op buitenposities
- aanvallend instinct in voorste lijn

De optimizer geeft:
- 11 basisspeelsters op een veld
- positie per speelster
- individuele fit
- teamfit
- wissels met aanbevolen eerste positie
- korte onderbouwing

## UI
Bij openen:
1. kies beoordelaar
2. toon huidige beoordelaar permanent in de header
3. `Mijn beoordelingen`
4. `Teambeeld`
5. `Opstellingen`

Per speelster:
- tab `Mijn beoordeling`: invoer 1–5 en observatie
- tab `Teambeeld`: gemiddelden, spreiding, positieadvies
- opslaan schrijft direct naar centrale Hub

Geen telefoonnummers of andere persoonsgegevens uit screenshots worden opgeslagen.

## Dataflow
Browser → Make webhook → Notion Beoordelingen → Make/website read-model → teambeeld → positie-engine → teamoptimizer → Notion Opstellingen + spelerssamenvatting → UI.

De bestaande directe schrijfroute naar Notion wordt vervangen door append/upsert op beoordeling-identiteit; bestaande spelers- en opstellingsdata blijft behouden.

## Foutafhandeling
- Zonder beoordelaar kan niet worden opgeslagen.
- Onvolledige beoordeling mag lokaal worden bewaard maar niet als definitief teambeeld meetellen.
- Webhookfout toont duidelijke foutstatus en behoudt lokale invoer.
- Dubbele submit van dezelfde beoordeling-id is idempotent.
- Ontbrekende Notion-data leidt niet tot wissen van lokale data.

## Privacy
Geen internetonderzoek naar individuele minderjarige speelsters. Externe kennis mag alleen algemene hockeypositie-eisen en trainingsprincipes leveren. Persoonlijke speelsterscores komen uitsluitend uit eigen observaties van het begeleidingsteam.

## Succescriteria
- Vijf beoordelaars kunnen onafhankelijk vanaf verschillende telefoons invullen.
- Geen scores worden onderling overschreven.
- Teambeeld verschijnt per speelster zodra centrale data beschikbaar is.
- Positie-fit is uitlegbaar en reproduceerbaar.
- 4-3-3, 3-4-3 en 4-4-2 gebruiken het gezamenlijke teambeeld.
- Notion bevat spelers, beoordelaars, beoordelingen en opstellingen.
- Live site blijft mobiel bruikbaar en bestaande tactiek/cultuurpagina's blijven intact.
