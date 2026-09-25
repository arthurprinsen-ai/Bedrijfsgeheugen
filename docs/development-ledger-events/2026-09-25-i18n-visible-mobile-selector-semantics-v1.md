# 2026-09-25 — visible mobile selector semantics

Production deploy `c2bf6d4f059307579686f1b61d66f195b0ee2af7` was ready and the pricing HTML contained a mobile language selector, but the terminal browser proof still failed.

Root cause: the verifier preferred `#bgSharedMobileNav [data-bg-language-select]` whenever that element existed, even when it was hidden. A hidden duplicate host therefore masked the visible fallback.

Repair: resolve `[data-bg-language-select]:visible` after opening the mobile navigation, and emit host diagnostics only if no visible control exists.
