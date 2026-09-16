const COVERED = new Set(['scheduled', 'sending', 'sent']);
const BLOCKED_ARTIFACT_STATES = new Set(['blocked', 'failed']);

export function normalizeText(value = '') {
  return String(value).replace(/\r\n/g, '\n').replace(/[\t ]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

function coveredPosts(posts = []) {
  return posts.filter((post) => COVERED.has(String(post?.status || '').toLowerCase()));
}

export function hasProviderCoverage({ posts = [] } = {}) {
  return coveredPosts(posts).length > 0;
}

function artifactUsable(artifact) {
  return Boolean(
    artifact &&
    !BLOCKED_ARTIFACT_STATES.has(String(artifact.status || '').toLowerCase()) &&
    normalizeText(artifact.body),
  );
}

function validPersonalArtifact(artifact) {
  const evidence = artifact?.generation_evidence || {};
  return Boolean(
    artifactUsable(artifact) &&
    artifact.channel === 'linkedin_personal' &&
    artifact.artifact_type === 'linkedin_post' &&
    evidence.identity_gate_result === 'PASS' &&
    evidence.concrete_personal_anchor === true &&
    evidence.corporate_style === false &&
    evidence.personal_truth_verified === true,
  );
}

function validInstagramArtifact(artifact) {
  const evidence = artifact?.generation_evidence || {};
  const gateInput = evidence.instagram_publish_gate_input;
  return Boolean(
    artifactUsable(artifact) &&
    artifact.channel === 'instagram' &&
    gateInput &&
    typeof gateInput === 'object' &&
    gateInput.miraGatePassed === true &&
    gateInput.instagramVisual?.verified === true &&
    gateInput.instagramVisual?.identityClass === 'mira_daily_life' &&
    gateInput.instagramVisual?.placeholderDetected !== true &&
    gateInput.instagramVisual?.assetUrl &&
    gateInput.assetUrl &&
    gateInput.instagramVisual.assetUrl === gateInput.assetUrl,
  );
}

function instagramMediaFromArtifact(artifact) {
  const gateInput = artifact?.generation_evidence?.instagram_publish_gate_input || {};
  const kind = String(gateInput.mediaKind || 'image').toLowerCase();
  return [{
    type: kind === 'video' || kind === 'reel' ? 'video' : 'image',
    url: gateInput.assetUrl,
    alt: gateInput.instagramVisual?.altText || null,
  }];
}

export function selectDeliverySource({ channel, artifact = null, idea = null } = {}) {
  if (channel === 'linkedin_personal') {
    if (!validPersonalArtifact(artifact)) return null;
    return { kind: 'artifact', text: artifact.body, ideaId: null, media: [], artifact };
  }

  if (channel === 'instagram') {
    if (!validInstagramArtifact(artifact)) return null;
    return { kind: 'artifact', text: artifact.body, ideaId: null, media: instagramMediaFromArtifact(artifact), artifact };
  }

  if (artifactUsable(artifact)) {
    return { kind: 'artifact', text: artifact.body, ideaId: null, media: [], artifact };
  }

  const ideaText = normalizeText(idea?.content?.text || '');
  if (!ideaText) return null;
  return { kind: 'idea', text: idea.content.text, ideaId: idea?.id || null, media: [], artifact: null };
}

function providerCoverageDecision({ channel, posts, artifact, obligation }) {
  const covered = coveredPosts(posts);
  if (!covered.length) return null;

  if (channel === 'linkedin_personal') {
    if (!validPersonalArtifact(artifact)) return { action: 'BLOCK', reason: 'PERSONAL_TRUTH_ARTIFACT_REQUIRED' };
    const exact = covered.find((post) => normalizeText(post?.text) === normalizeText(artifact.body));
    if (!exact) return { action: 'BLOCK', reason: 'PERSONAL_PROVIDER_ARTIFACT_MISMATCH' };
    return { action: 'NONE', reason: 'PROVIDER_COVERED_VERIFIED', providerPostId: exact.id || null };
  }

  if (channel === 'instagram') {
    if (!validInstagramArtifact(artifact)) return { action: 'BLOCK', reason: 'INSTAGRAM_MIRA_ARTIFACT_REQUIRED' };
    const exact = covered.find((post) => normalizeText(post?.text) === normalizeText(artifact.body));
    if (!exact) return { action: 'BLOCK', reason: 'INSTAGRAM_PROVIDER_ARTIFACT_MISMATCH' };

    const evidence = obligation?.evidence || {};
    const verified =
      obligation?.status === 'LIVE_PROVEN' &&
      evidence.delivery_guard === 'social-delivery-guarantee-v1' &&
      evidence.source_kind === 'artifact' &&
      evidence.provider_post_id === exact.id &&
      evidence.identity_gate_result !== 'FAIL' &&
      evidence.mira_identity_verified !== false &&
      evidence.asset_verified_under_current_contract !== false;
    if (!verified) return { action: 'BLOCK', reason: 'INSTAGRAM_PROVIDER_IDENTITY_UNVERIFIED' };
    return { action: 'NONE', reason: 'PROVIDER_COVERED_VERIFIED', providerPostId: exact.id || null };
  }

  return { action: 'NONE', reason: 'PROVIDER_COVERED' };
}

export function deliveryDecision({ channel, posts = [], artifact = null, idea = null, obligation = null } = {}) {
  const coverage = providerCoverageDecision({ channel, posts, artifact, obligation });
  if (coverage) return coverage;

  const source = selectDeliverySource({ channel, artifact, idea });
  if (!source) {
    const reason = channel === 'linkedin_personal'
      ? 'PERSONAL_TRUTH_ARTIFACT_REQUIRED'
      : channel === 'instagram'
        ? 'INSTAGRAM_MIRA_ARTIFACT_REQUIRED'
        : 'CONTENT_REQUIRED';
    return { action: 'BLOCK', reason };
  }
  return { action: 'CREATE', reason: 'DELIVERY_REQUIRED', source };
}
