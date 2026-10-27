// Anoniem meedoen aan de benchmark (AI-scan): alleen branche, omvangklasse en uren per jaar.
// Zuivere validatie, zonder netwerk, zodat de regels getest kunnen worden.

export const BRANCHES = [
  'Productie', 'Groothandel', 'Zakelijke dienstverlening', 'Bouw en installatie',
  'Retail en e-commerce', 'Zorg', 'Transport en logistiek', 'Overig',
];
export const OMVANGEN = ['3 tot 10', '10 tot 25', '25 tot 50', '50 tot 100', '100 tot 250'];
export const MAX_UREN = 1000000;
export const BENCHMARK_MIN = 5;

export function validateIntake(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, error: 'BODY_INVALID' };
  const branche = String(body.branche ?? '').trim();
  const omvang = String(body.omvang ?? '').trim();
  const uren = Number(body.uren);
  if (!BRANCHES.includes(branche)) return { ok: false, error: 'BRANCHE_INVALID' };
  if (!OMVANGEN.includes(omvang)) return { ok: false, error: 'OMVANG_INVALID' };
  if (!Number.isInteger(uren) || uren < 1 || uren > MAX_UREN) return { ok: false, error: 'UREN_INVALID' };
  if (String(body.compleet ?? '') !== 'ja') return { ok: false, error: 'SCAN_NIET_COMPLEET' };
  return { ok: true, row: { branche, omvang, uren_per_jaar: uren, bron: 'ai-scan' } };
}

// Alleen groepen met genoeg deelnemers tonen; minder is herleidbaar.
export function benchmarkVisible(aantal) {
  return Number(aantal) >= BENCHMARK_MIN;
}
