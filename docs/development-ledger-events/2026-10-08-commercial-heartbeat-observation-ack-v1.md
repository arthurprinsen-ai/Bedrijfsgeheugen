# Commercial heartbeat transport acknowledgement — 2026-10-08

- **Obligation:** commercial-heartbeat-observation-ack-20261008-v1
- **Source:** production SQL readback, provider-owned Netlify → Supabase Edge implementation, external scheduler regression gate.
- **Defect:** an honestly unproven commercial day invalidated the heartbeat durable receipt, causing the existing external runner to roll back measurement and retry.
- **Scope:** one additive SQL function-replacement migration, a regression test, learning and documentation. No duplicate publisher or scheduled owner.
- **Success contract:** scheduled five-minute heartbeat stores `state=observed`, `data_quality=VERIFIED`, daily commercial proof remains false and the Brain obligation OPEN until actual provider IDs. Malformed assurance and broken operational regression must still be rejected.
- **Delivery:** protected CI → official preview → merge → production migration → first natural scheduled run/readback. Never mark terminal on PR approval alone.
