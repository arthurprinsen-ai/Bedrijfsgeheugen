# 22 oktober 2026 — LinkedIn persoonlijk: veilige hervatting van verlopen publicatieautoriteit

Fingerprint: `powerhouse|linkedin-personal-expired-authority-recover|20261022-v1`. Huidige eigenaar: bestaande `powerhouse-social-publisher`. Geen nieuw cronjob, kanaal, sender of publieke claim.

**Bewezen productiestatus:** persoonlijke LinkedIn-beslissing `publish/blocked`, fout `PUBLICATION_AUTHORITY_DENIED:DAILY_CHANNEL_PUBLICATION_ALREADY_CLAIMED`, zonder extern publicatiebewijs. Alle drie dag-leases waren ongebruikt, laatste verlopen om 09:20 UTC; er bestond geen persoonlijke dag-reservering in `powerhouse_publication_uniqueness_v1`. Zowel beslissing als verplichting heeft aantoonbaar geen provider side-effect.

**Oorzaak:** de bestaande providerpublisher herstelde zulke onomkeerbaar *niet uitgevoerde* reserveringen uitsluitend voor LinkedIn bedrijf. Daarom werd persoonlijk nooit automatisch heropend ondanks een veilig verlopen, ongebruikte autorisatie.

**Correctie:** hergebruik exact hetzelfde bewezen controlepatroon ook voor LinkedIn persoonlijk binnen dezelfde publisher. Vereist exact dezelfde dag, `publish/blocked` en exact de foutcode, 0 provider ID, expliciete false voor create/ack/side-effect, geen `republish_forbidden`, alle leases verlopen of eerder ingetrokken en niet consumed, geen unieke publicatiereservering. Eén channel-scoped CAS revoket eventuele verlopen lease en hervat bestaande `content_ready`-beslissing; eigen identity/editorial/global uniqueness/OAuth/provider readback lopen daarna volledig opnieuw. Geen onzekere of bevestigde verzending herhalen.

**Acceptatie:** regressietest op beide identiteiten/negatieve gevallen, Required+CodeQL, beschermde merge, exacte Supabase Edge-redeploy en afzonderlijke providerreadback met echte personal-URN. Geen fictieve LIVE_PROVEN of extra email. P0 #4439 blijft open tot de volledige 7-daagse oplevering.
