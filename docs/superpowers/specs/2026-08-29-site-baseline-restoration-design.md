# Protected Website Baseline Restoration Design

## Doel

Herstel de inhoudelijk juiste Bedrijfsgeheugen-site zonder SEO-, Brain-, security- of infrastructuurverbeteringen terug te draaien, en voorkom permanent dat agents, menuwerk of automatische optimalisaties een geaccepteerde pagina stil vervangen door een andere inhoudsversie.

## Incident en root cause

De geaccepteerde V18.8-release is als homepage/runtime-baseline behandeld, maar niet als volledige site-identiteit. Daardoor konden onderliggende pagina's en navigatie onafhankelijk evolueren. `over-ons.html` is aantoonbaar eerder vervangen door de doelgroepversie "Geen callcenter. Je krijgt Arthur.", terwijl de gebruiker de merk-/verhaalversie verwacht waarin waarom Bedrijfsgeheugen bestaat, het geloof in de aanpak en de kernwaarden centraal staan. Een groene technische/SEO-test detecteerde dit niet, omdat route, H1, canonical en technische geldigheid nog aanwezig waren.

De foutklasse is daarom: **semantic version drift** — een pagina bestaat en is technisch geldig, maar vertegenwoordigt niet de geaccepteerde inhoudsversie.

## Beschermde website-identiteit

De site krijgt één versioned manifest, `site/accepted-baseline.json`, dat per beschermde route minimaal bevat:

- route en bestandspad;
- geaccepteerde broncommit of expliciete bron-hash;
- SHA-256 van de genormaliseerde inhoud;
- verwachte H1;
- verplichte inhoudsankers/secties (bijvoorbeeld voor `/over-ons`: verhaal/waarom, geloof/werkwijze, kernwaarden; missie en ambitie wanneer aanwezig in de geaccepteerde bron);
- title, meta description, canonical en primair zoekwoord;
- navigatiegroep en linklabel;
- relevante lokale assets;
- policy `content_change: explicit-scope-only`.

Dit manifest wordt de bron van waarheid voor content-identiteit, naast bestaande SEO- en runtimechecks.

## Restauratiestrategie

We herstellen niet door een oude hele repository terug te draaien. Per route wordt de juiste inhoudsversie uit Git-historie gehaald en selectief op de actuele technische basis toegepast.

### Over ons

De huidige doelgroepversie is niet de gewenste inhoudsbaseline. De pre-replacement versie uit commit-parent `4e6444e1228903853d085a4dac45f2885e37ca99` bevat aantoonbaar:

- het oprichtersverhaal en waarom Bedrijfsgeheugen bestaat;
- het probleem dat kennis niet van het bedrijf zelf is;
- het geloof in "praktiseren wat je preekt";
- drie kernwaarden: Gewone taal, Geen big bang, Van jou, niet van mij.

Deze versie wordt als herstelbron gebruikt tenzij een latere, door de gebruiker expliciet geaccepteerde merkversie met missie/ambitie/geloof in Git wordt gevonden. Een latere SEO/technische verbetering mag alleen additief worden hergebruikt en mag de inhoudsankers niet vervangen.

### Andere pagina's

Voor alle primaire routes wordt een content-drift audit uitgevoerd. Minimaal:

`/`, `/over-ons`, `/expertises`, `/product`, `/bedrijfsgeheugen`, `/hoe-het-werkt`, `/frisse-blik`, `/zelfscan`, `/ai-scan`, `/afmaakindex`, `/monitor`, `/benchmark`, `/systemen-koppelen`, `/ai-adoptie`, `/ai-marketing-mkb`, `/due-diligence`, `/voor-mkb`, `/investeerders-ma`, `/contact`, `/blog/`, `/ai-act`, `/data-soevereiniteit`, `/ai-in-bi`, `/ai-in-data-engineering`, `/ai-capability-model`, `/begrippen`, en de vijf koppelingspagina's.

Voor iedere route wordt vastgesteld:

1. Welke inhoud stond in de laatste geaccepteerde websiteversie vóór de drift?
2. Welke latere wijzigingen zijn technisch/SEO-additief en moeten behouden blijven?
3. Welke wijziging verving of verwijderde betekenisvolle inhoud?
4. Welke secties en links moeten terug?

Er wordt pas gerestaureerd als de bronversie aantoonbaar uit Git komt; geen nieuwe copy op basis van aannames.

## Navigatiecontract

Navigatie is een weergave van de geaccepteerde site-IA, niet een zelfstandige bron van waarheid.

- Desktop en mobiel gebruiken dezelfde routecatalogus.
- Een nieuwe mobiele UX mag labels groeperen of drill-down gebruiken, maar geen routes toevoegen, verwijderen of vervangen zonder expliciete scope.
- Voor elke navigatiewijziging wordt vóór en na een gesorteerde set `route + label + groep` vergeleken.
- Onbedoeld verschil = release rood.

## Self-healing baseline guardian

Een nieuwe test/gate `tests/site-baseline-guardian.test.mjs` controleert het manifest tegen de build-output.

De guardian valideert:

1. Alle beschermde routes bestaan.
2. Geen beschermde route heeft onverwachte content-hash drift buiten expliciete scope.
3. Verplichte inhoudsankers zijn aanwezig.
4. SEO-contract blijft geldig.
5. Desktop/mobile routecatalogus is compleet en onderling gelijk.
6. Scope manifest van de PR verklaart elke toegestane contentwijziging.

Bij een niet-toegestane afwijking:

- productiepromotie stopt;
- de afwijkende route en ontbrekende/gewijzigde ankers worden gerapporteerd;
- de laatste accepted baseline wordt als herstelbron aangeboden/gebruikt door de self-healing workflow;
- na herstel draaien baseline-, browser-, SEO- en bestaande V18-gates opnieuw;
- incident, root cause, herstelcommit en nieuwe regressieregel worden geschreven naar de development ledger/shared agent memory.

## Expliciete scope voor toekomstige wijzigingen

Elke PR die beschermde content wijzigt krijgt een machineleesbaar `site/change-scope.json` met exact de routes en change class, bijvoorbeeld:

```json
{
  "routes": ["/over-ons"],
  "change_class": "approved-content-change",
  "preserve": ["seo", "navigation", "required-anchors"]
}
```

Zonder zo'n scope mag een agent wel CSS, JS, performance, security of infrastructuur wijzigen, maar de genormaliseerde inhoud van beschermde pagina's niet veranderen.

## Last-known-good en productie

- `main` blijft productie.
- Herstel wordt op een geïsoleerde branch gebouwd.
- Test/deploy-preview moet exact dezelfde build-input gebruiken als productie.
- Geen productiepromotie voordat baseline guardian, V18 contract, live browser smoke en Pagina-/SEO-controle groen zijn.
- Na productie wordt exact de gepubliceerde SHA opnieuw gecontroleerd.
- Indien productie afwijkt: automatische rollback naar last-known-good accepted deploy en incidentregistratie.

## Acceptatiecriteria

De restauratie is pas klaar wanneer:

- `/over-ons` weer de geaccepteerde merk-/verhaalinhoud bevat, inclusief de door de gebruiker bedoelde missie/ambitie/geloof-elementen voor zover aantoonbaar in de gekozen bronversie;
- alle primaire routes inhoudelijk zijn geaudit en eventuele semantic drift is hersteld;
- geen bestaande SEO-, canonical-, structured-data-, Brain-, security- of portalfunctionaliteit onnodig is teruggedraaid;
- desktop- en mobiele navigatie dezelfde juiste pagina's ontsluiten;
- de baseline guardian een opzettelijke vervanging van `/over-ons` aantoonbaar rood maakt;
- self-healing een baseline-afwijking kan herstellen naar last-known-good en daarna opnieuw verifiëren;
- het incident als permanente leerregel is vastgelegd voor alle huidige en toekomstige agents.

## Niet-doelen

- Geen nieuw redesign.
- Geen nieuwe marketingcopy verzinnen tijdens herstel.
- Geen volledige repository rollback.
- Geen verwijdering van latere technische/SEO/securityverbeteringen als die additief kunnen worden behouden.
