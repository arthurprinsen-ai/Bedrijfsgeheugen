import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const migrationPath=new URL('../supabase/migrations/20260920101730_saas_checkout_entitlements_20260920.sql',import.meta.url);
const pricingPath=new URL('../prijzen.html',import.meta.url);

function parseEntitlements(sql){
  const plans={};
  const rx=/\('([^']+)','([^']+)',\s*'([^']+)'::jsonb\)/g;
  let m;
  while((m=rx.exec(sql))){
    const [,plan,key,raw]=m;
    plans[plan]??={};
    let value=raw;
    if(/^".*"$/.test(raw)) value=raw.slice(1,-1);
    else if(raw==='true'||raw==='false') value=raw==='true';
    else if(/^\d+(?:\.\d+)?$/.test(raw)) value=Number(raw);
    plans[plan][key]=value;
  }
  return plans;
}

const sliceDetailedPlan=(html,name,nextName)=>{
  const saasStart=html.indexOf('<div class="bg-saas-head">');
  assert.ok(saasStart>=0,'SaaS pricing section missing');
  const cardsStart=html.indexOf('<div class="kaarten bg-prijs-drie">',saasStart);
  assert.ok(cardsStart>=0,'detailed pricing card grid missing');
  const start=html.indexOf('<h3>'+name+'</h3>',cardsStart);
  assert.ok(start>=0,'detailed pricing card missing: '+name);
  const end=nextName
    ? html.indexOf('<h3>'+nextName+'</h3>',start+1)
    : html.indexOf('</div>\n\n<div class="bg-value-proof"',start);
  assert.ok(end>start,'detailed pricing card boundary missing: '+name);
  return html.slice(start,end);
};

test('pricing copy is locked to canonical server-side SaaS entitlements',async()=>{
  const [sql,html]=await Promise.all([
    readFile(migrationPath,'utf8'),
    readFile(pricingPath,'utf8')
  ]);
  const e=parseEntitlements(sql);
  for(const plan of ['control','scale','enterprise']) assert.ok(e[plan],plan+' entitlements missing');

  const control=sliceDetailedPlan(html,'Control','Scale');
  const scale=sliceDetailedPlan(html,'Scale','Enterprise');
  const enterprise=sliceDetailedPlan(html,'Enterprise',null);

  assert.equal(e.control.data_sources,5);
  assert.equal(e.control.refresh_minutes,1440);
  assert.equal(e.control.agent_mode,'recommend');
  assert.equal(e.control.organisations,1);
  assert.equal(e.control.sso,false);
  assert.equal(e.control.audit_trail,false);
  assert.equal(e.control.senior_advisory_minutes_month,60);
  assert.match(control,/Tot 5 aangesloten bedrijfsbronnen/);
  assert.match(control,/dagelijkse synchronisatie/);
  assert.match(control,/AI-copilot, bevindingen en prioriteiten/);
  assert.match(control,/1× per maand 60 min senior adviseur/);

  assert.equal(e.scale.data_sources,15);
  assert.equal(e.scale.refresh_minutes,60);
  assert.equal(e.scale.agent_mode,'approval_required');
  assert.equal(e.scale.organisations,1);
  assert.equal(e.scale.sso,false);
  assert.equal(e.scale.audit_trail,true);
  assert.equal(e.scale.senior_advisory_minutes_month,120);
  assert.match(scale,/Tot 15 aangesloten bedrijfsbronnen/);
  assert.match(scale,/ieder uur synchroniseren/);
  assert.match(scale,/Automatische acties met menselijke goedkeuring/);
  assert.match(scale,/Audittrail op acties en goedkeuringen/);
  assert.match(scale,/2× per maand 60 min senior adviseur/);

  assert.equal(e.enterprise.data_sources,999);
  assert.equal(e.enterprise.refresh_minutes,0);
  assert.equal(e.enterprise.agent_mode,'guardrailed_autonomous');
  assert.equal(e.enterprise.organisations,25);
  assert.equal(e.enterprise.sso,true);
  assert.equal(e.enterprise.audit_trail,true);
  assert.equal(e.enterprise.senior_advisory_minutes_month,240);
  assert.match(enterprise,/Meer dan 15 bronnen en meerdere entiteiten/);
  assert.match(enterprise,/Near-realtime\/event-driven/);
  assert.match(enterprise,/SSO, meerdere organisaties en strengere governance/);
  assert.match(enterprise,/Agentische workflows met expliciete guardrails/);
  assert.match(enterprise,/4 uur senior advisory per maand/);
});

test('all paid plans preserve the same intelligence core and differ only by operating envelope',async()=>{
  const [sql,html]=await Promise.all([
    readFile(migrationPath,'utf8'),
    readFile(pricingPath,'utf8')
  ]);
  const e=parseEntitlements(sql);
  for(const plan of ['control','scale','enterprise']){
    assert.equal(e[plan].intelligence_core,true,plan+' must retain full intelligence core');
    assert.equal(e[plan].forecasting,true,plan+' forecasting');
    assert.equal(e[plan].scenario_analysis,true,plan+' scenario analysis');
  }
  assert.match(html,/dezelfde kernintelligentie/i);
  assert.match(html,/Het abonnement bepaalt schaal, verversing, automatisering, governance en begeleiding/i);
  assert.match(html,/Het pakket bepaalt alleen schaal, actualiteit, automatisering, governance en begeleiding/i);
});

test('pricing prices stay aligned with canonical SaaS plan seed',async()=>{
  const [sql,html]=await Promise.all([
    readFile(migrationPath,'utf8'),
    readFile(pricingPath,'utf8')
  ]);
  const planRx=/\('([^']+)','([^']+)',(\d+),'eur',(true|false),true,\d+\)/g;
  const prices={};
  let m;
  while((m=planRx.exec(sql))) prices[m[1]]=Number(m[3])/100;
  assert.deepEqual(prices,{control:1495,scale:2495,enterprise:4995});
  assert.match(html,/data-monthly="€ 1\.495"/);
  assert.match(html,/data-monthly="€ 2\.495"/);
  assert.match(html,/data-monthly="vanaf € 4\.995"/);
  assert.match(html,/data-yearly="€ 14\.950"/);
  assert.match(html,/data-yearly="€ 24\.950"/);
  assert.match(html,/data-yearly="vanaf € 49\.950"/);
});
