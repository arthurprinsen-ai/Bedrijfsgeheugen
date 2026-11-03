# Securitymigratie — herstelde GitHub–Supabase bronregistratie

Een goedgekeurde databasebeveiligingswijziging was al toegepast in Supabase. De bronregistratie in GitHub liep één migratie achter, waardoor de volledige BRAIN-controle terecht rood bleef.

We hebben de productiebron opnieuw gelezen en exact 791 migraties vastgesteld. De eerste 790 waren identiek aan het lockbestand; alleen `20261102141045_writer_control_fixed_search_path_v1` moest worden toegevoegd. Dit is een bronregistratiecorrectie, **geen tweede uitvoering van de databasewijziging**.

De regressietest controleert de originele 790 identiteiten, de nieuwe versie en naam, de bestaande uitvoerbare migratie en unieke versies. De bestaande Security Agent bewaakt voortaan dat een provider-applied security migration en de vastgelegde bronidentiteit samen sluiten, zonder een test te onderdrukken.

Voor productiegroen zijn na deze kandidaat de oorspronkelijke Required/BRAIN/CodeQL, beschermde merge en terminal/providerreadback nodig. De aparte open Supabase-RPC-waarschuwing en Netlify-toegangskwestie blijven onafhankelijk open.
