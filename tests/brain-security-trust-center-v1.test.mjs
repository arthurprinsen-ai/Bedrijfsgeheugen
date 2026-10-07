import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const read=p=>readFile(p,'utf8');

test('security trust center is first-class and uses full href URLs',async()=>{
 const html=await read('portal-next/security.html');
 assert.match(html,/Security Trust Center/);
 assert.match(html,/https:\/\/www\.bedrijfsgeheugen\.nl\/portal-next\/security-trust-center\.css/);
 assert.match(html,/https:\/\/www\.bedrijfsgeheugen\.nl\/portal-next\/security-trust-center\.js/);
 assert.doesNotMatch(html,/href="\//);
});

test('trust UI answers customer questions and prevents false certification claims',async()=>{
 const js=await read('portal-next/security-trust-center.js');
 for(const phrase of ['Waar staat mijn data?','Wie kan erbij?','AI-training?','Buiten Europa?','Wat staat open?','Welke normen?'])assert.match(js,new RegExp(phrase.replace(/[?]/g,'\\?')));
 assert.match(js,/Provider assurance ≠ eigen certificering/);
 assert.match(js,/Onbekend of verlopen bewijs wordt niet groen/);
});

test('runtime reuses sovereignty heartbeat and expires management evidence',async()=>{
 const sql=await read('supabase/migrations/20261007155500_data_ai_security_trust_center_v1.sql');
 assert.match(sql,/security_database_posture_v1/);
 assert.match(sql,/security_management_observation_v1/);
 assert.match(sql,/expires_at/);
 assert.match(sql,/refresh_security_trust_snapshot_v1/);
 assert.match(sql,/powerhouse_refresh_data_sovereignty_v1/);
 assert.match(sql,/providerAssuranceIsOwnCertification',false/);
});

test('authenticated EU gateway exposes security read and observer paths',async()=>{
 const [edge,fn]=await Promise.all([read('supabase/functions/portal-state-eu/index.ts'),read('netlify/functions/security-trust.mjs')]);
 assert.match(edge,/security_trust_get/);
 assert.match(edge,/security_trust_observe/);
 assert.match(fn,/resolveIdentityTenant/);
 assert.match(fn,/\/api\/security-trust/);
});

test('existing trust and company surfaces link to security center',async()=>{
 const [compliance,company]=await Promise.all([read('portal-next/compliance.html'),read('portal/render-company.mjs')]);
 assert.match(compliance,/https:\/\/www\.bedrijfsgeheugen\.nl\/portal-next\/security\.html/);
 assert.match(company,/Security Trust Center/);
});

test('Powerhouse system map and learning register capability',async()=>{
 const [map,learning,skill]=await Promise.all([read('platform/system-map/canonical-system-map.mjs'),read('brain/learning/2026-10-07-data-ai-security-trust-center-v1.json'),read('.agents/skills/powerhouse-security-trust-center/SKILL.md')]);
 assert.match(map,/data-ai-security-trust-center-v1/);
 assert.match(map,/oneHeartbeatAuthority:true/);
 assert.match(learning,/provider_assurance/);
 assert.match(skill,/Unknown is a valid result/);
});


test('security trust client JavaScript parses under Node',()=>{
 for(const path of ['portal-next/security-trust-center.js','netlify/functions/security-trust.mjs','netlify/functions/_security-trust-client.mjs']){
  execFileSync(process.execPath,['--check',path],{stdio:'pipe'});
 }
});


test('customer snapshot does not project raw management evidence',async()=>{
 const sql=await read('supabase/migrations/20261007155500_data_ai_security_trust_center_v1.sql');
 assert.match(sql,/evidence_available/);
 assert.doesNotMatch(sql,/status end status,evidence,source,observed_at/);
});


test('framework registry has official source evidence and complete cyber scope',async()=>{
 const [sql,js]=await Promise.all([read('supabase/migrations/20261007155500_data_ai_security_trust_center_v1.sql'),read('portal-next/security-trust-center.js')]);
 const markers=["('NIS','NIS (legacy)'","('NIS2_CBW','NIS2 / Cyberbeveiligingswet'","('CRA','Cyber Resilience Act'",'https://www.iso.org/standard/27001','https://www.iso.org/standard/27017','https://www.iso.org/standard/27018','https://www.iso.org/standard/75106.html','https://www.iso.org/standard/42001'];
 for(const marker of markers) assert.ok(sql.includes(marker),marker);
 assert.match(js,/Officiële bron ↗/);
 assert.match(js,/f\.evidenceUrls/);
});


test('management-plane metadata is visible without raw evidence',async()=>{
 const js=await read('portal-next/security-trust-center.js');
 assert.match(js,/management-plane evidence/);
 assert.match(js,/managementObservations/);
 assert.match(js,/evidence_available/);
 assert.match(js,/ruwe management-evidence blijft server-only/);
});


test('canonical internal trust scope is admin-only for both security and sovereignty APIs',async()=>{
 const [security,sovereignty]=await Promise.all([read('netlify/functions/security-trust.mjs'),read('netlify/functions/data-sovereignty.mjs')]);
 for(const source of [security,sovereignty]){
  assert.match(source,/isPowerhouseAdmin/);
  assert.match(source,/POWERHOUSE_ADMIN_EMAILS/);
  assert.match(source,/POWERHOUSE_ADMIN_REQUIRED/);
  assert.match(source,/wantsCanonical/);
 }
});


test('connector mutations refresh sovereignty and security in the same database transaction',async()=>{
 const sql=await read('supabase/migrations/20261007155500_data_ai_security_trust_center_v1.sql');
 assert.match(sql,/refresh_trust_after_connector_change_v1/);
 assert.match(sql,/connector_definitions_trust_refresh_v1/);
 assert.match(sql,/after insert or update or delete on public\.connector_definitions/i);
 assert.match(sql,/perform public\.refresh_data_sovereignty_snapshot_v1\(v_tenant\)/);
 assert.match(sql,/perform public\.refresh_security_trust_snapshot_v1\(v_tenant\)/);
 assert.match(sql,/old\.organisatie_id is distinct from new\.organisatie_id/);
 assert.match(sql,/refresh_data_sovereignty_snapshot_v1\(v_old_tenant\)/);
 assert.match(sql,/refresh_security_trust_snapshot_v1\(v_old_tenant\)/);
});

test('system map makes connector auto-enrolment and single heartbeat explicit',async()=>{
 const map=await read('platform/system-map/canonical-system-map.mjs');
 assert.match(map,/newConnectorsAutoEnrolled:true/);
 assert.match(map,/connectorMutationsRefreshTrustTransactionally:true/);
 assert.match(map,/connectorTenantMovesRefreshOldAndNewTenant:true/);
 assert.match(map,/oneHeartbeatAuthority:true/);
});
