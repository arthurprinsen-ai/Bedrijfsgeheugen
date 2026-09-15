import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

test('approved blog writer keeps analytics out of the first render until consent or after load', () => {
  const probe = [
    "import sys",
    "sys.path.insert(0, 'scripts')",
    "import publish_approved_blog_v2 as writer",
    "sample = '''<head><!-- Google tag (gtag.js) --><script async src=\"https://www.googletagmanager.com/gtag/js?id=G-912L0PB68G\"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}try{ if(localStorage.getItem('bg_consent')==='granted'){ gtag('consent','update',{analytics_storage:'granted'}); } }catch(e){}</script><link rel=\"stylesheet\" href=\"https://fonts.googleapis.com/css2?family=Inter\"><link rel=\"stylesheet\" href=\"/assets/site.css\"><script data-goatcounter=\"https://bedrijfsgeheugen.goatcounter.com/count\" async src=\"https://gc.zgo.at/count.js\"></script></head>'''",
    "print(writer.normalize_performance(sample))",
  ].join('\n');
  const output = execFileSync('python3', ['-c', probe], { encoding: 'utf8' });

  assert.doesNotMatch(output, /<script async src=\"https:\/\/www\.googletagmanager\.com\/gtag\/js/);
  assert.match(output, /function bgLoadGoogleAnalytics\(\)/);
  assert.match(output, /analytics_storage==='granted'/);
  assert.doesNotMatch(output, /<script data-goatcounter=.*src=\"https:\/\/gc\.zgo\.at\/count\.js/);
  assert.match(output, /setTimeout\(loadGoat,5000\)/);
  assert.doesNotMatch(output, /fonts\.googleapis\.com/);
  assert.match(output, /href=\"\/assets\/site\.css\"/);
});
