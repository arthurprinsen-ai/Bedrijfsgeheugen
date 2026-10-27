# 2026-09-29 — CONTRACT_CHANGE — Live promotion governance closure

- **Fingerprint:** `powerhouse|live-promotion|governance-closure|2026-09-29-v1`
- **Trigger:** gebruiker vroeg na live-promotie expliciet om skills, agents, chats, Powerhouse, borging en documentatie bij te werken.
- **Canonical production identity:** main `204269314239ea2cc56a00a0da1ed87a5056415f`; Netlify `6abbdf73c4c7d80008d9811f`; state `ready`; context `production`.
- **Contract:** live promotion en governance writeback behoren voortaan tot één lineage.
- **Required writeback:** skill → AGENTS/chat contract → continuity policy → Brain learning → ledger/docs → System Map → read-after-write.
- **Truth rule:** exact deploy is alleen deploymentbewijs; capability-outcomes blijven onafhankelijk gated.
- **Owner:** Whole Brain / Reliability / Delivery Governance.


## Expliciete chat/continuity-projectie

De closure is aanvullend rechtstreeks geprojecteerd naar `config/brain-chat-learning-contract.json` en `.agents/skills/powerhouse-continuity/SKILL.md`. Daarmee erven toekomstige chats én continuity/recovery-agents deze regel expliciet, naast de universele AGENTS-policy.
