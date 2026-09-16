const COVERED = new Set(['scheduled', 'sending', 'sent']);
const BLOCKED_ARTIFACT_STATES = new Set(['blocked', 'failed']);

export function normalizeText(value = '') {
  return String(value).replace(/\r\n/g, '\n').replace(/[\t ]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

export function hasProviderCoverage({ posts = [] } = {}) {
  return posts.some((post) => COVERED.has(String(post?.status || '').toLowerCase()));
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

function normalizeIdeaMedia(idea) {
  return (idea?.content?.media || [])
    .filter((item) => item?.url && ['image', 'video'].includes(String(item?.type || '').toLowerCase()))
    .map((item) => ({ type: String(item.type).toLowerCase(), url: item.url, alt: item.alt || null }));
}

function artifactMedia(artifact) {
  const evidence = artifact?.generation_evidence || {};
  const url = evidence.final_media_url || evidence.media_url || evidence.asset_url || evidence.creative_url || null;
  const gatePassed = evidence.media_gate_result === 'PASS' || evidence.asset_verified === true;
  if (!url || !gatePassed) return [];
  const mediaType = String(evidence.media_type || 'image').toLowerCase() === 'video' ? 'video' : 'image';
  return [{ type: mediaType, url, alt: evidence.media_alt || null }];
}

export function selectDeliverySource({ channel, artifact = null, idea = null } = {}) {
  if (channel === 'linkedin_personal') {
    if (!validPersonalArtifact(artifact)) return null;
    return { kind: 'artifact', text: artifact.body, ideaId: null, media: [] };
  }

  if (artifactUsable(artifact)) {
    return {
      kind: 'artifact',
      text: artifact.body,
      ideaId: null,
      media: artifactMedia(artifact),
    };
  }

  const ideaText = normalizeText(idea?.content?.text || '');
  if (!ideaText) return null;
  return {
    kind: 'idea',
    text: idea.content.text,
    ideaId: idea?.id || null,
    media: normalizeIdeaMedia(idea),
  };
}

export function deliveryDecision({ channel, posts = [], artifact = null, idea = null } = {}) {
  if (hasProviderCoverage({ posts })) return { action: 'NONE', reason: 'PROVIDER_COVERED' };
  const source = selectDeliverySource({ channel, artifact, idea });
  if (!source) {
    return {
      action: 'BLOCK',
      reason: channel === 'linkedin_personal' ? 'PERSONAL_TRUTH_ARTIFACT_REQUIRED' : 'CONTENT_REQUIRED',
    };
  }
  if (channel === 'instagram' && !source.media.length) {
    return { action: 'BLOCK', reason: 'FINAL_MEDIA_REQUIRED' };
  }
  return { action: 'CREATE', reason: 'DELIVERY_REQUIRED', source };
}
