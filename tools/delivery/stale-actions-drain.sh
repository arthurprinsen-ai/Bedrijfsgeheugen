#!/usr/bin/env bash
set -euo pipefail

OPEN_PRS_JSON="${OPEN_PRS_JSON:-.artifacts/open-prs.json}"
EVIDENCE_NDJSON="${EVIDENCE_NDJSON:-.artifacts/stale-actions-drain.ndjson}"
mkdir -p "$(dirname "$OPEN_PRS_JSON")" "$(dirname "$EVIDENCE_NDJSON")"
[ -f "$OPEN_PRS_JSON" ] || gh api --paginate --slurp "repos/${GITHUB_REPOSITORY}/pulls?state=open&per_page=100" | jq 'add' > "$OPEN_PRS_JSON"
touch "$EVIDENCE_NDJSON"

protected_post_merge_workflow() {
  case "$1" in
    ".github/workflows/obligation-terminal-closure.yml"|".github/workflows/powerhouse-merged-branch-cleanup.yml")
      return 0 ;;
    *) return 1 ;;
  esac
}

age_seconds() {
  local timestamp="$1" epoch
  epoch="$(date -u -d "$timestamp" +%s 2>/dev/null || echo 0)"
  [ "$epoch" -gt 0 ] || { echo 0; return; }
  echo $(( $(date -u +%s) - epoch ))
}

record() {
  jq -cn "$@" >> "$EVIDENCE_NDJSON"
}

cancel_run() {
  local run_id="$1" branch="$2" run_sha="$3" reason="$4" latest_status cancel_mode=""
  latest_status="$(gh api "repos/${GITHUB_REPOSITORY}/actions/runs/${run_id}" --jq '.status' 2>/dev/null || echo unknown)"
  case "$latest_status" in queued|in_progress|pending|waiting|requested) ;; *) return 0 ;; esac
  if gh api -X POST "repos/${GITHUB_REPOSITORY}/actions/runs/${run_id}/cancel" >/dev/null 2>&1; then
    cancel_mode=normal-cancel
  elif gh api -X POST "repos/${GITHUB_REPOSITORY}/actions/runs/${run_id}/force-cancel" >/dev/null 2>&1; then
    cancel_mode=force-cancel
  elif gh api -X DELETE "repos/${GITHUB_REPOSITORY}/actions/runs/${run_id}" >/dev/null 2>&1; then
    cancel_mode=delete-fallback
  else
    latest_status="$(gh api "repos/${GITHUB_REPOSITORY}/actions/runs/${run_id}" --jq '.status' 2>/dev/null || echo unknown)"
    record --arg type CANCEL_RUN_BLOCKED --argjson id "$run_id" --arg branch "$branch" --arg sha "$run_sha" --arg reason "$reason" --arg status "$latest_status"       '{type:$type,run_id:$id,branch:$branch,head_sha:$sha,reason:$reason,status:$status,blocker:"GITHUB_API_UNCANCELLABLE"}'
    return 0
  fi
  record --arg type CANCEL_RUN --argjson id "$run_id" --arg branch "$branch" --arg sha "$run_sha" --arg reason "$reason" --arg mode "$cancel_mode"     '{type:$type,run_id:$id,branch:$branch,head_sha:$sha,reason:$reason,mode:$mode}'
}

for status in queued in_progress; do
  gh api --paginate "repos/${GITHUB_REPOSITORY}/actions/runs?status=${status}&per_page=100"     --jq '.workflow_runs[] | {id,head_branch,head_sha,status,created_at,updated_at,path,event} | @json' |
  while read -r run_json; do
    run_id="$(jq -r '.id' <<<"$run_json")"
    branch="$(jq -r '.head_branch // ""' <<<"$run_json")"
    run_sha="$(jq -r '.head_sha // ""' <<<"$run_json")"
    run_status="$(jq -r '.status // ""' <<<"$run_json")"
    created_at="$(jq -r '.created_at // ""' <<<"$run_json")"
    updated_at="$(jq -r '.updated_at // .created_at // ""' <<<"$run_json")"
    workflow_path="$(jq -r '.path // ""' <<<"$run_json")"

    [ -n "$branch" ] || continue
    [ "$branch" != main ] || continue
    protected_post_merge_workflow "$workflow_path" && continue

    current_pr_head="$(jq -r --arg branch "$branch" '[.[] | select(.head.ref == $branch and .state == "open") | .head.sha][0] // empty' "$OPEN_PRS_JSON")"
    safe_cancel=false
    reason=""

    if [ -n "$current_pr_head" ]; then
      if [ "$current_pr_head" != "$run_sha" ]; then
        if [ "$run_status" = queued ] || [ "$(age_seconds "$updated_at")" -ge 300 ]; then
          safe_cancel=true
          reason=STALE_PR_HEAD
        fi
      fi
    else
      encoded_branch="$(jq -rn --arg v "$branch" '$v|@uri')"
      branch_json="$(gh api "repos/${GITHUB_REPOSITORY}/branches/${encoded_branch}" 2>/dev/null || true)"
      if [ -z "$branch_json" ]; then
        if [ "$run_status" = queued ] && [ "$(age_seconds "$created_at")" -ge 60 ]; then
          safe_cancel=true
          reason=MISSING_NON_MAIN_BRANCH
        elif [ "$run_status" = in_progress ] && [ "$(age_seconds "$updated_at")" -ge 300 ]; then
          safe_cancel=true
          reason=MISSING_NON_MAIN_BRANCH
        fi
      elif [ "$(jq -r '.protected // true' <<<"$branch_json")" = false ]; then
        ahead="$(gh api "repos/${GITHUB_REPOSITORY}/compare/main...${encoded_branch}" --jq '.ahead_by' 2>/dev/null || echo UNPROVEN)"
        if [ "$ahead" = 0 ]; then
          if [ "$run_status" = queued ] || [ "$(age_seconds "$updated_at")" -ge 300 ]; then
            safe_cancel=true
            reason=MERGED_OR_CONTAINED_BRANCH
          fi
        elif [ "$run_status" = queued ] && [ "$(age_seconds "$created_at")" -ge 21600 ]; then
          safe_cancel=true
          reason=STALE_QUEUED_NO_OPEN_PR
        fi
      fi
    fi

    [ "$safe_cancel" = true ] || continue
    cancel_run "$run_id" "$branch" "$run_sha" "$reason"
  done
done
