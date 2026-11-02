import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

const seo=readFileSync('.github/scripts/seocontrole.py','utf8');
const workflow=readFileSync('.github/workflows/paginacontrole.yml','utf8');

test('unmodified SEO source does not create a clock-only candidate, but real changes still write',()=>{
  const python = `
import json, runpy, tempfile, pathlib
module = runpy.run_path('.github/scripts/seocontrole.py')
fn = module['schrijf_seo_status_als_gewijzigd']
with tempfile.TemporaryDirectory() as d:
    path = str(pathlib.Path(d) / 'seo-status.json')
    original = {'bijgewerkt': '2026-11-02', 'zoekwoorden': [{'zoekwoord':'klantwaarde','pagina':'/product','bestaat':True,'claimt':True,'type':'pijler'}], 'pijlers':['/product']}
    assert fn(original.copy(), path) is True
    before = pathlib.Path(path).read_bytes()
    clock_only = dict(original, bijgewerkt='2026-11-03')
    assert fn(clock_only, path) is False
    assert pathlib.Path(path).read_bytes() == before
    assert clock_only['bijgewerkt'] == '2026-11-02'
    changed = dict(original, bijgewerkt='2026-11-03', pijlers=['/product','/blog'])
    assert fn(changed, path) is True
    assert json.loads(pathlib.Path(path).read_text())['bijgewerkt'] == '2026-11-03'
    assert json.loads(pathlib.Path(path).read_text())['pijlers'] == ['/product','/blog']
    assert fn(changed, path) is False
`;
  const out=execFileSync('python3',['-c',python],{encoding:'utf8'});
  assert.equal(out,'');
});

test('original protected PR handoff still fails closed when GitHub denies createPullRequest',()=>{
 assert.match(seo,/schrijf_seo_status_als_gewijzigd\(status\)/);
 assert.match(workflow,/concurrency:\s*\n\s*group: repo-schrijven/);
 assert.match(workflow,/createWriterCandidate/);
 assert.match(workflow,/validateWriterCandidate/);
 assert.match(workflow,/git push origin "HEAD:\$CANDIDATE_BRANCH"/);
 assert.match(workflow,/gh pr create/);
 assert.match(workflow,/set -euo pipefail/);
 assert.doesNotMatch(workflow,/gh pr create[\s\S]{0,120}\|\| true/);
});