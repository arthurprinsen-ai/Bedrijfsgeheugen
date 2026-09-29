import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const publisher=fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');

test('LinkedIn company participates in historical story fingerprint dedupe',()=>{
  assert.match(publisher,/\['linkedin_personal','linkedin_company'\]\.includes\(clean\(row\?\.channel\)\)/);
  assert.match(publisher,/canonicalPublicationStorySource\(art\?\.body\)/);
  assert.match(publisher,/powerhouse_story_fingerprint_v1/);
});

test('dynamic campaign URLs hashtags and date markers cannot evade company dedupe',()=>{
  assert.match(publisher,/replace\(\/https\?:\\\/\\\/\\S\+\/gi,' '\)/);
  assert.match(publisher,/replace\(\/#[^\n]+\/gu,' '\)/);
  assert.match(publisher,/linkedin_company'\?canonicalPublicationStorySource\(art\.body\):clean\(art\.body\)/);
  assert.match(publisher,/powerhouse_reserve_unique_publication_v1/);
});
