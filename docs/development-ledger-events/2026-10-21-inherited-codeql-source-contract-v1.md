# Development ledger event — brain|historical-codeql-source-contract|20261021-v1

- Date: 2026-10-21
- Parent: #3742; dependency: #4573
- Base: d18ef16edac0e62058a51afee21cfe0b52a91e20
- Observed failed BRAIN run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39554866582
- Failure: obsolete CodeQL workflow file path in an inherited regression test, without current-main source breakage.
- Candidate fix: preserve original other tests and replace one missing-file/old-scope assertion with current exact protected CodeQL runtime contract checks.
- Red: ENOENT for retired workflow; green source-readback: 11/11 assertions checked on current CodeQL workflow; node and protected checks pending.
- Safety: no migrations, security bypass, customer/provider writes or production mutation.
