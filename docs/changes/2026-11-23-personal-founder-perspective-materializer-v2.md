# LinkedIn persoonlijk — bronselectie SQL afstemmen op bestaande trusted-advisor-afspraken

De actuele productiebronfunctie powerhouse_materialize_source_backed_channel_candidates_v2 quarantaineert zakelijke persoonlijke bronnen tenzij zij als geverifieerd bouwmoment herkenbaar zijn. De apart beveiligd gebouwde JS-redactiecorrectie in PR #6128 kan daardoor niet zelfstandig volstaan.

Deze afzonderlijke beveiligde SQL-migratie werkt alleen de bestaande v2-functie bij, inclusief dezelfde SECURITY DEFINER en fixed search_path. Een eigen opinie/onderzoeksafweging mag uitsluitend door indien 1) een direct gebruikersfeit met eigen bronherkomst aanwezig is; 2) identiteit en volledig broncontract aantoonbaar juist zijn; 3) eventuele externe onderzoeksclaims eigen geverifieerde evidence hebben; 4) er geen gefingeerd klantresultaat, bedrijfsstem of ongeautoriseerde privé-informatie wordt toegevoegd. De oude builder-uitzondering en quarantaine van generieke bedrijfs-/nieuwscontent blijven behouden.

Dit is geen nieuwe agent, writer, cron, providerconnector of automatische post. Na Required/CodeQL en Supabase preview zijn merge, native functieversie/source-hash en latere individuele provider-readbacks afzonderlijk vereist. Raadpleeg ook https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/6128 en https://app.notion.com/p/3e1da36aac8a818686c7cc61ff52d7f2.

**Status: source patch only; not independently verified live.**
