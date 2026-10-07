import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';

const read=p=>readFile(p,'utf8');

test('Source Universe reuses the existing external signal and evidence spine',async()=>{
  const sql=await read('supabase/migrations/20261007195000_source_universe_environment_radar_v1.sql');
  assert.match(sql,/powerhouse_source_catalog_v1/);
  assert.match(sql,/powerhouse_signal_impact_assessment_v1/);
  assert.match(sql,/from public\.bg_externe_signalen s/i);
  assert.match(sql,/powerhouse_evidence_sources/);
  assert.match(sql,/powerhouse_refresh_environment_radar_v1/);
  assert.match(sql,/powerhouse_evidence_daily_maintenance_v1/);
  assert.doesNotMatch(sql,/cron\.schedule\s*\(/i);
});

test('Source Universe covers broad business environment categories',async()=>{
  const sql=(await read('supabase/migrations/20261007195000_source_universe_environment_radar_v1.sql'))+
    (await read('supabase/migrations/20261007195500_source_universe_expansion_v1.sql'));
  for(const marker of [
    'AI-wetgeving en toezicht','Cyberdreigingen en kwetsbaarheden','AI-modellen en agents',
    'Marktvraag en klantgedrag','Concurrenten en prijsbewegingen','Subsidies en fondsen',
    'Rente en financiering','Arbeidsmarkt en personeel','Energieprijzen en netcongestie',
    'Leveranciers en supply chain','Geopolitiek en sancties','Publieke aanbestedingen',
    'Patenten merken en IP','Fraude AML en sanctielijsten','Vastgoed en bedrijfslocaties',
    'Demografie en regionale ontwikkeling','ISO standards','RIVM','World Trade Organization',
    'AFAS','Dynamics 365','Microsoft Fabric','Snowflake','Databricks','TOPdesk',
    'Google Ads','Meta Ads','Supplier master & contracts','Production / MES / operations'
  ]) assert.ok(sql.includes(marker),marker);
});

test('impact truth never invents tenant exposure or euro impact',async()=>{
  const sql=await read('supabase/migrations/20261007195000_source_universe_environment_radar_v1.sql');
  assert.match(sql,/company_exposure_synthesized',false/);
  assert.match(sql,/monetary_impact_synthesized',false/);
  assert.match(sql,/value_eur numeric/);
  assert.match(sql,/downside_eur numeric/);
  assert.match(sql,/null,\s*null,\s*case/s);
  assert.match(sql,/UNKNOWN_UNTIL_EVIDENCE/);
});

test('catalogued source capability is explicitly separated from live evidence',async()=>{
  const sql=await read('supabase/migrations/20261007195000_source_universe_environment_radar_v1.sql');
  assert.match(sql,/availability_state text not null default 'CATALOGUED'/);
  assert.match(sql,/CATALOGUED means Bedrijfsgeheugen knows how\/why to use a source/);
  assert.match(sql,/CONNECTED','OBSERVED','LIVE/);
  assert.match(sql,/enable row level security/);
  assert.match(sql,/revoke all on public\.powerhouse_source_catalog_v1 from anon, authenticated, public/);
});

test('authenticated Portal API projects one intelligence contract',async()=>{
  const api=await read('netlify/functions/portal-ondernemersdata.mjs');
  assert.match(api,/resolveIdentityTenant/);
  assert.match(api,/powerhouse_source_catalog_v1/);
  assert.match(api,/powerhouse_signal_impact_assessment_v1/);
  assert.match(api,/intelligence:\{/);
  assert.match(api,/tenantExposureApplied:false/);
  assert.match(api,/monetaryImpactSynthesized:false/);
  assert.match(api,/measured_or_evidence_backed_else_unknown/);
  assert.match(api,/vary.*authorization, cookie/i);
});

test('Portal V2 exposes the environment radar in the existing external-data family',async()=>{
  const [module,registry,shell]=await Promise.all([
    read('portal-v2/modules/entrepreneur-intelligence.js'),
    read('portal-v2/page-registry.js'),
    read('portal-v2/page-shell.js')
  ]);
  assert.match(module,/omgevingsradar/);
  assert.match(module,/Source → evidence → signal → impact → actie → outcome → learning/);
  assert.match(module,/Nog niet bewezen · eigen bedrijfscontext nodig/);
  assert.match(module,/catalogus betekent mogelijkheid, niet automatisch een actieve koppeling/);
  assert.match(registry,/'actueel-externe-data'.*omgevingsradar/s);
  assert.match(shell,/ENTREPRENEUR_DATA_PAGES.*omgevingsradar/);
});

test('Loop Assurance, System Map, skill and learning inherit the capability',async()=>{
  const [loops,map,skill,learning]=await Promise.all([
    read('powerhouse/assurance/loop-registry.json'),
    read('platform/system-map/canonical-system-map.mjs'),
    read('.agents/skills/powerhouse-company-intelligence-os/SKILL.md'),
    read('brain/learning/2026-10-07-source-universe-environment-radar-v1.json')
  ]);
  assert.match(loops,/"loop_key": "environment-radar"/);
  assert.match(map,/source-universe-environment-radar-v1/);
  assert.match(map,/tenantExposureNeverSynthesized:true/);
  assert.match(map,/monetaryImpactNeverSynthesized:true/);
  assert.match(skill,/Source Universe & Environment Radar inheritance/);
  assert.match(learning,/catalogued_is_not_connected/);
});

test('changed JavaScript parses',()=>{
  for(const path of [
    'netlify/functions/portal-ondernemersdata.mjs',
    'portal-v2/modules/entrepreneur-intelligence.js',
    'portal-v2/page-registry.js',
    'portal-v2/page-shell.js',
    'platform/system-map/canonical-system-map.mjs'
  ]) execFileSync(process.execPath,['--check',path],{stdio:'pipe'});
});
