import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {composerSourcePreflight,relationshipFact} from '../supabase/functions/_shared/composer-quality-provenance.mjs';
const plan={human_readable_context:true,source_trigger_relevance:false};
const base={source_url:'https://www.linkedin.com/in/x',evidence:{}};
test('the real 30 Oct gap (profile URL only) is still held',()=>{
 const r=composerSourcePreflight(base,plan);
 assert.equal(r.ok,false);
 assert.ok(r.missing.includes('relationship_fact_min_two'));
});
test('27 Oct decision: two verifiable relationship facts pass',()=>{
 const a={...base,evidence:{relationship_evidence:{role:'Eigenaar',company_name:'Van Dijk Installatie',status:'in_gesprek'}}};
 const r=composerSourcePreflight(a,plan);
 assert.equal(r.ok,true);assert.equal(r.via,'relationship_fact');
 const b={...base,evidence:{relationship_evidence:{company_name:'Van Dijk Installatie',prior_conversation:'Gesproken over offerte-administratie op de beurs in maart.'}}};
 assert.equal(composerSourcePreflight(b,plan).ok,true);
});
test('one fact, empty values or unknown status never pass',()=>{
 for(const rel of [{company_name:'Van Dijk'},{role:'',company_name:'',status:'in_gesprek'},{role:'Eigenaar',status:'lead'},null]){
  assert.equal(composerSourcePreflight({...base,evidence:{relationship_evidence:rel}},plan).ok,false);
 }
});
test('human readable context stays mandatory and the news path is unchanged',()=>{
 const rel={relationship_evidence:{role:'Eigenaar',company_name:'Van Dijk',status:'in_gesprek'}};
 assert.deepEqual(composerSourcePreflight({...base,evidence:rel},{human_readable_context:false}).missing,['human_readable_context']);
 const news={source_url:'https://nu.nl/a',evidence:{headline:'Bedrijf kondigt overname aan van concurrent in regio'}};
 const r=composerSourcePreflight(news,{human_readable_context:true,source_trigger_relevance:true});
 assert.equal(r.ok,true);assert.equal(r.via,'news');
 assert.equal(relationshipFact({}).ok,false);
});
test('composer feeds the relationship fact to the anchor check and keeps all other gates',()=>{
 const src=readFileSync('supabase/functions/powerhouse-commercial-message-composer/index.ts','utf8');
 assert.match(src,/relationship_fact:relationshipFact\(action\)\.text/);
 for(const gate of ['banned','factsOk','oneQuestion','lengthOk','topicLeak'])assert.ok(src.includes(gate));
});
