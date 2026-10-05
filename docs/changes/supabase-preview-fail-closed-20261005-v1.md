# Supabase preview fail-closed op lege migraties

Datum: 5 oktober 2026

Tijdens de post-merge readback van PR #3740 bleek dat remote/local migratiehistorie kon afwijken terwijl lege migratiebestanden lokaal hetzelfde versienummer konden vertegenwoordigen.

De Supabase PR Preview Contract valideert daarom voortaan niet alleen bestandsnaam en unieke versie, maar ook dat iedere SQL-migratie daadwerkelijk niet-lege inhoud bevat. Lege placeholders mogen nooit worden gebruikt om history parity te simuleren.

De hosted Supabase Preview blijft daarnaast een verplichte protected-branch status check. Daardoor moeten broncontract en remote preview beide slagen voordat een Supabase-wijziging kan mergen.
