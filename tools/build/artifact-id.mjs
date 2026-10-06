#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export function computeArtifactId({sourceManifest,lockfileContents,toolchainManifest,contractVersion}) {
  const payload={
    contract_version:String(contractVersion),
    lockfile_sha256:crypto.createHash('sha256').update(String(lockfileContents)).digest('hex'),
    source_manifest:[...sourceManifest].map(String).sort(),
    toolchain_manifest:Object.fromEntries(Object.entries(toolchainManifest).sort(([a],[b])=>a.localeCompare(b))),
  };
  const digest=crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  return `sha256:${digest}`;
}

export function computeRepositoryArtifactId(root=process.cwd()) {
  const contract=JSON.parse(fs.readFileSync(path.join(root,'config','build-contract.json'),'utf8'));
  const lockPath=fs.existsSync(path.join(root,'package-lock.json')) ? 'package-lock.json' : 'package.json';
  const lockfileContents=fs.readFileSync(path.join(root,lockPath),'utf8');
  const sourceManifest=execFileSync('git',['ls-files','-s'],{cwd:root,encoding:'utf8'}).split(/\r?\n/).filter(Boolean);
  return computeArtifactId({sourceManifest,lockfileContents,toolchainManifest:contract.toolchain,contractVersion:contract.contract_version});
}

const invokedAsScript=process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(invokedAsScript) process.stdout.write(computeRepositoryArtifactId()+'\n');
