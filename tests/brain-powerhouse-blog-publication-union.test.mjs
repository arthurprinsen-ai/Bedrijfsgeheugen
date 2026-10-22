import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const slug21='cyberdreigingen-een-praktisch-stappenplan-voor-ondernemers-om-signalen';
const slug22='hoe-nederlandse-cyberoefeningen-jouw-bedrijfsbeslissingen-moeten-beinv';
for(const file of ['blog/index.html','blog/rss.xml','sitemap.xml']) {
  test(file+' preserves both dated articles exactly once',()=>{
    const content=readFileSync(file,'utf8');
    for(const slug of [slug21,slug22]) {
      const matches=content.match(new RegExp(slug,'g'))||[];
      const expected=file==='blog/rss.xml'?2:1; // RSS link and GUID.
      assert.equal(matches.length,expected,file+': '+slug);
    }
  });
}
