import crypto from 'node:crypto';

const SHA_RE = /^[a-f0-9]{40}$/i;
const WRITER_RE = /^[a-z0-9][a-z0-9-]{1,79}$/;

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, stable(value[key])]),
    );
  }
  return value;
}

function digest(value) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(stable(value)))
    .digest('hex');
}

function requireSha(value, code) {
  const sha = String(value || '').toLowerCase();
  if (!SHA_RE.test(sha)) throw new Error(code);
  return sha;
}

function normalizeFiles(files) {
  if (!Array.isArray(files)) return [];
  return [...new Set(files.map((file) => String(file || '').trim()).filter(Boolean))].sort();
}

export function createWriterCandidate({
  writer,
  baseSha,
  runId,
  changedFiles,
  allowedFiles,
  rollbackSha,
} = {}) {
  const normalizedWriter = String(writer || '').toLowerCase();
  if (!WRITER_RE.test(normalizedWriter)) throw new Error('INVALID_WRITER');

  const normalizedBaseSha = requireSha(baseSha, 'INVALID_BASE_SHA');
  const normalizedRollbackSha = requireSha(rollbackSha, 'INVALID_ROLLBACK_SHA');
  const normalizedRunId = String(runId || '').trim();
  if (!normalizedRunId) throw new Error('INVALID_RUN_ID');

  const normalizedChangedFiles = normalizeFiles(changedFiles);
  const normalizedAllowedFiles = normalizeFiles(allowedFiles);
  const identity = {
    writer: normalizedWriter,
    baseSha: normalizedBaseSha,
    runId: normalizedRunId,
    changedFiles: normalizedChangedFiles,
    allowedFiles: normalizedAllowedFiles,
    rollbackSha: normalizedRollbackSha,
  };
  const fullDigest = digest(identity);

  return Object.freeze({
    schemaVersion: 1,
    state: 'CANDIDATE_ONLY',
    writer: normalizedWriter,
    runId: normalizedRunId,
    branch: `writer/${normalizedWriter}/${fullDigest.slice(0, 16)}`,
    idempotencyKey: `writer-candidate:${fullDigest}`,
    baseSha: normalizedBaseSha,
    rollbackSha: normalizedRollbackSha,
    changedFiles: normalizedChangedFiles,
    allowedFiles: normalizedAllowedFiles,
  });
}

export function validateWriterCandidate(candidate = {}) {
  requireSha(candidate.baseSha, 'INVALID_BASE_SHA');
  requireSha(candidate.rollbackSha, 'INVALID_ROLLBACK_SHA');

  if (candidate.state !== 'CANDIDATE_ONLY') throw new Error('INVALID_CANDIDATE_STATE');
  if (!WRITER_RE.test(String(candidate.writer || ''))) throw new Error('INVALID_WRITER');
  if (!/^writer\/[a-z0-9][a-z0-9-]{1,79}\/[a-f0-9]{16}$/.test(String(candidate.branch || ''))) {
    throw new Error('INVALID_CANDIDATE_BRANCH');
  }
  if (!/^writer-candidate:[a-f0-9]{64}$/.test(String(candidate.idempotencyKey || ''))) {
    throw new Error('INVALID_IDEMPOTENCY_KEY');
  }

  const changedFiles = normalizeFiles(candidate.changedFiles);
  const allowed = new Set(normalizeFiles(candidate.allowedFiles));
  const unapproved = changedFiles.filter((file) => !allowed.has(file));
  if (unapproved.length) {
    throw new Error(`UNAPPROVED_CHANGED_FILE:${unapproved.join(',')}`);
  }

  return Object.freeze({
    ok: true,
    writer: candidate.writer,
    branch: candidate.branch,
    changedFiles,
  });
}
