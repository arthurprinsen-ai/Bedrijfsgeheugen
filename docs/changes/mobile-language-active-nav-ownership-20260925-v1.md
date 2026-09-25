# Mobile NL/EN active-navigation ownership fix

The mobile language selector was not guaranteed to remain in the navigation that users actually see. The legacy mobile DOM was used as the source for a newer shared drill-down navigation and then hidden.

The repair makes the visible shared mobile navigation the deterministic owner of the selector while keeping the i18n runtime able to remount it after navigation construction. Static i18n reconciliation is now idempotent for the mobile selector too.

Production completion requires the visible mobile control to complete NL → EN → NL on the live pricing route without exposing the runtime translation error.
