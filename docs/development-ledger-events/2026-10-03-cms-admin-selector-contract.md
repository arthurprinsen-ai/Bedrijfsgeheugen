# CMS admin selector contract — 2026-10-03

Obligation: `cms-admin-selector-runtime-20261003-v1`

Observed failure: `/cms` first failed because event binding received a collection instead of a DOM element, then exposed a remaining collection binding still using the single-element helper.

Closure: distinct single/collection selector helpers, corrected `data-area` collection binding, executable historical replay, and runtime `/cms` page-check as terminal acceptance.
