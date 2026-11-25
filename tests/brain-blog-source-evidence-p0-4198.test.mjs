import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ex=read('supabase/functions/powerhouse-blog-export/index.ts');
const py=read('tools/site-shell/publish_powerhouse_blog_artifact.py');
const wf=read('.github/workflows/powerhouse-daily-blog.yml');
test('source lineage survives legacy JSON-string-wrapped generation evidence',()=>{
 assert.match(ex,/function evidenceObject\(value:any\)/);
 assert.match(ex,/const generation=evidenceObject\(a.generation_evidence\)/);
 assert.match(ex,/generation.recommendation_id/);
 assert.match(ex,/source_url/);
 assert.match(ex,/source_title/);
 assert.match(ex,/\.eq\('target_channel','blog'\)/);
 assert.match(ex,/SOURCE_PROVENANCE_READ_FAILED/);
 assert.match(ex,/sources,/);
});
test('html publishes real external citation with visible source attribution',()=>{
 assert.match(py,/data-bg-evidence="publieke-bron"/);
 assert.match(py,/Bronnen en actualiteit/);
 assert.match(py,/source\["url"\]/);
 assert.match(py,/html\.escape\(str\(source\["url"\]\), quote=True\)/);
 assert.match(py,/startswith\("https:\/\/"\)/);
});
test('existing blog workflow cleans only temporary failed build state before exact same PR checkout',()=>{
 assert.match(wf,/git reset --hard HEAD/);
 assert.match(wf,/git clean -fd/);
 assert.match(wf,/git fetch origin "\$branch"/);
 assert.match(wf,/gh pr list --head "\$branch" --base main --state open/);
});
