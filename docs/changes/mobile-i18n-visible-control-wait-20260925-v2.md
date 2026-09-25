# Mobile NL/EN browser readback wait — 25 September 2026

## Incident

Netlify production was already serving the exact protected `main` SHA `6417fa291ac08345369e1e143abf974fac54f0e4`, but the terminal pricing/i18n browser proof failed with:

`visible mobile language select is missing`

## Root cause

The mobile language select is not static markup in the canonical header. It is mounted by `assets/js/i18n.js` into the mobile drawer. The production verifier opened the drawer and immediately tested locator count, so the assertion could execute before the dynamically mounted control became visible.

## Fix

The verifier now waits up to five seconds for the visible mobile language select before selecting English, and applies the same wait on the English-to-Dutch return path.

The actual functional proof remains unchanged: the gate still requires `/prijzen` → `/en/prijzen` → `/prijzen`, correct `html lang`, visible English pricing content, and no runtime language-switch failure.

## Prevention

Dynamic UI is verified as asynchronous state. Presence-only checks and hidden desktop fallbacks are not accepted as proof for the mobile viewport.

## Revision 3 — visibility-first host selection

Exact production on `c2bf6d4f059307579686f1b61d66f195b0ee2af7` proved the provider build, exact identity and pricing content, but the terminal browser gate still failed with:

`visible mobile language select is missing after opening mobile navigation`

The wait itself was no longer the problem. The verifier chose the shared selector with:

`sharedLanguage.count() ? sharedLanguage : legacyLanguage`

That tests DOM presence rather than active visibility. A hidden shared control could therefore be selected while a visible compact/legacy control existed.

The verifier now resolves only `:visible` language selects inside approved mobile hosts and applies the same rule on the EN→NL return path. Presence-only host selection is explicitly prohibited by regression.

