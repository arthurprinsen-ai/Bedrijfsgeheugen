const TOKEN_FIELDS = Object.freeze({
  inputTokens: ['input_tokens', 'inputTokens', 'prompt_tokens', 'promptTokens'],
  outputTokens: ['output_tokens', 'outputTokens', 'completion_tokens', 'completionTokens'],
  cacheReadTokens: ['cache_read_input_tokens', 'cacheReadInputTokens', 'cached_tokens', 'cachedTokens'],
  cacheWriteTokens: ['cache_creation_input_tokens', 'cacheCreationInputTokens'],
});

function requireText(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${name} is required`);
  return value.trim();
}

function tokenCount(usage, names) {
  const match = names.find(name => usage?.[name] !== undefined);
  const value = match ? Number(usage[match]) : 0;
  if (!Number.isSafeInteger(value) || value < 0) throw new TypeError('token usage must contain non-negative integers');
  return value;
}

function zonedParts(value, timezone) {
  const instant = new Date(value);
  if (!Number.isFinite(instant.getTime())) throw new TypeError('valid timestamp is required');
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(instant).filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
  return { instant, year: parts.year, month: parts.month, day: parts.day, ymd: `${parts.year}-${parts.month}-${parts.day}`, ym: `${parts.year}-${parts.month}` };
}

export function normalizeProviderTokenUsage(input = {}) {
  const provider = requireText(input.provider, 'provider');
  const providerModelId = requireText(input.providerModelId, 'providerModelId');
  const componentKey = requireText(input.componentKey, 'componentKey');
  const requestId = requireText(input.requestId, 'requestId');
  const { instant } = zonedParts(input.at, input.timezone ?? 'Europe/Amsterdam');
  const inputTokens = tokenCount(input.usage, TOKEN_FIELDS.inputTokens);
  const outputTokens = tokenCount(input.usage, TOKEN_FIELDS.outputTokens);
  const cacheReadTokens = tokenCount(input.usage, TOKEN_FIELDS.cacheReadTokens);
  const cacheWriteTokens = tokenCount(input.usage, TOKEN_FIELDS.cacheWriteTokens);
  return Object.freeze({ schemaVersion:1, requestId, componentKey, provider, providerModelId, inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens, totalTokens: inputTokens + outputTokens + cacheReadTokens + cacheWriteTokens, at: instant.toISOString() });
}

function canonicalFactor(factor = {}) {
  return {
    factorId: factor.factorId ?? factor.factor_id,
    provider: factor.provider ?? factor.source,
    providerModelId: factor.providerModelId ?? factor.provider_model_id,
    resourceType: factor.resourceType ?? factor.resource_type ?? 'ai_tokens',
    unit: factor.unit ?? 'tokens',
    quantityBasisTokens: factor.quantityBasisTokens ?? factor.quantity_basis,
    energyKwh: factor.energyKwh ?? factor.energy_kwh,
    co2eKg: factor.co2eKg ?? factor.co2e_kg,
    waterLiters: factor.waterLiters ?? factor.water_liters,
    methodology: factor.methodology,
    confidence: factor.confidence,
    validFrom: factor.validFrom ?? factor.valid_from,
    validTo: factor.validTo ?? factor.valid_to,
  };
}

function matchingFootprintFactor(record, factors = []) {
  const instant = new Date(record.at);
  if (!Number.isFinite(instant.getTime())) throw new TypeError('valid timestamp is required');
  const day = instant.toISOString().slice(0, 10);
  return (Array.isArray(factors) ? factors : []).map(canonicalFactor).find(factor => factor.provider === record.provider && factor.resourceType === 'ai_tokens' && factor.unit === 'tokens' && (!factor.providerModelId || factor.providerModelId === record.providerModelId) && (!factor.validFrom || factor.validFrom <= day) && (!factor.validTo || factor.validTo >= day) && Number(factor.quantityBasisTokens) > 0) ?? null;
}

export function deriveTokenFootprint(record = {}, factors = []) {
  const requestId = requireText(record.requestId, 'requestId');
  const totalTokens = Number(record.totalTokens);
  if (!Number.isSafeInteger(totalTokens) || totalTokens < 0) throw new TypeError('totalTokens must be a non-negative integer');
  const factor = matchingFootprintFactor(record, factors);
  if (!factor) return Object.freeze({ requestId, status:'unknown_factor', measurementClass:'estimated', energyKwh:null, co2eKg:null, waterLiters:null, factorId:null, methodology:null, confidence:0 });
  const ratio = totalTokens / Number(factor.quantityBasisTokens);
  const scaled = value => value == null ? null : Number(value) * ratio;
  return Object.freeze({ requestId, status:'calculated', measurementClass:'estimated', energyKwh:scaled(factor.energyKwh), co2eKg:scaled(factor.co2eKg), waterLiters:scaled(factor.waterLiters), factorId:requireText(factor.factorId,'factorId'), methodology:requireText(factor.methodology,'methodology'), confidence:Math.max(0,Math.min(1,Number(factor.confidence)||0)) });
}

export function aggregateTokenFootprint(records = []) {
  const unique = new Map();
  for (const record of Array.isArray(records) ? records : []) if (record?.requestId && !unique.has(record.requestId)) unique.set(record.requestId, record);
  const values = [...unique.values()];
  const calculated = values.filter(row => row.status === 'calculated');
  const sumOrNull = key => { const known = calculated.map(row => row[key]).filter(value => value != null && Number.isFinite(Number(value))); return known.length ? known.reduce((total,value)=>total+Number(value),0) : null; };
  return Object.freeze({ totalRequests:values.length, calculatedRequests:calculated.length, coverage:values.length ? calculated.length/values.length : 0, energyKwh:sumOrNull('energyKwh'), co2eKg:sumOrNull('co2eKg'), waterLiters:sumOrNull('waterLiters'), confidence:calculated.length ? calculated.reduce((total,row)=>total+(Number(row.confidence)||0),0)/calculated.length : 0, factorVersions:Object.freeze([...new Set(calculated.map(row=>row.factorId).filter(Boolean))].sort()), methodologies:Object.freeze([...new Set(calculated.map(row=>row.methodology).filter(Boolean))].sort()) });
}

export function aggregateTokenUsage(records = [], { monthlyLimitTokens = 10_000, now = new Date().toISOString(), timezone = 'Europe/Amsterdam' } = {}) {
  if (!Number.isSafeInteger(Number(monthlyLimitTokens)) || Number(monthlyLimitTokens) <= 0) throw new TypeError('monthly token limit must be a positive integer');
  const current = zonedParts(now, timezone);
  const unique = new Map();
  for (const record of Array.isArray(records) ? records : []) {
    if (!record?.requestId || unique.has(record.requestId)) continue;
    const when = zonedParts(record.at, timezone);
    if (when.ym !== current.ym) continue;
    const totalTokens = Number(record.totalTokens);
    if (!Number.isSafeInteger(totalTokens) || totalTokens < 0) continue;
    unique.set(record.requestId, { ...record, totalTokens, ymd: when.ymd });
  }
  const components = new Map(); let usedTokens=0; let tokensToday=0;
  for (const record of unique.values()) {
    usedTokens += record.totalTokens; if (record.ymd === current.ymd) tokensToday += record.totalTokens;
    const componentKey=String(record.componentKey ?? 'agent:unclassified'); const entry=components.get(componentKey) ?? {componentKey,totalTokens:0,tokensToday:0,calls:0};
    entry.totalTokens += record.totalTokens; entry.tokensToday += record.ymd === current.ymd ? record.totalTokens : 0; entry.calls += 1; components.set(componentKey,entry);
  }
  const limit=Number(monthlyLimitTokens); const remainingTokens=Math.max(0,limit-usedTokens); const daysInMonth=new Date(Date.UTC(Number(current.year),Number(current.month),0)).getUTCDate(); const remainingDays=Math.max(1,daysInMonth-Number(current.day)+1); const dailyTokenAllowance=remainingTokens/remainingDays; const paceRatio=dailyTokenAllowance>0?tokensToday/dailyTokenAllowance:usedTokens/limit; const state=usedTokens>=limit||paceRatio>=1?'EXHAUSTED':paceRatio>=0.9?'RED':paceRatio>=0.7?'ORANGE':'GREEN';
  return Object.freeze({ monthlyLimitTokens:limit, usedTokens, remainingTokens, tokensToday, dailyTokenAllowance, tokenPaceRatio:paceRatio, tokenState:state, coverage:'RECORDED_PROVIDER_CALLS_ONLY', month:current.ym, components:Object.freeze([...components.values()].sort((left,right)=>right.totalTokens-left.totalTokens).map(Object.freeze)) });
}

export function tokenUsageMonth(value = new Date().toISOString(), timezone = 'Europe/Amsterdam') { return zonedParts(value, timezone).ym; }
