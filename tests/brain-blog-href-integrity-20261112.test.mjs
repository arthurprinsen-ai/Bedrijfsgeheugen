import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('new blog preflight rejects broken, noncanonical and unsafe href attributes', () => {
  const script = String.raw\`
from scripts.ci.blog_technical_seo_gate import validate_public_href_targets as check
BASE = "https://www.bedrijfsgeheugen.nl"
paths = ["/", "/frisse-blik", "/afas-koppeling", "/blog/valid/"]
sitemap = "<urlset>" + "".join("<url><loc>" + BASE + p + "</loc></url>" for p in paths) + "</urlset>"
def markup(href):
    return '<main><a href="' + href + '">Een leesbare bestemming</a></main>'
valid = check(markup("/frisse-blik") + markup("https://www.bedrijfsgeheugen.nl/blog/valid/") + markup("https://example.com/guide"), sitemap)
assert valid["internal_checked"] == 2
assert valid["external_https_checked"] == 1
for bad in [
    "/blog/unpublished/", "https://www.bedrijfsgeheugen.nl/blog/unpublished/",
    "https://bedrijfsgeheugen.nl/frisse-blik", "http://example.com",
    "//example.com", "javascript:alert(1)", "data:text/html,test",
    "relative/path", "#", "", "/wrong%20route"
]:
    try:
        check(markup(bad), sitemap)
    except SystemExit:
        pass
    else:
        raise AssertionError("Unexpectedly accepted href: " + repr(bad))
\`;
  const result = spawnSync('python3', ['-c', script], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout || 'Python blog link verification failed');
});
