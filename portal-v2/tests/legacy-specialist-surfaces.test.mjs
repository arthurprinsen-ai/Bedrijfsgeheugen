import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('specialist Portal V2 renderers preserve legacy user-facing surfaces',async()=>{
  const [company,profile,dna,native]=await Promise.all([
    readFile(new URL('../modules/full-company-input.js',import.meta.url),'utf8'),
    readFile(new URL('../modules/company-input.js',import.meta.url),'utf8'),
    readFile(new URL('../strategy-dna.js',import.meta.url),'utf8'),
    readFile(new URL('../native-pages.js',import.meta.url),'utf8')
  ]);
  for(const marker of ['Je gegevens invullen','Bedrijfscijfers','Balans en financiering','Mensen','Productiviteit en operatie','Klanten','Metingen toevoegen','Beleid en documenten','Duurzaamheid en CSRD','Wat hieruit blijkt','Wat je hebt ingevuld'])assert.ok(company.includes(marker),marker);
  for(const marker of ['Je onderdelen — schuif om bij te werken','Profiel tegenover de bovenste 25%','Alles in één beeld','Wat een niveau erbij oplevert'])assert.ok(profile.includes(marker),marker);
  for(const marker of ['Van strategie naar maandagochtend','Hoe dit in elkaar zit','Hoe je dit gebruikt','Wat het raakt','Wat verandert er per afdeling?','Volwassenheid per capability','De veranderagenda','De verbanden — stel er een vraag over','De thermometer','Je eigen bouwstenen'])assert.ok(dna.includes(marker),marker);
  for(const marker of ['De Uitvoeringsladder','De planning','Wat het tot nu toe heeft opgeleverd','Wat Bedrijfsgeheugen hierin doet'])assert.ok(native.includes(marker),marker);
});
