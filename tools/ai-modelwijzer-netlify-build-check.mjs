import { spawnSync } from 'node:child_process';

const steps = [
  ['tools/site-shell/pricing-build-integrity.mjs','capture'],
  ['tools/site-shell/bedrijfslek-build-integrity.mjs','capture'],
  ['tools/site-shell/ai-modelwijzer-build-integrity.mjs','capture'],
  ['tools/bouw-powerhouse-auth.mjs'],
  ['tools/bouw-kennisindex.mjs'],
  ['tools/bouw-v18-production.mjs'],
  ['tools/apply-tabbladen.mjs'],
  ['tools/bouw-v18-views.mjs'],
  ['tools/bouw-v18-chrome-alles.mjs'],
  ['tools/prijzen-uit-de-homepage.mjs'],
  ['tools/normaliseer-site-ui.mjs'],
  ['tools/site-shell/pricing-build-integrity.mjs','restore'],
  ['tools/site-shell/bedrijfslek-build-integrity.mjs','restore'],
  ['tools/site-shell/ai-modelwijzer-build-integrity.mjs','restore'],
  ['tools/site-shell/apply-i18n.mjs'],
  ['tools/site-shell/build-localized-routes.mjs'],
  ['tools/genereer-sitemap.mjs'],
  ['tools/bouw-release-evidence.mjs']
];

for (const [file,...args] of steps) {
  process.stdout.write('\n[ai-modelwijzer-build] '+file+' '+args.join(' ')+'\n');
  const result = spawnSync(process.execPath,[file,...args],{
    stdio:'inherit',
    env:{...process.env,STATIC_I18N_NETWORK:'0',STATIC_I18N_REQUIRE_CACHE:'1'}
  });
  if(result.status!==0){
    process.stderr.write('[ai-modelwijzer-build] FAILED '+file+' exit='+result.status+'\n');
    process.exit(result.status||1);
  }
}
process.stdout.write('\n[ai-modelwijzer-build] GREEN\n');
