const GENERIC_FEED = /^https:\/\/(?:www\.)?linkedin\.com\/feed\/?(?:[?#].*)?$/i;
const LINKEDIN_CONCRETE = /^https:\/\/(?:www\.)?linkedin\.com\/(?:in\/|posts\/|feed\/update\/|messaging\/thread\/)/i;
const GENERIC_COPY = /Hoi\s*,\s*ik zag jullie uitvraag/i;

export function textFromProperty(property) {
  if (!property || typeof property !== 'object') return '';
  if (property.type === 'title') return (property.title || []).map(item => item?.plain_text || '').join('').trim();
  if (property.type === 'rich_text') return (property.rich_text || []).map(item => item?.plain_text || '').join('').trim();
  if (property.type === 'url') return property.url || '';
  if (property.type === 'email') return property.email || '';
  if (property.type === 'select') return property.select?.name || '';
  if (property.type === 'number') return property.number ?? null;
  if (property.type === 'checkbox') return Boolean(property.checkbox);
  if (property.type === 'date') return property.date?.start || '';
  return '';
}

export function relationIds(property) {
  if (!property || property.type !== 'relation') return [];
  return (property.relation || []).map(item => item?.id).filter(Boolean);
}

export function isConcreteLinkedInSource(url) {
  if (!url || typeof url !== 'string' || GENERIC_FEED.test(url.trim())) return false;
  return LINKEDIN_CONCRETE.test(url.trim());
}

export function isSendReady(candidate = {}) {
  const person = String(candidate.person || '').trim();
  const text = String(candidate.readyText || '').trim();
  const evidence = String(candidate.contextEvidence || '').trim();
  if (!person || !text || !evidence) return false;
  if (candidate.contactPolicy === 'Niet benaderen') return false;
  if (!isConcreteLinkedInSource(candidate.sourceUrl || candidate.linkedinUrl)) return false;
  if (GENERIC_COPY.test(text) || /Hoi\s+,/.test(text)) return false;
  return true;
}

function numeric(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function scoreCandidate(candidate = {}) {
  if (candidate.contactPolicy === 'Niet benaderen') return -1;
  let score = 0;
  if (candidate.waitingOnMe) score += 35;
  if (candidate.priority === '1 — Nu') score += 25;
  if (candidate.driveStatus === 'Nu') score += 18;
  if (candidate.incomingReaction) score += 16;
  if (candidate.directPost) score += 12;
  score += Math.min(8, Math.max(0, numeric(candidate.confidence)) / 12.5);
  score += Math.min(4, Math.log10(Math.max(1, numeric(candidate.expectedValue))) * 1.2);
  score += Math.min(4, Math.max(0, numeric(candidate.intent)) / 25);
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function buildPriorityQueue(candidates = [], { limit = 15 } = {}) {
  const boundedLimit = Math.max(1, Math.min(15, Number(limit) || 15));
  const deduped = new Map();
  for (const raw of candidates) {
    if (!raw || raw.contactPolicy === 'Niet benaderen') continue;
    const key = String(raw.linkedinUrl || raw.person || raw.id || '').toLowerCase().trim();
    if (!key) continue;
    const next = { ...raw, score: scoreCandidate(raw) };
    const current = deduped.get(key);
    if (!current || next.score > current.score) deduped.set(key, next);
  }
  return [...deduped.values()]
    .sort((a, b) => b.score - a.score || String(a.id || a.person).localeCompare(String(b.id || b.person), 'en'))
    .slice(0, boundedLimit);
}

export function basicAuthMatches(header, user, password) {
  if (!header || !user || !password) return false;
  const expected = `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`;
  const actual = String(header);
  let diff = actual.length ^ expected.length;
  const max = Math.max(actual.length, expected.length);
  for (let i = 0; i < max; i += 1) diff |= (actual.charCodeAt(i) || 0) ^ (expected.charCodeAt(i) || 0);
  return diff === 0;
}

export function normalizeConnectionPage(page) {
  const p = page?.properties || {};
  const person = textFromProperty(p['Naam']);
  const linkedinUrl = textFromProperty(p['LinkedIn']);
  const sourceUrl = textFromProperty(p['Directe bron-URL']) || textFromProperty(p['Laatste event URL']) || linkedinUrl;
  const readyText = textFromProperty(p['Drive Aanbevolen Tekst']) || textFromProperty(p['Bericht']);
  const contextEvidence = textFromProperty(p['Personalisatiebewijs']) || textFromProperty(p['Laatste waargenomen event']) || textFromProperty(p['Signaal toelichting']) || textFromProperty(p['Reactie']);
  const candidate = {
    id: page?.id || linkedinUrl || person,
    person,
    company: textFromProperty(p['Bedrijf']),
    role: textFromProperty(p['Functie']),
    linkedinUrl,
    sourceUrl,
    channel: textFromProperty(p['Kanaal']) || 'LinkedIn DM',
    whyNow: textFromProperty(p['Drive Waarom Nu']) || textFromProperty(p['Waarom nu']) || contextEvidence,
    nextAction: textFromProperty(p['Volgende beste actie']) || 'Context aanvullen',
    readyText,
    contextEvidence,
    contactPolicy: textFromProperty(p['Contactbeleid']),
    waitingOnMe: textFromProperty(p['Bal ligt bij']) === 'Zij wachten op mij',
    priority: textFromProperty(p['Prioriteit']),
    driveStatus: textFromProperty(p['Drive Status']),
    confidence: numeric(textFromProperty(p['Drive Confidence']) ?? textFromProperty(p['Datavertrouwen'])),
    expectedValue: numeric(textFromProperty(p['Verwachte waarde €']) ?? textFromProperty(p['Drive Revenue Signal'])),
    intent: numeric(textFromProperty(p['Intentiescore'])),
    proposition: textFromProperty(p['Passende propositie']),
    source: 'connecties'
  };
  candidate.sendReady = isSendReady(candidate);
  return candidate;
}

export function normalizeUnansweredPage(page) {
  const p = page?.properties || {};
  const linkedinUrl = textFromProperty(p['LinkedIn']);
  return {
    id: page?.id || linkedinUrl,
    person: textFromProperty(p['Naam']),
    company: textFromProperty(p['Bedrijf']),
    role: textFromProperty(p['Functie']),
    linkedinUrl,
    sourceUrl: linkedinUrl,
    channel: 'LinkedIn DM',
    whyNow: 'Deze connectie staat geregistreerd als: zij wachten op mij.',
    nextAction: 'Open het gesprek en lees de laatste boodschap voordat je antwoordt.',
    readyText: '',
    contextEvidence: '',
    waitingOnMe: textFromProperty(p['Bal ligt bij']) === 'Zij wachten op mij',
    priority: textFromProperty(p['Prioriteit']),
    messageCount: numeric(textFromProperty(p['Aantal berichten'])),
    lastContact: textFromProperty(p['Laatst contact']),
    email: textFromProperty(p['E-mail']),
    sendReady: false,
    source: 'inbox'
  };
}

export function normalizeCommentPage(page) {
  const p = page?.properties || {};
  const sourceUrl = textFromProperty(p['Postlink']);
  const readyText = textFromProperty(p['Mijn commentaar']);
  const evidence = textFromProperty(p['Waar de post over ging']);
  const candidate = {
    id: page?.id || sourceUrl,
    person: textFromProperty(p['Persoon']),
    linkedinUrl: sourceUrl,
    sourceUrl,
    channel: 'LinkedIn commentaar',
    whyNow: evidence,
    nextAction: 'Reageer inhoudelijk op deze post.',
    readyText,
    contextEvidence: evidence,
    incomingReaction: Boolean(textFromProperty(p['Zijn reactie'])),
    directPost: isConcreteLinkedInSource(sourceUrl),
    sendReady: false,
    source: 'posts'
  };
  candidate.sendReady = isSendReady(candidate);
  return candidate;
}

export function normalizeDmPage(page, connectionsById = new Map()) {
  const p = page?.properties || {};
  const relation = relationIds(p['Connectie']);
  const linked = relation.map(id => connectionsById.get(id)).find(Boolean) || {};
  const sourceUrl = textFromProperty(p['Bron URL']) || linked.linkedinUrl || '';
  const evidence = textFromProperty(p['Vorige boodschap']) || textFromProperty(p['Reactiesamenvatting']) || textFromProperty(p['Personalisatiebewijs']);
  const candidate = {
    id: page?.id || sourceUrl,
    person: linked.person || '',
    company: linked.company || '',
    role: linked.role || '',
    linkedinUrl: linked.linkedinUrl || (sourceUrl.includes('/in/') ? sourceUrl : ''),
    sourceUrl,
    channel: textFromProperty(p['Kanaal']) || 'LinkedIn DM',
    whyNow: textFromProperty(p['Commerciële hypothese']) || evidence,
    nextAction: textFromProperty(p['Status']) === 'Beantwoord' ? 'Beantwoord de reactie met concrete context.' : 'Controleer context en verstuur alleen als de tekst klopt.',
    readyText: textFromProperty(p['Bericht']),
    contextEvidence: evidence,
    incomingReaction: Boolean(textFromProperty(p['Reactie ontvangen'])) || textFromProperty(p['Status']) === 'Beantwoord',
    sendReady: false,
    source: 'dm'
  };
  candidate.sendReady = isSendReady(candidate);
  return candidate;
}


export function scoreEngagementSignal(signal = {}) {
  const weights = { like: 4, save: 8, click: 10, follow: 12, comment: 18, share: 24, repost: 28, dm: 40 };
  const type = String(signal.type || '').toLowerCase().trim();
  const count = Math.max(1, Number(signal.count) || 1);
  const base = weights[type] || 0;
  const repeatBoost = Math.min(20, Math.max(0, count - 1) * 4);
  const fit = Math.min(1, Math.max(0, Number(signal.commercialFit) || 0));
  const fitBoost = Math.round(fit * 10);
  const connectionBoost = signal.isConnection ? 4 : 0;
  return Math.min(100, Math.max(0, Math.round(base + repeatBoost + fitBoost + connectionBoost)));
}

export function recommendEngagementAction(signal = {}) {
  const type = String(signal.type || '').toLowerCase().trim();
  const count = Math.max(1, Number(signal.count) || 1);
  const fit = Math.min(1, Math.max(0, Number(signal.commercialFit) || 0));
  if (type === 'dm') return 'reply_dm';
  if (type === 'comment') {
    if (count >= 2 && Boolean(signal.isConnection) && fit >= 0.7) return 'review_dm';
    return 'reply_public';
  }
  if (type === 'repost' || type === 'share' || type === 'follow') return 'review_profile';
  if (type === 'like' && count >= 3) return 'review_profile';
  if ((type === 'save' || type === 'click') && count >= 2) return 'review_profile';
  return 'observe';
}
