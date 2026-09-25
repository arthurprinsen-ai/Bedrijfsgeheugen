# Apply-i18n compact mobile syntax recovery — 25 September 2026

The production snapshot for current `main` failed even after Netlify authentication and exact-source fallback were working. Exact build reproduction isolated the failure to `tools/site-shell/apply-i18n.mjs`: a duplicated function body had been pasted inside a string concatenation in the compact mobile drawer branch.

The recovery restores the intended behavior: prefix the matched compact mobile CTA with the mobile language control using `MOBILE_LANGUAGE + '$&'`. A syntax regression test now runs `node --check` and guards against reintroducing the malformed pasted-function pattern.

Terminal completion still requires protected merge, Netlify `commit_ref === main`, and public NL/EN route readback.
