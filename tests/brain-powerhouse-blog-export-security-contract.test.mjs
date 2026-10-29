import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

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
