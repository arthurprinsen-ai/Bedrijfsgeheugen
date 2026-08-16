/* Techniekscan — vijf vragen, dan een concreet antwoord:
 * wat er in jouw geval kan, met welke techniek, en wat de eerste stap is.
 *
 * Plaatsing:
 *   <div data-techniekscan="bi"></div>
 *   <script src="/assets/js/techniekscan.js" defer></script>
 *
 * De vragen en uitkomsten staan onderin dit bestand in SETS.
 */
(function () {
  'use strict';

  var SETS = {};

  /* ---------- AI in business intelligence ---------- */
  SETS.bi = {
    titel: 'Wat kan er bij jou met AI in BI?',
    vragen: [
      {
        v: 'Waar staan je cijfers nu?',
        o: [
          { t: 'Verspreid over Excel-bestanden', w: { basis: 3 } },
          { t: 'In het pakket zelf, AFAS of Exact', w: { basis: 2, model: 1 } },
          { t: 'In een dashboard, Power BI of vergelijkbaar', w: { model: 2, taal: 1 } },
          { t: 'In een datawarehouse', w: { taal: 3 } },
        ],
      },
      {
        v: 'Is "omzet" bij jullie eenduidig gedefinieerd?',
        o: [
          { t: 'Nee, dat verschilt per afdeling', w: { basis: 4 } },
          { t: 'Ongeveer, maar niet vastgelegd', w: { basis: 2, model: 1 } },
          { t: 'Ja, vastgelegd en iedereen rekent hetzelfde', w: { model: 2, taal: 2 } },
        ],
      },
      {
        v: 'Wat wil je dat AI doet?',
        o: [
          { t: 'Vragen beantwoorden in gewone taal', w: { taal: 3 } },
          { t: 'Zelf melden als er iets afwijkt', w: { signaal: 3 } },
          { t: 'Vrije tekst indelen, mails of tickets', w: { tekst: 3 } },
          { t: 'Vooruit kijken, voorspellen', w: { voorspel: 3 } },
        ],
      },
      {
        v: 'Hoeveel historie heb je van wat je wilt voorspellen of volgen?',
        o: [
          { t: 'Minder dan een jaar', w: { basis: 2 } },
          { t: 'Eén tot drie jaar', w: { signaal: 1, voorspel: 1 } },
          { t: 'Meer dan drie jaar', w: { voorspel: 2, signaal: 1 } },
        ],
      },
      {
        v: 'Mogen die cijfers je eigen omgeving uit?',
        o: [
          { t: 'Nee, absoluut niet', w: { intern: 3 } },
          { t: 'Alleen binnen de EU', w: { intern: 1 } },
          { t: 'Geen bezwaar', w: {} },
        ],
      },
    ],
    uitkomsten: {
      basis: {
        kop: 'Eerst het fundament, dan pas AI',
        tekst:
          'AI over een rommelig datamodel geeft overtuigende rommel. Het antwoord klinkt goed, staat vol cijfers, en klopt niet — en niemand ziet het, want er is geen bron om tegen te controleren. Dit is de vaakste manier waarop AI in BI mislukt.',
        techniek: 'Eén bron per cijfer. Power Query of een simpele koppeling naar AFAS of Exact, en één definitielijst waarin staat wat omzet, marge en klant precies betekenen.',
        stap: 'Kies één cijfer waar het vaakst ruzie over is. Leg de definitie vast op één A4. Dat kost een middag en is de goedkoopste stap die je kunt zetten.',
      },
      taal: {
        kop: 'Vragen stellen in gewone taal kan',
        tekst:
          'Dit werkt goed, maar alleen bovenop een semantisch model waarin de definities al vastliggen. Het model vertaalt jouw vraag naar een query op dat model. Zonder die laag verzint het de logica erbij en krijg je elke keer een ander antwoord op dezelfde vraag.',
        techniek: 'Power BI Copilot op een semantisch model, of een metrics-laag zoals dbt met een tekst-naar-SQL-laag erbovenop.',
        stap: 'Neem de tien vragen die het MT elke maand stelt. Bouw daar één dashboard op. Zet daarna pas de taallaag ernaast en kijk of het dezelfde antwoorden geeft.',
      },
      signaal: {
        kop: 'Laten melden wat afwijkt is de beste eerste toepassing',
        tekst:
          'Dit is waar AI in BI het meeste oplevert en het minste kan misgaan. Niet jij die het dashboard opent, maar het dashboard dat jou een bericht stuurt als iets buiten de bandbreedte valt. Weinig risico, want je controleert de melding zelf.',
        techniek: 'Afwijkingsdetectie in Power BI of Fabric, of een eigen drempelwaarde met een melding via Make. Geen groot model nodig.',
        stap: 'Kies één getal waarvan je wilt dat iemand het merkt als het scheef gaat. Zet daar een melding op. Binnen een week draaiend.',
      },
      tekst: {
        kop: 'Vrije tekst indelen is de meest onderschatte winst',
        tekst:
          'Mails, tickets, klachten en offerteaanvragen zijn de grootste ongebruikte databron in het mkb. Een model kan die betrouwbaar indelen op onderwerp, urgentie en toon. Dit werkt goed omdat je het antwoord kunt nalezen — je ziet de tekst en de indeling naast elkaar.',
        techniek: 'Een taalmodel met een vaste categorielijst, aangeroepen per bericht. De uitkomst als kolom in je dashboard.',
        stap: 'Pak honderd binnengekomen mails van vorige maand. Laat ze indelen. Kijk zelf of de indeling klopt voordat je er iets op bouwt.',
      },
      voorspel: {
        kop: 'Voorspellen kan, maar wees eerlijk over hoe hard het is',
        tekst:
          'Met genoeg historie kan een voorspelling helpen bij inkoop en planning. Maar bij mkb-volumes is de foutmarge vaak groter dan het effect waarop je stuurt. Een voorspelling die er tien procent naast zit is nutteloos als je marge acht procent is.',
        techniek: 'Tijdreeksmodellen in Power BI of Python. Geen taalmodel — daar zijn die niet voor.',
        stap: 'Laat het model eerst de afgelopen zes maanden voorspellen die je al kent. Vergelijk met wat er echt gebeurde. Pas als dat klopt, ga je vooruit kijken.',
      },
      intern: {
        kop: 'Let op waar je cijfers heen gaan',
        tekst:
          'Je gaf aan dat deze gegevens je omgeving niet uit mogen. Dat sluit een deel van de opties niet uit, maar het bepaalt wel welke.',
        techniek: 'Microsoft Fabric of Power BI Copilot binnen je eigen tenant, of een model dat je zelf draait. Publieke chatinterfaces vallen af.',
        stap: 'Leg eerst vast welke cijfers welke omgeving niet uit mogen. Zonder die lijst is elke tool een gok.',
      },
    },
  };

  /* ---------- AI in data engineering ---------- */
  SETS.de = {
    titel: 'Wat kan er bij jou met AI in data engineering?',
    vragen: [
      {
        v: 'Hoe worden je gegevens nu verplaatst?',
        o: [
          { t: 'Handmatig, exports en imports', w: { doc: 1, bouw: 3 } },
          { t: 'Losse scripts die iemand ooit schreef', w: { doc: 3 } },
          { t: 'Een tool zoals Make of Power Automate', w: { bouw: 2, test: 1 } },
          { t: 'Echte pipelines met versiebeheer', w: { test: 3 } },
        ],
      },
      {
        v: 'Weet je wat er in die koppelingen gebeurt?',
        o: [
          { t: 'Nee, dat zit bij één persoon of een oud-collega', w: { doc: 4 } },
          { t: 'Globaal', w: { doc: 2 } },
          { t: 'Ja, het is gedocumenteerd', w: { test: 2, bouw: 1 } },
        ],
      },
      {
        v: 'Wat gaat er het vaakst mis?',
        o: [
          { t: 'Het valt stil en niemand merkt het', w: { test: 3 } },
          { t: 'De cijfers kloppen niet en we zoeken waar', w: { test: 2, doc: 1 } },
          { t: 'Een leverancier wijzigt iets en alles breekt', w: { test: 2 } },
          { t: 'Het duurt te lang om iets nieuws te koppelen', w: { bouw: 3 } },
        ],
      },
      {
        v: 'Wie beheert dit?',
        o: [
          { t: 'Niemand echt', w: { doc: 2 } },
          { t: 'Iemand ernaast, geen data-achtergrond', w: { doc: 1, bouw: 2 } },
          { t: 'Een externe partij', w: { doc: 2 } },
          { t: 'Eigen technische mensen', w: { bouw: 1, test: 2 } },
        ],
      },
      {
        v: 'Mag een model je productiegegevens zien?',
        o: [
          { t: 'Nee', w: { veilig: 3 } },
          { t: 'Alleen structuur, geen inhoud', w: { veilig: 2 } },
          { t: 'Ja', w: {} },
        ],
      },
    ],
    uitkomsten: {
      doc: {
        kop: 'Laat AI eerst uitleggen wat er al staat',
        tekst:
          'Dit is verreweg de beste eerste toepassing, en bijna niemand begint hier. Een model is uitstekend in het lezen van een script dat niemand meer begrijpt en er in gewone taal uitleg bij schrijven. Het risico is nul: je verandert niets, je maakt alleen zichtbaar wat er is.',
        techniek: 'Een taalmodel dat je bestaande SQL, scripts of Make-scenario’s leest en er documentatie van maakt. Zet die documentatie ergens waar iedereen erbij kan.',
        stap: 'Neem het script waar je het meest bang voor bent. Laat het regel voor regel uitleggen. Lees mee. Je zult dingen ontdekken die je niet wist.',
      },
      bouw: {
        kop: 'Bouwen kan sneller, maar niet zonder controle',
        tekst:
          'Een model schrijft in minuten een transformatie waar iemand een dag over doet. Dat werkt echt. De valkuil is dat gegenereerde SQL er altijd goed uitziet en stil fout kan zijn: een join die rijen dupliceert, een filter dat net verkeerd staat. Dat merk je pas als de cijfers al drie maanden scheef zijn.',
        techniek: 'Laat het model de transformatie schrijven, maar altijd met een controle ernaast: telt het aantal rijen nog, klopt het totaal met de bron.',
        stap: 'Laat de eerstvolgende koppeling die je nodig hebt schrijven door een model, maar draai hem eerst naast de oude. Pas overstappen als beide dezelfde uitkomst geven.',
      },
      test: {
        kop: 'Zet AI in op controles, niet op het draaiwerk',
        tekst:
          'Jouw grootste probleem is niet dat er te weinig gebouwd wordt, maar dat je te laat merkt dat er iets stukging. Dat is precies wat je stil moet oplossen. Een model is goed in het bedenken van welke controles er zouden moeten zijn — daar denken mensen zelden aan.',
        techniek: 'Laat een model per tabel controles voorstellen: mag dit veld leeg zijn, welke waarden horen erin, hoeveel rijen komen er normaal per dag bij. Zet die als test in je pipeline.',
        stap: 'Kies de tabel waar de meeste cijfers uit komen. Laat er tien controles bij bedenken. Zet de drie belangrijkste aan.',
      },
      veilig: {
        kop: 'Structuur delen mag, inhoud niet',
        tekst:
          'Je gaf aan dat productiegegevens niet naar een model mogen. Dat is geen blokkade voor het meeste werk hierboven — code, schema’s en documentatie bevatten meestal geen persoonsgegevens.',
        techniek: 'Deel kolomnamen en tabelstructuur, niet de rijen. Werk met verzonnen voorbeeldrijen als het model iets moet begrijpen.',
        stap: 'Leg vast welke tabellen persoonsgegevens bevatten. Zonder die lijst weet niemand wanneer hij een grens overgaat.',
      },
    },
  };

  /* ---------- motor ---------- */

  function bouw(houder, set) {
    var antwoorden = [];
    var stap = 0;

    function render() {
      if (stap < set.vragen.length) {
        var vr = set.vragen[stap];
        var h =
          '<p class="ts-voortgang">Vraag ' + (stap + 1) + ' van ' + set.vragen.length + '</p>' +
          '<h3 class="ts-vraag">' + vr.v + '</h3>' +
          '<div class="ts-opties">';
        vr.o.forEach(function (opt, i) {
          h += '<button type="button" class="ts-optie" data-i="' + i + '">' + opt.t + '</button>';
        });
        h += '</div>';
        if (stap > 0) h += '<button type="button" class="ts-terug">Terug</button>';
        houder.innerHTML = h;

        houder.querySelectorAll('.ts-optie').forEach(function (b) {
          b.addEventListener('click', function () {
            antwoorden[stap] = vr.o[+b.dataset.i];
            stap++;
            render();
          });
        });
        var t = houder.querySelector('.ts-terug');
        if (t) t.addEventListener('click', function () { stap--; render(); });
        return;
      }

      var score = {};
      antwoorden.forEach(function (a) {
        Object.keys(a.w).forEach(function (k) { score[k] = (score[k] || 0) + a.w[k]; });
      });
      var gesorteerd = Object.keys(score).sort(function (a, b) { return score[b] - score[a]; });
      var hoofd = gesorteerd[0];
      var extra = gesorteerd.slice(1).filter(function (k) {
        return (k === 'intern' || k === 'veilig') && score[k] >= 2;
      })[0];

      var u = set.uitkomsten[hoofd];
      if (!u) { houder.innerHTML = '<p>Er ging iets mis. Vernieuw de pagina.</p>'; return; }

      var h =
        '<div class="ts-uit">' +
        '<p class="eyebrow">Jouw uitkomst</p>' +
        '<h3>' + u.kop + '</h3>' +
        '<p>' + u.tekst + '</p>' +
        '<div class="ts-blok"><b>Welke techniek</b><p>' + u.techniek + '</p></div>' +
        '<div class="ts-blok ts-blok--stap"><b>De eerste snelle stap</b><p>' + u.stap + '</p></div>';

      if (extra) {
        var e = set.uitkomsten[extra];
        h += '<div class="ts-blok"><b>' + e.kop + '</b><p>' + e.techniek + '</p></div>';
      }

      h +=
        '<p class="ts-slot">Dit is een richting, geen advies op maat. Wil je weten wat het bij jou concreet oplevert: dat zit in de bedrijfsscan.</p>' +
        '<a class="knop" href="/contact">Plan een gesprek</a> ' +
        '<button type="button" class="ts-opnieuw">Opnieuw</button>' +
        '</div>';
      houder.innerHTML = h;
      houder.querySelector('.ts-opnieuw').addEventListener('click', function () {
        stap = 0; antwoorden = []; render();
      });
    }

    render();
  }

  var STIJL =
    '.ts{border:1.5px solid var(--lijn,#DCDFE6);border-radius:16px;padding:1.75rem;background:#fff;max-width:720px}' +
    '.ts-voortgang{font-family:"IBM Plex Mono",monospace;font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;color:var(--amber,#C2410C);margin:0 0 .5rem}' +
    '.ts-vraag{font-size:1.3rem;margin:0 0 1.1rem}' +
    '.ts-opties{display:grid;gap:.5rem}' +
    '.ts-optie{text-align:left;padding:.85rem 1rem;border:1.5px solid var(--lijn,#DCDFE6);border-radius:10px;background:var(--vlak,#F4F5F8);font:inherit;font-size:.95rem;cursor:pointer}' +
    '.ts-optie:hover{border-color:var(--blauw,#2742D6);background:var(--blauw-l,#EDF0FD)}' +
    '.ts-terug{margin-top:1rem;border:0;background:none;color:var(--grijs,#5C646E);font:inherit;font-size:.85rem;cursor:pointer;text-decoration:underline}' +
    '.ts-uit h3{font-size:1.35rem;margin:.3rem 0 .8rem}' +
    '.ts-blok{margin-top:1rem;padding:1rem;border-radius:10px;background:var(--vlak,#F4F5F8)}' +
    '.ts-blok--stap{background:var(--groen-l,#E8F5EC)}' +
    '.ts-blok b{display:block;font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;margin-bottom:.35rem;color:var(--grijs,#5C646E)}' +
    '.ts-blok p{margin:0}' +
    '.ts-slot{margin-top:1.2rem;font-size:.9rem;color:var(--grijs,#5C646E)}' +
    '.ts-opnieuw{border:0;background:none;color:var(--grijs,#5C646E);font:inherit;font-size:.9rem;cursor:pointer;text-decoration:underline;margin-left:.6rem}';

  function start() {
    var houders = document.querySelectorAll('[data-techniekscan]');
    if (!houders.length) return;
    var s = document.createElement('style');
    s.textContent = STIJL;
    document.head.appendChild(s);
    Array.prototype.forEach.call(houders, function (h) {
      var set = SETS[h.getAttribute('data-techniekscan')];
      if (!set) return;
      h.classList.add('ts');
      bouw(h, set);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
