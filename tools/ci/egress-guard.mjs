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
// Owner-authorized dedicated App secret: only the exact read-only protected
// main identity job, never a global secret allowlist entry. Any edited job
// must be reviewed again before it can consume the credential.
const RELEASE_APP_PROBE_JOB = [
  "  release-app-identity-proof:",
  "    if: github.event_name == 'workflow_dispatch' && inputs.release_app_identity == true && inputs.patch_handoff != true && github.ref == 'refs/heads/main' && (inputs.release_app_fence != true || inputs.release_app_token != true)",
  "    runs-on: ubuntu-latest",
  "    environment: powerhouse-release-controller",
  "    timeout-minutes: 5",
  "    permissions:",
  "      contents: read",
  "    steps:",
  "      - uses: actions/checkout@v5",
  "        with:",
  "          ref: ${{ github.sha }}",
  "          persist-credentials: false",
  "      - name: Verify dedicated App identity without mutation authority",
  "        env:",
  "          RELEASE_APP_FENCE_PROOF: ${{ inputs.release_app_fence }}",
  "          RELEASE_APP_TOKEN_PROOF: ${{ inputs.release_app_token }}",
  "          RELEASE_APP_ID: ${{ vars.POWERHOUSE_RELEASE_APP_ID }}",
  "          RELEASE_APP_PRIVATE_KEY: ${{ secrets.POWERHOUSE_RELEASE_APP_PRIVATE_KEY }}",
  "        shell: bash",
  "        run: |",
  "          set -euo pipefail",
  "          test \"$GITHUB_REF\" = refs/heads/main",
  "          test \"$(git rev-parse HEAD)\" = \"$GITHUB_SHA\"",
  "          node --input-type=module <<'NODE'",
  "          import {verifyReleaseApp} from './tools/delivery/release-app-identity.mjs';",
  "          import {proveScopedPromotionToken} from './tools/delivery/reviewed-promotion-token.mjs';",
  "          import {proveScopedFenceRead} from './tools/delivery/reviewed-provider-fence.mjs';",
  "          try {",
  "            if(process.env.RELEASE_APP_FENCE_PROOF==='true') {",
  "              if(process.env.RELEASE_APP_TOKEN_PROOF==='true') throw Error('FENCE_READ_MODE_CONFLICT');",
  "              const f=await proveScopedFenceRead({appId:Number(process.env.RELEASE_APP_ID),privateKey:process.env.RELEASE_APP_PRIVATE_KEY,expectedMainSha:process.env.GITHUB_SHA});",
  "              if(f.appId!==5916428 || f.installationId!==185660155 || f.repository!==process.env.GITHUB_REPOSITORY || f.expectedMainSha!==process.env.GITHUB_SHA || f.scopeVerified!==true || f.revocationVerified!==true || f.exclusiveWriterVerified!==false || f.mutationAuthority!==false || f.state!=='SCOPED_READ_TOKEN_REVOKED_AUTHORITY_UNPROVEN') throw Error('FENCE_READ_PROBE_CONTRACT_MISMATCH');",
  "              const complete=['DEDICATED_CONTEXT_MISSING','NATIVE_CONTEXT_BOUND_EXCLUSIVE_WRITER_UNPROVEN'].includes(f.fenceState);",
  "              console.log('RELEASE_APP_FENCE_PROOF:'+JSON.stringify({appId:f.appId,installationId:f.installationId,repository:f.repository,expectedMainSha:f.expectedMainSha,state:f.state,fenceState:complete?f.fenceState:'NATIVE_INVENTORY_UNPROVEN',scopeVerified:true,revocationVerified:true,exclusiveWriterVerified:false,mutationAuthority:false}));",
  "              if(!complete) throw Error('FENCE_READ_NATIVE_INVENTORY_UNPROVEN');",
  "            } else {",
  "            const proof=await verifyReleaseApp({appId:Number(process.env.RELEASE_APP_ID),privateKey:process.env.RELEASE_APP_PRIVATE_KEY});",
  "            if(proof.appId!==5916428 || proof.authenticated!==true || proof.exclusiveWriterVerified!==false || proof.mutationAuthority!==false) throw Error('APP_PROBE_CONTRACT_MISMATCH');",
  "            console.log('RELEASE_APP_IDENTITY_PROOF:'+JSON.stringify({appId:proof.appId,installationId:proof.installationId,repository:proof.repository,state:proof.state,authenticated:true,exclusiveWriterVerified:false,mutationAuthority:false}));",
  "            if(process.env.RELEASE_APP_TOKEN_PROOF==='true') {",
  "              const tokenProof=await proveScopedPromotionToken({appId:Number(process.env.RELEASE_APP_ID),privateKey:process.env.RELEASE_APP_PRIVATE_KEY});",
  "              if(tokenProof.scopeVerified!==true || tokenProof.revocationVerified!==true || tokenProof.exclusiveWriterVerified!==false || tokenProof.mutationAuthority!==false) throw Error('PROMOTION_TOKEN_PROBE_CONTRACT_MISMATCH');",
  "              console.log('RELEASE_APP_TOKEN_PROOF:'+JSON.stringify({appId:tokenProof.appId,installationId:tokenProof.installationId,repository:tokenProof.repository,state:tokenProof.state,scopeVerified:true,revocationVerified:true,exclusiveWriterVerified:false,mutationAuthority:false}));",
  "            }",
  "            }",
  "          } catch(e) {",
  "            const code=String(e?.message??'');",
  "            const safe=/^(APP_NATIVE_AUTH_HTTP_\\d{3}|APP_IDENTITY_OR_PERMISSIONS_UNPROVEN|APP_INSTALLATION_SCOPE_UNPROVEN_(?:IDENTITY|ACCOUNT|SELECTION|SUSPENSION|PERMISSIONS)|DEDICATED_APP_CREDENTIAL_REQUIRED|APP_RSA_KEY_REQUIRED|APP_PRIVATE_KEY_PARSE_FAILED|APP_JWT_SIGN_FAILED|APP_NATIVE_NETWORK_FAILED|APP_NATIVE_RESPONSE_INVALID|APP_PROBE_CONTRACT_MISMATCH|PROMOTION_APP_ID_UNPROVEN|PROMOTION_IDENTITY_REQUEST_INVALID|PROMOTION_APP_AUTH_UNPROVEN|PROMOTION_APP_AUTH_CHANGED|PROMOTION_IDENTITY_UNPROVEN|PROMOTION_TOKEN_TRANSPORT_UNPROVEN|PROMOTION_TOKEN_RESPONSE_INVALID|PROMOTION_TOKEN_ISSUANCE_UNPROVEN|PROMOTION_TOKEN_ISSUANCE_AMBIGUOUS|PROMOTION_TOKEN_PERMISSIONS_UNPROVEN|PROMOTION_TOKEN_EXPIRY_UNPROVEN|PROMOTION_TOKEN_SCOPE_READBACK_FAILED|PROMOTION_TOKEN_REPOSITORY_SCOPE_UNPROVEN|PROMOTION_TOKEN_REVOCATION_UNPROVEN|PROMOTION_TOKEN_REVOCATION_READBACK_UNPROVEN|PROMOTION_TOKEN_PROBE_CONTRACT_MISMATCH|FENCE_READ_MODE_CONFLICT|FENCE_READ_PROBE_CONTRACT_MISMATCH|FENCE_READ_NATIVE_INVENTORY_UNPROVEN)$/.test(code)?code:'APP_PROBE_FAILED';",
  "            console.error(safe);process.exitCode=1;",
  "          }",
  "          NODE",
  ""
].join('\n');
function isApprovedReleaseAppSecret(file, text, isWorkflow, match) {
  if (!isWorkflow || file !== ".github/workflows/powerhouse-delivery-recovery-supervisor.yml" || match[1] !== 'POWERHOUSE_RELEASE_APP_PRIVATE_KEY') return false;
  const marker = '\n  release-app-identity-proof:\n';
  const start = text.indexOf(marker);
  return start >= 0 && start === text.lastIndexOf(marker) &&
    text.slice(start + 1) === RELEASE_APP_PROBE_JOB && match.index > start;
}

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
    if (!SECRET_ALLOWLIST.has(m[1]) && !isApprovedReleaseAppSecret(file, text, isWorkflow, m)) add('SECRET_NOT_ALLOWLISTED', m[1]);
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
