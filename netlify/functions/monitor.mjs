// Neemt een ingevulde Digitaliseringsmonitor aan en geeft de deelnemer zijn eigen
// uitkomst terug. Het opslaan gebeurt in Make (BG 47), dat naar Notion schrijft.
// De bestaande Make-payload blijft intact; Brain-metadata wordt alleen additief
// meegestuurd zodat elke inzending provenance, idempotency en verificatiestatus heeft.

import { createSourceEventEnvelope } from '../../platform/integrations/source-event-envelope.mjs';

const WEBHOOK = 'https://hook.eu1.make.com/7hsxkgmjyipcpzm0lq86khswzw2wxvda';
const WERKWEKEN = 46;
const MAX_UREN = 200;

const tekst = (v, max = 200) => String(v || '').trim().slice(0, max);

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

  const requestReferer = tekst(request.headers.get('referer'), 1200);
  let landingParams = new URLSearchParams();
  try {
    if (requestReferer) landingParams = new URL(requestReferer).searchParams;
  } catch {
    landingParams = new URLSearchParams();
  }

  const bron = tekst(a.bron || landingParams.get('bron'), 100);
  const utmSource = tekst(a.utm_source || landingParams.get('utm_source') || bron, 120);
  const utmMedium = tekst(a.utm_medium || landingParams.get('utm_medium'), 120);
  const utmCampaign = tekst(a.utm_campaign || landingParams.get('utm_campaign'), 160);
  const utmContent = tekst(a.utm_content || landingParams.get('utm_content'), 200);
  const contentId = tekst(a.content_id || landingParams.get('content_id'), 200);
  const platformPostId = tekst(a.platform_post_id || landingParams.get('platform_post_id') || landingParams.get('post_id'), 240);
  const landingUrl = tekst(a.landing_url || requestReferer, 1200);
  const externalReferrer = tekst(a.referrer, 1200);

  const attributionParts = [
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    contentId,
    platformPostId,
  ].map(v => v || '-');
  const attributionKey = tekst(
    a.attribution_key || (attributionParts.some(v => v !== '-') ? `monitor|${attributionParts.join('|')}` : ''),
    900
  );

  const inzending = {
    grootte: tekst(a.grootte, 40),
    sector: tekst(a.sector, 60),
    provincie: tekst(a.provincie, 40),
    uren,
    systemen: Number.isFinite(systemen) ? systemen : '',
    pakket: tekst(a.pakket, 40),
    uitval: tekst(a.uitval, 40),
    ai: tekst(a.ai, 40),
    abonnement: tekst(a.abonnement, 20),
    aiact: tekst(a.aiact, 40),
    rapport: !!a.rapport,
    email: a.rapport && typeof a.email === 'string' && a.email.includes('@') ? a.email.trim().slice(0, 200) : '',
    bron,
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    utm_content: utmContent,
    referrer: externalReferrer,
    landing_url: landingUrl,
    content_id: contentId,
    platform_post_id: platformPostId,
    attribution_key: attributionKey,
  };

  const explicitIdempotencyKey = tekst(
    request.headers.get('x-idempotency-key') || a.idempotency_key || a.submission_id,
    240
  );
  const brainEvent = createSourceEventEnvelope({
    payload: inzending,
    explicitIdempotencyKey,
  });
  const writePayload = {
    ...inzending,
    brain_event_id: brainEvent.eventId,
    brain_idempotency_key: brainEvent.idempotencyKey,
    _brain: brainEvent,
  };

  try {
    const r = await fetch(WEBHOOK, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-idempotency-key': brainEvent.idempotencyKey,
        'x-bedrijfsgeheugen-event-id': brainEvent.eventId,
      },
      body: JSON.stringify(writePayload),
    });
    if (!r.ok) {
      return Response.json(
        { fout: 'Opslaan lukte niet. Probeer het zo nog eens.', detail: 'make ' + r.status, eventId: brainEvent.eventId },
        { status: 502 }
      );
    }
  } catch {
    return Response.json({ fout: 'Opslaan lukte niet. Probeer het zo nog eens.', eventId: brainEvent.eventId }, { status: 502 });
  }

  return Response.json({
    eigen: {
      urenPerWeek: uren,
      urenPerJaar: perJaar,
      systemen: Number.isFinite(systemen) ? systemen : null,
    },
    benchmark: null,
    deelnemers: null,
    drempel: 50,
    eventId: brainEvent.eventId,
  });
};

export const config = { path: '/api/monitor' };
