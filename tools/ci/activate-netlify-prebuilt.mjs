import { readFile, writeFile } from 'node:fs/promises';

const SHA_RE=/^[a-f0-9]{40}$/i;
const expectedSha=String(process.env.EXPECTED_SHA||'').trim().toLowerCase();
const expectedTree=String(process.env.EXPECTED_TREE_SHA||'').trim().toLowerCase();
if(!SHA_RE.test(expectedSha)) throw new Error('PREBUILT_EXPECTED_SHA_INVALID');
if(!SHA_RE.test(expectedTree)) throw new Error('PREBUILT_EXPECTED_TREE_INVALID');

const manifestPath=process.argv[2] || '.bg-prebuilt-manifest.json';
const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
if(String(manifest.source_tree_sha||'').toLowerCase()!==expectedTree){
  throw new Error(`PREBUILT_TREE_MISMATCH expected=${expectedTree} artifact=${manifest.source_tree_sha||'missing'}`);
}
if(manifest.contract!=='bedrijfsgeheugen-netlify-prebuilt-v1'){
  throw new Error(`PREBUILT_CONTRACT_INVALID: ${manifest.contract||'missing'}`);
}

let toml=await readFile('netlify.toml','utf8');
const buildStart=toml.indexOf('[build]');
if(buildStart<0) throw new Error('PREBUILT_NETLIFY_BUILD_SECTION_MISSING');
const nextSection=toml.indexOf('\n[',buildStart+7);
const end=nextSection<0?toml.length:nextSection;
let buildBlock=toml.slice(buildStart,end);
if(!/^\s*command\s*=/m.test(buildBlock)) throw new Error('PREBUILT_NETLIFY_BUILD_COMMAND_MISSING');
buildBlock=buildBlock
  .replace(/^\s*command\s*=.*$/m,'  command = "node tools/ci/finalize-netlify-prebuilt.mjs"')
  .replace(/^\s*ignore\s*=.*(?:\n|$)/m,'');
toml=toml.slice(0,buildStart)+buildBlock+toml.slice(end);
await writeFile('netlify.toml',toml);
await writeFile('.bg-source-commit',expectedSha+'\n');
await writeFile('.bg-prebuilt-manifest.json',JSON.stringify({...manifest,promotion_sha:expectedSha,promotion_tree_sha:expectedTree},null,2)+'\n');
console.log('NETLIFY_PREBUILT_ACTIVATED',JSON.stringify({expected_sha:expectedSha,tree:expectedTree,source_candidate_sha:manifest.candidate_sha||null}));
