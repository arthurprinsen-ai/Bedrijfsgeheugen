import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePortalProject} from '../portal-next/portal-project-model.js';
import {portalPageUrl} from '../portal-next/portal-navigation-complete.js';

const counts={parts:9,sprints:14,stories:21,documents:15,integrations:14,planning:4,customerNeeds:6};
const parts=Array.from({length:counts.parts},(_,i)=>({
  id:`part-${i+1}`,titel:`Onderdeel ${i+1}`,prijs:1000+i,weken:1,
  sprints:Array.from({length:i<5?2:1},(_,j)=>({titel:`Sprint ${i+1}.${j+1}`,wat:'Werk',op:'Oplevering'})),
  stories:Array.from({length:i<3?3:2},(_,j)=>['rol',`behoefte ${i+1}.${j+1}`,'resultaat']),
  documenten:Array.from({length:i<6?2:1},(_,j)=>({naam:`Document ${i+1}.${j+1}`,week:i+1})),
  koppelingen:Array.from({length:i<5?2:1},(_,j)=>({naam:`Koppeling ${i+1}.${j+1}`,wat:'Doel',week:i+1}))
}));
const quote={nummer:'OF-IJS-001',titel:'Analytics en een Power BI-dashboard waar vier rollen mee sturen',status:'verstuurd',bedrag:20000,geldig_tot:'2026-09-17',inhoud:{onderdelen:parts,planning:Array.from({length:4},(_,i)=>[`Fase ${i+1}`,`Week ${i+1}`]),licenties:{status:'offerte'},vanUNodig:Array.from({length:6},(_,i)=>`Input ${i+1}`),architectuur:{type:'Power BI'},doorlopend:{type:'abonnement'}}};

test('native model behoudt actuele IJsselmonde offerte-parity',()=>{
  const project=normalizePortalProject({customer:{name:'IJsselmonde'},quote});
  assert.equal(project.quote.number,'OF-IJS-001');
  assert.equal(project.quote.amount,20000);
  assert.equal(project.parts.length,counts.parts);
  assert.equal(project.sprints.length,counts.sprints);
  assert.equal(project.stories.length,counts.stories);
  assert.equal(project.documents.length,counts.documents);
  assert.equal(project.integrations.length,counts.integrations);
  assert.equal(project.planning.length,counts.planning);
  assert.equal(project.customerNeeds.length,counts.customerNeeds);
  assert.deepEqual(project.licenses,{status:'offerte'});
  assert.deepEqual(project.architecture,{type:'Power BI'});
  assert.deepEqual(project.subscription,{type:'abonnement'});
});

test('alle project deep links behouden klantcontext',()=>{
  for(const page of ['offerte','roadmap','documenten','koppelingen','taken-werkstromen']){
    const url=portalPageUrl(page,'?klant=ijsselmonde');
    assert.match(url,/klant=ijsselmonde/);
    assert.match(url,new RegExp(`page=${page}`));
    assert.doesNotMatch(url,/klantportaal/);
  }
});
