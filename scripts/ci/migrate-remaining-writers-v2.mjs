import fs from 'node:fs';

const workflows = [
  '.github/workflows/blog-bijwerken.yml',
  '.github/workflows/paginacontrole.yml',
  '.github/workflows/weekblog.yml',
];

function removeStep(text, headingPattern) {
  const re = new RegExp(`\\n      - name: [^\\n]*${headingPattern}[^\\n]*\\n[\\s\\S]*?(?=\\n      - name: |$)`, 'gi');
  return text.replace(re, '');
}

function migrateWorkflow(path) {
  let text = fs.readFileSync(path, 'utf8');
  text = text
    .replace(/description: ['"]Publiceer direct of maak alleen een gecontroleerde candidate PR['"]/g, "description: 'Maak uitsluitend een gecontroleerde BRAIN v2 candidate PR'")
    .replace(/default:\s*direct/g, 'default: candidate-pr')
    .replace(/\n\s*-\s*direct\s*\n(\s*-\s*candidate-pr)/g, '\n$1')
    .replace(/\|\|\s*'direct'/g, "|| 'candidate-pr'")
    .replace(/\|\|\s*"direct"/g, '|| "candidate-pr"')
    .replace(/echo\s+"delivery=direct"\s*>>\s*"\$GITHUB_OUTPUT"/g, 'echo "::error::DIRECT_DELIVERY_DISABLED_BY_BRAIN_V2"; exit 64');

  text = removeStep(text, 'Direct publiceren');
  text = removeStep(text, 'directe publicatie');
  text = removeStep(text, 'successful direct');

  fs.writeFileSync(path, text);
}

for (const path of workflows) migrateWorkflow(path);

const tests = {
  'tests/blog-update-writer-candidate-mode.test.mjs': `import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport fs from 'node:fs';\nconst text=fs.readFileSync('.github/workflows/blog-bijwerken.yml','utf8');\ntest('blog updater is candidate-only under BRAIN v2',()=>{assert.match(text,/default:\\s*candidate-pr/);assert.doesNotMatch(text,/default:\\s*direct/);assert.doesNotMatch(text,/git push origin HEAD:main/);assert.match(text,/createWriterCandidate/);assert.match(text,/gh pr create/);});\ntest('blog updater does not mark Notion production state before production proof',()=>{assert.doesNotMatch(text,/Notion op Goedgekeurd zetten na succesvolle directe publicatie/);assert.doesNotMatch(text,/steps\\.commit\\.outputs\\.delivery == 'direct'/);});\n`,
  'tests/weekblog-writer-candidate-mode.test.mjs': `import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport fs from 'node:fs';\nconst text=fs.readFileSync('.github/workflows/weekblog.yml','utf8');\ntest('scheduled and manual weekblog runs are candidate-only under BRAIN v2',()=>{assert.match(text,/default:\\s*candidate-pr/);assert.doesNotMatch(text,/default:\\s*direct/);assert.doesNotMatch(text,/git push origin HEAD:main/);assert.match(text,/createWriterCandidate/);assert.match(text,/gh pr create/);});\ntest('weekblog does not mark Notion published before production proof',()=>{assert.doesNotMatch(text,/Notion bijwerken na succesvolle directe publicatie/);assert.doesNotMatch(text,/steps\\.commit\\.outputs\\.delivery == 'direct'/);});\n`,
  'tests/paginacontrole-writer-candidate-mode.test.mjs': `import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport fs from 'node:fs';\nconst text=fs.readFileSync('.github/workflows/paginacontrole.yml','utf8');\ntest('automatic and manual page-control repairs are candidate-only under BRAIN v2',()=>{assert.match(text,/candidate-pr/);assert.doesNotMatch(text,/default:\\s*direct/);assert.doesNotMatch(text,/git push origin HEAD:main/);assert.match(text,/createWriterCandidate/);assert.match(text,/gh pr create/);});\ntest('page-control candidate cannot mutate production issue state',()=>{assert.doesNotMatch(text,/steps\\.[^\\n]*delivery == 'direct'/);assert.doesNotMatch(text,/gh\\s+pr\\s+merge/);});\n`,
};
for (const [path, content] of Object.entries(tests)) fs.writeFileSync(path, content);

const parity = `import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport fs from 'node:fs';\nconst writers={\n 'approved-central-blog':'.github/workflows/approved-central-blog.yml',\n 'blog-bijwerken':'.github/workflows/blog-bijwerken.yml',\n 'menu-balk-fix':'.github/workflows/menu-balk-fix.yml',\n 'paginacontrole':'.github/workflows/paginacontrole.yml',\n 'regelgeving-bijwerken':'.github/workflows/regelgeving-bijwerken.yml',\n 'seo-controle':'.github/workflows/seo-controle.yml',\n 'weekblog':'.github/workflows/weekblog.yml'\n};\nconst rows=Object.entries(writers).map(([name,path])=>[name,fs.readFileSync(path,'utf8')]);\ntest('all seven governed writers are BRAIN v2 candidate-only',()=>{for(const [name,text] of rows){assert.match(text,/candidate-pr/,name);assert.match(text,/createWriterCandidate/,name);assert.match(text,/gh\\s+pr\\s+create/,name);assert.doesNotMatch(text,/default:\\s*direct/,name);assert.doesNotMatch(text,/git push origin HEAD:main/,name);assert.doesNotMatch(text,/gh\\s+pr\\s+merge/,name);}});\ntest('all writer production completion stays behind central promotion proof',()=>{for(const [name,text] of rows){assert.doesNotMatch(text,/steps\\.[^\\n]*delivery == 'direct'/,name);}});\n`;
fs.writeFileSync('tests/repository-writer-structural-parity.test.mjs', parity);

const shared='.github/workflows/shared-agent-memory-tests.yml';
let sharedText=fs.readFileSync(shared,'utf8');
if(!sharedText.includes('tests/repo-writer-v2-no-direct-main.test.mjs')){
  sharedText=sharedText.replace('tests/repo-writer-candidate.test.mjs', 'tests/repo-writer-candidate.test.mjs tests/repo-writer-v2-no-direct-main.test.mjs');
  fs.writeFileSync(shared,sharedText);
}

console.log('BRAIN v2 remaining writer migration applied');
