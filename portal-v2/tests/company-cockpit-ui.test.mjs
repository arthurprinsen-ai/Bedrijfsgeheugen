import test from 'node:test';
import assert from 'node:assert/strict';
import {renderCompanyCockpitHtml,createDecisionCommandClient,sanitizePortalEvent} from '../company-cockpit-ui.js';

const runtime={
 decisions:{items:[{id:'d1',title:'Automatiseer facturen',portfolioBucket:'NOW',rank:1,status:'PROPOSED',owner:'Finance',confidence:.84,expectedValue:30000,investment:5000,realizedValue:4000,currency:'EUR',nextAction:'Goedkeuren',evidenceIds:['e1']}]},
 approvals:{items:[{decisionId:'d1',approval:{state:'PENDING'}}]},
 economics:{expectedValue:30000,actualCost:1000,realizedValue:4000,realizedProfit:3000,currency:'EUR'},
 timeline:{items:[{id:'a1',actor:'user:piet',owner:'Finance',status:'IN_PROGRESS',occurredAt:'2026-09-11T07:30:00Z'}]},
 portfolio:{NOW:[{id:'d1'}],NEXT:[],LATER:[],DO_NOT_DO:[]}
};

test('visible cockpit HTML shows priority approval economics actor and command controls',()=>{
 const html=renderCompanyCockpitHtml(runtime);
 assert.match(html,/Wat moet eerst/);
 assert.match(html,/Automatiseer facturen/);
 assert.match(html,/Goedkeuren/);
 assert.match(html,/Afwijzen/);
 assert.match(html,/Verwachte waarde/);
 assert.match(html,/Gerealiseerde winst/);
 assert.match(html,/user:piet/);
 assert.match(html,/data-decision-id="d1"/);
});

test('command client posts idempotent command and refreshes projection after success',async()=>{
 const calls=[];
 const client=createDecisionCommandClient({fetchImpl:async(url,options)=>{
  calls.push([url,options]);
  if(url==='/api/company-decision') return new Response(JSON.stringify({ok:true}),{status:201,headers:{'content-type':'application/json'}});
  if(url==='/api/brain-operating-loop') return new Response(JSON.stringify({companyDecisions:[]}),{status:200,headers:{'content-type':'application/json'}});
 }});
 const result=await client.command({command:'APPROVE',decisionId:'d1',expectedStatus:'PROPOSED'});
 assert.equal(calls[0][0],'/api/company-decision');
 const body=JSON.parse(calls[0][1].body);
 assert.equal(body.command,'APPROVE');
 assert.equal(body.decisionId,'d1');
 assert.ok(body.idempotencyKey);
 assert.equal(calls[1][0],'/api/brain-operating-loop');
 assert.deepEqual(result.projection,{companyDecisions:[]});
});

test('portal event sanitizer keeps only bounded correlation metadata and drops PII/form values',()=>{
 const event=sanitizePortalEvent({event:'approve',decisionId:'d1',actionId:'a1',page:'overzicht',email:'secret@example.com',name:'Arthur',formValue:'top secret',freeText:'should drop'});
 assert.deepEqual(event,{event:'approve',decisionId:'d1',actionId:'a1',page:'overzicht'});
});
