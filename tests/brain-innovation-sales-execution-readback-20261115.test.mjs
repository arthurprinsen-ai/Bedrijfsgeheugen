import test from 'node:test';
import assert from 'node:assert/strict';
import {readOriginalSalesExecutionAudit,projectPowerhouseIntegrationReadback}
  from '../platform/portal/powerhouse-existing-integration-read-model.mjs';
import {powerhouseIntegrationMarkup} from '../portal-v2/control-plane-cockpit.js';

const uuid=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const at='2026-11-15T12:00:00Z';
const originalExecutionAt='2026-11-15T09:59:00Z';
const events=n=>Array.from({length:n},(_,i)=>{
  const action=uuid(i+1);
  return {event_id:uuid(i+10000),entity_id:action,
    occurred_at:'2026-11-15T10:00:00Z',
    evidence_ref:'powerhouse_sales_actions:'+action+':execution',
    payload:{status:'done',executed_at:originalExecutionAt,
      truth_class:'observed_action_state',
      writer_component:'public.powerhouse_advance_sales_action_v1',
      writer_contract_version:'v1'}};
});
const options={baseUrl:'https://example.supabase.co',key:'server-secret',at};

test('164 immutable historical executions remain source-proven when one action is later requeued to waiting',async()=>{
  const sample=events(164);const calls=[];
  const result=await readOriginalSalesExecutionAudit({...options,
    fetchImpl:async(url,opts)=>{
      assert.equal(opts.method,undefined);
      assert.equal(opts.headers.authorization,'Bearer server-secret');
      const u=new URL(url),p=u.searchParams;
      calls.push({table:u.pathname,offset:p.get('offset')});
      if(u.pathname.endsWith('/powerhouse_cycle_events')){
        assert.equal(opts.headers.prefer,'count=exact');
        assert.equal(p.get('order'),'occurred_at.desc,event_id.desc');
        assert.equal(p.getAll('occurred_at').length,2);
        const offset=Number(p.get('offset'));
        assert.ok([0,100].includes(offset));
        const slice=sample.slice(offset,offset+100);
        return {ok:true,headers:{get:()=>offset+'-'+(offset+slice.length-1)+'/164'},
          json:async()=>slice};
      }
      assert.ok(u.pathname.endsWith('/powerhouse_sales_actions'));
      const ids=p.get('action_id').slice(4,-1).split(',');
      return {ok:true,json:async()=>ids.map(action_id=>({
        action_id,status:action_id===uuid(42)?'waiting':'done',
        executed_at:originalExecutionAt
      }))};
    }
  });
  assert.equal(result.state,'HISTORICAL_WRITER_ACTION_JOINED_PROVIDER_UNVERIFIED');
  assert.equal(result.totalEvents7d,164);
  assert.equal(result.sampledEvents,164);
  assert.equal(result.actionBackedSample,164);
  assert.equal(result.unsupportedSample,0);
  assert.equal(result.currentActionNotDoneSample,1);
  assert.equal(result.missingActionSample,0);
  assert.equal(result.scope,'FULL_LAST_7D');
  assert.equal(result.externalProviderProof,false);
  assert.equal(result.paidOutcomeProof,false);
  assert.equal(result.readOnly,true);
  assert.equal(calls.filter(c=>c.table.endsWith('/powerhouse_cycle_events')).length,2);
  assert.equal(calls.filter(c=>c.table.endsWith('/powerhouse_sales_actions')).length,2);
  assert.doesNotMatch(JSON.stringify(result),/server-secret|00000000-0000-4000-8000/);
});

test('missing original action stays unsupported even if immutable event claims done',async()=>{
  const sample=events(2),calls=[];
  const result=await readOriginalSalesExecutionAudit({...options,
    fetchImpl:async(url)=>{
      calls.push(url);
      const u=new URL(url);
      if(u.pathname.endsWith('/powerhouse_cycle_events'))
        return {ok:true,headers:{get:()=> '0-1/2'},json:async()=>sample};
      return {ok:true,json:async()=>[
        {action_id:uuid(1),status:'done',executed_at:originalExecutionAt}
      ]};
    }
  });
  assert.equal(calls.length,2);
  assert.equal(result.totalEvents7d,2);
  assert.equal(result.actionBackedSample,1);
  assert.equal(result.unsupportedSample,1);
  assert.equal(result.missingActionSample,1);
  assert.equal(result.currentActionNotDoneSample,0);
  assert.equal(result.state,'SOURCE_EXECUTION_GAP');
  assert.ok(projectPowerhouseIntegrationReadback({salesExecutionAudit:result})
    .gapCodes.includes('SALES_EXECUTION_EVENTS_WITHOUT_CURRENT_ACTION_PROOF'));
});

test('current done does not certify forged historical writer payload, source ref or mismatched executed_at',async()=>{
  for(const failure of ['status','truth','writer','contract','source_ref','timestamp','missing']){
    const sample=events(1);
    if(failure==='status')sample[0].payload.status='waiting';
    if(failure==='truth')sample[0].payload.truth_class='claimed_without_source';
    if(failure==='writer')sample[0].payload.writer_component='unknown';
    if(failure==='contract')sample[0].payload.writer_contract_version='v0';
    if(failure==='source_ref')sample[0].evidence_ref='unrelated';
    if(failure==='timestamp')sample[0].payload.executed_at='2026-11-15T10:59:00Z';
    if(failure==='missing')sample[0].payload=null;
    const actual=await readOriginalSalesExecutionAudit({...options,
      fetchImpl:async url=>new URL(url).pathname.endsWith('/powerhouse_cycle_events')
        ? {ok:true,headers:{get:()=> '0-0/1'},json:async()=>sample}
        : {ok:true,json:async()=>[{action_id:uuid(1),status:'done',
          executed_at:originalExecutionAt}]}
    });
    assert.equal(actual.state,'SOURCE_EXECUTION_GAP',failure);
    assert.equal(actual.unsupportedSample,1,failure);
    assert.equal(actual.actionBackedSample,0,failure);
    assert.equal(actual.currentActionNotDoneSample,0,failure);
  }
  const mismatched=await readOriginalSalesExecutionAudit({...options,
    fetchImpl:async url=>new URL(url).pathname.endsWith('/powerhouse_cycle_events')
      ? {ok:true,headers:{get:()=> '0-0/1'},json:async()=>events(1)}
      : {ok:true,json:async()=>[{action_id:uuid(1),status:'done',
        executed_at:'2026-11-15T09:58:00Z'}]}
  });
  assert.equal(mismatched.unsupportedSample,1);
  assert.equal(mismatched.actionBackedSample,0);
});

test('provider count drift, wrong page range or repeated event ID fails closed',async()=>{
  const sample=events(101);
  for(const failure of ['count','range','duplicate']){
    const audit=await readOriginalSalesExecutionAudit({...options,
      fetchImpl:async(url)=>{
        const u=new URL(url),p=u.searchParams;
        if(!u.pathname.endsWith('/powerhouse_cycle_events'))
          throw new Error('INVALID_UNEXPECTED_ACTIONS_READ');
        const offset=Number(p.get('offset'));
        if(offset===0)return {ok:true,headers:{get:()=> '0-99/101'},
          json:async()=>sample.slice(0,100)};
        const second=failure==='duplicate'?[sample[0]]:[sample[100]];
        return {ok:true,headers:{get:()=>failure==='count'?'100-100/102':
          failure==='range'?'101-101/101':'100-100/101'},json:async()=>second};
      }
    });
    assert.equal(audit.state,'SOURCE_UNAVAILABLE',failure);
    assert.equal(audit.actionBackedSample,null,failure);
  }
});

test('a source count above the safe bounded census cap never becomes green',async()=>{
  const audit=await readOriginalSalesExecutionAudit({...options,
    fetchImpl:async()=>({ok:true,headers:{get:()=> '0-99/501'},
      json:async()=>events(100)})});
  assert.equal(audit.state,'SOURCE_SCOPE_EXCEEDS_SAFE_CAP');
  assert.equal(audit.totalEvents7d,501);
  assert.equal(audit.sampledEvents,null);
  assert.equal(audit.scope,'ABOVE_500_FAIL_CLOSED');
  assert.equal(audit.externalProviderProof,false);
});

test('empty source and incomplete exact provider metadata never invent proof',async()=>{
  const zero=await readOriginalSalesExecutionAudit({...options,
    fetchImpl:async()=>({ok:true,headers:{get:()=> '*/0'},json:async()=>[]})});
  assert.equal(zero.state,'NO_EXECUTION_EVENTS_OBSERVED');
  assert.equal(zero.scope,'FULL_LAST_7D');
  assert.equal(zero.currentActionNotDoneSample,0);
  assert.equal(zero.externalProviderProof,false);
  const unknown=await readOriginalSalesExecutionAudit({...options,
    fetchImpl:async()=>({ok:true,headers:{get:()=> null},
      json:async()=>events(1)})});
  assert.equal(unknown.state,'SOURCE_UNAVAILABLE');
  assert.equal(unknown.totalEvents7d,null);
  assert.equal(unknown.currentActionNotDoneSample,null);
});

test('existing Powerhouse admin cockpit shows historical event and current mutable status separately',()=>{
  const html=powerhouseIntegrationMarkup({salesExecutionAudit:{
    state:'HISTORICAL_WRITER_ACTION_JOINED_PROVIDER_UNVERIFIED',
    totalEvents7d:164,sampledEvents:164,actionBackedSample:164,
    unsupportedSample:0,currentActionNotDoneSample:1,
    scope:'FULL_LAST_7D',externalProviderProof:false
  }});
  assert.match(html,/historisch writer\+actie bevestigd 164/);
  assert.match(html,/historisch niet ondersteund 0/);
  assert.match(html,/actuele actiestatus niet done 1/);
  assert.match(html,/externe provider-uitvoering niet bewezen/);
  assert.match(html,/NIET BEWEZEN/);
});

test('a later execution timestamp is NOT a fake historical gap but MUST flag its missing new event',async()=>{
  const sample=events(1);
  const result=await readOriginalSalesExecutionAudit({...options,
    fetchImpl:async(url)=>{
      const u=new URL(url);
      if(u.pathname.endsWith('/powerhouse_cycle_events'))
        return {ok:true,headers:{get:()=> '0-0/1'},json:async()=>sample};
      return {ok:true,json:async()=>[{action_id:uuid(1),status:'done',
        executed_at:'2026-11-15T10:01:00Z'}]};
    }
  });
  assert.equal(result.state,'CURRENT_EXECUTION_EVENT_MISSING');
  assert.equal(result.actionBackedSample,1,
    'immutable earlier SQL writer record remains valid');
  assert.equal(result.unsupportedSample,0);
  assert.equal(result.currentExecutionWithoutEventSample,1);
  assert.equal(result.externalProviderProof,false);
  const projected=projectPowerhouseIntegrationReadback({salesExecutionAudit:result});
  assert.ok(projected.gapCodes.includes('CURRENT_SALES_ACTION_EXECUTION_NOT_IMMUTABLY_LOGGED'));
  const html=powerhouseIntegrationMarkup(projected);
  assert.match(html,/nieuwste uitvoering zonder onveranderlijk event 1/);
  assert.match(html,/NIET BEWEZEN/);
});

test('a distinct new attempt event in the SAME original source closes only the missing immutable writer gap',async()=>{
  const sample=events(2);
  sample[1].entity_id=sample[0].entity_id;
  sample[1].evidence_ref=sample[0].evidence_ref;
  sample[1].payload.executed_at='2026-11-15T10:01:00Z';
  sample[1].occurred_at='2026-11-15T10:02:00Z';
  const result=await readOriginalSalesExecutionAudit({...options,
    fetchImpl:async(url)=>{
      const u=new URL(url);
      if(u.pathname.endsWith('/powerhouse_cycle_events'))
        return {ok:true,headers:{get:()=> '0-1/2'},json:async()=>sample};
      return {ok:true,json:async()=>[{action_id:uuid(1),status:'done',
        executed_at:'2026-11-15T10:01:00Z'}]};
    }
  });
  assert.equal(result.state,'HISTORICAL_WRITER_ACTION_JOINED_PROVIDER_UNVERIFIED');
  assert.equal(result.totalEvents7d,2);
  assert.equal(result.sampledEvents,2);
  assert.equal(result.actionBackedSample,2);
  assert.equal(result.unsupportedSample,0);
  assert.equal(result.currentExecutionWithoutEventSample,0);
  assert.equal(result.externalProviderProof,false);
  assert.equal(result.paidOutcomeProof,false);
});

test('an earlier current action timestamp cannot rewrite an immutable later event',async()=>{
  const sample=events(1);
  sample[0].payload.executed_at='2026-11-15T09:59:55Z';
  const result=await readOriginalSalesExecutionAudit({...options,
    fetchImpl:async(url)=>new URL(url).pathname.endsWith('/powerhouse_cycle_events')
      ? {ok:true,headers:{get:()=> '0-0/1'},json:async()=>sample}
      : {ok:true,json:async()=>[{action_id:uuid(1),status:'done',
        executed_at:'2026-11-15T09:58:00Z'}]}
  });
  assert.equal(result.state,'SOURCE_EXECUTION_GAP');
  assert.equal(result.unsupportedSample,1);
  assert.equal(result.actionBackedSample,0);
});
