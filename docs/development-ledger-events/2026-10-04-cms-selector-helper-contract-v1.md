# Development ledger — CMS selector helper repair\n\n- Datum: 2026-10-04\n- Fout: `/cms` JavaScript TypeError door overschreven DOM-helper.\n- Root cause: dubbele `var $` declaratie.\n- Herstel: aparte single- en multi-selector helpers.\n- Regressie: `tests/brain-cms-admin-selector-contract.test.mjs`.\n
- Closure: de full-page diagnose blijft de `/cms` runtimefout als release-evidence bewaken.
