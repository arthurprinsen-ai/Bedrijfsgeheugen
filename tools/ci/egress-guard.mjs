#!/usr/bin/env node
// Egress guard: agents may only touch THIS repository.
// Fails when a workflow or CI script could write to another GitHub repo/account,
// uses a secret outside the allowlist (e.g. a personal access token), or runs
// without an explicit least-privilege `permissions:` block.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export const HOME_REPO = 'arthurprinsen-ai/bedrijfsgeheugen';
export const SECRET_ALLOWLIST = new Set([
  'GITHUB_TOKEN', 'NOTION_TOKEN', 'NOTION_BLOG_DB', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ACCESS_TOKEN', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'DATABASE_URL', 'BG_SEO_WEBHOOK',
  'BG_PORTAL_EU_SUPABASE_URL', 'BG_PORTAL_EU_SUPABASE_SERVICE_ROLE_KEY',
]);
const OWN_VARS = /^\$\{?(GITHUB_REPOSITORY|repo|REPO|GITHUB_REPOSITORY_OWNER)\}?/;

const walk = (dir, exts, out = []) => {
  let names; try { names = readdirSync(dir); } catch { return out; }
  for (const n of names) {
    if (n === 'node_modules' || n === '.git' || n === '__pycache__') continue;
    const p = join(dir, n); const st = statSync(p);
    if (st.isDirectory()) walk(p, exts, out); else if (exts.some((e) => n.endsWith(e))) out.push(p);
  }
  return out;
};

export function scanText(file, text, isWorkflow) {
  const v = [];
  const add = (rule, detail) => v.push({ file, rule, detail });
  if (isWorkflow && !/^permissions:/m.test(text)) add('NO_PERMISSIONS_BLOCK', 'workflow has no top-level permissions: block');
  if (isWorkflow && /^permissions:\s*write-all/m.test(text)) add('WRITE_ALL', 'permissions: write-all is not allowed');
  for (const m of text.matchAll(/secrets\.([A-Za-z0-9_]+)/g)) {
    if (!SECRET_ALLOWLIST.has(m[1])) add('SECRET_NOT_ALLOWLISTED', m[1]);
  }
  for (const m of text.matchAll(/repos\/([^\s"'`/]+)\/([^\s"'`/?]+)/g)) {
    const owner = m[1]; const name = m[2];
    if (OWN_VARS.test(`$${owner.replace(/^\$/, '')}`) || owner.startsWith('$') || owner.startsWith('{')) continue;
    if (`${owner}/${name}`.toLowerCase() !== HOME_REPO) add('FOREIGN_REPO_API', `${owner}/${name}`);
  }
  for (const m of text.matchAll(/\bgh\b[^\n]*?(?:--repo|\s-R)[ =]+["']?([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)/g)) {
    if (m[1].toLowerCase() !== HOME_REPO) add('FOREIGN_REPO_FLAG', m[1]);
  }
  for (const m of text.matchAll(/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\.git\b/g)) {
    if (`${m[1]}/${m[2]}`.toLowerCase() !== HOME_REPO) add('FOREIGN_CLONE_URL', `${m[1]}/${m[2]}`);
  }
  return v;
}

export function scanRepo(root = '.') {
  const v = [];
  for (const f of walk(join(root, '.github/workflows'), ['.yml', '.yaml'])) {
    v.push(...scanText(relative(root, f), readFileSync(f, 'utf8'), true));
  }
  for (const d of ['.github/scripts', 'scripts/brain', 'tools/ci', 'tools/delivery']) {
    for (const f of walk(join(root, d), ['.mjs', '.js', '.sh', '.py'])) {
      if (f.endsWith('egress-guard.mjs') || f.includes('/tests/')) continue;
      v.push(...scanText(relative(root, f), readFileSync(f, 'utf8'), false).filter((x) => x.rule !== 'SECRET_NOT_ALLOWLISTED'));
    }
  }
  return v;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const violations = scanRepo(process.argv[2] || '.');
  for (const x of violations) console.error(`EGRESS_GUARD:${x.rule}:${x.file}:${x.detail}`);
  console.log(JSON.stringify({ contract: 'egress-guard-v1', home_repo: HOME_REPO, violations: violations.length }));
  process.exit(violations.length ? 1 : 0);
}
