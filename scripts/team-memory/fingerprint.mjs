import crypto from 'node:crypto';

const clean = v => String(v ?? '').trim().toLowerCase().replace(/\s+/g,' ');
const hash = value => crypto.createHash('sha256').update(value).digest('hex').slice(0,16);

export function fingerprintEvent(event = {}) {
  const semantic = {
    type: clean(event.type),
    source: clean(event.source),
    component: clean(event.component),
    error_class: clean(event.error_class),
    opportunity_key: clean(event.opportunity_key),
    query: clean(event.query),
    route: clean(event.route),
    entity: clean(event.entity)
  };
  return `${semantic.type || 'event'}|${semantic.component || 'unknown'}|${hash(JSON.stringify(semantic))}`;
}

export function dedupeKey(event = {}, state = {}) {
  const fingerprint = fingerprintEvent(event);
  const stateHash = hash(JSON.stringify({
    baseline: state.baseline ?? null,
    commit_sha: state.commit_sha ?? null,
    deploy_id: state.deploy_id ?? null,
    config_version: state.config_version ?? null
  }));
  return `${fingerprint}|${stateHash}`;
}
