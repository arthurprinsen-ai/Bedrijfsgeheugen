# 2026-09-28 — FALSE_FAILURE — LinkedIn provider write vs readback

- **Fingerprint:** `linkedin-company-create-ack-over-readback-v1`
- **Observed:** LinkedIn company post was visibly live and had provider URN `urn:li:share:7510281040192602112`, while later API read/admin calls returned 401/403.
- **Impact:** Powerhouse incorrectly classified a successful publication as blocked/failed, triggering unnecessary authorization diagnostics and risking duplicate recovery attempts.
- **Root cause:** provider write acknowledgement, exact post readback, and organization ACL capability were treated as one capability.
- **Fix:** provider-create success plus durable post URN is now terminal publication evidence; readback permission failures remain verification limitations only.
- **Safety:** external URN is persisted immediately, `republish_forbidden=true`, and reconciliation is exact-ID only.
- **Daily invariant:** watchdog/self-healing may never label an already provider-created post as a silent publication failure solely because readback/admin inspection is unavailable.
- **Regression:** `tests/brain-linkedin-composio-authority.test.mjs`.
- **Human evidence:** visible LinkedIn Bedrijfsgeheugen company-page post supplied on 2026-09-28.
