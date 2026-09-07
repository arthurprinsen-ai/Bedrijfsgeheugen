import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToday } from '../portal/render-today.mjs';

const vm = {
  user:{name:'Arthur Prinsen'}, period:'Mei 2025', company:{},
  healthCards:[
    {id:'health',label:'Bedrijfsgezondheid',value:72,delta:4,trend:[68,72]},
    {id:'knowledge',label:'Kennisborging',value:61,delta:-3,trend:[64,61]},
    {id:'process',label:'Processen',value:69,delta:6,trend:[63,69]},
    {id:'data',label:'Data & systemen',value:74,delta:3,trend:[71,74]},
    {id:'ai',label:'AI-volwassenheid',value:54,delta:5,trend:[49,54]},
  ],
  managementSummary:{sections:[
    {id:'opportunities',label:'Kansen',count:7,items:['Automatiseer offerteproces']},
    {id:'threats',label:'Risico’s',count:5,items:['Kennisafhankelijkheid Finance']},
    {id:'trends',label:'Trends',count:4,items:['AI-adoptie versnelt']},
  ]},
  graph:{nodes:[
    {id:'systems',label:'Systemen',meta:'ERP · CRM'},
    {id:'knowledge',label:'Documenten',meta:'Kennis · beleid'},
    {id:'processes',label:'Processen',meta:'Werkstromen'},
    {id:'people',label:'Mensen',meta:'Eigenaarschap'},
    {id:'data',label:'Dashboards',meta:'KPI · BI'},
  ],edges:[]},
  agents:[{id:'a1',name:'Detectie',status:'verified',evidenceId:'ev-1'}],
  roadmap:[{title:'Kennis Finance borgen',status:'Nu',progress:65}],
  recommendedActions:[{title:'Automatiseer het offerteproces',priority:'Hoog'}],
  monthlyImpact:[{label:'Tijdwinst',value:'+12%',delta:'+4%'}],
  activities:[{type:'Data',title:'CRM gekoppeld',meta:'Vandaag'}],
  integrationStatus:{total:5,healthy:4,attention:1,disconnected:0},
  quickLinks:[{label:'Koppelingen',route:'admin/integrations'}]
};

test('Vandaag volgt het goedgekeurde klantenportaal-design', () => {
  const html = renderToday(vm);
  for (const required of [
    'Welkom terug, Arthur',
    'Grip op je bedrijf. Ruimte om te groeien.',
    'Bedrijfsgezondheid','Kennisborging','Processen','Data &amp; systemen','AI-volwassenheid',
    'Het brein van je bedrijf','1. Bronnen','2. Het bedrijfsgeheugen','AI Brain','Datahub','Powerhouse','3. Klantenportaal',
    'AI Management Summary','Aanbevelingen','Snelle links','Roadmap &amp; voortgang','Kansen &amp; bedreigingen','Impact overzicht','Recente activiteiten'
  ]) assert.ok(html.includes(required), `ontbreekt in dashboard: ${required}`);
});

test('dashboard markeert flow niet actief zonder bewijsbare runtime', () => {
  const html = renderToday({...vm, agents:[]});
  assert.match(html,/data-flow-active="false"/);
  assert.doesNotMatch(html,/data-flow-active="true"/);
});

test('dashboard activeert runtime-flow alleen met verified evidence', () => {
  const html = renderToday(vm);
  assert.match(html,/data-flow-active="true"/);
  assert.ok(html.includes('ev-1'));
});
