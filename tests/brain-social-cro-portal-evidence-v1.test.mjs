import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectSocialCroFunnel} from '../netlify/functions/_social-cro-funnel-projection.mjs';
import {projectOtherData} from '../netlify/functions/powerhouse-cro-other-data.mjs';
const now='2026-10-30T12:00:00Z';
const make=(channel,days,score,i)=>({
  tenant_id:channel==='linkedin_personal'?'canonical':'bedrijfsgeheugen',
  platform:channel==='instagram'?'instagram':'linkedin',
  channel_kind:channel==='instagram'?'instagram_business':channel,
  post_id:channel+':'+days+':'+i,
  published_at:new Date(Date.parse(now)-days*86400000).toISOString(),
  topic:'case',hook_type:'concrete',format:'text'
});
const obs=(post,score)=>({tenant_id:post.tenant_id,post_id:post.post_id,
  observed_at:new Date(Date.parse(post.published_at)+48*3600000).toISOString(),
  data_quality:'OBSERVED',metrics:{likes:score,comments:score,shares:score,views:score*10}});
test('Existing portal projects exactly three scoped social channels with a provider-only 48h comparison',()=>{
 const posts=['linkedin_personal','linkedin_company','instagram'].flatMap(ch=>[
  ...Array.from({length:5},(_,i)=>make(ch,3+i*.1,8,i)),
  ...Array.from({length:5},(_,i)=>make(ch,10+i*.1,3,i))
 ]);
 const observations=posts.map((p,i)=>obs(p,i%10<5?8:3));
 const data=projectSocialCroFunnel({posts,snapshots:observations,at:now});
 assert.equal(data.channels.length,3);
 assert.equal(data.status,'COMPARABLE_DESCRIPTIVE_METRICS');
 assert.deepEqual(data.channels.map(ch=>ch.metrics.likes.direction),['RISING','RISING','RISING']);
 assert.equal(data.viewerIdentities,'NOT_COLLECTED');
 assert.equal(data.conversionClaim,'UNKNOWN_UNLESS_INDEPENDENTLY_ATTRIBUTED');
});
test('Legacy unlabeled LI, partial provider dates and arbitrary viewer identities cannot influence portal trend',()=>{
 const personal=make('linkedin_personal',3,2,0);
 const unknown={...personal,tenant_id:'bedrijfsgeheugen',channel_kind:null};
 const rows=projectSocialCroFunnel({posts:[personal,unknown],snapshots:[{...obs(personal,9),data_quality:'OBSERVED_PARTIAL_SCOPE'}],at:now});
 assert.equal(rows.observedAlignedWindows,0);
 assert.equal(rows.channels[0].posts_registered,1);
 assert.equal(rows.channels[1].posts_registered,0);
 assert.equal(rows.status,'INSUFFICIENT_48H_EVIDENCE');
});
test('Existing owner-only portal contract remains and missing social evidence never becomes fake green',()=>{
 const no=projectOtherData({readStates:{}});
 assert.equal(no.socialFunnel,null);
 assert.equal(no.sources.socialFunnel.status,'UNAVAILABLE');
 const code=readFileSync('netlify/functions/powerhouse-cro-other-data.mjs','utf8');
 assert.match(code,/isPowerhouseAdmin\(user/);
 assert.match(code,/tenant_id=eq\.canonical/);
 assert.match(code,/tenant_id=eq\.bedrijfsgeheugen/);
 assert.match(code,/projectSocialCroFunnel\(/);
 assert.doesNotMatch(code,/config=\{schedule:/);
 const ui=readFileSync('portal-v2/modules/andere-data.js','utf8');
 assert.match(ui,/Social CRO/);
 assert.match(ui,/socialFunnel/);
});
