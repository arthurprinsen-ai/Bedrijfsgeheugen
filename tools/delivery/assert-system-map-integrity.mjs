#!/usr/bin/env node
/**
 * Read-only determinism and tracked System Map drift check.
 * Run only after checkout of the exact integration/merge_group SHA.
 * This script never commits, pushes or weakens a release gate.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
const command = process.env.SYSTEM_MAP_GENERATE_COMMAND;
const mapPath = process.env.SYSTEM_MAP_PATH;
function fail(message) { console.error('SYSTEM_MAP_INTEGRITY_FAIL:', message); process.exit(1); }
if (!command || !mapPath) fail('SYSTEM_MAP_GENERATE_COMMAND and SYSTEM_MAP_PATH must be configured');
if (!/^[a-zA-Z0-9_./ -]+$/.test(command) || command.includes('  ') || command.startsWith('-')) fail('generator command must be a literal vetted executable and arguments');
if (mapPath.startsWith('/') || mapPath.includes('..') || !/^[a-zA-Z0-9_./-]+$/.test(mapPath)) fail('unsafe tracked path');
const args = command.split(' ');
const sha = execFileSync('git', ['rev-parse','HEAD'], {encoding:'utf8'}).trim();
const expected = process.env.EXPECTED_INTEGRATION_SHA;
if (expected && sha !== expected) fail('checked-out SHA differs from exact integration SHA');
try { execFileSync('git', ['ls-files','--error-unmatch','--',mapPath],{stdio:'ignore'}); }
catch { fail('generated System Map is not tracked'); }
function generate() {
  try { execFileSync(args[0],args.slice(1),{stdio:'inherit',timeout:120000}); }
  catch(e) { fail('generator exited unsuccessfully: '+String(e.message)); }
  if (!existsSync(mapPath)) fail('generator did not produce System Map');
  return createHash('sha256').update(readFileSync(mapPath)).digest('hex');
}
const first=generate(), second=generate();
if(first!==second) fail('nondeterministic generator output');
let changed;
try { changed=execFileSync('git',['diff','--exit-code','--',mapPath],{stdio:'pipe'}).length>0; }
catch(e){ if(e.status===1) changed=true; else fail('git diff failed'); }
if(changed) fail('regenerated System Map differs from integrated tracked version');
console.log(JSON.stringify({status:'SYSTEM_MAP_INTEGRITY_PROVEN',head_sha:sha,map_path:mapPath,sha256:second}));
