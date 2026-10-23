import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('supabase/functions/powerhouse-blog-export/index.ts', 'utf8');
const publisher = readFileSync('tools/site-shell/publish_powerhouse_blog_artifact.py', 'utf8');
const definition = source.match(/const slugify=\(s:string\)=>([^;]+);/);
assert.ok(definition, 'use the actual production slugifier expression');
// Evaluate only the checked-in pure expression, not the Deno function or provider data.
const slugify = new Function('s', 'return ' + definition[1]);
const valid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

test('long approved article titles cannot produce a trailing hyphen at the 70-character boundary', () => {
  const title = 'Cyberdreigingen voor ondernemers: een praktisch beslis- en oefenplan om risico’s bestuurlijk te beheersen';
  const slug = slugify(title);
  assert.equal(slug, 'cyberdreigingen-voor-ondernemers-een-praktisch-beslis-en-oefenplan-om');
  assert.ok(slug.length <= 70);
  assert.match(slug, valid);
  assert.doesNotMatch(slug, /-$/);
});

test('slugify remains deterministic, lowercase and accent safe', () => {
  for (const [input, expected] of [
    ['AFAS API', 'afas-api'],
    ['Een échte oplossing', 'een-echte-oplossing'],
    ['  Multi   tenant  ', 'multi-tenant'],
    ['X'.repeat(69) + ' ' + 'tail', 'x'.repeat(69)],
    ['-'.repeat(90), ''],
  ]) assert.equal(slugify(input), expected);
  for (const text of ['Bedrijfsoverdracht aan familie en een gedetailleerde afweging: ' + 'test '.repeat(15), 'API — '+ 'koppeling-'.repeat(18)]) {
    const slug = slugify(text);
    assert.ok(slug.length <= 70 && valid.test(slug));
  }
});

test('explicit invalid SEO slug fails closed and cannot silently fork an approved canonical URL', () => {
  assert.match(source, /const approvedSlug=clean\(generation\.seo_slug\)/);
  assert.match(source, /INVALID_APPROVED_SEO_SLUG/);
  assert.match(source, /return json\(\{ok:false,error:'INVALID_APPROVED_SEO_SLUG',runDate\},409\)/);
  assert.match(source, /const slug=approvedSlug\|\|slugify\(clean\(a\.title\)\)\|\|\('powerhouse-'\+runDate\)/);
});

test('publication lineage, provider side effect, date and tenant guards stay intact', () => {
  assert.match(source, /\.eq\('tenant_id','canonical'\)/);
  assert.match(source, /clean\(o\?\.status\)!=='GENERATED'/);
  assert.match(source, /provider_create_success/);
  assert.match(source, /republish_forbidden/);
  assert.match(source, /BLOG_LINEAGE_MISMATCH_REQUIRES_RECONCILIATION/);
  assert.match(source, /NO_APPROVED_BLOG_ARTIFACT/);
  assert.match(publisher, /INVALID_SLUG/);
  assert.match(publisher, /target\.exists\(\) and not force_regenerate/);
});
