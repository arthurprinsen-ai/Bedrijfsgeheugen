#!/usr/bin/env bash
set -euo pipefail

candidate_branch="${1:?candidate branch required}"
repo="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY required}"

mapfile -t matches < <(
  gh pr list --repo "$repo" --head "$candidate_branch" --base main --state open --limit 100 --json number --jq '.[].number'
)
if [ "${#matches[@]}" -ne 1 ]; then
  echo "::error::WRITER_SHADOW_PR_IDENTITY_AMBIGUOUS:$candidate_branch:${#matches[@]}"
  exit 1
fi

pr_number="${matches[0]}"
pr_json="$(gh api "repos/$repo/pulls/$pr_number")"
base_sha="$(jq -r '.base.sha' <<<"$pr_json")"
head_sha="$(jq -r '.head.sha' <<<"$pr_json")"
head_ref="$(jq -r '.head.ref' <<<"$pr_json")"

if [ "$head_ref" != "$candidate_branch" ]; then
  echo "::error::WRITER_SHADOW_HEAD_REF_DRIFT:$candidate_branch:$head_ref"
  exit 1
fi
if [[ "$head_ref" != writer/* ]]; then
  echo "::error::WRITER_SHADOW_NON_WRITER_BRANCH:$head_ref"
  exit 1
fi

gh workflow run repo-writer-candidate-shadow.yml \
  --repo "$repo" \
  --ref main \
  -f pr_number="$pr_number" \
  -f base_sha="$base_sha" \
  -f head_sha="$head_sha" \
  -f candidate_branch="$head_ref"

echo "WRITER_SHADOW_DISPATCHED:$pr_number:$base_sha:$head_sha:$head_ref"
