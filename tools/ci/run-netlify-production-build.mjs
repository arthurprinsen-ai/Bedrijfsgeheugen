import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';

const timeline = [];

function run(command, args, label) {
  return new Promise((resolve, reject) => {
    const started = performance.now();
    const child = spawn(command, args, { stdio: 'inherit', env: process.env });
    child.on('error', reject);
    child.on('exit', code => {
      const durationMs = Math.round(performance.now() - started);
      timeline.push({ label, duration_ms: durationMs, exit_code: code });
      if (code === 0) resolve();
      else reject(new Error(`${label} failed with exit code ${code}`));
    });
  });
}

const node = (label, script, ...args) => ({ label, command: process.execPath, args: [script, ...args] });

async function phase(name, commands) {
  const started = performance.now();
  if (commands.length === 1) {
    const item = commands[0];
    await run(item.command, item.args, item.label);
  } else {
    await Promise.all(commands.map(item => run(item.command, item.args, item.label)));
  }
  timeline.push({ label: `phase:${name}`, duration_ms: Math.round(performance.now() - started), exit_code: 0 });
}

await mkdir('.artifacts', { recursive: true });

let status = 'success';
let failure = null;
try {
  await phase('capture-integrity', [
    node('pricing-integrity-capture', 'tools/site-shell/pricing-build-integrity.mjs', 'capture'),
    node('bedrijfslek-integrity-capture', 'tools/site-shell/bedrijfslek-build-integrity.mjs', 'capture'),
  ]);

  for (const item of [
    node('powerhouse-auth', 'tools/bouw-powerhouse-auth.mjs'),
    node('knowledge-index', 'tools/bouw-kennisindex.mjs'),
    node('v18-production', 'tools/bouw-v18-production.mjs'),
    node('product-led-home', 'tools/site-shell/apply-product-led-home.mjs'),
    node('tabs', 'tools/apply-tabbladen.mjs'),
    node('v18-views', 'tools/bouw-v18-views.mjs'),
    node('v18-chrome', 'tools/bouw-v18-chrome-alles.mjs'),
    node('pricing-from-home', 'tools/prijzen-uit-de-homepage.mjs'),
    node('normalize-site-ui', 'tools/normaliseer-site-ui.mjs'),
  ]) await phase(item.label, [item]);

  await phase('restore-integrity', [
    node('pricing-integrity-restore', 'tools/site-shell/pricing-build-integrity.mjs', 'restore'),
    node('bedrijfslek-integrity-restore', 'tools/site-shell/bedrijfslek-build-integrity.mjs', 'restore'),
  ]);

  for (const item of [
    node('seo-order-apply', 'tools/seo-order-engine/apply.mjs'),
    node('seo-order-validate', 'tools/seo-order-engine/validate.mjs'),
    node('apply-i18n', 'tools/site-shell/apply-i18n.mjs'),
    node('localized-routes', 'tools/site-shell/build-localized-routes.mjs'),
    node('commercial-pricing', 'tools/site-shell/apply-commercial-pricing-v1.mjs'),
    node('revenue-links', 'tools/seo-order-engine/apply-revenue-links.mjs'),
    node('website-coherence', 'tools/site-shell/finalize-website-coherence-v1.mjs'),
    node('cms-runtime', 'tools/site-shell/apply-cms-runtime.mjs'),
    node('sitemap', 'tools/genereer-sitemap.mjs'),
    node('locale-validation', 'tools/seo-order-engine/validate-locales.mjs'),
    node('release-evidence', 'tools/bouw-release-evidence.mjs'),
  ]) await phase(item.label, [item]);
} catch (error) {
  status = 'failure';
  failure = error instanceof Error ? error.message : String(error);
  throw error;
} finally {
  await writeFile(
    '.artifacts/netlify-build-timings.json',
    JSON.stringify({
      schema: 'bedrijfsgeheugen/netlify-build-timings/v1',
      status,
      failure,
      commit_ref: String(process.env.COMMIT_REF || ''),
      context: String(process.env.CONTEXT || ''),
      generated_at: new Date().toISOString(),
      timeline,
    }, null, 2) + '\n',
    'utf8'
  );
}
