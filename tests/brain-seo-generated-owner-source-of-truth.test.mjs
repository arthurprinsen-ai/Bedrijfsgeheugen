import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('tools/zoekwoorden.mjs','utf8');
const views=fs.readFileSync('tools/v18-views-lijst.mjs','utf8');

const expected={
  '/blog/':'digitalisering mkb kennisbank',
  '/investeerders-ma':'bedrijfskennis bij overname',
  '/product':'bedrijfsgeheugen platform',
  '/systemen-koppelen':'systemen koppelen mkb'
};

for(const [route,keyword] of Object.entries(expected)){
  test(`generated SEO owner ${route} matches canonical registry`,()=>{
    assert.ok(source.includes(`"${route}": "${keyword}"`),`${route} keyword drift`);
  });
}

test('V18 generated product and integrations do not carry conflicting keyword ownership',()=>{
  assert.match(views,/zoekwoord: 'bedrijfsgeheugen platform'/);
  assert.match(views,/zoekwoord: 'systemen koppelen mkb'/);
  assert.doesNotMatch(views,/zoekwoord: 'kennisborging mkb'/);
  assert.doesNotMatch(views,/zoekwoord: 'systemen koppelen' \}/);
});
