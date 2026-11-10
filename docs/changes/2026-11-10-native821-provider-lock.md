# Originele Supabase 821/821 — behoud productiebewijs

10 november 2026. Oorspronkelijk Supabase-project `adhjwmvyoixzjtmiroln` rapporteert onafhankelijk **821 unieke toegepaste** migraties, met als 821e `20261110123000_original_content_handoff_no_aging_gap_v2`. SQL staat al in beschermd GitHub-main na gemergede PR #5556. Alleen de migratiehistorie-lock bleef op 820.

Herstel: append exact deze ene bewezen versie en naam aan `supabase/migration-history.lock.json`; behoud alle eerdere records en SQL identiek. Daarnaast bewaart de oude 819-regressietest zijn historische **prefix**, zodat toekomstige correcte migraties de vroegere geschiedenis niet vals als regressie markeren. De nieuwe 821-test controleert zowel deze exacte historische identiteit als volledige huidige bron/lock-pariteit.

Beschermde Required, CodeQL en officiële Supabase Preview blijven verplicht. Geen directe productie-DDL, verzender, scheduler of provider-omweg. De oude content- en leerverplichtingen zijn alleen opnieuw geïnspecteerd, nog niet daadwerkelijk afgerond.

Bestaand centraal incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
