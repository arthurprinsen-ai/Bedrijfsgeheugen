#!/usr/bin/env bash
set -euo pipefail

state="${1:?state is required}"
context="${2:?context is required}"
description="${3:?description is required}"

case "$state" in
  error|failure|pending|success) ;;
  *)
    echo "Unsupported GitHub commit status state: $state" >&2
    exit 2
    ;;
esac

: "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"
: "${GITHUB_SHA:?GITHUB_SHA is required}"
: "${GITHUB_SERVER_URL:?GITHUB_SERVER_URL is required}"
: "${GITHUB_RUN_ID:?GITHUB_RUN_ID is required}"
: "${GH_TOKEN:?GH_TOKEN is required}"

target_url="${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}"

for attempt in 1 2 3; do
  if gh api --method POST     -H "Accept: application/vnd.github+json"     "repos/${GITHUB_REPOSITORY}/statuses/${GITHUB_SHA}"     -f state="$state"     -f context="$context"     -f description="$description"     -f target_url="$target_url" >/dev/null; then
    echo "Published commit status context=$context state=$state sha=$GITHUB_SHA"
    exit 0
  fi
  sleep "$attempt"
done

echo "Failed to publish commit status context=$context state=$state sha=$GITHUB_SHA" >&2
exit 1
