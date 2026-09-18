// Exact native migration of the protected legacy execution-ladder definitions.
// Source of record for migration parity: klantportaal.html.
export const EXECUTION_LADDER_STEPS=Object.freeze(['Tellen','Vastleggen','Koppelen','Meten','Borgen']);
export const EXECUTION_LADDER_REALIZABILITY=0.70;
export const EXECUTION_LADDER_CATALOG=Object.freeze({
  "mensen": {
    "t": "Kennis uit hoofden",
    "afd": "HR en de afdeling met de meeste sleutelkennis",
    "s": [
      {
        "w": "Tel één week hoe vaak iemand iets moet navragen bij één persoon",
        "rol": "afdeling",
        "wie": "Leidinggevende van die afdeling",
        "mnd": 1,
        "d": 1,
        "klaar": "Je hebt een lijst met namen en hoe vaak ze werden gestoord.",
        "deel": 0.05
      },
      {
        "w": "Maak een kennismatrix: per taak wie het kan",
        "rol": "afdeling",
        "wie": "Leidinggevende, in één werkoverleg",
        "mnd": 2,
        "d": 1,
        "klaar": "Elke kerntaak heeft twee namen, of staat op de risicolijst.",
        "deel": 0.2
      },
      {
        "w": "Beschrijf de taken met één naam op één A4",
        "rol": "afdeling",
        "wie": "De persoon zelf, met een collega die meeleest",
        "mnd": 3,
        "d": 2,
        "klaar": "Een collega heeft de taak één keer gedaan met alleen dat A4.",
        "deel": 0.35
      },
      {
        "w": "Meet de inwerktijd van de volgende nieuwe collega",
        "rol": "directie",
        "wie": "Directie of HR",
        "mnd": 6,
        "d": 2,
        "klaar": "Je kent het aantal dagen tot iemand zelfstandig draait.",
        "deel": 0.25
      },
      {
        "w": "Zet de kwartaalcontrole vast in de agenda",
        "rol": "directie",
        "wie": "Directie wijst één eigenaar aan",
        "mnd": 9,
        "d": 1,
        "klaar": "Het staat in de agenda en is één keer uitgevoerd.",
        "deel": 0.15
      }
    ]
  },
  "tech": {
    "t": "Eén keer invoeren",
    "afd": "Commercie, operatie en finance samen",
    "s": [
      {
        "w": "Tel één week hoe vaak gegevens worden overgetypt",
        "rol": "afdeling",
        "wie": "De mensen die het doen",
        "mnd": 1,
        "d": 1,
        "klaar": "Eén getal: keer per week, plus de zwaarste route.",
        "deel": 0.05
      },
      {
        "w": "Spreek af wat een klant, order en uur precies zijn",
        "rol": "directie",
        "wie": "Directie beslist, finance schrijft op",
        "mnd": 2,
        "d": 1,
        "klaar": "Eén A4 met definities, door iedereen gezien.",
        "deel": 0.15
      },
      {
        "w": "Koppel de twee systemen met het meeste handwerk",
        "rol": "project",
        "wie": "Projectleider of externe partij",
        "mnd": 3,
        "d": 2,
        "klaar": "Een order gaat van A naar B zonder overtypen.",
        "deel": 0.45
      },
      {
        "w": "Meet de doorlooptijd van offerte tot factuur",
        "rol": "afdeling",
        "wie": "Finance",
        "mnd": 6,
        "d": 1,
        "klaar": "Je kent het aantal dagen, voor en na.",
        "deel": 0.2
      },
      {
        "w": "Leg vast wie de koppeling beheert en wat er gebeurt als hij stilvalt",
        "rol": "project",
        "wie": "Projectleider draagt over aan een vaste eigenaar",
        "mnd": 8,
        "d": 1,
        "klaar": "Eén naam en een herstelinstructie van vijf regels.",
        "deel": 0.15
      }
    ]
  },
  "analytics": {
    "t": "Sturen op cijfers",
    "afd": "Directie en finance",
    "s": [
      {
        "w": "Tel hoeveel dagen na de maand je cijfers klaar zijn",
        "rol": "afdeling",
        "wie": "Finance",
        "mnd": 2,
        "d": 1,
        "klaar": "Je kent het aantal dagen en wie erop wacht.",
        "deel": 0.05
      },
      {
        "w": "Kies vijf getallen die er echt toe doen",
        "rol": "directie",
        "wie": "Directie, in één sessie van een uur",
        "mnd": 3,
        "d": 1,
        "klaar": "Vijf getallen met per getal één eigenaar.",
        "deel": 0.2
      },
      {
        "w": "Haal die vijf uit de bron in plaats van uit een spreadsheet",
        "rol": "project",
        "wie": "Projectleider of externe partij",
        "mnd": 5,
        "d": 2,
        "klaar": "De cijfers werken zichzelf bij; niemand exporteert nog.",
        "deel": 0.4
      },
      {
        "w": "Bespreek ze maandelijks op een vast moment",
        "rol": "directie",
        "wie": "Directie",
        "mnd": 7,
        "d": 3,
        "klaar": "Drie keer achter elkaar gedaan met dezelfde cijfers.",
        "deel": 0.2
      },
      {
        "w": "Zet de rapportagekalender vast",
        "rol": "afdeling",
        "wie": "Finance",
        "mnd": 10,
        "d": 1,
        "klaar": "Wie levert wat wanneer staat op één plek.",
        "deel": 0.15
      }
    ]
  },
  "operatie": {
    "t": "Het proces zichtbaar maken",
    "afd": "Operatie en werkvoorbereiding",
    "s": [
      {
        "w": "Volg één opdracht van binnenkomst tot factuur en noteer elke wachttijd",
        "rol": "afdeling",
        "wie": "Werkvoorbereider",
        "mnd": 1,
        "d": 1,
        "klaar": "Je hebt de doorlooptijd en de drie langste wachtmomenten.",
        "deel": 0.1
      },
      {
        "w": "Beschrijf de drie hoofdprocessen op één A4 (SIPOC)",
        "rol": "afdeling",
        "wie": "De mensen die het werk doen",
        "mnd": 2,
        "d": 2,
        "klaar": "Per proces staat wie levert, wat erin gaat en wat eruit komt.",
        "deel": 0.25
      },
      {
        "w": "Haal de grootste wachttijd eruit",
        "rol": "project",
        "wie": "Projectleider met de betrokken afdelingen",
        "mnd": 4,
        "d": 2,
        "klaar": "De doorlooptijd is aantoonbaar korter dan bij de eerste meting.",
        "deel": 0.35
      },
      {
        "w": "Meet doorlooptijd en herstelwerk elke maand",
        "rol": "afdeling",
        "wie": "Operatie",
        "mnd": 7,
        "d": 2,
        "klaar": "Twee getallen die maandelijks vanzelf komen.",
        "deel": 0.2
      },
      {
        "w": "Leg de nieuwe werkwijze vast en wijs een eigenaar aan",
        "rol": "directie",
        "wie": "Directie",
        "mnd": 10,
        "d": 1,
        "klaar": "Eén naam per proces, vastgelegd.",
        "deel": 0.1
      }
    ]
  },
  "finance": {
    "t": "Cijfers die vanzelf kloppen",
    "afd": "Finance en administratie",
    "s": [
      {
        "w": "Tel hoeveel uur de maandafsluiting kost en waaraan",
        "rol": "afdeling",
        "wie": "Administratie",
        "mnd": 1,
        "d": 1,
        "klaar": "Je weet het aantal uur en de drie zwaarste stappen.",
        "deel": 0.1
      },
      {
        "w": "Maak een afsluitkalender: wie doet wat op welke dag",
        "rol": "afdeling",
        "wie": "Finance",
        "mnd": 2,
        "d": 1,
        "klaar": "De kalender is één maand gevolgd.",
        "deel": 0.2
      },
      {
        "w": "Automatiseer de zwaarste stap (facturen, bank of uren)",
        "rol": "project",
        "wie": "Projectleider of je accountant",
        "mnd": 4,
        "d": 2,
        "klaar": "Die stap gebeurt zonder handwerk.",
        "deel": 0.4
      },
      {
        "w": "Meet debiteurendagen elke maand",
        "rol": "afdeling",
        "wie": "Administratie",
        "mnd": 6,
        "d": 1,
        "klaar": "Het getal staat maandelijks op tafel.",
        "deel": 0.2
      },
      {
        "w": "Spreek af wie bij afwijkingen ingrijpt",
        "rol": "directie",
        "wie": "Directie",
        "mnd": 9,
        "d": 1,
        "klaar": "Eén naam, en één keer toegepast.",
        "deel": 0.1
      }
    ]
  },
  "commercie": {
    "t": "Opvolging die niet meer vergeten wordt",
    "afd": "Sales en binnendienst",
    "s": [
      {
        "w": "Tel hoeveel offertes er open staan en hoe oud ze zijn",
        "rol": "afdeling",
        "wie": "Binnendienst",
        "mnd": 1,
        "d": 1,
        "klaar": "Je hebt het aantal en de oudste datum.",
        "deel": 0.1
      },
      {
        "w": "Leg de vier stappen van contact tot opdracht vast",
        "rol": "afdeling",
        "wie": "Sales samen met de directie",
        "mnd": 2,
        "d": 1,
        "klaar": "Iedereen gebruikt dezelfde stappen.",
        "deel": 0.2
      },
      {
        "w": "Zet automatische opvolging op na verzending",
        "rol": "project",
        "wie": "Projectleider of je systeembeheerder",
        "mnd": 3,
        "d": 2,
        "klaar": "Geen offerte blijft langer dan tien dagen zonder contact.",
        "deel": 0.4
      },
      {
        "w": "Meet conversie per stap",
        "rol": "afdeling",
        "wie": "Sales",
        "mnd": 6,
        "d": 2,
        "klaar": "Je weet bij welke stap de meeste afvallers zitten.",
        "deel": 0.2
      },
      {
        "w": "Bespreek verloren offertes één keer per maand",
        "rol": "directie",
        "wie": "Directie met sales",
        "mnd": 9,
        "d": 1,
        "klaar": "Drie keer gedaan, met genoteerde redenen.",
        "deel": 0.1
      }
    ]
  },
  "service": {
    "t": "Klantvragen naar één plek",
    "afd": "Klantenservice en binnendienst",
    "s": [
      {
        "w": "Tel een week lang waar klantvragen binnenkomen",
        "rol": "afdeling",
        "wie": "Binnendienst",
        "mnd": 1,
        "d": 1,
        "klaar": "Je weet via welke kanalen en hoeveel per dag.",
        "deel": 0.1
      },
      {
        "w": "Kies één adres of systeem voor alle vragen",
        "rol": "directie",
        "wie": "Directie beslist",
        "mnd": 2,
        "d": 1,
        "klaar": "Alles komt op één plek binnen.",
        "deel": 0.25
      },
      {
        "w": "Geef elke vraag een eigenaar en een status",
        "rol": "project",
        "wie": "Projectleider of leverancier",
        "mnd": 3,
        "d": 2,
        "klaar": "Je ziet per vraag wie hem heeft en hoe lang hij open staat.",
        "deel": 0.35
      },
      {
        "w": "Meet reactietijd en oplostijd",
        "rol": "afdeling",
        "wie": "Klantenservice",
        "mnd": 6,
        "d": 2,
        "klaar": "Twee getallen per maand.",
        "deel": 0.2
      },
      {
        "w": "Maak van de tien meestgestelde vragen een antwoordenlijst",
        "rol": "afdeling",
        "wie": "Klantenservice",
        "mnd": 9,
        "d": 1,
        "klaar": "De lijst is er en wordt gebruikt.",
        "deel": 0.1
      }
    ]
  },
  "security": {
    "t": "De basis van beveiliging",
    "afd": "Directie met de systeembeheerder",
    "s": [
      {
        "w": "Maak een lijst van wie waar toegang toe heeft",
        "rol": "afdeling",
        "wie": "Systeembeheerder",
        "mnd": 1,
        "d": 1,
        "klaar": "De lijst is compleet en één keer nagelopen.",
        "deel": 0.15
      },
      {
        "w": "Zet tweestapsverificatie aan op alles wat het ondersteunt",
        "rol": "project",
        "wie": "Systeembeheerder of externe partij",
        "mnd": 2,
        "d": 1,
        "klaar": "Iedereen logt in met twee stappen.",
        "deel": 0.3
      },
      {
        "w": "Zet één keer een back-up terug",
        "rol": "project",
        "wie": "Systeembeheerder",
        "mnd": 3,
        "d": 1,
        "klaar": "Een bestand is teruggezet en werkt.",
        "deel": 0.25
      },
      {
        "w": "Schrijf één A4 incident-responseplan",
        "rol": "directie",
        "wie": "Directie",
        "mnd": 5,
        "d": 1,
        "klaar": "Wie doet wat in het eerste uur staat op papier.",
        "deel": 0.2
      },
      {
        "w": "Zet de uitdienstlijst vast",
        "rol": "directie",
        "wie": "Directie met HR",
        "mnd": 8,
        "d": 1,
        "klaar": "Bij de volgende vertrekker is de lijst gebruikt.",
        "deel": 0.1
      }
    ]
  }
});
export const EXECUTION_LADDER_STANDARD=Object.freeze({
  "t": "{{dimension}}",
  "afd": "De afdeling die dit raakt",
  "s": [
    {
      "w": "Tel één week hoeveel tijd hier verloren gaat",
      "rol": "afdeling",
      "wie": "Leidinggevende",
      "mnd": 1,
      "d": 1,
      "klaar": "Je hebt één getal.",
      "deel": 0.1
    },
    {
      "w": "Leg vast hoe het nu gaat",
      "rol": "afdeling",
      "wie": "De mensen die het doen",
      "mnd": 2,
      "d": 2,
      "klaar": "Eén A4 dat klopt met de praktijk.",
      "deel": 0.25
    },
    {
      "w": "Verbeter de zwaarste stap",
      "rol": "project",
      "wie": "Projectleider",
      "mnd": 4,
      "d": 2,
      "klaar": "De meting is beter dan bij de start.",
      "deel": 0.35
    },
    {
      "w": "Meet het maandelijks",
      "rol": "afdeling",
      "wie": "Leidinggevende",
      "mnd": 7,
      "d": 2,
      "klaar": "Het getal komt vanzelf.",
      "deel": 0.2
    },
    {
      "w": "Wijs een vaste eigenaar aan",
      "rol": "directie",
      "wie": "Directie",
      "mnd": 10,
      "d": 1,
      "klaar": "Eén naam, vastgelegd.",
      "deel": 0.1
    }
  ]
});
export const EXECUTION_LADDER_SPECIAL_DIMENSIONS=Object.freeze(Object.keys(EXECUTION_LADDER_CATALOG));
