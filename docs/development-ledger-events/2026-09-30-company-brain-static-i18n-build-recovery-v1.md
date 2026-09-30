# 2026-09-30 — Company Brain static i18n build recovery

- type: `RECOVERY`
- fingerprint: `website|static-i18n|post-shell-final-string-coverage|v1`
- obligation: `company-brain-static-i18n-recovery-v1`
- owner: `powerhouse-terminal-delivery`
- signal: Company Brain production build failed with static English cache enforcement after final shell/CRO transforms.
- root_cause: source-level translations did not cover all exact post-shell final-artifact strings.
- fix: extend the canonical Company Brain static i18n patch with final-artifact keys; add regression and permanent chat/agent/skill governance.
- evidence: failed Netlify deploys `6abcc8e43755c1132dfb791f`, `6abcc939f771a22b21c16fb6`; production-source replay reached localized route generation and exposed the missing-string class.
- terminal_gate: exact protected-main Netlify production + public NL/EN readback.
- status: `RECOVERY_IN_PROGRESS`
