# Platform navigation product route — 2026-10-03

Production click readback showed route drift between navigation shells:
- desktop Platform → /product;
- mobile/overlay Platform → /bedrijfsgeheugen.

Recovery:
- canonical destination is /product;
- shared navigation runtime repairs outdated Platform anchors;
- repair also runs after late DOM/CMS mutations;
- production acceptance requires readback of the real Platform click destination.

Scope is limited to public website navigation.
