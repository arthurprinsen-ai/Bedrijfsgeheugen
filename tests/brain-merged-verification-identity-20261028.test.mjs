import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const workflow=fs.readFileSync('.github/workflows/unified-brain-delivery.yml','utf8');
const section=workflow.split('name: Validate explicitly dispatched PR identity')[1].split('\n  admission:')[0];
const script=section.split('        run: |\n')[1].split('\n').map(l=>l.startsWith('          ')?l.slice(10):l).join('\n');
const sha=c=>c.repeat(40),repo='arthurprinsen-ai/Bedrijfsgeheugen';
function run(overrides={},env={}){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'merged-brain-'));
 const pr={state:'closed',merged:true,base:{sha:sha('a'),ref:'main'},head:{sha:sha('b'),ref:'fix/original',repo:{full_name:repo}},merge_commit_sha:sha('c'),...overrides};
 fs.writeFileSync(path.join(dir,'gh'),'#!/usr/bin/env node\nconst p=process.argv.at(-1);const pr=JSON.parse(process.env.FIXTURE_PR);if(p.includes("/pulls/"))console.log(JSON.stringify(pr));else if(p.includes("/compare/"))console.log(JSON.stringify({merge_base_commit:{sha:p.includes(pr.head.sha+"...")?process.env.CANDIDATE_BASE:process.env.MERGE_BASE}}));else if(p.includes("/git/commits/"))console.log(JSON.stringify({tree:{sha:p.endsWith(pr.head.sha)?process.env.HEAD_TREE:process.env.MERGE_TREE}}));else process.exit(19);\n',{mode:0o755});
 try{return spawnSync('bash',['-c',script],{encoding:'utf8',env:{...process.env,PATH:dir+':'+process.env.PATH,GH_TOKEN:'fixture',PR_NUMBER:'5040',BASE_SHA:sha('a'),HEAD_SHA:sha('b'),CANDIDATE_BRANCH:'fix/original',GITHUB_REPOSITORY:repo,GITHUB_REF:'refs/heads/main',GITHUB_SHA:sha('d'),VERIFY_ONLY:'true',FIXTURE_PR:JSON.stringify(pr),CANDIDATE_BASE:sha('a'),MERGE_BASE:sha('c'),HEAD_TREE:sha('e'),MERGE_TREE:sha('e'),...env}});}finally{fs.rmSync(dir,{recursive:true,force:true});}
}
test('read-only recovery verifies a protected merged squash candidate',()=>{const r=run();assert.equal(r.status,0,r.stderr);});
test('open promotion retains existing identity validation',()=>assert.equal(run({state:'open',merged:false},{VERIFY_ONLY:'false'}).status,0));
test('closed unmerged or promotion requests remain denied',()=>{assert.notEqual(run({state:'invalid'}).status,0);assert.notEqual(run({merged:false}).status,0);assert.notEqual(run({},{VERIFY_ONLY:'false'}).status,0);});
test('wrong repository, protected ref, base and candidate identity remain denied',()=>{
 for(const [p,e] of [[{head:{sha:sha('b'),repo:{full_name:'other/repo'}}},{}],[{base:{sha:sha('a'),ref:'develop'}},{}],[{}, {GITHUB_REF:'refs/tags/main'}],[{}, {HEAD_SHA:sha('f')}],[{}, {BASE_SHA:sha('f')} ]])assert.notEqual(run(p,e).status,0);
});
test('uncontained merge or non-equivalent candidate remains denied',()=>{assert.notEqual(run({},{MERGE_BASE:sha('f')}).status,0);assert.notEqual(run({},{MERGE_TREE:sha('f')}).status,0);});
test('ancestor merge candidate is accepted without tree equivalence',()=>{assert.equal(run({},{CANDIDATE_BASE:sha('b'),MERGE_TREE:sha('f')}).status,0);});
test('verification-only still has no production handoff and skips moving-main mutation fence',()=>{
 assert.ok(section.includes('VERIFY_ONLY: ${{ inputs.verification_only }}'));
 const handoff=workflow.split('name: Enforce current-main file and contract conflict index')[1].split('      - name:')[0];
 assert.ok(handoff.includes('inputs.verification_only != true'));
 for(const name of ['Certify live main protection before production handoff','BG169 GitHub-native production transport'])assert.ok(workflow.split('name: '+name)[1].split('        env:')[0].includes('inputs.verification_only != true'));
});
