# PW MO14-jeugddatabase afgeschermd — 20 november 2026

## Beveiligingsprobleem
De twee historische tabellen voor opstellingen en jeugdbeoordelingen stonden achter RLS, maar hun oude anonieme policies waren te ruim. De jeugdgegevens mochten nooit door willekeurige bezoekers gelezen of geschreven kunnen worden.

## Live gerichte afscherming
Op het originele Supabase-project is de security-migratie `20261120134537_security_pw_mo14_private_player_data_20261120` uitgevoerd. De originele RLS-policies die anonieme SELECT/INSERT toestonden zijn verwijderd, en de anon/authenticated table grants zijn ingetrokken. De service-rol blijft beschikbaar voor expliciete servergeautoriseerde processen. Geen tabellen of inhoud verwijderd.

Read-only productiecontrole op 20 november 2026: voor **beide** tabellen RLS aan, geen policies, anonieme SELECT/INSERT onwaar, authenticated SELECT/INSERT onwaar, service SELECT waar. De lokale PW-coach in Netlify schrijft niet naar deze Supabase-tabellen, zodat de huidige appplannen niet verdwijnen.

## Opvolging
Als later een gedeelde beoordeling wordt gewenst, voeg eerst coachautorisatie, tenant-/teamcontrole, rate limiting en per-rol RLS toe. **Heropen nooit anonieme jeugdbeoordelingen** voor gemak. De provider staat beveiligd; de bron-PR moet nog aan de originele GitHub-controles voldoen voordat een bronmerge als voltooid geldt.

- Supabase beleid: https://supabase.com/docs/guides/database/postgres/row-level-security
- Bron-PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/6070
