import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('final release stage strips the inherited homepage SPA router from standalone pages', () => {
  const release = readFileSync('tools/bouw-release-evidence.mjs', 'utf8');
  assert.match(release, /standalone-page-router\.mjs/, 'final release stage must import standalone page router isolation');
  assert.match(release, /isolateStandalonePages\(\)/, 'router isolation must run before release evidence is emitted');
});

test('standalone page router isolation preserves ordinary scripts and content', async () => {
  const { verwijderHomepageSpaRouter } = await import('../tools/standalone-page-router.mjs');
  const html = `<!doctype html><html><body>
    <script>console.log('keep me')</script>
    <script>const viewButtons=document.querySelectorAll('[data-view]'); function showView(name){ document.querySelectorAll('.page').forEach(p=>p.classList.remove('active')); } viewButtons.forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();showView(btn.dataset.view);})); showView('home');</script>
    <div class="page active" id="view-inhoud"><h1>AI Act</h1></div>
  </body></html>`;

  const result = verwijderHomepageSpaRouter(html);
  assert.match(result, /keep me/, 'unrelated page scripts must be preserved');
  assert.doesNotMatch(result, /viewButtons|showView\(/, 'legacy SPA router must not survive on a standalone page');
  assert.match(result, /id="view-inhoud"/, 'standalone content itself must remain intact');
});

test('standalone documents are decoupled from the homepage .page/.active state machine', async () => {
  const { ontkoppelStandalonePageState } = await import('../tools/standalone-page-router.mjs');
  const html = '<main><div class="page active" id="view-inhoud"><h1>AI Act</h1><p>Visible content</p></div></main>';
  const result = ontkoppelStandalonePageState(html);
  assert.doesNotMatch(result, /class="page active"/, 'standalone page must not remain addressable by homepage .page CSS/JS');
  assert.match(result, /class="bg-standalone-page" id="view-inhoud"/, 'standalone content gets an isolated wrapper');
  assert.match(result, /<h1>AI Act<\/h1>/, 'content must be preserved');
});

test('standalone pages receive a fail-safe that keeps the real page visible even when stale inherited CSS or JS hides it', async () => {
  const { borgStandaloneVisibility } = await import('../tools/standalone-page-router.mjs');
  const html = '<!doctype html><html><head><style>body{opacity:0} main{visibility:hidden}</style></head><body><header>Menu</header><main><div class="bg-standalone-page"><h1>AI Act</h1></div></main><footer>Footer</footer></body></html>';
  const result = borgStandaloneVisibility(html);
  assert.match(result, /id="bg-standalone-visibility-guard"/);
  assert.match(result, /html,body\{opacity:1!important;visibility:visible!important\}/);
  assert.match(result, /\.bg-standalone-page\{display:block!important;transform:none!important\}/);
  assert.equal((result.match(/bg-standalone-visibility-guard/g) || []).length, 1, 'visibility guard must be idempotent');
  assert.equal((borgStandaloneVisibility(result).match(/bg-standalone-visibility-guard/g) || []).length, 1, 'second pass must not duplicate the guard');
});

test('real-browser visibility gate covers every internal page linked from the shared menu', () => {
  const checker = readFileSync('tools/site-shell/standalone-visibility-check.mjs', 'utf8');
  assert.match(checker, /discoverMenuRoutes/, 'browser gate must discover the menu routes instead of checking only a hand-picked pair');
  assert.match(checker, /\.bgkop\s+a\[href\]/, 'browser gate must derive routes from the actual shared menu');
  assert.doesNotMatch(checker, /const routes = \['\/ai-act', '\/benchmark'\]/, 'AI Act and benchmark cannot be the only protected routes');
  assert.match(checker, /routes\.length\s*<\s*8/, 'gate must fail closed if menu discovery unexpectedly returns too few pages');
});
