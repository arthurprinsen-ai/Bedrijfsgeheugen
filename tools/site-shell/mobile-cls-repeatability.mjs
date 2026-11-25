// Repeatability is a second assertion within the EXISTING daily browser runner.
// It is not a new scheduler, renderer, or way to waive a failing full sitemap scan.
export const MOBILE_CLS_LIMIT = 0.100;
const canonical = route => {
  const path = String(route || '').split(/[?#]/, 1)[0];
  return path === '/' ? '/' : path.replace(/\/+$/, '');
};

export function planMobileClsReplay(routes, policy) {
  if (policy?.version !== 'POWERHOUSE-MOBILE-CLS-REPEATABILITY-v1')
    throw new Error('MOBILE_CLS_REPLAY_POLICY_INVALID');
  if (policy.max_cls !== MOBILE_CLS_LIMIT)
    throw new Error('MOBILE_CLS_REPLAY_THRESHOLD_CHANGE_FORBIDDEN');
  if (JSON.stringify(policy.modes) !== JSON.stringify(['isolated','parallel']))
    throw new Error('MOBILE_CLS_REPLAY_MODES_INVALID');
  const rounds = policy.samples_per_route;
  if (!Number.isInteger(rounds) || rounds < 2 || rounds > 3)
    throw new Error('MOBILE_CLS_REPLAY_ROUNDS_INVALID');
  const known = new Set(routes.map(canonical));
  const focus = policy.focus_routes;
  if (!Array.isArray(focus) || focus.length < 3 || new Set(focus.map(canonical)).size !== focus.length)
    throw new Error('MOBILE_CLS_REPLAY_FOCUS_INVALID');
  // The primary NL sitemap is the source inventory; EN mirrors are generated
  // routes and do not have to be listed separately in sitemap.xml.
  // checkOne still requires a successful real HTTP navigation for every EN URL.
  const inSourceInventory = route => {
    const candidate=canonical(route);
    return known.has(candidate)
      || (candidate.startsWith('/en/') && known.has(candidate.slice(3)));
  };
  const missing = focus.filter(route => !inSourceInventory(route));
  if (missing.length) throw new Error('MOBILE_CLS_REPLAY_ROUTES_MISSING:' + missing.join(','));
  const expected = focus.length * rounds * 2;
  if (expected > 24 || policy.max_total_checks !== 24)
    throw new Error('MOBILE_CLS_REPLAY_BUDGET_INVALID');
  return Object.freeze({ routes: focus.map(canonical), rounds,
    modes: Object.freeze(['isolated','parallel']), expected, maxCls:MOBILE_CLS_LIMIT });
}

export function summarizeMobileClsReplay(plan, records) {
  if (!Array.isArray(records) || records.length !== plan.expected)
    throw new Error('MOBILE_CLS_REPLAY_INCOMPLETE:' + (records?.length ?? 'missing'));
  const seen=new Set();
  const samples=[];
  for(const record of records){
    const key=record.mode + '|' + canonical(record.route) + '|' + record.round;
    if(seen.has(key)) throw new Error('MOBILE_CLS_REPLAY_DUPLICATE:'+key);
    seen.add(key);
    if(!plan.modes.includes(record.mode) || !plan.routes.includes(canonical(record.route))
      || !Number.isInteger(record.round) || record.round < 1 || record.round > plan.rounds)
      throw new Error('MOBILE_CLS_REPLAY_UNEXPECTED_SAMPLE:'+key);
    const cls=record.cls;
    const valid=typeof cls==='number' && Number.isFinite(cls) && cls >= 0;
    samples.push({...record,valid,
      failed:!valid || (record.violations||[]).length > 0 || cls > plan.maxCls});
  }
  for(const mode of plan.modes)for(const route of plan.routes)
    for(let round=1;round<=plan.rounds;round++)
      if(!seen.has(mode+'|'+route+'|'+round))
        throw new Error('MOBILE_CLS_REPLAY_SAMPLE_MISSING:'+mode+':'+route+':'+round);
  const grouped=[];
  for(const route of plan.routes)for(const mode of plan.modes){
    const slice=samples.filter(x=>canonical(x.route)===route && x.mode===mode);
    const values=slice.map(x=>x.cls).filter(Number.isFinite).sort((a,b)=>a-b);
    grouped.push({route,mode,samples:slice.length,
      minCls:values.length===slice.length?values[0]:null,
      maxCls:values.length===slice.length?values[values.length-1]:null,
      meanCls:values.length===slice.length
        ?Math.round((values.reduce((a,b)=>a+b,0)/values.length)*100000)/100000:null,
      failed:slice.some(x=>x.failed)});
  }
  return {contract:'POWERHOUSE-MOBILE-CLS-REPEATABILITY-v1',
    threshold:plan.maxCls, expected:plan.expected,observed:samples.length,
    healthy:samples.every(x=>!x.failed),groups:grouped,
    failures:samples.filter(x=>x.failed).map(x=>({route:x.route,mode:x.mode,round:x.round,cls:x.cls,violations:x.violations||[]}))};
}
