#!/usr/bin/env bash
set -euo pipefail

manifest=/tmp/validated-writeback-files.txt
message=${1:-}

if [[ -z "$message" || ! -s "$manifest" ]]; then
  echo "::error::Validated manifest of commitbericht ontbreekt"
  exit 1
fi

mapfile -t expected < <(sort -u "$manifest")
mapfile -t actual < <({ git diff --name-only; git ls-files --others --exclude-standard; } | sed '/^$/d' | sort -u)
if [[ "${expected[*]}" != "${actual[*]}" ]]; then
  echo "::error::Worktree wijzigde na validatie; publication fail-closed"
  printf 'expected: %s\n' "${expected[*]}"
  printf 'actual:   %s\n' "${actual[*]}"
  exit 1
fi

git config user.name "Bedrijfsgeheugen Publisher"
git config user.email "actions@users.noreply.github.com"
for file in "${expected[@]}"; do
  git add -- "$file"
done

mapfile -t staged < <(git diff --cached --name-only | sort -u)
if [[ "${expected[*]}" != "${staged[*]}" ]]; then
  echo "::error::Staged set wijkt af van validated manifest"
  exit 1
fi

git commit -m "$message"

for attempt in 1 2 3; do
  if git push origin HEAD:main; then
    echo "WRITEBACK_PUBLISHED attempt=$attempt"
    exit 0
  fi

  echo "Push geweigerd; rebase op actuele main, poging $attempt/3"
  if ! git pull --rebase origin main; then
    git rebase --abort || true
    echo "::error::Rebaseconflict; fail-closed zonder force push"
    exit 1
  fi
done

echo "::error::Push faalde na drie begrensde pogingen"
exit 1
