/**
 * Externe data van Bedrijfsgeheugen.
 *
 * Een op een overgenomen uit klantportaal.html, waar dit de bron was onder de
 * branchevergelijking, de onderzoekskaarten en het bronnenregister. Portal V2
 * had deze data helemaal niet: elke vergelijking met de markt kwam daar uit
 * handmatig ingevoerde benchmarks.
 *
 * Drie datasets:
 *   BRANCHES   per sector de normcijfers (verzuim, verloop, eNPS, toegevoegde
 *              waarde per vte, digitale intensiteit, groei), de financiele
 *              kengetallen, de relevante wetgeving en de brancheorganisatie.
 *   ONDERZOEK  30 bevindingen uit extern onderzoek, elk met cijfer, bron en
 *              wat het voor een mkb-bedrijf betekent.
 *   BRONNEN    het register waaruit die cijfers komen, met vindplaats.
 *
 * Elk cijfer hoort met zijn bron te worden getoond. Zonder bron is het een
 * bewering, en dat is precies wat dit portaal niet wil zijn.
 */

export const BRANCHES = Object.freeze({
 "ICT & software": {
  "verzuim": 3.4,
  "verloop": 14,
  "enps": 22,
  "tw": 118000,
  "dig": 3.4,
  "groei": 2.6,
  "inst": "NLdigital",
  "url": "https://www.nldigital.nl",
  "wet": [
   "EU AI Act — vanaf augustus 2026 gelden de verplichtingen voor algemene AI-modellen",
   "NIS2 — zorgplicht en meldplicht voor digitale dienstverleners",
   "AVG — verwerkersovereenkomsten met elke klant"
  ],
  "norm": {
   "marge": 62,
   "ebitda": 15,
   "loonquote": 52,
   "marketing": 8,
   "it": 5,
   "dso": 38,
   "cac": 14
  },
  "fin": {
   "mult": 6.5,
   "solva": 40,
   "ebitda": 15,
   "schuldratio": 2
  },
  "duiding": "Snelst groeiende sector: investeringen in AI en digitalisering trekken de toegevoegde waarde omhoog."
 },
 "Zakelijke dienstverlening": {
  "verzuim": 3.6,
  "verloop": 15,
  "enps": 18,
  "tw": 96000,
  "dig": 2.9,
  "groei": 1.2,
  "inst": "VZN / Nederland Adviseert",
  "url": "https://www.vzn.nl",
  "wet": [
   "EU AI Act bij AI in dienstverlening",
   "AVG — verwerkersrol richting opdrachtgevers",
   "Wet DBA en modelovereenkomsten bij inhuur"
  ],
  "norm": {
   "marge": 55,
   "ebitda": 12,
   "loonquote": 58,
   "marketing": 5,
   "it": 3.5,
   "dso": 36,
   "cac": 11
  },
  "fin": {
   "mult": 5,
   "solva": 35,
   "ebitda": 12,
   "schuldratio": 2
  },
  "duiding": "Groeit nauwelijks; de uitzend- en adviesbranche merkt de voorzichtigheid van opdrachtgevers het eerst."
 },
 "Financiële dienstverlening": {
  "verzuim": 4.1,
  "verloop": 12,
  "enps": 15,
  "tw": 142000,
  "dig": 2.8,
  "groei": 1.4,
  "inst": "NVB / Adfiz",
  "url": "https://www.adfiz.nl",
  "wet": [
   "DORA — digitale weerbaarheid, van kracht sinds 2025",
   "Wwft — cliëntenonderzoek en meldplicht",
   "AFM-vergunning en zorgplicht"
  ],
  "norm": {
   "marge": 60,
   "ebitda": 18,
   "loonquote": 50,
   "marketing": 6,
   "it": 6,
   "dso": 30,
   "cac": 12
  },
  "fin": {
   "mult": 6,
   "solva": 30,
   "ebitda": 18,
   "schuldratio": 2.5
  },
  "duiding": "Hoogste toegevoegde waarde per medewerker, maar ook de zwaarste nalevingslast."
 },
 "Handel & retail": {
  "verzuim": 5,
  "verloop": 22,
  "enps": 8,
  "tw": 84000,
  "dig": 2.3,
  "groei": 0.8,
  "inst": "INretail",
  "url": "https://www.inretail.nl",
  "wet": [
   "UPV verpakkingen — uitgebreide producentenverantwoordelijkheid",
   "Consumentenrecht en garantietermijnen",
   "CSRD in de keten: grote klanten vragen jouw cijfers"
  ],
  "norm": {
   "marge": 28,
   "ebitda": 6,
   "loonquote": 18,
   "marketing": 3,
   "it": 1.5,
   "dso": 32,
   "cac": 8
  },
  "fin": {
   "mult": 4,
   "solva": 30,
   "ebitda": 6,
   "schuldratio": 2.5
  },
  "duiding": "Beperkte groei door een voorzichtige consument en hogere inkoopkosten."
 },
 "Industrie & productie": {
  "verzuim": 5.4,
  "verloop": 11,
  "enps": 10,
  "tw": 92000,
  "dig": 2.3,
  "groei": 0.4,
  "inst": "Koninklijke Metaalunie · FME",
  "url": "https://www.metaalunie.nl",
  "wet": [
   "CSRD — via de keten ook voor mkb-toeleveranciers",
   "CBAM — koolstofheffing aan de grens",
   "Machinerichtlijn en CE-markering",
   "Energiebesparingsplicht en informatieplicht"
  ],
  "norm": {
   "marge": 34,
   "ebitda": 10,
   "loonquote": 26,
   "marketing": 2,
   "it": 2,
   "dso": 45,
   "cac": 6
  },
  "fin": {
   "mult": 5,
   "solva": 35,
   "ebitda": 10,
   "schuldratio": 3
  },
  "duiding": "Energie-intensieve bedrijven kunnen hogere kosten niet altijd doorberekenen; automatisering is hier de marge."
 },
 "Logistiek & transport": {
  "verzuim": 5.9,
  "verloop": 18,
  "enps": 5,
  "tw": 72000,
  "dig": 2.2,
  "groei": 0.2,
  "inst": "Transport en Logistiek Nederland",
  "url": "https://www.tln.nl",
  "wet": [
   "Mobiliteitspakket EU — rij- en rusttijden, detachering",
   "CSRD-ketenrapportage over emissies",
   "Zero-emissiezones in ruim dertig steden"
  ],
  "norm": {
   "marge": 24,
   "ebitda": 8,
   "loonquote": 38,
   "marketing": 1.5,
   "it": 2,
   "dso": 42,
   "cac": 5
  },
  "fin": {
   "mult": 4.5,
   "solva": 30,
   "ebitda": 8,
   "schuldratio": 3
  },
  "duiding": "Voelt de brandstof- en ketenkosten het meest rechtstreeks van alle sectoren."
 },
 "Zorg": {
  "verzuim": 8.2,
  "verloop": 16,
  "enps": 6,
  "tw": 68000,
  "dig": 2.1,
  "groei": 2.8,
  "inst": "ActiZ · NVZ",
  "url": "https://www.actiz.nl",
  "wet": [
   "Wkkgz — kwaliteit en klachtenregeling",
   "Wtza — toelatingsvergunning en intern toezicht",
   "NEN 7510 — informatiebeveiliging in de zorg",
   "EHDS — Europese ruimte voor gezondheidsdata"
  ],
  "norm": {
   "marge": 40,
   "ebitda": 4,
   "loonquote": 70,
   "marketing": 1,
   "it": 3,
   "dso": 28,
   "cac": 4
  },
  "fin": {
   "mult": 4.5,
   "solva": 25,
   "ebitda": 4,
   "schuldratio": 3
  },
  "duiding": "Groeit hard in volume, maar het verzuim is het hoogst van alle sectoren — bezetting is hier het knelpunt."
 },
 "Bouw": {
  "verzuim": 5.1,
  "verloop": 12,
  "enps": 12,
  "tw": 78000,
  "dig": 1.6,
  "groei": 0.5,
  "inst": "Bouwend Nederland · EIB",
  "url": "https://www.bouwendnederland.nl",
  "wet": [
   "Wkb — Wet kwaliteitsborging, private toetsing",
   "Omgevingswet — vergunningen en participatie",
   "Stikstofregels en netcongestie bij aansluitingen",
   "Digitaal paspoort voor materialen in aantocht"
  ],
  "norm": {
   "marge": 22,
   "ebitda": 7,
   "loonquote": 30,
   "marketing": 1.5,
   "it": 1.5,
   "dso": 48,
   "cac": 5
  },
  "fin": {
   "mult": 4,
   "solva": 30,
   "ebitda": 7,
   "schuldratio": 2
  },
  "duiding": "Laagste digitale intensiteit van alle sectoren; stikstof, netcongestie en doorlooptijden drukken de productie."
 },
 "Horeca & recreatie": {
  "verzuim": 3.4,
  "verloop": 35,
  "enps": 4,
  "tw": 46000,
  "dig": 1.6,
  "groei": 0.9,
  "inst": "Koninklijke Horeca Nederland",
  "url": "https://www.khn.nl",
  "wet": [
   "HACCP — voedselveiligheid en registratie",
   "Alcoholwet en leeftijdsverificatie",
   "Arbeidstijdenwet bij piekbezetting"
  ],
  "norm": {
   "marge": 68,
   "ebitda": 9,
   "loonquote": 36,
   "marketing": 3,
   "it": 1,
   "dso": 5,
   "cac": 6
  },
  "fin": {
   "mult": 3.5,
   "solva": 25,
   "ebitda": 9,
   "schuldratio": 3
  },
  "duiding": "Laagste verzuim maar veruit het hoogste verloop — inwerken is hier een doorlopend proces."
 },
 "Gemiddeld NL-bedrijf": {
  "verzuim": 5.4,
  "verloop": 17,
  "enps": 12,
  "tw": 88000,
  "dig": 2.3,
  "groei": 1,
  "inst": "MKB-Nederland",
  "url": "https://www.mkb.nl",
  "wet": [
   "EU AI Act — verplichtingen vanaf augustus 2026",
   "AVG",
   "NIS2 voor bedrijven in kritieke ketens",
   "CSRD via klanten en financiers"
  ],
  "norm": {
   "marge": 38,
   "ebitda": 10,
   "loonquote": 38,
   "marketing": 3,
   "it": 2.5,
   "dso": 38,
   "cac": 8
  },
  "fin": {
   "mult": 4.8,
   "solva": 32,
   "ebitda": 10,
   "schuldratio": 2.5
  },
  "duiding": "De Nederlandse economie groeit in 2026 met ongeveer 1%, met oplopende inflatie."
 }
});

export const ONDERZOEK = Object.freeze([
 {
  "dim": "tech",
  "t": "Bijna iedereen gebruikt AI, bijna niemand schaalt op",
  "cijfer": "88% / 23%",
  "bev": "88% van de organisaties gebruikt AI in minstens één functie, maar circa tweederde is nog niet begonnen met opschalen over de organisatie.",
  "bron": "McKinsey, State of AI (gepubliceerd 5 november 2025; enquête juni-juli 2025, 1.993 respondenten in 105 landen)",
  "jaar": 2025,
  "geverifieerd": "2026-09-10",
  "advies": "Gebruik is geen voorsprong. De voorsprong zit in één werkproces dat er echt anders uitziet."
 },
 {
  "dim": "analytics",
  "t": "Pilots zonder resultaat zijn de regel, niet de uitzondering",
  "cijfer": "95%",
  "bev": "MIT vond dat 95% van de generatieve AI-pilots geen meetbaar effect op het resultaat had. De oorzaak lag zelden bij het model, meestal bij data en integratie.",
  "bron": "MIT Project NANDA, The GenAI Divide: State of AI in Business (augustus 2025)",
  "jaar": 2025,
  "geverifieerd": "2026-09-10",
  "voorbehoud": "Dit cijfer is omstreden en rust op één studie, waarin mislukking smal is gedefinieerd als geen snelle omzet- of resultaatimpact. Noem die nuance erbij.",
  "advies": "Begin bij het proces, niet bij de techniek. Als de gegevens niet kloppen, versterkt AI alleen de rommel."
 },
 {
  "dim": "sturing",
  "t": "Uitgaven verdubbelen, rendement niet",
  "cijfer": "1,7% van de omzet",
  "bev": "Bedrijven begroten in 2026 gemiddeld 1,7% van hun omzet voor AI, meer dan het dubbele van vorig jaar. Slechts een kleine groep meldt substantieel rendement.",
  "bron": "BCG AI Radar · Forbes Research",
  "advies": "Zet geen percentage van je omzet opzij. Zet één bedrag tegenover één probleem met een terugverdientijd."
 },
 {
  "dim": "operatie",
  "t": "Vier op de tien agent-projecten worden gestopt",
  "cijfer": "40%",
  "bev": "Gartner verwacht dat meer dan 40% van de agentische AI-projecten vóór eind 2027 wordt geannuleerd — door oplopende kosten, onduidelijk rendement en zwakke beheersing.",
  "bron": "Gartner",
  "advies": "Kies iets kleins dat af kan. Een project dat je binnen twee weken afrondt, wordt nooit geannuleerd."
 },
 {
  "dim": "quality",
  "t": "Het knelpunt is data en integratie, niet het model",
  "cijfer": "80%+",
  "bev": "RAND meet een faalpercentage boven de 80% bij AI-projecten, doorgaans door ontbrekende of ontoegankelijke gegevens.",
  "bron": "RAND",
  "advies": "De saaie stap — afspreken wat een klant, order of uur precies is — bepaalt of de rest werkt."
 },
 {
  "dim": "mensen",
  "t": "Waarde ontstaat pas bij herontwerp van werk",
  "cijfer": "6%",
  "bev": "Ongeveer 6% van de organisaties haalt substantiële waarde uit AI. Wat hen onderscheidt is niet meer techniek maar het opnieuw inrichten van werkstromen.",
  "bron": "McKinsey",
  "advies": "Techniek naast bestaand werk leggen levert niets op. Het werk zelf moet veranderen — en dat vraagt om mensen die meebewegen."
 },
 {
  "dim": "finance",
  "t": "Kosten lopen structureel uit de hand",
  "cijfer": "79%",
  "bev": "79% van de ondernemingen had het afgelopen jaar te maken met hogere AI-kosten dan begroot; de gemiddelde overschrijding lag rond 30%.",
  "bron": "DoiT / Sapio Research",
  "advies": "Spreek vooraf een maximum af per toepassing, en meet het verbruik vanaf dag één."
 },
 {
  "dim": "finance",
  "t": "Reken het rendement door zoals een investeerder dat doet",
  "cijfer": "TEI",
  "bev": "Forrester rekent bij zijn Total Economic Impact-aanpak niet alleen kosten en baten door, maar ook de flexibiliteit die je erbij koopt en het risico dat een aanname niet uitkomt — met een bandbreedte in plaats van één getal.",
  "bron": "Forrester (Total Economic Impact)",
  "advies": "Zet naast je besparing ook op wat er misgaat als het tegenvalt. Een businesscase met een ondergrens wordt eerder geloofd dan één mooi getal."
 },
 {
  "dim": "sturing",
  "t": "Nederland zit in de Europese kopgroep, het mkb blijft achter",
  "cijfer": "DESI",
  "bev": "Eurostat en de Europese Commissie meten de digitale positie van lidstaten in de DESI-index. Nederland scoort hoog op connectiviteit en digitale vaardigheden, maar de spreiding binnen het mkb is groot — het gemiddelde wordt opgetrokken door grote bedrijven.",
  "bron": "Eurostat / Europese Commissie (DESI)",
  "advies": "Vergelijk je niet met het landelijk gemiddelde maar met je eigen branche en grootteklasse. Dat is de enige vergelijking waar je iets aan hebt."
 },
 {
  "dim": "finance",
  "t": "Er is subsidie voor precies dit soort werk",
  "cijfer": "RVO",
  "bev": "RVO voert regelingen uit die op digitalisering en scholing zijn gericht — onder meer SLIM (leren en ontwikkelen in het mkb), MIT (innovatie) en WBSO (loonkosten voor ontwikkelwerk). Voorwaarden en openstellingsperiodes wisselen per jaar.",
  "bron": "RVO",
  "advies": "Kijk vóór je begint of je stap onder een regeling valt. Achteraf aanvragen kan meestal niet, en dat scheelt zomaar een derde van de kosten."
 },
 {
  "dim": "commercie",
  "t": "Banken zien per sector iets anders aankomen",
  "cijfer": "per sector",
  "bev": "De economische bureaus van Rabobank, ING en ABN AMRO publiceren elk kwartaal sectorprognoses met omzet-, marge- en volumeverwachtingen per branche, inclusief de knelpunten die zij bij hun klanten zien.",
  "bron": "RaboResearch · ING Economisch Bureau · ABN AMRO Sector Advisory",
  "advies": "Lees één keer per kwartaal het rapport van je eigen sector. Het kost twintig minuten en het is de goedkoopste marktanalyse die er bestaat."
 },
 {
  "dim": "analytics",
  "t": "Rendement aantonen vraagt om een bandbreedte",
  "cijfer": "TEI",
  "bev": "Forrester onderscheidt in zijn Total Economic Impact-aanpak vier onderdelen: kosten, baten, flexibiliteit (opties die je erbij koopt) en risico (de kans dat een aanname niet uitkomt). De uitkomst is een bandbreedte, geen enkel getal.",
  "bron": "Forrester (Total Economic Impact)",
  "advies": "Presenteer je businesscase met een ondergrens en een bovengrens. Directies geloven een bandbreedte eerder dan één mooi getal."
 },
 {
  "dim": "mensen",
  "t": "Bedrijfsoverdracht is een landelijk vraagstuk, geen persoonlijk probleem",
  "cijfer": "vergrijzing",
  "bev": "Onderzoek van universiteiten en kennisinstellingen (onder meer Nyenrode en Panteia, in opdracht van onder meer KVK en het ministerie van EZK) laat zien dat een groot deel van de mkb-eigenaren de komende jaren de pensioenleeftijd bereikt, terwijl de overdraagbaarheid van hun bedrijf vaak niet is voorbereid.",
  "bron": "Nyenrode · Panteia · KVK",
  "advies": "Begin drie jaar voor een beoogde overdracht met vastleggen, niet drie maanden. De kennisoverdracht is de traagste stap van het hele traject."
 },
 {
  "dim": "quality",
  "t": "Slechte datakwaliteit is een kostenpost, geen ergernis",
  "cijfer": "structureel",
  "bev": "Gartner wijst al jaren op datakwaliteit als een van de grootste verborgen kostenposten in organisaties: dubbel werk, verkeerde beslissingen en projecten die stranden op gegevens die niet kloppen.",
  "bron": "Gartner",
  "advies": "Kies drie kernbegrippen — klant, order, uur — en spreek af wat ze betekenen. Dat is goedkoper dan elk dashboard opnieuw bouwen."
 },
 {
  "dim": "governance",
  "t": "Toezichthouders kijken nu ook naar AI",
  "cijfer": "2026",
  "bev": "DNB en het Financieel Stabiliteitscomité signaleren dat AI het cyberdreigingsbeeld verandert en de weerbaarheidseisen verhoogt. Tegelijk lopen de verplichtingen uit de EU AI Act vanaf augustus 2026 in.",
  "bron": "DNB · Financieel Stabiliteitscomité · EU AI Act",
  "advies": "Zet op één A4 welke AI-tools jullie gebruiken en welke gegevens erin gaan. Dat is de eerste vraag die je bij een audit of due diligence krijgt."
 },
 {
  "dim": "sturing",
  "t": "Nederland is Europees koploper — de lat ligt dus hoog",
  "cijfer": "89%",
  "bev": "89% van het Nederlandse mkb haalt het basisniveau van digitale intensiteit (vier van twaalf technologieën), tegen 83% twee jaar eerder. Nederland staat daarmee op plek één in Europa. In de ict-sector haalt 98% dat niveau; in de horeca zit 41% juist op het laagste.",
  "bron": "CBS en Eurostat (digitale-intensiteitsindex)",
  "advies": "Basisniveau is geen voorsprong meer maar een instapeis. De voorsprong zit in de stap daarna: gegevens die één keer worden ingevoerd."
 },
 {
  "dim": "mensen",
  "t": "Tot 60% van je opleidingskosten vergoed",
  "cijfer": "€ 24.999",
  "bev": "De SLIM-regeling vergoedt tot 60% van de kosten voor leren en ontwikkelen in het mkb, tot bijna € 25.000 per aanvraag. Voor 2026 is € 71,9 miljoen beschikbaar. Werkt je bedrijf aan technisch nieuwe processen of software, dan is de WBSO de grootste fiscale regeling.",
  "bron": "RVO en Uitvoering Van Beleid (SZW)",
  "advies": "Reken je verbeterplan door mét regeling. Een traject van € 20.000 kan netto € 8.000 kosten — dat verandert het gesprek in de directiekamer."
 },
 {
  "dim": "finance",
  "t": "Rendement met een bandbreedte, niet met één getal",
  "cijfer": "TEI",
  "bev": "Forrester rekent in zijn Total Economic Impact-aanpak vier dingen door: kosten, baten, de flexibiliteit die je erbij koopt, en het risico dat een aanname niet uitkomt. De uitkomst is een bandbreedte.",
  "bron": "Forrester (Total Economic Impact)",
  "advies": "Zet naast je besparing wat er gebeurt als het tegenvalt. Een businesscase met een ondergrens wordt eerder geloofd dan één mooi getal."
 },
 {
  "dim": "tech",
  "t": "Kies gereedschap op je eigen situatie, niet op een ranglijst",
  "cijfer": "40%",
  "bev": "Gartner verwacht dat ruim 40% van de agentische AI-projecten vóór eind 2027 wordt gestopt, door oplopende kosten en onduidelijk rendement. Leveranciersvergelijkingen zeggen iets over de markt, niet over jouw bedrijf.",
  "bron": "Gartner",
  "advies": "Kies op basis van wat er al draait bij jou. Een pakket dat hoog scoort maar niet koppelt met je huidige systemen, kost je meer dan het oplevert."
 },
 {
  "dim": "operatie",
  "t": "Wat de banken van je sector verwachten",
  "cijfer": "sector",
  "bev": "De economische bureaus van Rabobank, ING en ABN AMRO publiceren per kwartaal prognoses per sector — volumegroei, marges en knelpunten. Die cijfers gebruiken financiers ook bij hun eigen beoordeling.",
  "bron": "RaboResearch · ING Economisch Bureau · ABN AMRO Sector Advisory",
  "advies": "Leg je eigen groeiverwachting naast die van je sector. Wijk je er sterk van af, zorg dan dat je kunt uitleggen waarom — je financier vraagt ernaar."
 },
 {
  "dim": "sturing",
  "t": "De macro-belofte is groot, de weg ernaartoe traag",
  "cijfer": "± 7%",
  "bev": "Goldman Sachs raamt dat brede AI-toepassing het mondiale bruto product op termijn met enkele procenten kan verhogen — in hun bekendste raming rond 7% — maar met invoering over tien jaar en per sector grote verschillen. Diezelfde bank publiceerde later ook een kritisch stuk over de vraag of de investeringen zich terugverdienen.",
  "bron": "Goldman Sachs Research",
  "advies": "Macrocijfers rechtvaardigen geen budget. Reken je eigen zaak door met de uren die je zelf hebt geteld."
 },
 {
  "dim": "finance",
  "t": "Investeringen lopen voor op de opbrengsten",
  "cijfer": "kapitaal",
  "bev": "Morgan Stanley wijst erop dat de kapitaaluitgaven aan AI-infrastructuur sneller stijgen dan de gemeten productiviteitswinst bij gebruikers. Het gat tussen uitgaven en resultaat is voorlopig de regel, niet de uitzondering.",
  "bron": "Morgan Stanley Research",
  "advies": "Koop geen capaciteit vooruit. Begin bij één proces met een terugverdientijd die je kunt uitleggen."
 },
 {
  "dim": "operatie",
  "t": "Wie opschaalt, doet het bedrijfsbreed — niet per afdeling",
  "cijfer": "schaal",
  "bev": "Bain constateert dat bedrijven die daadwerkelijk waarde halen uit AI het niet per afdeling aanpakken, maar rond hele werkstromen organiseren, met één eigenaar en een vaste manier van meten.",
  "bron": "Bain & Company — Technology Report",
  "advies": "Kies één keten van begin tot eind — offerte tot factuur — in plaats van drie losse experimenten."
 },
 {
  "dim": "mensen",
  "t": "Wat de wetenschap zegt over waarom het misgaat",
  "cijfer": "onderzoek",
  "bev": "Onderzoek van MIT en RAND wijst steevast naar dezelfde oorzaken: ontbrekende of ontoegankelijke gegevens en werk dat niet opnieuw is ingericht. Niet het model, maar de organisatie eromheen bepaalt de uitkomst. Nederlandse instellingen als TNO en de universiteiten van Groningen en Tilburg komen op hetzelfde uit voor het mkb.",
  "bron": "MIT · RAND · TNO en Nederlandse universiteiten",
  "advies": "Behandel dit als een organisatievraagstuk met een technisch onderdeel, niet andersom."
 },
 {
  "dim": "operatie",
  "t": "Verbeteren is een gewoonte, geen project",
  "cijfer": "Harvard",
  "bev": "Onderzoek vanuit Harvard Business School laat zien dat organisaties die structureel verbeteren dat doen met kleine, doorlopende aanpassingen en zichtbaar resultaat — niet met grote programma's. Grote veranderprogramma's stranden juist het vaakst op uitvoering, niet op het plan.",
  "bron": "Harvard Business School / Harvard Business Review",
  "advies": "Plan geen jaartraject. Plan een reeks van stappen van twee weken, elk met een zichtbaar resultaat."
 },
 {
  "dim": "mensen",
  "t": "Wie het werk doet, weet waar het misgaat",
  "cijfer": "praktijk",
  "bev": "Uit onderzoek naar procesverbetering blijkt dat de meest bruikbare verbeteringen komen van de mensen die het werk dagelijks doen — mits iemand die inbreng ophaalt en er daadwerkelijk iets mee doet. Waar dat ontbreekt, houdt verbetering op na het eerste enthousiasme.",
  "bron": "Harvard Business Review · MIT Sloan",
  "advies": "Vraag één keer aan het team welke drie dingen tijd kosten zonder iets op te leveren. Pak er één op en laat zien dat het is opgelost."
 },
 {
  "dim": "commercie",
  "t": "Wat klanten van technologie vinden, bepaalt of ze blijven",
  "cijfer": "houding",
  "bev": "Publieksonderzoek van Ipsos, Kantar en YouGov laat zien dat vertrouwen in hoe een bedrijf met gegevens en AI omgaat meeweegt in de keuze voor een leverancier — en dat mensen het vooral merken aan hoe snel en hoe eerlijk ze antwoord krijgen.",
  "bron": "Ipsos · Kantar · YouGov",
  "advies": "Wees open over waar je AI voor gebruikt en waar niet. Dat is goedkoper dan het verlies van één klant die zich overvallen voelt."
 },
 {
  "dim": "sturing",
  "t": "Wat de planbureaus zeggen over productiviteit",
  "cijfer": "CPB",
  "bev": "Het Centraal Planbureau wijst er al jaren op dat de Nederlandse productiviteitsgroei laag is en dat investeringen in kennis en organisatie zwaarder wegen dan investeringen in machines. Het SCP voegt daaraan toe dat werkbeleving en autonomie sterk samenhangen met wat mensen aankunnen aan verandering.",
  "bron": "Centraal Planbureau · Sociaal en Cultureel Planbureau",
  "advies": "Reken je verbetering niet alleen in uren. Wat je mensen ervan vinden bepaalt of die uren ook echt vrijkomen."
 },
 {
  "dim": "tech",
  "t": "Leveranciersvergelijkingen zeggen iets over de markt, niet over jou",
  "cijfer": "let op",
  "bev": "Analisten als Gartner, Forrester, IDC, Omdia, Everest Group en ISG publiceren kwadranten, golven en marktoverzichten waarin leveranciers naast elkaar worden gezet. Die vergelijkingen wegen zwaar bij grote ondernemingen: schaalbaarheid, wereldwijde ondersteuning, uitgebreide functionaliteit. Voor een bedrijf van elf tot vijftig medewerkers zijn dat zelden de doorslaggevende criteria.",
  "bron": "Gartner · Forrester · IDC · Omdia · Everest Group · ISG",
  "advies": "Gebruik ze om te zien welke partijen serieus zijn en waar de markt heen gaat. Kies vervolgens op wat bij jou past: koppelt het met wat er draait, spreekt de leverancier Nederlands, en kun je er over drie jaar nog uit?"
 },
 {
  "dim": "security",
  "t": "AI verandert het dreigingsbeeld",
  "cijfer": "—",
  "bev": "Het Financieel Stabiliteitscomité constateerde in juni 2026 dat geavanceerde AI-modellen het cyberdreigingslandschap ingrijpend veranderen en de urgentie van weerbaarheid vergroten.",
  "bron": "DNB / FSC",
  "advies": "Begin bij het saaie deel: toegangsrechten, tweestapsverificatie en een back-up die je hebt teruggezet."
 }
]);

export const BRONNEN = Object.freeze([
 {
  "soort": "Statistiek",
  "naam": "CBS StatLine",
  "wat": "Verzuim per bedrijfstak, arbeidsproductiviteit, digitale intensiteit, omzet per branche",
  "url": "https://opendata.cbs.nl"
 },
 {
  "soort": "Statistiek",
  "naam": "Eurostat — digitale-intensiteitsindex",
  "wat": "Nederland tegenover Europa; 89% van het mkb haalt het basisniveau",
  "url": "https://ec.europa.eu/eurostat"
 },
 {
  "soort": "Economie",
  "naam": "De Nederlandsche Bank",
  "wat": "Groei, inflatie, loonontwikkeling, financiële stabiliteit",
  "url": "https://www.dnb.nl"
 },
 {
  "soort": "Economie",
  "naam": "RaboResearch · ING Economisch Bureau · ABN AMRO",
  "wat": "Sectorprognoses per kwartaal",
  "url": "https://www.rabobank.nl/kennis"
 },
 {
  "soort": "Onderzoek",
  "naam": "McKinsey — State of AI",
  "wat": "Gebruik tegenover opschaling; waarde ontstaat bij herontwerp van werk",
  "url": "https://www.mckinsey.com"
 },
 {
  "soort": "Onderzoek",
  "naam": "BCG — AI Radar",
  "wat": "Budgetten en rendement",
  "url": "https://www.bcg.com"
 },
 {
  "soort": "Onderzoek",
  "naam": "Gartner",
  "wat": "Verwachtingen over projecten en gereedschap",
  "url": "https://www.gartner.com"
 },
 {
  "soort": "Onderzoek",
  "naam": "Forrester — Total Economic Impact",
  "wat": "Rendement met flexibiliteit en risico erin",
  "url": "https://www.forrester.com"
 },
 {
  "soort": "Universiteit",
  "naam": "MIT — Project NANDA · RAND",
  "wat": "Waarom pilots stranden: data en integratie, niet het model",
  "url": "https://mit.edu"
 },
 {
  "soort": "Universiteit",
  "naam": "Stanford — AI Index",
  "wat": "Jaarlijks overzicht van adoptie en kosten",
  "url": "https://aiindex.stanford.edu"
 },
 {
  "soort": "Overheid",
  "naam": "RVO — SLIM, WBSO, MIT",
  "wat": "Tot 60% vergoeding voor leren en ontwikkelen; fiscale korting bij ontwikkelwerk",
  "url": "https://www.rvo.nl"
 },
 {
  "soort": "Overheid",
  "naam": "UWV — Arbeidsmarktprognose",
  "wat": "Krapte per beroep en regio",
  "url": "https://www.uwv.nl"
 },
 {
  "soort": "Overheid",
  "naam": "KVK Handelsregister",
  "wat": "SBI-code, grootteklasse en oprichtingsjaar",
  "url": "https://www.kvk.nl"
 },
 {
  "soort": "Regelgeving",
  "naam": "EU AI Act · NIS2 · CSRD · AVG",
  "wat": "Wat er wanneer gaat gelden, per sector uitgewerkt",
  "url": "https://digital-strategy.ec.europa.eu"
 },
 {
  "soort": "Branche",
  "naam": "Metaalunie · Bouwend Nederland · NLdigital · INretail · TLN · KHN · ActiZ",
  "wat": "Cao’s, marges en sectorspecifieke normen",
  "url": "https://www.mkb.nl"
 }
]);

/**
 * Herkomst en houdbaarheid van de datasets.
 *
 * Het regelgevingsregister had dit al; deze datasets niet, en dat was een gat:
 * CBS-cijfers, sectorprognoses en onderzoekspercentages verouderen net zo goed.
 * Wat hier staat is bewust ongemakkelijk expliciet: de branchenormen en de
 * meeste onderzoekskaarten zijn overgenomen uit klantportaal.html en zijn niet
 * stuk voor stuk opnieuw bij de bron gecontroleerd. Alleen kaarten met een
 * `geverifieerd`-datum zijn dat wel.
 *
 * tests/delivery-regelgeving-actueel.test.mjs gaat rood zodra een van deze
 * herzieningsdata verstrijkt.
 */
export const HERKOMST = Object.freeze({
  branches: Object.freeze({
    wat: 'Normcijfers per sector: verzuim, verloop, eNPS, toegevoegde waarde per vte, digitale intensiteit, groei en financiële kengetallen.',
    bronnen: 'CBS StatLine, Eurostat digitale-intensiteitsindex, DNB, sectorprognoses van RaboResearch, ING en ABN AMRO. Verloop en eNPS komen uit gangbare HR-benchmarks en zijn geen CBS-cijfer.',
    peildatum: '2026-09-10',
    herzienUiterlijk: '2027-03-01',
    voorbehoud: 'Overgenomen uit klantportaal.html en niet per sector opnieuw bij de bron gecontroleerd. Bij de eerstvolgende herziening: begin bij CBS StatLine en de kwartaalprognoses.'
  }),
  onderzoek: Object.freeze({
    wat: 'Bevindingen uit extern onderzoek over AI-gebruik, opschaling en rendement.',
    bronnen: 'McKinsey, MIT, BCG, Gartner, RAND, Forrester en anderen.',
    peildatum: '2026-09-10',
    herzienUiterlijk: '2026-12-15',
    voorbehoud: 'Van de dertig kaarten zijn er twee opnieuw geverifieerd en gedateerd. De overige dragen de bron die het vorige portaal noemde, zonder jaartal. Een percentage zonder jaartal is voor een klant niet na te lopen; die kaarten horen bij de herziening een jaar te krijgen of te verdwijnen.'
  }),
  bronnen: Object.freeze({
    wat: 'Register van vindplaatsen achter de cijfers.',
    peildatum: '2026-09-10',
    herzienUiterlijk: '2027-03-01',
    voorbehoud: 'De URL\'s zijn niet automatisch gecontroleerd op bereikbaarheid.'
  })
});

/** Onderzoekskaarten waarvan het cijfer opnieuw bij de bron is nagelopen. */
export function onderzoekGeverifieerd() {
  return ONDERZOEK.filter(item => item.geverifieerd);
}

/** Kaarten zonder jaartal: bruikbaar als richting, niet als bewijs. */
export function onderzoekZonderJaar() {
  return ONDERZOEK.filter(item => !item.jaar);
}

const norm = value => String(value ?? '').toLocaleLowerCase('nl').trim();

export const BRANCHENAMEN = Object.freeze(Object.keys(BRANCHES));
export const STANDAARD_BRANCHE = 'Gemiddeld NL-bedrijf';

/** De normcijfers van een branche; valt terug op het gemiddelde NL-bedrijf. */
export function brancheProfiel(naam) {
  if (!naam) return BRANCHES[STANDAARD_BRANCHE] || null;
  const sleutel = BRANCHENAMEN.find(key => norm(key) === norm(naam));
  return BRANCHES[sleutel] || BRANCHES[STANDAARD_BRANCHE] || null;
}

/**
 * Eigen cijfers naast de branchenorm. Geeft per maatstaf het verschil en of
 * hoger beter is, zodat een scherm er niet zelf over hoeft te oordelen.
 */
export function brancheVergelijking(metrics = {}, brancheNaam) {
  const b = brancheProfiel(brancheNaam);
  if (!b) return [];
  const getal = value => (Number.isFinite(Number(value)) ? Number(value) : null);
  const rijen = [
    ['Brutomarge', getal(metrics.grossMargin), b.norm?.marge, true, '%'],
    ['EBITDA-marge', getal(metrics.ebitdaMargin), b.norm?.ebitda, true, '%'],
    ['Loonquote', getal(metrics.wageRatio), b.norm?.loonquote, false, '%'],
    ['Marketingquote', getal(metrics.marketingRatio), b.norm?.marketing, false, '%'],
    ['IT-quote', getal(metrics.itRatio), b.norm?.it, false, '%'],
    ['DSO', getal(metrics.dso), b.norm?.dso, false, ' dgn'],
    ['Verzuim', getal(metrics.absence), b.verzuim, false, '%'],
    ['Verloop', getal(metrics.turnover), b.verloop, false, '%'],
    ['eNPS', getal(metrics.enps), b.enps, true, '']
  ];
  return rijen
    .filter(([, eigen, norm]) => eigen !== null && Number.isFinite(Number(norm)))
    .map(([label, eigen, normwaarde, hogerIsBeter, eenheid]) => ({
      maatstaf: label, eigen, norm: Number(normwaarde), eenheid,
      verschil: eigen - Number(normwaarde),
      beter: hogerIsBeter ? eigen >= Number(normwaarde) : eigen <= Number(normwaarde)
    }));
}

/** Onderzoekskaarten die bij een bedrijfsonderdeel horen. */
export function onderzoekVoor(dimensie) {
  if (!dimensie) return ONDERZOEK;
  return ONDERZOEK.filter(item => item.dim === dimensie);
}

/** Wetgeving die voor deze branche speelt, met de brancheorganisatie erbij. */
export function regelgevingVoor(brancheNaam) {
  const b = brancheProfiel(brancheNaam);
  if (!b) return { regels: [], instantie: '', url: '' };
  return { regels: [...(b.wet || [])], instantie: b.inst || '', url: b.url || '' };
}

export const EXTERNAL_DATA_VERSION = '2026-09-10-v1';
