# Main rood door twee verouderde testaannames

Besluit Arthur 17 nov 2026: los main op en zet de Rituals-PR's live.

- `brain-original-provider874-lock-reconcile-20261116`: pinde exact 874 regels en `captured_at` van 16 nov. De lock op main staat inmiddels terecht op 879. De test bewaakt nu de positie van mux v3 (index 873), uniekheid en volgorde, niet het aantal.
- `brain-merge-group-admission-authority-v1`: zocht letterlijk `context.prNumber ?`; de workflow gebruikt `context.prNumber && [...] ? ...`. De regex accepteert nu beide vormen. Workflow en lock zijn niet gewijzigd.
- Geen test overgeslagen, lock en workflow ongemoeid.
- Niet bewezen: volledige backend-lane op exact-head en productie-readback.
