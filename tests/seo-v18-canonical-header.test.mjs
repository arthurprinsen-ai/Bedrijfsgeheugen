import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

/**
 * De validator moet pagina's vergelijken met de canonieke V18-navigatie
 * (<nav class="bgkop">) en niet meer met de oude V17-header.
 *
 * De vorige assertie toetste op een letterlijk stuk broncode met ontsnapte
 * aanhalingstekens (class=\"bgkop\"). Dat patroon hoorde bij een versie waarin
 * die regel binnen een string stond; in seocontrole.py staan er nu gewone
 * aanhalingstekens. De validator was dus in orde, de test niet. Hij toetst nu
 * de bedoeling.
 */
test('SEO validator vergelijkt pagina\'s met de canonieke V18-navigatie', async () => {
  const source = await readFile('.github/scripts/seocontrole.py', 'utf8');
  const zoekregel = source.split('\n').find(line => line.includes('re.search') && line.includes('bgkop'));
  assert.ok(zoekregel, 'de validator zoekt nergens naar de canonieke bgkop-navigatie');
  assert.match(zoekregel, /<nav[^>]*bgkop/, 'de validator zoekt niet naar het nav-element van de canonieke schil');
  assert.match(zoekregel, /<\\?\/nav>/, 'de validator sluit de navigatie niet af op </nav>');
});

test('de oude V17-header wordt niet meer gebruikt als referentie', async () => {
  const source = await readFile('.github/scripts/seocontrole.py', 'utf8');
  assert.doesNotMatch(source, /re\.search\(\s*r?['"]<header[^'"]*v17-header/, 'de validator valt nog terug op de V17-header');
});
