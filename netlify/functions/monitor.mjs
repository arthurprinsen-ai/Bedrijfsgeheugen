// Slaat een ingevulde Digitaliseringsmonitor op in Notion en geeft de deelnemer
// zijn eigen uitkomst terug, naast het gemiddelde van alle inzendingen.
//
// Nodig in Netlify: NOTION_TOKEN (integratietoken, begint met ntn_)
// De database moet met die integratie gedeeld zijn.
//
// POST /api/monitor  met de acht antwoorden.

const DB = '365bf9eb-4913-4b2f-9ca9-bb1351619c94';
const NOTION = 'https://api.notion.com/v1';
const WERKWEKEN = 46; // vakanties eraf, zodat de jaarcijfers niet te rooskleurig zijn

const KEUZES = {
  grootte: ['1-3', '4-10', '11-25', '26-50', '51-250', '250 of meer'],
  sector: ['Bouw en installatie', 'Groothandel', 'Productie', 'Zakelijke dienstverlening',
           'Zorg', 'Transport en logistiek', 'Retail en e-commerce', 'ICT', 'Anders'],
  provincie: ['Groningen', 'Friesland', 'Drenthe', 'Overijssel', 'Flevoland', 'Gelderland',
              'Utrecht', 'Noord-Holland', 'Zuid-Holland', 'Zeeland', 'Noord-Brabant', 'Limburg'],
  pakket: ['AFAS', 'Exact', 'Microsoft 365', 'Branchepakket', 'Vooral Excel', 'Anders of weet niet'],
  uitval: ['Ja meerdere personen', 'Ja een persoon', 'Nee', 'Weet niet'],
  ai: ['Dagelijks', 'Af en toe', 'Geexperimenteerd', 'Nee'],
  abonnement: ['Ja', 'Nee', 'Weet niet'],
  aiact: ['Ja en het geldt voor ons', 'Ja maar niet voor ons', 'Vaag', 'Nee'],
};

const kop = (t) => ({
  'Authorization': `Bearer ${t}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
});

function kies(veld, waarde) {
  return KEUZES[veld].includes(waarde) ? { select: { name: waarde } } : undefined;
}

// Alle inzendingen ophalen om het gemiddelde te bepalen. Bij lage aantallen
// is dat één verzoek; boven de honderd pagineert Notion en volgen we door.
async function alles(token) {
  const rijen = [];
  let cursor;
  for (let i = 0; i < 10; i++) {
    const r = await fetch(`${NOTION}/databases/${DB}/query`, {
      method: 'POST', headers: kop(token),
      body: JSON.stringify({ page_size: 100, start_cursor: cursor }),
    });
    if (!r.ok) break;
    const d = await r.json();
    rijen.push(...(d.results || []));
    if (!d.has_more) break;
    cursor = d.next_cursor;
  }
  return rijen;
}

function getal(p, naam) {
  const v = p.properties?.[naam]?.number;
  return typeof v === 'number' ? v : null;
}

export default async (request) => {
  if (request.method !== 'POST') return new Response('Alleen POST', { status: 405 });

  const token = process.env.NOTION_TOKEN;
  if (!token) return Response.json({ fout: 'De monitor is nog niet ingesteld.' }, { status: 500 });

  let a;
  try { a = await request.json(); } catch { return Response.json({ fout: 'Ongeldige aanvraag.' }, { status: 400 }); }

  const uren = Number(a.uren);
  const systemen = Number(a.systemen);
  if (!Number.isFinite(uren) || uren < 0 || uren > 200) {
    return Response.json({ fout: 'Vul een aantal uren in tussen 0 en 200.' }, { status: 400 });
  }

  const perJaar = Math.round(uren * WERKWEKEN);
  const nu = new Date().toISOString().slice(0, 10);

  const eigenschappen = {
    'Inzending': { title: [{ text: { content: `${a.sector || 'Onbekend'} · ${a.grootte || '?'} · ${nu}` } }] },
    'date:Ingevuld op': undefined,
    'Ingevuld op': { date: { start: nu } },
    'Grootte': kies('grootte', a.grootte),
    'Sector': kies('sector', a.sector),
    'Provincie': kies('provincie', a.provincie),
    'Uren overtypen': { number: uren },
    'Losse systemen': Number.isFinite(systemen) ? { number: systemen } : undefined,
    'Hoofdpakket': kies('pakket', a.pakket),
    'Uitval risico': kies('uitval', a.uitval),
    'Gebruikt AI': kies('ai', a.ai),
    'Weet van AI in abonnement': kies('abonnement', a.abonnement),
    'Kent de AI Act': kies('aiact', a.aiact),
    'Uren per jaar': { number: perJaar },
    'Wil het rapport': { checkbox: !!a.rapport },
    'Bron': { select: { name: ['LinkedIn', 'Instagram'].includes(a.bron) ? a.bron : 'Monitorpagina' } },
  };
  if (a.rapport && typeof a.email === 'string' && a.email.includes('@')) {
    eigenschappen['Contact'] = { email: a.email.trim().slice(0, 200) };
  }
  Object.keys(eigenschappen).forEach((k) => eigenschappen[k] === undefined && delete eigenschappen[k]);

  try {
    const bewaard = await fetch(`${NOTION}/pages`, {
      method: 'POST', headers: kop(token),
      body: JSON.stringify({ parent: { database_id: DB }, properties: eigenschappen }),
    });
    if (!bewaard.ok) {
      // Notion's eigen melding meesturen: zonder die tekst is niet te zien of het
      // aan de deling ligt (404), aan een veldnaam (400) of aan het token (401).
      let detail = '';
      try {
        const f = await bewaard.json();
        detail = [f.code, f.message].filter(Boolean).join(' - ').slice(0, 300);
      } catch { detail = 'geen leesbare melding'; }
      return Response.json(
        { fout: 'Opslaan lukte niet. Probeer het zo nog eens.', notion: bewaard.status + ' ' + detail },
        { status: 502 }
      );
    }

    const rijen = await alles(token);
    const urenLijst = rijen.map((p) => getal(p, 'Uren overtypen')).filter((v) => v !== null);
    const sysLijst = rijen.map((p) => getal(p, 'Losse systemen')).filter((v) => v !== null);
    const n = urenLijst.length;
    const gem = (l) => (l.length ? l.reduce((s, v) => s + v, 0) / l.length : null);

    // Positie: hoeveel procent van de deelnemers zit lager dan jij?
    const lager = urenLijst.filter((v) => v < uren).length;
    const percentiel = n > 1 ? Math.round((lager / n) * 100) : null;

    // Onder de vijftig deelnemers geen benchmark tonen. Een gemiddelde over
    // twaalf bedrijven is geen gemiddelde, dat is toeval met een komma erin.
    const genoeg = n >= 50;

    return Response.json({
      eigen: { urenPerWeek: uren, urenPerJaar: perJaar, systemen: Number.isFinite(systemen) ? systemen : null },
      benchmark: genoeg
        ? {
            n,
            gemiddeldeUren: Math.round((gem(urenLijst) + Number.EPSILON) * 10) / 10,
            gemiddeldeSystemen: sysLijst.length ? Math.round(gem(sysLijst) * 10) / 10 : null,
            percentiel,
          }
        : null,
      deelnemers: n,
      drempel: 50,
    });
  } catch {
    return Response.json({ fout: 'Er ging iets mis. Probeer het zo nog eens.' }, { status: 502 });
  }
};

export const config = { path: '/api/monitor' };
