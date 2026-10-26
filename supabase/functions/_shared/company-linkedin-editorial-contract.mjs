// Canonical prepublication editor for the Bedrijfsgeheugen LinkedIn company page.
// A provider acknowledgement does not imply editorial fitness.
// Kept dependency-free so both orchestration and independent review can apply it.
export const COMPANY_EDITORIAL_POLICY = 'linkedin-company-entrepreneur-value-v1';

const clean = (value) => String(value ?? '').trim();
const normalized = (value) => clean(value).toLowerCase().normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[‐‑‒–—―]/g, '-')
  .replace(/https?:\/\/\S+/gi, ' ').replace(/\s+/g, ' ').trim();

export function companyStoryFamily(text) {
  const t = normalized(text);
  // Only named, identifiable news/events become exact story families.
  // Broad words like "AI", "MKB", "omzet" or "digitalisering" must never be
  // used alone for a dedupe decision.
  if (/\btki\b.{0,60}\b(bouw|techniek)\b|\boptoppen\b.{0,100}\b(splitsen|woning|gebouw)|\b3 miljoen\b.{0,150}\b(bestaande gebouwen|woningbouw)/i.test(t)) return 'tki-existing-buildings';
  if (/\bcircular plastics nl\b|\bcpnl\b/.test(t)) return 'rvo-circular-plastics-nl';
  if (/\bmijn cyberweerbare zaak\b/.test(t)) return 'rvo-mijn-cyberweerbare-zaak';
  if (/\bzetaris\b.{0,150}\b(ai|data|harness)\b/.test(t)) return 'zetaris-ai-data-harness';
  if (/\bbank lending survey\b/.test(t)) return 'ecb-bank-lending-survey';
  return null;
}
function nearDuplicate(a,b) {
  const tokens=(s)=>new Set(normalized(s).slice(0,650).split(/[^a-z0-9]+/)
    .filter(w=>w.length>=5&&!/^(bedrijf|bedrijven|ondernem|ondernemers|signaal|context|gevolg|directie|risico|resultaat|strategie|bedrijfsgeheugen|powerhouse|website|kunnen|worden|wordt)$/.test(w)));
  const aa=tokens(a),bb=tokens(b);
  if(aa.size<10||bb.size<10)return false;
  const shared=[...aa].filter(t=>bb.has(t)).length;
  return shared/Math.min(aa.size,bb.size)>=0.78;
}
export function companyEditorialViolations(text, {recentPosts=[]}={}) {
  const t=clean(text),out=[];
  const fail=(code)=>out.push({code,message:code});
  const n=normalized(t),words=t.split(/\s+/u).filter(Boolean).length;
  if(words<70 || words>175 || [...t].length>1650)fail('COMPANY_READER_LENGTH_INVALID');
  if(/^\s*(?:signaal\s*:|context\s*:|concrete probleem voor|probleem\s*\(zakelijk\)|aantoonbare externe signalen|beslissing\s*\(|waargenomen gevolg)/i.test(t))fail('COMPANY_REPORT_OPENING_FORBIDDEN');
  const reportHeadings=(t.match(/^\s*(?:signaal|context|gevolg|beslissing|actie|resultaat|leren|eigenaarschap|meetpunt|controleerbare uitkomst|concrete bestuurlijke beslissing|wat verandert er|risico)\s*(?::|\()/gim)||[]).length;
  if(reportHeadings>=2)fail('COMPANY_INTERNAL_MEMO_STRUCTURE');
  if(/\b(?:compliance.exposure|bi.refresh(?:es)?|lineage|readback|runtime|pipeline|deliverable|stakeholder.matrix|vendor.lock.in|cloud.agents|gekalibreerde prioriteitenlijst|pilot.dossier)\b/i.test(t))fail('COMPANY_TECHNICAL_JARGON');
  if(/\b(?:signaal\s*[→>-]\s*context|context\s*[→>-]\s*gevolg|resultaat\s*[→>-]\s*leren)\b/i.test(t))fail('COMPANY_INTERNAL_PROCESS_FORMULA');
  if(!/\b(?:klant(?:en)?|offert(?:e|es)|order(?:s)?|omzet|marge|kosten|tijd|uren|planning|factur(?:en|atie)|voorraad|kennis|overdracht|medewerker(?:s)?|levering|ondernemer(?:s)?|cashflow|risico(?:s)?|fout(?:en)?|betalingen|proces(?:sen)?|werkdruk)\b/i.test(t))
    fail('COMPANY_ENTREPRENEUR_PROBLEM_REQUIRED');
  if(!/\b(?:bespaar|bespaart|verliest|kost|kosten|duurt|wacht|blijft liggen|mist|missen|risico|marge|omzet|tijd|werkdruk|voorkom|voorkomt|sneller|duidelijk|betere?|levert|verlies|groei)\b/i.test(t))
    fail('COMPANY_BUSINESS_CONSEQUENCE_REQUIRED');
  const previous=Array.isArray(recentPosts)?recentPosts:[];
  const family=companyStoryFamily(t);
  if(previous.some(p=>family&&companyStoryFamily(typeof p==='string'?p:p?.body)===family))
    fail('COMPANY_RECENT_STORY_FAMILY_REPEAT');
  else if(previous.some(p=>nearDuplicate(t,typeof p==='string'?p:p?.body)))
    fail('COMPANY_RECENT_STORY_NEAR_DUPLICATE');
  // A source-backed niche example is allowed only if novel; a company page
  // is not an unfiltered feed of grants, regulatory bulletins, or tech news.
  return out;
}
