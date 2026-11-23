import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {publicMarketPayload} from '../supabase/functions/powerhouse-predictive-engine/openai-forecast.mjs';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const implementation=readFileSync(join(root,'supabase/functions/powerhouse-predictive-engine/index.ts'),'utf8');

test('forecast candidate queries filter public news and search demand BEFORE strength limit',()=>{
  const start=implementation.indexOf("const signalColumns=");
  const end=implementation.indexOf("if(!signals?.length)",start);
  assert.ok(start>0 && end>start,'expected public-market selection query');
  const selection=implementation.slice(start,end);
  assert.match(selection,/\.eq\('source_type','external_news'\)[\s\S]*?\.order\('strength',[\s\S]*?\.limit\(24\)/);
  assert.match(selection,/\.eq\('source_type','search_demand'\)[\s\S]*?\.order\('strength',[\s\S]*?\.limit\(16\)/);
  assert.match(selection,/\.eq\('entity_scope','market'\)/);
  assert.doesNotMatch(selection,/\.limit\(80\)/,'unfiltered top-80 must not crowd out market signals');
  assert.match(selection,/if\(newsSelection\.error\)throw newsSelection\.error;/);
  assert.match(selection,/if\(demandSelection\.error\)throw demandSelection\.error;/);
});

test('public payload retains both valid signal types and drops stronger private relationship rows',()=>{
  const common={entity_scope:'market',direction:'rising',strength:0.5,novelty:0.8,topic_key:'test',lead_time_days:30,evidence:{title:'Public signal'}};
  const news={...common,signal_key:'external:'+'a'.repeat(64),source_type:'external_news'};
  const demand={...common,signal_key:'search:'+'b'.repeat(64),source_type:'search_demand',evidence:{keyword:'market demand',search_volume:100}};
  const privateRow={...common,signal_key:'relationship:'+'c'.repeat(64),source_type:'external_relationship_evidence',strength:1};
  const payload=publicMarketPayload({date:'2026-10-30',signals:[privateRow,news,demand]});
  assert.deepEqual(payload.signals.map(s=>s.signal_key),[news.signal_key,demand.signal_key]);
  assert.ok(payload.signals.every(s=>['external_news','search_demand'].includes(s.source_type)));
});
