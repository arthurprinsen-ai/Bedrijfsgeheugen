import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(path,'utf8');
const primaryPages=['index.html','contact.html','zelfscan.html','frisse-blik.html'];

test('primary public navigation no longer contradicts the 12 question free scan',()=>{
 for(const path of primaryPages){
  const html=read(path);
  assert.doesNotMatch(html,/Zeven vragen over waar kennis bij jou weglekt/);
  assert.match(html,/12 vragen over tijd, geld en kennis/);
  assert.doesNotMatch(html,/In 30 minuten zien waar de grootste kansen liggen/);
  assert.match(html,/Onderzoek, businesscase en een concrete aanpak/);
 }
});

test('customer landing pages do not promise universal fixed speed of delivery',()=>{
 for(const path of primaryPages){
  const html=read(path);
  assert.doesNotMatch(html,/In twee weken draaiend/);
  assert.match(html,/Duidelijke afspraken vooraf/);
  assert.match(html,/Klein beginnen, resultaat toetsen/);
 }
 const menu=read('assets/js/menu.js');
 assert.doesNotMatch(menu,/Vaste prijs · In twee weken draaiend/);
 assert.match(menu,/Duidelijke afspraken · Klein beginnen · Resultaat toetsen/);
});

test('free scan is anonymous first and never promises automatic email fulfillment',()=>{
 const scan=read('zelfscan.html');
 const contact=read('contact.html');
 assert.match(scan,/Gratis Bedrijfslek · 12 vragen · 3 minuten/);
 assert.match(scan,/Geen account, geen e-mail en geen gegevens vooraf/);
 assert.doesNotMatch(scan,/Je ontvangt het volledige rapport binnen één werkdag/);
 assert.match(scan,/zonder expliciete aanvraag geen e-mailrapport verstuurd/);
 assert.match(contact,/zonder account of verplicht e-mailadres/);
 assert.doesNotMatch(contact,/Je krijgt het rapport per e-mail/);
});

test('trusted advisor labels show evidence, not a self-assessed trusted status',()=>{
 const advisor=read('portal-v2/trusted-advisor-assurance.js');
 assert.match(advisor,/Bronnen en zekerheid/);
 assert.match(advisor,/Bekijk onderbouwing/);
 assert.match(advisor,/item\?\.healthy===true/);
 assert.doesNotMatch(advisor,/item\?\.healthy!==false/);
 assert.match(advisor,/outcomes\.every\(outcomeVerified\)/);
 assert.doesNotMatch(advisor,/String\(item\?\.status\)\.toLowerCase\(\)==='ok'/);
});
