import test from 'node:test';
import assert from 'node:assert/strict';
import { pageVisual } from '../page-visuals.js';

const maturity={sturing:2,commercie:2,operatie:2,finance:2,mensen:2,analytics:3,quality:2,governance:2,tech:2,culture:2,service:2,security:2,duurzaam:2};
const state={portal:{
  profile:{employees:24,hourlyCost:52,maturity},
  dataAi:{phase:'Pilot',maturity:2,changeReadiness:2,governance:2},
  research:{hypotheses:[{hypothesis:'H',evidence:'E',source:'S'}]},
  compliance:{esg:[1,2,3,2,1,2,3,2,1,2,3],policies:['vastgesteld']},
  strategy:{findings:[{finding:'Proces verbeteren',model:'SIPOC',duration:4,value:12000}]},
  roadmap:{items:[{title:'A',start:1,duration:2}]},
  execution:{completed:{finance:[true,false,false,false,false]}}
}};

test('data-ai restores all protected legacy visual concepts',()=>{
  const html=pageVisual('data-ai',state);
  for(const marker of ['Data en AI per onderdeel','Fasen van invoering','Verandercurve','Kosten en opbrengsten','CMMI-trap','Greiner'])assert.ok(html.includes(marker),marker);
});

test('research restores four-quadrant and cost-of-doing-nothing visuals',()=>{
  const html=pageVisual('onderzoek',state);
  assert.ok(html.includes('Onderdelen in vier vakken'));
  assert.ok(html.includes('Kosten van niets doen'));
});

test('compliance and strategy pages expose their legacy visual surfaces',()=>{
  const compliance=pageVisual('compliance-governance',state);
  for(const marker of ['Staat van de techniek','Governance-volwassenheid','CSRD-gereedheid'])assert.ok(compliance.includes(marker),marker);
  const strategy=pageVisual('strategie-naar-maandagochtend',state);
  assert.ok(strategy.includes('Alle modellen in één beeld'));
  assert.ok(strategy.includes('Per functie'));
});

test('execution ladder keeps planning and delivered-value visual concepts',()=>{
  const html=pageVisual('uitvoeringsladder',state);
  assert.ok(html.includes('Planning van de uitvoeringsladder'));
  assert.ok(html.includes('Opgeleverde waarde'));
});
