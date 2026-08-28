const green = value => String(value || '').toLowerCase() === 'green';
const ready = value => String(value || '').toLowerCase() === 'ready';

const iphoneSafeMedia = media => Boolean(
  media &&
  Number(media.width) === 1920 &&
  Number(media.height) === 1080 &&
  Number(media.fps) === 30 &&
  String(media.codec || '').toLowerCase() === 'h264' &&
  String(media.pixel_format || '').toLowerCase() === 'yuv420p' &&
  media.has_audio === false &&
  media.faststart === true
);

export function evaluatePromotion(state = {}) {
  if (state.hard_boundary) {
    return {
      state: 'BLOCKED_HARD_BOUNDARY',
      action: 'BLOCKED_HARD_BOUNDARY',
      reason: state.hard_boundary_reason || 'hard boundary'
    };
  }

  if (String(state.production_status || '').toLowerCase() === 'red') {
    return {
      state: 'ROLLBACK_REQUIRED',
      action: 'ROLLBACK_LAST_KNOWN_GOOD',
      rollback_sha: state.last_known_good_sha || null
    };
  }

  if (
    green(state.production_status) &&
    state.production_sha &&
    state.production_sha === state.candidate_sha &&
    ready(state.production_deploy_status)
  ) {
    return {
      state: 'PRODUCTION_GREEN',
      action: 'PRODUCTION_GREEN',
      production_sha: state.production_sha
    };
  }

  if (!state.candidate_sha || !state.tested_head_sha || state.candidate_sha !== state.tested_head_sha) {
    return { state: 'OPEN_REPAIR', action: 'VERIFY_CANDIDATE' };
  }

  if (!state.base_sha || !state.current_main_sha || state.base_sha !== state.current_main_sha) {
    return { state: 'OPEN_REPAIR', action: 'VERIFY_CANDIDATE' };
  }

  const candidateRed = !green(state.ci_status) || !green(state.preview_status);
  if (candidateRed) {
    const retries = Number(state.retry_count_for_hypothesis || 0);
    return {
      state: 'OPEN_REPAIR',
      action: retries >= 2 ? 'CHANGE_HYPOTHESIS' : 'REPAIR',
      owner_agent: state.owner_agent || null
    };
  }

  if (state.media_contract_required) {
    if (!iphoneSafeMedia(state.media_derivative)) {
      return { state: 'OPEN_REPAIR', action: 'NORMALIZE_MEDIA' };
    }

    if (!state.media_derivative_validated) {
      return { state: 'OPEN_REPAIR', action: 'VERIFY_MEDIA' };
    }

    if (!green(state.iphone_runtime_status)) {
      return { state: 'OPEN_REPAIR', action: 'VERIFY_IPHONE_RUNTIME' };
    }
  }

  if (!state.rollback_ready || !state.last_known_good_sha) {
    return { state: 'OPEN_REPAIR', action: 'VERIFY_CANDIDATE' };
  }

  return {
    state: 'PROMOTION_READY',
    action: 'PROMOTE_EXACT_SHA',
    candidate_sha: state.candidate_sha
  };
}
