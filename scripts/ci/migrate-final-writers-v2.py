from pathlib import Path
import re


def replace_required(text, old, new, label):
    if old not in text:
        raise SystemExit(f'MISSING_PATTERN:{label}')
    return text.replace(old, new)


def write(path, text):
    Path(path).write_text(text, encoding='utf-8')
    print('UPDATED', path)


def candidate_input(text):
    return re.sub(
        r"delivery_mode:\n\s+description: '[^']*'\n\s+type: choice\n\s+required: true\n\s+default: direct\n\s+options:\n\s+- direct\n\s+- candidate-pr",
        "delivery_mode:\n        description: 'BRAIN v2 staat alleen gecontroleerde candidate PR delivery toe'\n        type: choice\n        required: true\n        default: candidate-pr\n        options:\n          - candidate-pr",
        text,
    )


def migrate_blog(path, writer, notion_step_prefix):
    text = Path(path).read_text(encoding='utf-8')
    text = candidate_input(text)
    text = re.sub(r"DELIVERY_MODE: \$\{\{ github\.event_name == 'workflow_dispatch' && inputs\.delivery_mode \|\| 'direct' \}\}", "DELIVERY_MODE: candidate-pr", text)
    # Keep the already proven candidate builder but remove the unreachable direct publication path.
    text = re.sub(
        r"\n      - name: Direct publiceren op huidige veilige pad[\s\S]*?(?=\n      - name: Candidate branch publiceren)",
        "\n",
        text,
        count=1,
    )
    # Scheduled and manual runs now always publish their candidate branch + PR.
    text = text.replace(" && steps.commit.outputs.delivery == 'candidate-pr'", "")
    # External completion state belongs after exact production proof, never candidate creation.
    text = re.sub(
        rf"\n      - name: {re.escape(notion_step_prefix)}[\s\S]*?(?=\n      - name: Niets te doen)",
        "\n",
        text,
        count=1,
    )
    write(path, text)


migrate_blog(
    '.github/workflows/blog-bijwerken.yml',
    'blog-bijwerken',
    'Notion op Goedgekeurd zetten na succesvolle directe publicatie',
)
migrate_blog(
    '.github/workflows/weekblog.yml',
    'weekblog',
    'Notion bijwerken na succesvolle directe publicatie',
)

# Paginacontrole: non-PR runs may prepare candidates, never write main directly.
p = '.github/workflows/paginacontrole.yml'
text = Path(p).read_text(encoding='utf-8')
text = candidate_input(text)
text = re.sub(r"DELIVERY_MODE: \$\{\{ github\.event_name == 'workflow_dispatch' && inputs\.delivery_mode \|\| 'direct' \}\}", "DELIVERY_MODE: candidate-pr", text)
text = replace_required(
    text,
    '''            if [ "$DELIVERY_MODE" = "direct" ]; then\n              git pull --rebase origin main\n              git push origin HEAD:main\n            else\n              echo "SEO-bronfix blijft lokaal in de candidate tot de PR is geverifieerd."\n            fi''',
    '''            echo "SEO-bronfix blijft lokaal in de candidate tot de PR is geverifieerd."''',
    'paginacontrole-source-direct-push',
)
text = re.sub(
    r'''          if \[ "\$DELIVERY_MODE" = "direct" \]; then\n[\s\S]*?          else\n            cp /tmp/seo-status\.json seo-status\.json\n            if ! git diff --quiet -- seo-status\.json; then\n              git add -- seo-status\.json\n              git commit -m "seo-status\.json bijgewerkt door de SEO-controle"\n            fi\n            echo "seo-status\.json blijft onderdeel van dezelfde candidate PR\."\n          fi''',
    '''          cp /tmp/seo-status.json seo-status.json\n          if ! git diff --quiet -- seo-status.json; then\n            git add -- seo-status.json\n            git commit -m "seo-status.json bijgewerkt door de SEO-controle"\n          fi\n          echo "seo-status.json blijft onderdeel van dezelfde candidate PR."''',
    text,
    count=1,
)
text = text.replace(
    "if: always() && github.event_name == 'workflow_dispatch' && inputs.delivery_mode == 'candidate-pr'",
    "if: always() && github.event_name != 'pull_request'",
)
# Issue state is allowed only on a main push validation, never on scheduled/manual candidate preparation.
text = re.sub(
    r"if: \(steps\.controle\.outcome == 'failure' \|\| steps\.seo\.outcome == 'failure'\) && github\.event_name != 'pull_request' && \(github\.event_name != 'workflow_dispatch' \|\| inputs\.delivery_mode != 'candidate-pr'\)",
    "if: (steps.controle.outcome == 'failure' || steps.seo.outcome == 'failure') && github.event_name == 'push'",
    text,
)
text = re.sub(
    r"if: steps\.controle\.outcome == 'success' && steps\.seo\.outcome == 'success' && github\.event_name != 'pull_request' && \(github\.event_name != 'workflow_dispatch' \|\| inputs\.delivery_mode != 'candidate-pr'\)",
    "if: steps.controle.outcome == 'success' && steps.seo.outcome == 'success' && github.event_name == 'push'",
    text,
)
write(p, text)

# Production exposes exact Netlify commit evidence as a static build artifact.
p = 'tools/bouw-release-evidence.mjs'
write(p, '''import { writeFile } from 'node:fs/promises';\n\nconst commitRef = String(process.env.COMMIT_REF || process.env.HEAD || '').trim();\nif (!/^[a-f0-9]{40}$/i.test(commitRef)) {\n  throw new Error('Netlify COMMIT_REF/HEAD is required for exact production evidence');\n}\nconst evidence = {\n  contract: 'BRAIN-DELIVERY-v2',\n  production_authority: 'BG169',\n  commit_ref: commitRef,\n  context: String(process.env.CONTEXT || ''),\n  deploy_id: String(process.env.DEPLOY_ID || ''),\n  generated_at: new Date().toISOString(),\n};\nawait writeFile('release.json', `${JSON.stringify(evidence, null, 2)}\\n`);\nconsole.log('RELEASE_EVIDENCE', commitRef);\n''')

p = 'netlify.toml'
text = Path(p).read_text(encoding='utf-8')
old = 'command = "node tools/bouw-powerhouse-auth.mjs && node tools/bouw-sitemap.mjs && node tools/bouw-kennisindex.mjs && node tools/bouw-v18-production.mjs"'
new = 'command = "node tools/bouw-powerhouse-auth.mjs && node tools/bouw-sitemap.mjs && node tools/bouw-kennisindex.mjs && node tools/bouw-v18-production.mjs && node tools/bouw-release-evidence.mjs"'
text = replace_required(text, old, new, 'netlify-build-release-evidence')
write(p, text)

# Candidate-only contracts replace the old reversible direct/candidate assertions.
write('tests/repo-writer-governance.test.mjs', '''import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport fs from 'node:fs';\nimport path from 'node:path';\n\nconst dir='.github/workflows';\nconst files=fs.readdirSync(dir).filter(x=>x.endsWith('.yml'));\nconst direct=files.filter(name=>/git\\s+push\\s+origin\\s+HEAD:main/.test(fs.readFileSync(path.join(dir,name),'utf8'))).sort();\n\ntest('BRAIN v2 has zero direct-main workflow writers',()=>{\n  assert.deepEqual(direct,[],'direct main writers are forbidden; writers must create candidate PRs for BG169');\n});\n''')

write('tests/repository-writer-structural-parity.test.mjs', '''import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport fs from 'node:fs';\n\nconst writers={\n  'approved-central-blog':'.github/workflows/approved-central-blog.yml',\n  'blog-bijwerken':'.github/workflows/blog-bijwerken.yml',\n  'menu-balk-fix':'.github/workflows/menu-balk-fix.yml',\n  'paginacontrole':'.github/workflows/paginacontrole.yml',\n  'regelgeving-bijwerken':'.github/workflows/regelgeving-bijwerken.yml',\n  'seo-controle':'.github/workflows/seo-controle.yml',\n  'weekblog':'.github/workflows/weekblog.yml',\n};\n\ntest('all seven governed writers are candidate-only and cannot self-promote',()=>{\n  for(const [name,p] of Object.entries(writers)){\n    const w=fs.readFileSync(p,'utf8');\n    assert.match(w,/candidate-pr/,`${name}: candidate mode required`);\n    assert.match(w,/createWriterCandidate/,`${name}: canonical candidate required`);\n    assert.match(w,/gh pr create/,`${name}: candidate PR required`);\n    assert.doesNotMatch(w,/git\\s+push\\s+origin\\s+HEAD:main/,`${name}: direct main forbidden`);\n    assert.doesNotMatch(w,/gh\\s+pr\\s+merge/,`${name}: self merge forbidden`);\n  }\n});\n''')

write('tests/content-writer-operational-fixture.test.mjs', '''import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport fs from 'node:fs';\n\nfor (const [name,path] of Object.entries({\n  'approved-central-blog':'.github/workflows/approved-central-blog.yml',\n  'blog-bijwerken':'.github/workflows/blog-bijwerken.yml',\n})) {\n  test(`${name} verification remains fixture-safe and candidate-only`,()=>{\n    const w=fs.readFileSync(path,'utf8');\n    assert.match(w,/verification_mode/);\n    assert.match(w,/candidate-pr/);\n    assert.doesNotMatch(w,/git\\s+push\\s+origin\\s+HEAD:main/);\n  });\n}\n''')

write('tests/blog-update-writer-candidate-mode.test.mjs', '''import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';\nconst w=fs.readFileSync('.github/workflows/blog-bijwerken.yml','utf8');\ntest('blog updater is candidate-only',()=>{assert.match(w,/default:\\s*candidate-pr/);assert.doesNotMatch(w,/HEAD:main/);assert.match(w,/createWriterCandidate/);assert.match(w,/gh pr create/);});\ntest('blog updater does not mark Notion completed before production reconciliation',()=>assert.doesNotMatch(w,/Notion op Goedgekeurd zetten na succesvolle directe publicatie/));\n''')
write('tests/weekblog-writer-candidate-mode.test.mjs', '''import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';\nconst w=fs.readFileSync('.github/workflows/weekblog.yml','utf8');\ntest('weekblog is candidate-only',()=>{assert.match(w,/default:\\s*candidate-pr/);assert.doesNotMatch(w,/HEAD:main/);assert.match(w,/createWriterCandidate/);assert.match(w,/gh pr create/);});\ntest('weekblog does not mark Notion published before production reconciliation',()=>assert.doesNotMatch(w,/Notion bijwerken na succesvolle directe publicatie/));\n''')
write('tests/paginacontrole-writer-candidate-mode.test.mjs', '''import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';\nconst w=fs.readFileSync('.github/workflows/paginacontrole.yml','utf8');\ntest('paginacontrole is candidate-only for repository repair',()=>{assert.match(w,/default:\\s*candidate-pr/);assert.doesNotMatch(w,/HEAD:main/);assert.match(w,/createWriterCandidate/);assert.match(w,/gh pr create/);});\ntest('candidate preparation does not mutate production issue state',()=>assert.doesNotMatch(w,/inputs\\.delivery_mode != 'candidate-pr'/));\n''')
