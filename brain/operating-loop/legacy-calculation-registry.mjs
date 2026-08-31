import { evaluateLegacyParity } from './legacy-parity.mjs';

export const ACTIVE_LEGACY_CALCULATION_SOURCES = Object.freeze([
  'frisse-blik.html',
  'zelfscan.html',
  'klantportaal.html'
]);

const JS_ROUND = value => Math.floor(Number(value) + 0.5);
const closeNumber = value => Number(Number(value).toFixed(9));

export function calculateFrisseBlikMaturity({points}) {
  const values = Array.isArray(points) ? points.map(Number) : [];
  if (!values.length || values.some(value => !Number.isFinite(value) || value < 1 || value > 4)) {
    throw new TypeError('points must contain scored legacy values between 1 and 4');
  }
  const overall = values.reduce((sum, value) => sum + value, 0) / values.length;
  const score = JS_ROUND(((overall - 1) / 3) * 100);
  const level = overall < 1.6 ? 1 : overall < 2.2 ? 2 : overall < 2.8 ? 3 : overall < 3.5 ? 4 : 5;
  return Object.freeze({overall: closeNumber(overall), score, level});
}

const GAINS = Object.freeze({
  1: Object.freeze({share: 0.5, hours: 2.5, margin: Object.freeze([0.5, 1.5])}),
  2: Object.freeze({share: 0.6, hours: 2.0, margin: Object.freeze([0.5, 1.5])}),
  3: Object.freeze({share: 0.6, hours: 2.5, margin: Object.freeze([1, 2])}),
  4: Object.freeze({share: 0.7, hours: 3.0, margin: Object.freeze([1, 2])}),
  5: Object.freeze({share: 0.7, hours: 1.5, margin: Object.freeze([0.5, 1])})
});
const INVEST = Object.freeze({
  1: Object.freeze([15000, 40000]),
  2: Object.freeze([40000, 90000]),
  3: Object.freeze([60000, 120000]),
  4: Object.freeze([80000, 150000]),
  5: Object.freeze([30000, 60000])
});
const HORIZON_MONTHS = 36;
const STEP_DURATION_MONTHS = 9;

const sizeFactor = employees => Math.min(4, Math.max(0.6, Math.pow(Number(employees) / 40, 0.6)));
const investmentRange = (level, employees) => {
  const factor = sizeFactor(employees);
  const source = INVEST[level];
  if (!source) throw new RangeError(`unsupported maturity level ${level}`);
  return Object.freeze([
    JS_ROUND((source[0] * factor) / 1000) * 1000,
    JS_ROUND((source[1] * factor) / 1000) * 1000
  ]);
};
const investmentMid = (level, employees) => {
  const [low, high] = investmentRange(level, employees || 40);
  return (low + high) / 2;
};
const annualGain = (level, employees, revenue, hourlyRate) => {
  const gain = GAINS[level];
  if (!gain) throw new RangeError(`unsupported maturity level ${level}`);
  const averageMargin = (gain.margin[0] + gain.margin[1]) / 2;
  return Number(employees) * gain.share * gain.hours * 44 * Number(hourlyRate) * 0.8
    + Number(revenue) * averageMargin / 100;
};
const buildBusinessSeries = (currentLevel, targetLevel, startDelay, employees, revenue, hourlyRate) => {
  const cumulative = [0];
  let accumulated = 0;
  for (let month = 1; month <= HORIZON_MONTHS; month += 1) {
    let flow = 0;
    for (let step = 0; step < targetLevel - currentLevel; step += 1) {
      const startsAfter = startDelay + step * STEP_DURATION_MONTHS;
      const finishes = startsAfter + STEP_DURATION_MONTHS;
      if (month > startsAfter && month <= finishes) flow -= investmentMid(currentLevel + step, employees) / STEP_DURATION_MONTHS;
      if (month > finishes) flow += annualGain(currentLevel + step, employees, revenue, hourlyRate) / 12;
    }
    accumulated += flow;
    cumulative.push(accumulated);
  }
  return cumulative;
};

export function calculateFrisseBlikBusinessCase({currentLevel,targetLevel,employees,revenue,hourlyRate,delayMonths=0}) {
  const current = Number(currentLevel);
  const target = Number(targetLevel);
  if (!Number.isInteger(current) || !Number.isInteger(target) || current < 1 || target > 5 || target < current) {
    throw new RangeError('currentLevel/targetLevel must be integer maturity levels with 1 <= current <= target <= 5');
  }
  if (target === current) return Object.freeze({net3:0,wait:0,breakEven:null,investmentLow:0,investmentHigh:0});
  const now = buildBusinessSeries(current,target,0,employees,revenue,hourlyRate);
  const delayed = buildBusinessSeries(current,target,Number(delayMonths),employees,revenue,hourlyRate);
  let breakEven = null;
  for (let month = 1; month <= HORIZON_MONTHS; month += 1) {
    if (now[month] >= 0 && now[month - 1] < 0) { breakEven = month; break; }
  }
  let investmentLow = 0;
  let investmentHigh = 0;
  for (let level = current; level < target; level += 1) {
    const [low,high] = investmentRange(level,employees);
    investmentLow += low;
    investmentHigh += high;
  }
  return Object.freeze({
    net3: closeNumber(now[HORIZON_MONTHS]),
    wait: closeNumber(now[HORIZON_MONTHS] - delayed[HORIZON_MONTHS]),
    breakEven,
    investmentLow,
    investmentHigh
  });
}

export function calculateZelfscanKnowledgeRiskScore({points}) {
  const values = Array.isArray(points) ? points.map(Number) : [];
  if (!values.length || values.some(value => !Number.isFinite(value) || value < 0 || value > 3)) {
    throw new TypeError('points must contain legacy selfscan values between 0 and 3');
  }
  return JS_ROUND(values.reduce((sum,value)=>sum+value,0) / (values.length * 3) * 100);
}

const PORTAL_LEVEL_FACTOR = Object.freeze([0,1,0.78,0.5,0.22,0.06]);
export function calculatePortalHandwork({dimensions,employees,hourlyRate}) {
  const rows = Array.isArray(dimensions) ? dimensions : [];
  if (!rows.length) throw new TypeError('dimensions are required');
  let weeklyHours = 0;
  for (const row of rows) {
    const level = Number(row.level);
    if (!Number.isInteger(level) || level < 1 || level > 5) throw new RangeError('dimension level must be 1..5');
    weeklyHours += Number(row.baseHours) * PORTAL_LEVEL_FACTOR[level] * (Number(employees) / 24);
  }
  const annualCost = weeklyHours * 46 * Number(hourlyRate);
  const fte = weeklyHours * 46 / 1600;
  const averageLevel = rows.reduce((sum,row)=>sum+Number(row.level),0) / rows.length;
  return Object.freeze({weeklyHours:closeNumber(weeklyHours),annualCost:closeNumber(annualCost),fte:closeNumber(fte),averageLevel:closeNumber(averageLevel)});
}

export function calculatePortalEsgCoverage({E,S,G}) {
  const result = {};
  for (const [pillar,valuesRaw] of Object.entries({E,S,G})) {
    const values = Array.isArray(valuesRaw) ? valuesRaw.map(Number) : [];
    if (!values.length || values.some(value=>!Number.isFinite(value)||value<0||value>3)) throw new TypeError(`${pillar} ESG values must be 0..3`);
    result[pillar] = Object.freeze({
      pct: JS_ROUND(values.reduce((sum,value)=>sum+value,0) / (values.length * 3) * 100),
      have: values.filter(value=>value>0).length,
      auto: values.filter(value=>value>=2).length,
      n: values.length
    });
  }
  const total = JS_ROUND((result.E.pct + result.S.pct + result.G.pct) / 3);
  return Object.freeze({scores:Object.freeze(result),total,manual:[...E,...S,...G].filter(value=>Number(value)===1).length,missing:[...E,...S,...G].filter(value=>Number(value)===0).length});
}

const DEFINITIONS = Object.freeze([
  Object.freeze({
    id:'frisse-blik-maturity-score-v1', legacySource:'frisse-blik.html', sourceFingerprint:'finish:overall-score-userLevel-2026-08-31', canonicalService:'brain/operating-loop/legacy-calculation-registry.mjs#calculateFrisseBlikMaturity', tolerance:0,
    compute:calculateFrisseBlikMaturity,
    fixtures:Object.freeze([
      Object.freeze({id:'mixed-1-4',input:{points:[1,2,3,4]},expected:{overall:2.5,score:50,level:3}}),
      Object.freeze({id:'upper-band',input:{points:[4,4,3,4]},expected:{overall:3.75,score:92,level:5}})
    ])
  }),
  Object.freeze({
    id:'frisse-blik-business-case-v1', legacySource:'frisse-blik.html', sourceFingerprint:'GAINS-INVEST-buildSeries-renderCk-2026-08-31', canonicalService:'brain/operating-loop/legacy-calculation-registry.mjs#calculateFrisseBlikBusinessCase', tolerance:0.000001,
    compute:calculateFrisseBlikBusinessCase,
    fixtures:Object.freeze([
      Object.freeze({id:'n2-n4-40fte',input:{currentLevel:2,targetLevel:4,employees:40,revenue:6000000,hourlyRate:55,delayMonths:6},expected:{net3:498328,wait:179544,breakEven:20,investmentLow:100000,investmentHigh:210000}}),
      Object.freeze({id:'n3-n5-150fte',input:{currentLevel:3,targetLevel:5,employees:150,revenue:12000000,hourlyRate:75,delayMonths:3},expected:{net3:2805400,wait:446400,breakEven:15,investmentLow:310000,investmentHigh:597000}})
    ])
  }),
  Object.freeze({
    id:'zelfscan-knowledge-risk-score-v1', legacySource:'zelfscan.html', sourceFingerprint:'toonScore:sum-points-divide-max-2026-08-31', canonicalService:'brain/operating-loop/legacy-calculation-registry.mjs#calculateZelfscanKnowledgeRiskScore', tolerance:0,
    compute:calculateZelfscanKnowledgeRiskScore,
    fixtures:Object.freeze([
      Object.freeze({id:'sixty',input:{points:[0,1,2,3,3]},expected:60}),
      Object.freeze({id:'full',input:{points:[3,3,3,3,3]},expected:100})
    ])
  }),
  Object.freeze({
    id:'portal-handwork-cost-v1', legacySource:'klantportaal.html', sourceFingerprint:'teken:DIM-level-factor-weekly-cost-fte-average-2026-08-31', canonicalService:'brain/operating-loop/legacy-calculation-registry.mjs#calculatePortalHandwork', tolerance:0.000001,
    compute:calculatePortalHandwork,
    fixtures:Object.freeze([
      Object.freeze({id:'24-employees',input:{dimensions:[{baseHours:10,level:2},{baseHours:6,level:3}],employees:24,hourlyRate:50},expected:{weeklyHours:10.8,annualCost:24840,fte:0.3105,averageLevel:2.5}}),
      Object.freeze({id:'48-employees',input:{dimensions:[{baseHours:8,level:1},{baseHours:12,level:4},{baseHours:4,level:5}],employees:48,hourlyRate:70},expected:{weeklyHours:21.76,annualCost:70067.2,fte:0.6256,averageLevel:3.333333333}})
    ])
  }),
  Object.freeze({
    id:'portal-esg-coverage-score-v1', legacySource:'klantportaal.html', sourceFingerprint:'ESG:pillar-pct-have-auto-total-2026-08-31', canonicalService:'brain/operating-loop/legacy-calculation-registry.mjs#calculatePortalEsgCoverage', tolerance:0,
    compute:calculatePortalEsgCoverage,
    fixtures:Object.freeze([
      Object.freeze({id:'mixed',input:{E:[0,1,2],S:[1,2,3],G:[3,3,3]},expected:{scores:{E:{pct:33,have:2,auto:1,n:3},S:{pct:67,have:3,auto:2,n:3},G:{pct:100,have:3,auto:3,n:3}},total:67,manual:2,missing:1}}),
      Object.freeze({id:'sparse',input:{E:[0,0],S:[1,1],G:[2,3]},expected:{scores:{E:{pct:0,have:0,auto:0,n:2},S:{pct:33,have:2,auto:0,n:2},G:{pct:83,have:2,auto:2,n:2}},total:39,manual:2,missing:2}})
    ])
  })
]);

const normaliseNumeric = value => {
  if (typeof value === 'number') return closeNumber(value);
  if (Array.isArray(value)) return value.map(normaliseNumeric);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,normaliseNumeric(item)]));
  return value;
};

export const LEGACY_CALCULATION_REGISTRY = Object.freeze(DEFINITIONS.map(definition => Object.freeze({
  id:definition.id,
  legacySource:definition.legacySource,
  sourceFingerprint:definition.sourceFingerprint,
  canonicalService:definition.canonicalService,
  tolerance:definition.tolerance,
  fixtures:Object.freeze(definition.fixtures.map(fixture=>Object.freeze({id:fixture.id,input:fixture.input,legacy:normaliseNumeric(fixture.expected)})))
})));

export function evaluateRealLegacyCalculationParity({expectedCalculationIds=LEGACY_CALCULATION_REGISTRY.map(item=>item.id)}={}) {
  const registry = DEFINITIONS.map(definition => ({
    id:definition.id,
    legacySource:definition.legacySource,
    sourceFingerprint:definition.sourceFingerprint,
    canonicalService:definition.canonicalService,
    tolerance:definition.tolerance,
    fixtures:definition.fixtures.map(fixture=>({
      id:fixture.id,
      legacy:normaliseNumeric(fixture.expected),
      canonical:normaliseNumeric(definition.compute(fixture.input))
    }))
  }));
  return evaluateLegacyParity(registry,{expectedCalculationIds});
}
