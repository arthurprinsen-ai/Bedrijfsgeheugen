# Native mobile language chooser

Fingerprint: `global-i18n-native-mobile-select-v1`

The mobile menu language switch now follows the same interaction pattern as the supplied neno.co reference: one language field in the menu rather than two large side-by-side buttons.

The control is a real HTML `select`. On iPhone/Safari this opens the native iOS choice UI, including the checkmark next to the currently selected language. The options are English and Dutch.

The selected value is synchronized with the canonical Bedrijfsgeheugen locale state and still uses the same translation runtime. The change affects presentation and interaction only; it does not introduce a second locale authority.
