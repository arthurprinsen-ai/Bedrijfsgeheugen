// Official EU legal-reference screening, not a tenant-specific legal ruling.
// A customer cannot become CSRD compliant or exempt on the basis of this projection.
export const CSRD_ESRS_OFFICIAL_SOURCES = Object.freeze([
  Object.freeze({
    id:'DIRECTIVE_EU_2026_470',
    url:'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32026L0470',
    kind:'EU_DIRECTIVE',
    subject:'CSRD scope and phased application',
    reference:'Directive (EU) 2026/470, Article 2 and amendments to Directive 2022/2464'
  }),
  Object.freeze({
    id:'DELEGATED_REGULATION_EU_2026_1563',
    url:'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32026R1563',
    kind:'EU_DELEGATED_REGULATION',
    subject:'Revised ESRS disclosures',
    reference:'Commission Delegated Regulation (EU) 2026/1563'
  })
]);
const nonNegative = value => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
};
const yearStart = value => {
  const s = String(value ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(s+'T00:00:00Z');
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === s ? s : null;
};
const unique = array => Object.freeze([...new Set(array)]);

/**
 * Conservative screening against the post-2026 EU threshold rule:
 * BOTH average employees > 1,000 AND net turnover > EUR 450m.
 * Do not apply this future-year rule to pre-2027 accounting periods.
 *
 * No status returned here constitutes a legal applicability determination.
 * Group consolidation, transitional reporting, Dutch implementation and
 * materiality/disclosure review require separate authoritative evidence.
 */
export function screenCsrdEsrsScope({
  financialYearStart,
  averageEmployees,
  netTurnoverEur,
  entityScope,
  memberState,
  nationalImplementationEvidence,
  legalReviewEvidence,
  esrsMaterialityEvidence
}={}) {
  const year=yearStart(financialYearStart);
  const employees=nonNegative(averageEmployees);
  const turnover=nonNegative(netTurnoverEur);
  const scope=['single','consolidated_parent'].includes(entityScope) ? entityScope : null;
  const appliesNewThreshold=year !== null && year >= '2027-01-01';
  const thresholdScreen=!appliesNewThreshold?'PERIOD_REVIEW_REQUIRED'
    :employees===null || turnover===null || !scope?'INSUFFICIENT_ENTITY_DATA'
    :employees>1000 && turnover>450000000?'ABOVE_BOTH_THRESHOLDS'
    :'NOT_ABOVE_BOTH_THRESHOLDS';
  const missing=[];
  if (!year) missing.push('FINANCIAL_YEAR_START');
  if (!scope) missing.push('ENTITY_OR_CONSOLIDATED_GROUP_SCOPE');
  if (employees===null) missing.push('AVERAGE_EMPLOYEES');
  if (turnover===null) missing.push('NET_TURNOVER_EUR');
  if (!String(memberState||'').trim()) missing.push('MEMBER_STATE');
  if (!String(nationalImplementationEvidence||'').trim()) missing.push('NATIONAL_TRANSPOSITION_EVIDENCE');
  if (!String(legalReviewEvidence||'').trim()) missing.push('APPROVED_LEGAL_REVIEW');
  if (!String(esrsMaterialityEvidence||'').trim()) missing.push('ESRS_MATERIALITY_ASSESSMENT');
  if (!appliesNewThreshold) missing.push('TRANSITIONAL_YEAR_RULES');
  return Object.freeze({
    legalStatus:'REVIEW_REQUIRED',
    csrdApplicability:'UNDETERMINED',
    esrsReportingObligation:'UNDETERMINED',
    thresholdScreen,
    financialYearStart:year,
    officialSources:CSRD_ESRS_OFFICIAL_SOURCES,
    missingEvidence:unique(missing),
    financialImpactEur:null,
    measuredEmissions:null,
    notice:'Threshold screening is not legal proof, exemption, ESRS materiality or compliance certification.'
  });
}
