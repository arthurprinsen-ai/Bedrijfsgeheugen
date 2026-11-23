# 2026-10-28 — Frisse blik lead endpoint

- Obligation: website|sales|frisse-blik-lead-endpoint|20261028-v1.
- Defect: empty WEBHOOK_URL, lead submissions lost silently.
- Change: one line in frisse-blik.html; new edge function lead-intake (deployed, tested live).
- Proof pending: real submission creates one commercial_leads row.
