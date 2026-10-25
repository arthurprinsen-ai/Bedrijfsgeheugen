import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative, join } from 'node:path';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export async function collectSkillByteAudit({ root = process.cwd(), runId, runAttempt, headSha } = {}) {
  if (!/^[0-9]+$/.test(String(runId ?? '')) || !/^[0-9]+$/.test(String(runAttempt ?? '')) ||
      !/^[a-f0-9]{40}$/.test(String(headSha ?? ''))) throw new Error('TRUSTED_RUN_CONTEXT_REQUIRED');
  const skills = [];
  async function walk(directory) {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a,b) => a.name.localeCompare(b.name))) {
      const location=join(directory,entry.name);
      if (entry.isDirectory()) await walk(location);
      else if (entry.isFile() && entry.name==='SKILL.md') {
        const bytes=await readFile(location);
        if (!bytes.length) throw new Error('EMPTY_SKILL_FILE:'+location);
        skills.push({path:relative(root,location).replaceAll('\\','/'), contentSha256:hash(bytes),byteLength:bytes.length});
      }
    }
  }
  for (const folder of ['.agents/skills','brain/skills']) await walk(resolve(root,folder));
  if (!skills.length) throw new Error('NO_SKILLS_OBSERVED');
  return {schema:'skill-byte-audit-v1', runId:String(runId),runAttempt:String(runAttempt),headSha,skills,
    status:'LOADED_BYTES_ONLY',applicationVerified:false,independentVerifier:false};
}
if (process.argv[1] && import.meta.url === new URL('file://'+resolve(process.argv[1])).href) {
  const audit=await collectSkillByteAudit({runId:process.env.GITHUB_RUN_ID,runAttempt:process.env.GITHUB_RUN_ATTEMPT,headSha:process.env.GITHUB_SHA});
  const file=resolve('artifacts/quality/skill-byte-audit.json');
  await mkdir(resolve('artifacts/quality'),{recursive:true});
  await writeFile(file,JSON.stringify(audit,null,2)+'\n');
  console.log(JSON.stringify({status:audit.status,skillCount:audit.skills.length,runId:audit.runId,headSha:audit.headSha}));
}
