export function verifyProductionEvidence({ evidence, expectedSha } = {}) {
  const expected = String(expectedSha || '').trim();
  if (!/^[a-f0-9]{40}$/i.test(expected)) return { ok:false, reason:'invalid-expected-sha' };
  if (!evidence || typeof evidence !== 'object') return { ok:false, reason:'missing-release-evidence' };
  if (String(evidence.commit_ref || '') !== expected) return { ok:false, reason:'production-sha-mismatch', expectedSha:expected, actualSha:String(evidence.commit_ref || '') };
  if (String(evidence.context || '') !== 'production') return { ok:false, reason:'not-production-context', context:String(evidence.context || '') };
  if (!String(evidence.deploy_id || '').trim()) return { ok:false, reason:'missing-deploy-id' };
  return { ok:true, reason:'exact-production-sha-live', expectedSha:expected, deployId:String(evidence.deploy_id) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const expectedSha=String(process.env.EXPECTED_SHA || '').trim();
  const releaseUrl=String(process.env.RELEASE_URL || 'https://www.bedrijfsgeheugen.nl/release.json').trim();
  const response=await fetch(`${releaseUrl}?expected=${encodeURIComponent(expectedSha)}&t=${Date.now()}`, { headers:{'cache-control':'no-cache'} });
  if (!response.ok) throw new Error(`release evidence HTTP ${response.status}`);
  const evidence=await response.json();
  const result=verifyProductionEvidence({evidence,expectedSha});
  console.log(JSON.stringify({ ...result, evidence }));
  if (!result.ok) process.exitCode=1;
}
