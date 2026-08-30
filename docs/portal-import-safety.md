# Native portal import safety

The native `Openen` migration must preserve these invariants:

- parse and validate the selected JSON before any portal state changes;
- show a user-visible change preview before commit;
- require an explicit confirmation action before mutation;
- never auto-confirm an import;
- retain the current in-memory state as last-known-good until the authenticated server write succeeds;
- on parse, validation or write failure, keep the current state active and show a recoverable error;
- the compatibility bridge remains the fallback until the exact native candidate is preview-green and production-green.
