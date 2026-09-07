import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('standalone content pages strip the inherited homepage SPA router before release', () => {
  const chrome = readFileSync('tools/bouw-v18-chrome.mjs', 'utf8');
  const views = readFileSync('tools/bouw-v18-views.mjs', 'utf8');
  const shell = readFileSync('tools/site-shell/apply-shell.mjs', 'utf8');

  for (const [name, source] of [['content composer', chrome], ['view composer', views], ['canonical shell', shell]]) {
    assert.match(source, /verwijderHomepageSpaRouter/, `${name} must explicitly remove the inherited homepage SPA router`);
  }
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
