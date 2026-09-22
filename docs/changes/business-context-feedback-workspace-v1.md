# Business context feedback workspace

The living business context is now a two-way contract.

Powerhouse may infer a primary phase from verified business data and may detect simultaneous strategic events and goals, but the entrepreneur can now confirm or correct that interpretation directly in **Bedrijfssituatie & context**.

## Interaction

The workspace shows:
- the current Powerhouse context and health state;
- **Dit klopt** to explicitly confirm the current interpretation;
- **Pas situatie aan** to edit the primary company phase;
- multi-select strategic events such as funding, acquisition, sale, succession, restructuring and internationalisation;
- multi-select entrepreneur goals such as profit, cash, automation, valuation and exit readiness.

## Canonical writeback

User choices are stored under `portal.business_context`:
- `stage`;
- `events[]`;
- `goals[]`;
- `confirmed`;
- `confirmed_at`;
- `confirmation_source = entrepreneur`.

The existing Portal domain-state flush is reused. This means the update follows the same tenant-scoped business-input persistence, impact propagation and Brain sync as other canonical Portal inputs. No parallel context database or browser-only state was introduced.

## Trust rule

An inferred default is not silently promoted to fact. Only evidence-backed inference or explicit user confirmation is treated as confirmed context.
