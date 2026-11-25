const SHA_RE = /^[0-9a-f]{40}$/i;
const ARTIFACT_RE = /^sha256:[0-9a-f]{64}$/i;

function text(value) { return String(value ?? '').trim(); }

export function createReleaseEvidence({
  commitRef,
  artifactId,
  context = 'production',
  deployId,
  generatedAt = new Date().toISOString(),
  contract = 'BRAIN-DELIVERY-v2',
  productionAuthority = 'BG169',
} = {}) {
  const commit = text(commitRef);
  const artifact = text(artifactId).toLowerCase();
  const deploy = text(deployId);
  const generated = text(generatedAt);
  if (!SHA_RE.test(commit)) throw new TypeError('commitRef must be a 40-character Git SHA');
  if (!ARTIFACT_RE.test(artifact)) throw new TypeError('artifactId must be a sha256 artifact identity');
  if (!deploy) throw new TypeError('deployId is required');
  if (!generated || Number.isNaN(Date.parse(generated))) throw new TypeError('generatedAt must be an ISO timestamp');
  return Object.freeze({
    contract: text(contract) || 'BRAIN-DELIVERY-v2',
    production_authority: text(productionAuthority) || 'BG169',
    commit_ref: commit.toLowerCase(),
    artifact_id: artifact,
    context: text(context),
    deploy_id: deploy,
    generated_at: new Date(generated).toISOString(),
  });
}
