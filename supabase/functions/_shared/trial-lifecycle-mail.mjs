// Proefperiode-mails: tekst per account uit wat het account in de proef heeft gedaan.
// Zuivere functies (geen netwerk), zodat de tekst getest kan worden.

export const MAIL_KEYS = ['d23', 'd29', 'expired'];
export const VARIANTS = ['A', 'B'];
export const SITE = 'https://www.bedrijfsgeheugen.nl';
export const OPT_OUT_LINE = 'Geen mail meer van mij? Antwoord met "afmelden" en ik mail je niet meer.';

const s = (v) => String(v ?? '').trim();
const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export function pickVariant(subscriptionId) {
  const hex = s(subscriptionId).replace(/[^0-9a-f]/gi, '');
  const last = hex ? parseInt(hex.slice(-1), 16) : 0;
  return last % 2 === 0 ? 'A' : 'B';
}

export function segmentOf(ctx) {
  const k = n(ctx.koppelingen), sc = n(ctx.scans), ai = n(ctx.ai_vragen);
  return k + sc + ai > 0 ? 'actief' : 'niet_gestart';
}

function euro(cents) {
  const v = n(cents) / 100;
  return '€ ' + (Number.isInteger(v) ? String(v) : v.toFixed(2).replace('.', ','));
}

function plural(count, one, many) {
  return count + ' ' + (count === 1 ? one : many);
}

function checkoutLink(ctx) {
  const plan = s(ctx.plan_code) || 'starter';
  return SITE + '/afsluiten?plan=' + encodeURIComponent(plan);
}

function activity(ctx) {
  const parts = [];
  if (n(ctx.scans) > 0) {
    const score = ctx.laatste_score != null && s(ctx.laatste_score) !== '' ? ' (laatste score ' + String(Math.round(n(ctx.laatste_score))) + ')' : '';
    parts.push(plural(n(ctx.scans), 'scan', 'scans') + score);
  }
  if (n(ctx.koppelingen) > 0) parts.push(plural(n(ctx.koppelingen), 'koppeling', 'koppelingen'));
  if (n(ctx.ai_vragen) > 0) parts.push(plural(n(ctx.ai_vragen), 'AI-vraag', 'AI-vragen'));
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return parts.slice(0, -1).join(', ') + ' en ' + parts[parts.length - 1];
}

export function composeTrialMail(mailKey, variant, ctx) {
  if (!MAIL_KEYS.includes(mailKey)) throw new Error('UNKNOWN_MAIL_KEY:' + mailKey);
  const v = VARIANTS.includes(variant) ? variant : 'A';
  const bedrijf = s(ctx.bedrijf) || 'je bedrijf';
  const segment = segmentOf(ctx);
  const link = checkoutLink(ctx);
  const pakket = s(ctx.plan_name) || 'Pro';
  const prijs = euro(ctx.monthly_price_cents);
  const done = activity(ctx);
  let subject = '';
  const lines = [];

  if (mailKey === 'd23') {
    subject = v === 'A' ? bedrijf + ': nog 7 dagen proef' : bedrijf + ': wat heb je tot nu toe opgebouwd?';
    lines.push('Hoi,');
    if (segment === 'actief') {
      lines.push('Je proef tot nu toe: ' + done + '.');
      lines.push('Over 7 dagen stopt de proef. Je gegevens blijven bewaard. Wil je doorgaan op hetzelfde account, kies dan hier je pakket: ' + link);
      lines.push(v === 'A' ? 'Zullen we deze week 15 minuten doorlopen wat je er al uit haalt?' : 'Wat zou je als eerste uit het bedrijfsgeheugen willen halen voordat de proef stopt?');
    } else {
      lines.push('Je account staat klaar, maar er staat nog niets in. Meestal begint het met één document of één systeem.');
      lines.push(v === 'A' ? 'Welke van de twee zou jij als eerste willen laten zien?' : 'Wat houdt je tegen om te beginnen?');
      lines.push('De proef loopt nog 7 dagen. Kies je daarna een pakket, dan ga je verder op hetzelfde account: ' + link);
    }
  } else if (mailKey === 'd29') {
    subject = v === 'A' ? 'Morgen stopt je proef, ' + bedrijf : bedrijf + ': morgen is je proef afgelopen';
    lines.push('Hoi,');
    lines.push('Morgen is je proef afgelopen. Er wordt niets afgeschreven.');
    lines.push('Kies je een pakket (' + pakket + ' is ' + prijs + ' per maand, excl. btw), dan loopt alles door zoals het nu staat: ' + link);
    lines.push('Kies je niets, dan pauzeert de toegang en bewaren we je gegevens nog 30 dagen.');
    lines.push(v === 'A' ? 'Laat je het vandaag weten?' : 'Wat is er nodig om vandaag een keuze te maken?');
  } else {
    subject = v === 'A' ? 'Je proef is afgelopen' : bedrijf + ': je toegang is gepauzeerd';
    lines.push('Hoi,');
    const kept = done ? ' (' + done + ')' : '';
    lines.push('Je toegang is gepauzeerd. Je gegevens' + kept + ' bewaren we nog 30 dagen. Hervatten kan via deze link: ' + link);
    lines.push(v === 'A' ? 'Was er iets dat je tegenhield? Een antwoord op deze mail lees ik zelf.' : 'Wat had er anders moeten zijn om wel door te gaan? Een antwoord op deze mail lees ik zelf.');
  }

  lines.push('Arthur');
  const body = lines.join('\n\n') + '\n\n' + OPT_OUT_LINE;
  return { subject, body, segment, variant: v, mail_key: mailKey };
}

export function sampleContexts() {
  const base = { bedrijf: 'Voorbeeld Installatie BV', plan_code: 'pro', plan_name: 'Pro', monthly_price_cents: 29900 };
  return [
    { label: 'actief met scan en koppeling', ...base, scans: 2, laatste_score: 54, koppelingen: 1, ai_vragen: 12 },
    { label: 'niet gestart', ...base, scans: 0, koppelingen: 0, ai_vragen: 0 },
    { label: 'alleen AI-vragen', ...base, scans: 0, koppelingen: 0, ai_vragen: 5 },
  ];
}

// Antwoord van een klant dat om afmelding vraagt. Geciteerde regels (">") en de eigen afmeldregel tellen niet mee.
const OPT_OUT_WORDS = /\b(afmelden|uitschrijven|geen mail meer|niet meer mailen|verwijder mij|stop mailen)\b/i;
export function optOutRequested(text) {
  const own = String(text ?? '').split(/\r?\n/)
    .filter((l) => !l.trim().startsWith('>'))
    .join('\n')
    .split(OPT_OUT_LINE).join('');
  return OPT_OUT_WORDS.test(own);
}
