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
  const txt = Number.isInteger(v) ? String(v) : v.toFixed(2).replace('.', ',');
  return '€ ' + txt.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
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

const DAGEN = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
const MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

// "vrijdag 6 november" in Nederlandse tijd; leeg als de datum ontbreekt.
function einddatum(ctx) {
  const raw = s(ctx.period_end);
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  const nl = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' }));
  return DAGEN[nl.getDay()] + ' ' + nl.getDate() + ' ' + MAANDEN[nl.getMonth()];
}

export function composeTrialMail(mailKey, variant, ctx) {
  if (!MAIL_KEYS.includes(mailKey)) throw new Error('UNKNOWN_MAIL_KEY:' + mailKey);
  const v = VARIANTS.includes(variant) ? variant : 'A';
  const bedrijf = s(ctx.bedrijf) || 'je bedrijf';
  const segment = segmentOf(ctx);
  const link = checkoutLink(ctx);
  const pakket = s(ctx.plan_name) || 'Pro';
  const prijs = euro(ctx.monthly_price_cents);
  const jaarprijs = euro(n(ctx.monthly_price_cents) * 10);
  const done = activity(ctx);
  const eind = einddatum(ctx);
  let subject = '';
  const lines = [];

  if (mailKey === 'd23') {
    subject = v === 'A' ? bedrijf + ', je proef loopt nog een week' : bedrijf + ': dit staat er al in je bedrijfsgeheugen';
    lines.push('Hoi,');
    if (segment === 'actief') {
      lines.push('Goed bezig. Je proef tot nu toe: ' + done + '.');
      lines.push('Je proef loopt nog ' + (eind ? 'tot ' + eind : '7 dagen') + '. Daarna gaat alles gewoon door op hetzelfde account zodra je een pakket kiest, met alles wat je nu hebt opgebouwd: ' + link);
      lines.push(v === 'A' ? 'Zullen we deze week 15 minuten doorlopen wat je er al uit haalt? Antwoord op deze mail met een dag die past.' : 'Wat zou je als eerste uit het bedrijfsgeheugen willen halen voordat de proef stopt? Antwoord kort, dan denk ik mee.');
    } else {
      lines.push('Je account staat klaar, maar er staat nog niets in. Dat is normaal: de eerste stap is de moeilijkste, en hij kost minder tijd dan je denkt. Meestal begint het met één document of één systeem.');
      lines.push(v === 'A' ? 'Welke van de twee zou jij als eerste willen laten zien? Antwoord met één woord, dan zet ik hem voor je klaar.' : 'Wat houdt je tegen om te beginnen? Een antwoord van één regel is genoeg, dan kijk ik wat ik voor je kan wegnemen.');
      lines.push('Je proef loopt nog ' + (eind ? 'tot ' + eind : '7 dagen') + '. Kies je daarna een pakket, dan ga je verder op hetzelfde account: ' + link);
    }
  } else if (mailKey === 'd29') {
    subject = v === 'A' ? 'Je proef stopt ' + (eind ? 'op ' + eind.split(' ')[0] : 'binnenkort') + ', ' + bedrijf : bedrijf + ': nog even en je proef is afgelopen';
    lines.push('Hoi,');
    lines.push('Je proef stopt ' + (eind ? 'op ' + eind : 'binnenkort') + '. Er wordt niets afgeschreven: je hebt geen betaalgegevens achtergelaten, dus er gebeurt niets zonder jouw keuze.');
    if (done) lines.push('Dit staat er nu in: ' + done + '. Kies je een pakket, dan loopt dat gewoon door.');
    lines.push('Wat het kost: ' + pakket + ' is ' + prijs + ' per maand, excl. btw. Per jaar betaal je ' + jaarprijs + ' (tien maanden voor twaalf). Betalen gaat veilig via Mollie met iDEAL, creditcard of SEPA-incasso, en je kunt maandelijks opzeggen. Kies hier je pakket: ' + link);
    lines.push('Kies je niets, dan pauzeert de toegang en bewaren we je gegevens nog 30 dagen. Niets kwijt dus.');
    lines.push(v === 'A' ? 'Laat je het vandaag weten? Ook "nee, bedankt" helpt me.' : 'Is er iets wat je nog nodig hebt om vandaag een keuze te maken? Antwoord op deze mail, ik lees hem zelf.');
  } else {
    subject = v === 'A' ? 'Je proef is afgelopen, je gegevens zijn veilig' : bedrijf + ': je toegang is gepauzeerd, niets is weg';
    lines.push('Hoi,');
    const kept = done ? ' (' + done + ')' : '';
    lines.push('Je proef is afgelopen en je toegang is gepauzeerd. Je gegevens' + kept + ' bewaren we nog 30 dagen, dus je raakt niets kwijt.');
    lines.push('Wil je verder waar je was gebleven? Kies een pakket en alles staat er direct weer: ' + link);
    lines.push(v === 'A' ? 'Was er iets dat je tegenhield? Een antwoord op deze mail lees ik zelf, ook als het kritiek is.' : 'Wat had er anders moeten zijn om wel door te gaan? Een antwoord op deze mail lees ik zelf, ook als het kritiek is.');
  }

  lines.push('Groet,\nArthur Prinsen\nBedrijfsgeheugen');
  const body = lines.join('\n\n') + '\n\n' + OPT_OUT_LINE;
  return { subject, body, segment, variant: v, mail_key: mailKey };
}

export function sampleContexts() {
  const base = { bedrijf: 'Voorbeeld Installatie BV', plan_code: 'pro', plan_name: 'Pro', monthly_price_cents: 29900, period_end: '2026-11-06T09:00:00Z' };
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
