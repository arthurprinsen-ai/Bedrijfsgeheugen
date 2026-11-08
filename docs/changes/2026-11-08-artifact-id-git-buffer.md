# Required test: git listing buffer — 2026-11-08

## Problem
The required check `test` was red on every pull request, including the daily blog PR #5525, so nothing could merge.

## Cause
`tools/build/artifact-id.mjs` runs `git ls-files -s` through `execFileSync`, whose default output buffer is 1 MiB. The repository index is now about 1.2 MB, so the step died with `spawnSync git ENOBUFS`.

## Change
- `tools/build/artifact-id.mjs` and `tests/delivery-test-coverage-guard.test.mjs`: explicit `maxBuffer` of 256 MiB on the `git ls-files` call.
- `tests/brain-artifact-id-git-buffer-20261108.test.mjs` pins both calls, proves the 1 MiB default fails, and checks the planned-action trigger; new step in `required-test.yml`.
- Lesson, rule `GIT_LS_FILES_MUST_SET_MAXBUFFER`, planned-action trigger, learning, ledger event, two skill lines.

## Second cause behind the same red check
The `preflight` job of `Required test` fails earlier: `npm install` exits 1 because root `ffmpeg-static` downloads a binary in its postinstall and GitHub releases returned HTTP 504 (reproduced locally). `--silent` hid it. The same incident was fixed on 5 Nov only in `lane-backend.yml`.
- `required-test.yml`: preflight installs with `--ignore-scripts`. The exact Netlify parity install is unchanged (`tests/brain-composable-release-control-plane.test.mjs` pins its text), so that job can still hit the same download flake.
- `tests/brain-required-test-npm-install-20261108.test.mjs` pins both and the backend lane; lesson, rule `REQUIRED_TEST_NPM_INSTALL_MUST_SURVIVE_FFMPEG_DOWNLOAD`, trigger, learning.

## Not changed
No test weakened, no branch protection or repository setting touched.

## Known limit
Not proven until the required test of a pull request with this change is green. The two `npm install` steps of the daily blog workflow still run postinstall scripts. Other git or child-process calls without `maxBuffer` were not audited beyond a code search.
