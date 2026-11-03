# 2026-11-02 — Open security evidence-expiry incident and candidate

Obligation-ID: powerhouse-security-expired-observation-false-green-20261102-v1
Original incident: `powerhouse|security|expired-management-proof-client-can-green|20261102-v1`.
Cause: rendering source used cached positive status and evidence availability but did not independently test expires_at when database snapshot was stale. This is a truthful-status defect, not proof of unauthorized data access.
Prevention: require current and parseable observed_at/expires_at for each provider control, a fresh snapshot timestamp, independent negative tests at expiry boundary, no old-cache green.
Evidence owner: existing ONE BRAIN/Powerhouse/Heartbeat Security Agent; no separate scheduling, disclosure or production direct-write shortcut.
Candidate state: OPEN until original protected release, exact production commit and login-scoped browser readback with old cached PASS rendered non-green.
