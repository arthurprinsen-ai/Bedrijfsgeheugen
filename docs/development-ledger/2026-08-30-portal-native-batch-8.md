# Portal native legacy batch 8 — production outcome

Status: PRODUCTION_GREEN

- PR: #271
- Merge commit: `dedc05436f2c77be48ad7a9e1c8144e0405eace8`
- Native workspaces: `dna`, `downloaden`, `afdrukken`
- `openen` remains on compatibility bridge because import mutates customer state and requires preview + explicit confirmation.
- Production deploy: `6a93e8ce1311e1000842dd8f`
- Netlify state: `ready`
- Redirect rules: 75, no errors
- Header rules: 16, no errors
- Functions: 7
- Edge functions: 1
- Secret scan: 0 matches

Operational learning: a failed GitHub contents write caused the workflow to stop because an existing file was treated as a create without its blob SHA. Recovery must inspect branch/file state first and resume from the existing branch/PR rather than aborting the loop.
