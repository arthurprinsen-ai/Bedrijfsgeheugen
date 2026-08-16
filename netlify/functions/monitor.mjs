// Neemt een ingevulde Digitaliseringsmonitor aan en geeft de deelnemer zijn eigen
// uitkomst terug. Het opslaan gebeurt in Make (BG 47), dat naar Notion schrijft.
//
// Waarom via Make en niet rechtstreeks naar Notion: de Notion-integratie moet per
// database gedeeld worden en dat is stil te breken. De Make-verbinding schrijft
// hier al maanden zonder problemen, en fouten zijn daar zichtbaar.
//
// POST /api/monitor  met de tien antwoorden.

const WEBHOOK = 'https://hook.eu1.make.com/7hsxkgmjyipcpzm0lq86khswzw2wxvda';
const WERKWEKEN = 46; // vakanties eraf, zodat het jaarcijfer niet te rooskleurig is
const MAX_UREN = 200;

export default async (request) => {
  if (request.method !== 'POST') return new Response('Alleen POST', { status: 405 });

  let a;
  try { a = await request.json(); } catch { return Response.json({ fout: 'Ongeldige aanvraag.' }, { status: 400 }); }

  const uren = Number(a.uren);
  if (!Number.isFinite(uren) || uren < 0 || uren > MAX_UREN) {
    return Response.json({ fout: `Vul een aantal uren in tussen 0 en ${MAX_UREN}.` }, { status: 400 });
  }
  const systemen = Number(a.systemen);
  const perJaar = Math.round(uren * WERKWEKEN);

  const inzending = {
    grootte: String(a.grootte || '').slice(0, 40),
    sector: String(a.sector || '').slice(0, 60),
    provincie: String(a.provincie || '').slice(0, 40),
    uren,
    systemen: Number.isFinite(systemen) ? systemen : '',
    pakket: String(a.pakket || '').slice(0, 40),
    uitval: String(a.uitval || '').slice(0, 40),
    ai: String(a.ai || '').slice(0, 40),
    abonnement: String(a.abonnement || '').slice(0, 20),
    aiact: String(a.aiact || '').slice(0, 40),
    rapport: !!a.rapport,
    email: a.rapport && typeof a.email === 'string' && a.email.includes('@') ? a.email.trim().slice(0, 200) : '',
  };

  try {
    const r = await fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(inzending),
    });
    if (!r.ok) {
      return Response.json(
        { fout: 'Opslaan lukte niet. Probeer het zo nog eens.', detail: 'make ' + r.status },
        { status: 502 }
      );
    }
  } catch {
    return Response.json({ fout: 'Opslaan lukte niet. Probeer het zo nog eens.' }, { status: 502 });
  }

  // De benchmark tonen we pas vanaf vijftig deelnemers. Een gemiddelde over
  // twaalf bedrijven is geen gemiddelde, dat is toeval met een komma erin.
  return Response.json({
    eigen: {
      urenPerWeek: uren,
      urenPerJaar: perJaar,
      systemen: Number.isFinite(systemen) ? systemen : null,
    },
    benchmark: null,
    deelnemers: null,
    drempel: 50,
  });
};

export const config = { path: '/api/monitor' };
