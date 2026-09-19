# SEO clean URL recovery — bedrijf-overdraagbaar-maken

- Obligation-ID: seo-clean-url-bedrijf-overdraagbaar-maken-v1
- Adds the missing permanent 301 redirect from `/bedrijf-overdraagbaar-maken.html` to `/bedrijf-overdraagbaar-maken`.
- Keeps the existing current-main `netlify.toml` configuration intact and adds only the missing redirect block.
- Adds a deterministic regression test so the redirect cannot silently disappear again.
- Carries Brain learning and development-ledger evidence in the same delivery lineage.

## Recovery after serialization silent-drop
The first recovery candidate was closed after its branch became equal to a newer main epoch, but current main did not contain the redirect or its closure artifacts. This rebuild uses exact current main as the base and fails closed unless the bounded five-file delta is present before the branch ref moves.
