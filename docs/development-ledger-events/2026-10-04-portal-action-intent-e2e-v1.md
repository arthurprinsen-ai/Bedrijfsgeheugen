# Development ledger — Portal action intent E2E

- Datum: 2026-10-04
- Obligation-ID: portal-action-intent-e2e-20261004
- Scope: Portal V2 intelligence → authenticated Brain Action → readback.
- Frontend: Future Lens en semantic visual action controls emitten `portal:action-intent`.
- Runtime bridge: persistente Brain `Action`, `REQUESTED`, idempotent, same-lineage.
- Backend: bestaande `/api/brain-operating-loop`.
- Authority: bestaande Supabase Brain operating authority / `brain_records`.
- Geen DDL en geen parallelle state store.
- Regressies: central Brain + portal bridge.
