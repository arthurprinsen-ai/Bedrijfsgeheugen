#!/usr/bin/env node
// Read-only SkillOps snapshot. No deployments, agent mutations or customer data.
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative, resolve } from 'node:path';
const root = resolve(process.cwd());
const roots = ['.agents/skills', 'brain/skills'];
async function walk(dir) {
  let out = [];
  for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a,b)=>a.name.localeCompare(b.name))) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(path));
    else if (entry.isFile() && /(?:SKILL\.md|\.json)$/i.test(entry.name)) out.push(path);
  }
  return out;
}
const skills = [];
for (const folder of roots) {
  for (const file of await walk(join(root, folder))) {
    const bytes = await readFile(file);
    skills.push({ path: relative(root, file).replaceAll('\\','/'), sha256: createHash('sha256').update(bytes).digest('hex'), size_bytes: bytes.length });
  }
}
const snapshot = { schema_version: 1, kind: 'skillops-inventory', read_only: true, count: skills.length, skills };
const json = JSON.stringify(snapshot, null, 2)+'\n';
const target = process.argv.find(a=>a.startsWith('--output='))?.slice(9);
if (target) {
  const path = resolve(target);
  if (!path.startsWith(root+'/')) throw new Error('Output must remain inside repository');
  await mkdir(resolve(path, '..'), {recursive:true});
  await writeFile(path, json);
} else process.stdout.write(json);
