import test from 'node:test';
import assert from 'node:assert/strict';
import {readOriginalSalesExecutionAudit,projectPowerhouseIntegrationReadback}
  from '../platform/portal/powerhouse-existing-integration-read-model.mjs';

const uuid=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const at='2026-11-15T12:00:00Z';
const events=n=>Array.from({length:n},(_,i)=>({
  event_id:uuid(i+10000),entity_id:uuid(i+1),
  occurred_at:'2026-11-15T10:00:00Z'
}));
const options={baseUrl:'https://example.supabase.co',key:'server-secret',at};

test('full 164-event native 7d census resolves all pages and original done actions, not only latest 100',async()=>{
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
        const offset=Number(p.get('offset'));
        assert.ok([0,100].includes(offset));
        const slice=sample.slice(offset,offset+100);
        return {ok:true,headers:{get:()=>offset+'-'+(offset+slice.length-1)+'/164'},
          json:async()=>slice};
      }
      assert.ok(u.pathname.endsWith('/powerhouse_sales_actions'));
      const ids=p.get('action_id').slice(4,-1).split(',');
      return {ok:true,json:async()=>ids.map(action_id=>({
        action_id,status:'done',executed_at:'2026-11-15T09:59:00Z'
      }))};
    }
  });
  assert.equal(result.state,'ACTION_RECORDS_MATCH_IN_SAMPLE_PROVIDER_UNVERIFIED');
  assert.equal(result.totalEvents7d,164);
  assert.equal(result.sampledEvents,164);
  assert.equal(result.actionBackedSample,164);
  assert.equal(result.unsupportedSample,0);
  assert.equal(result.missingActionSample,0);
  assert.equal(result.scope,'FULL_LAST_7D');
  assert.equal(result.externalProviderProof,false);
  assert.equal(result.paidOutcomeProof,false);
  assert.equal(result.readOnly,true);
  assert.equal(calls.filter(c=>c.table.endsWith('/powerhouse_cycle_events')).length,2);
  assert.equal(calls.filter(c=>c.table.endsWith('/powerhouse_sales_actions')).length,2);
  assert.doesNotMatch(JSON.stringify(result),/server-secret|00000000-0000-4000-8000/);
});

test('source-joined audit records unsupported events and missing original action identity',async()=>{
  const sample=events(2),calls=[];
  const result=await readOriginalSalesExecutionAudit({...options,
    fetchImpl:async(url,opts)=>{
      calls.push(url);
      const u=new URL(url);
      if(u.pathname.endsWith('/powerhouse_cycle_events'))
        return {ok:true,headers:{get:()=> '0-1/2'},json:async()=>sample};
      return {ok:true,json:async()=>[
        {action_id:uuid(1),status:'done',executed_at:'2026-11-15T09:59:00Z'}
      ]};
    }
  });
  assert.equal(calls.length,2);
  assert.equal(result.totalEvents7d,2);
  assert.equal(result.actionBackedSample,1);
  assert.equal(result.unsupportedSample,1);
  assert.equal(result.missingActionSample,1);
  assert.equal(result.state,'SOURCE_EXECUTION_GAP');
  assert.equal(result.scope,'FULL_LAST_7D');
  assert.ok(projectPowerhouseIntegrationReadback({salesExecutionAudit:result})
    .gapCodes.includes('SALES_EXECUTION_EVENTS_WITHOUT_CURRENT_ACTION_PROOF'));
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
  assert.equal(zero.externalProviderProof,false);
  const unknown=await readOriginalSalesExecutionAudit({...options,
    fetchImpl:async()=>({ok:true,headers:{get:()=> null},
      json:async()=>events(1)})});
  assert.equal(unknown.state,'SOURCE_UNAVAILABLE');
  assert.equal(unknown.totalEvents7d,null);
});
