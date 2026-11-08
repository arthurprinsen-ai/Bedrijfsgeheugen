# Git listing buffer — development ledger

- 2026-11-08, owner: build artifact id tool and delivery test-coverage guard.
- Fingerprint: `ci|git|shared|ls-files-default-maxbuffer|20261108-v1`.
- Source: required `test` red on every PR with `spawnSync git ENOBUFS`.
- Repair: explicit `maxBuffer` on the `git ls-files` calls; test, rule and trigger added.
- Status: CODE_CANDIDATE, not verified until a protected required test is green.
- Second cause (fingerprint `ci|npm|required-test|ffmpeg-static-postinstall-504-repeat|20261108-v1`): preflight `npm install` failed on the ffmpeg-static postinstall download (HTTP 504); preflight and the parity install now use `--ignore-scripts`.
