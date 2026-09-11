# Portal V2 Project Navigation Implementation Notes

The implementation keeps all existing Portal V2 routing and state contracts intact. The Project layer is a navigation/composition layer only.

Current mappings for legacy labels that do not yet have a distinct canonical V2 page are intentionally routed to the nearest existing native V2 capability, without inventing new data or duplicating business logic:

- Uren & facturen → Waarde en financiering
- Integraties → Koppelingen
- Notities → Documenten
- Activiteit → Wijzigingen
- Team & toegang → Gebruikers

These mappings are explicit in `PROJECT_GROUPS`; they can later be replaced by distinct native page ids without changing the global Project navigation contract.
