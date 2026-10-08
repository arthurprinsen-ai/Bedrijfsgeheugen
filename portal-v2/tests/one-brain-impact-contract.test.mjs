import test from 'node:test';
import assert from 'node:assert/strict';
import {allPageIds} from '../page-registry.js';
import {impactForMutation,sourcePageForPath} from '../portal-impact-engine.js';

const mutation=(path,from,to)=>{
  const section=path.split('.')[1];
  return impactForMutation({path,before:{portal:{[section]:from}},after:{portal:{[section]:to}}});
};

test('every registered native Portal V2 page has a traceable mutation source and invalidation path',()=>{
  const pages=allPageIds();
  assert.ok(pages.length>50);
  for(const page of pages){
    const path='portal.'+page+'.setting';
    assert.equal(sourcePageForPath(path),page, 'source: '+page);
    const impact=mutation(path,'before','after');
    assert.equal(impact.changed,true, 'mutation: '+page);
    assert.equal(impact.mappingStatus,'MAPPED', 'mapping: '+page);
    assert.ok(impact.affectedPages.includes(page), 'source must be invalidated: '+page);
    assert.ok(impact.affectedPages.includes('overzicht'), 'overview must be refreshed: '+page);
    assert.ok(impact.affectedPages.every(id=>pages.includes(id)), 'invalid destination: '+page);
  }
});

test('non-calculator changes, deletes and new values require impact assessment',()=>{
  const update=mutation('portal.documenten.fileName','v1','v2');
  assert.equal(update.changed,true);
  assert.ok(update.affectedPages.includes('documenten'));
  const deletion=mutation('portal.instellingen.model', 'provider-a',undefined);
  assert.equal(deletion.changed,true);
  assert.ok(deletion.affectedPages.includes('instellingen'));
  const insert=mutation('portal.koppelingen.connector',undefined,'microsoft-365');
  assert.equal(insert.changed,true);
  assert.ok(insert.affectedPages.includes('csrd-impact'));
  assert.equal(mutation('portal.documenten.fileName','same','same').changed,false);
});

test('AI cloud residency changes invalidate CSRD, security, governance and forecasts for re-evaluation',()=>{
  const impact=mutation('portal.data-ai-passport.residency','eu-central-1','eu-west-1');
  for(const page of ['data-ai-passport','csrd-impact','compliance-governance','trust-center','koppelingen','businesscase','roadmap','powerhouse-control-center']){
    assert.ok(impact.affectedPages.includes(page),page);
  }
  assert.ok(impact.reviewDomains.includes('data-residency'));
  assert.ok(impact.reviewDomains.includes('csrd-esrs'));
  assert.equal(impact.externalExecutionAuthorized,false);
});

test('unknown mutation keys never become silent green and do not claim execution',()=>{
  const impact=mutation('portal.experimentalFutureSection.setting',false,true);
  assert.equal(impact.changed,true);
  assert.equal(impact.mappingStatus,'REVIEW_REQUIRED');
  assert.equal(impact.externalExecutionAuthorized,false);
  assert.ok(impact.affectedPages.includes('wijzigingen'));
  assert.ok(impact.affectedPages.includes('audittrail'));
});

test('existing camelCase paths preserve canonical source mapping',()=>{
  assert.equal(sourcePageForPath('portal.aiScan.technology'),'ai-scan');
  assert.equal(sourcePageForPath('portal.valueFinance.multiple'),'waarde-financiering');
});

test('additions of an empty value and object key reordering do not create false evidence',()=>{
  assert.equal(mutation('portal.documenten.title',undefined,'').changed,true);
  const before={portal:{documenten:{alpha:1,beta:2}}};
  const after={portal:{documenten:{beta:2,alpha:1}}};
  assert.equal(impactForMutation({path:'portal.documenten',before,after}).changed,false);
});
