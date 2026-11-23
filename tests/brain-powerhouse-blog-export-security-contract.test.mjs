import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('blog exporter denies requests lacking service credentials', () => {
  const code = read('supabase/functions/powerhouse-blog-export/index.ts');
  assert.match(code, /req\.headers\.get\('authorization'\)/);
  assert.match(code, /'EXPORT_AUTH_REQUIRED'\},401/);
  assert.match(code, /'SUPABASE_SERVICE_ROLE_KEY'/);
  assert.ok(code.indexOf('EXPORT_AUTH_REQUIRED') < code.indexOf('createClient(url,key'), 'auth is before database queries');
});

test('blog exporter never treats content_ready as external publication approval', () => {
  const code = read('supabase/functions/powerhouse-blog-export/index.ts');
  assert.match(code, /approved_at,published_at,content_id,slug,canonical_url,evidence/);
  assert.match(code, /!o\?\.approved_at/);
  assert.match(code, /'BLOG_PUBLIC_EXPORT_NOT_APPROVED'/);
  assert.ok(code.indexOf('BLOG_PUBLIC_EXPORT_NOT_APPROVED') < code.indexOf('title:clean(a.title)'), 'approval check precedes full-body response');
});

test('platform JWT verification cannot be disabled by the next Git deployment', () => {
  const conf = read('supabase/config.toml');
  const section = conf.match(/\[functions\.powerhouse-blog-export\]([\s\S]*?)(?=\n\[|$)/)?.[1];
  assert.ok(section);
  assert.match(section, /verify_jwt\s*=\s*true/);
});

test('canonical public PR workflow never stages internal Brain or ledger evidence', () => {
  const workflow = read('.github/workflows/powerhouse-daily-blog.yml');
  assert.doesNotMatch(workflow, /^\s*git add [^\n]*brain\/learning\/powerhouse-blog-\$DATE\.json/m);
  assert.doesNotMatch(workflow, /^\s*git add [^\n]*docs\/development-ledger-events\/powerhouse-blog-\$DATE\.md/m);
  assert.match(workflow, /SUPABASE_SERVICE_ROLE_KEY: \$\{\{ secrets\.SUPABASE_SERVICE_ROLE_KEY \}\}/);
  assert.match(workflow, /Authorization: Bearer \$\{SUPABASE_SERVICE_ROLE_KEY\}/);
  const renderer = read('tools/site-shell/publish_powerhouse_blog_artifact.py');
  assert.match(renderer, /BLOG_EXPORT_SERVICE_AUTH_NOT_CONFIGURED/);
  assert.match(renderer, /headers=\{"Authorization": f"Bearer \{token\}"\}/);
});

test('read-only live exporter matrix cannot run the canonical publishing job', () => {
  const workflow = read('.github/workflows/powerhouse-daily-blog.yml');
  assert.match(workflow, /security_probe_only:/);
  assert.ok(workflow.includes("    if: ${{ github.event_name != 'workflow_dispatch' || inputs.security_probe_only != true }}"), 'probe-only dispatch skips publisher');
  assert.match(workflow, /security_export_probe:/);
  assert.match(workflow, /github.event_name == 'workflow_dispatch' && inputs.security_probe_only == true/);
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /probe "GENERATED_WITHOUT_APPROVAL" "2026-10-28" "403"/);
  assert.match(workflow, /probe "HISTORIC_LIVE_WITHOUT_APPROVAL" "2026-10-22" "403"/);
  assert.match(workflow, /probe "APPROVED_LIVE_PROVEN" "2026-10-25" "200"/);
  assert.match(workflow, /--output \/dev\/null/);
});

test('legacy native daily publisher authenticates canonical duplicate-prevention readback', () => {
  const workflow = read('.github/workflows/daily-blog-publisher.yml');
  assert.ok(workflow.includes("SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}"));
  assert.ok(workflow.includes('NATIVE_BLOG_EXPORT_AUTH_NOT_CONFIGURED'));
  assert.ok(workflow.includes('Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}'));
  assert.ok(!workflow.includes('curl --fail --silent --show-error --max-time 15 "https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-blog-export'));
});

test('dated private blog Brain/change/ledger evidence cannot be added to public source', () => {
  const ignored = read('.gitignore').split(/\r?\n/).map(s => s.trim());
  const patterns = [
    'brain/learning/powerhouse-blog-*.json',
    'docs/changes/powerhouse-blog-*.md',
    'docs/development-ledger-events/powerhouse-blog-*.md'
  ];
  for (const pattern of patterns) assert.ok(ignored.includes(pattern), 'ignore entry required: ' + pattern);
  for (const folder of ['brain/learning', 'docs/changes', 'docs/development-ledger-events']) {
    const files = readdirSync(new URL('../' + folder + '/', import.meta.url));
    const leaked = files.filter(name => /^powerhouse-blog-\d{4}-\d{2}-\d{2}\.(?:json|md)$/.test(name));
    assert.deepEqual(leaked, [], 'private dated blog evidence must never be committed in ' + folder);
  }
});

test('official CPNL deadline inversion cannot enter original blog public delivery',async()=>{
 const {assessOfficialBlogDateTruth} = await import('../supabase/functions/_shared/blog-official-date-truth.mjs');
 const original="Volgens een recente voorspelling opent de Circular Plastics NL-subsidie op 6 oktober 2026 met een totaalbudget van €40 miljoen.";
 const result=assessOfficialBlogDateTruth({title:'Circular Plastics NL subsidie',body:original,runDate:'2026-10-30'});
 assert.equal(result.ok,false);
 assert.equal(result.code,'BLOG_OFFICIAL_SUBSIDY_DEADLINE_INVERTED');
 assert.equal(result.published_approval_allowed,false);
 const past=assessOfficialBlogDateTruth({title:'Circular Plastics NL',body:original,runDate:'2026-09-20'});
 assert.equal(past.ok,true,'do not invent a past tense review from future');
 const trueHistorical=assessOfficialBlogDateTruth({title:'Circular Plastics NL',body:'De regeling opende 21 april 2026 en sloot op 6 oktober 2026.',runDate:'2026-10-30'});
 assert.equal(trueHistorical.ok,true,'historically accurate RVO source statement remains eligible');
 const unrelated=assessOfficialBlogDateTruth({title:'Andere subsidie',body:'Een andere regeling opent op 6 oktober 2026.',runDate:'2026-10-30'});
 assert.equal(unrelated.ok,true,'do not apply CPNL policy to unrelated schemes');
});

test('real blog queue and exporter reject known wrong subsidy facts without changing service auth/approval gates',()=>{
 const queue=read('supabase/functions/powerhouse-blog-queue/index.ts');
 const exporter=read('supabase/functions/powerhouse-blog-export/index.ts');
 const py=read('tools/site-shell/publish_powerhouse_blog_artifact.py');
 assert.match(queue,/assessOfficialBlogDateTruth\(/);
 assert.match(exporter,/assessOfficialBlogDateTruth\(/);
 assert.ok(exporter.indexOf('BLOG_PUBLIC_EXPORT_NOT_APPROVED')<exporter.indexOf('const fact=assessOfficialBlogDateTruth'), 'approval boundary must remain before source body reads for external requests');
 assert.match(py,/reason == 'BLOG_PUBLIC_EXPORT_NOT_APPROVED'/);
 assert.match(py,/if error.code == 403:/);
 assert.match(py,/if error.code == 404:/);
 assert.match(exporter,/'EXPORT_AUTH_REQUIRED'\},401/);
});
