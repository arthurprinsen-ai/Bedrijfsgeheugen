# Beveiliging publieke bronbestanden — 20 november 2026

Een onafhankelijke controle heeft aangetoond dat niet-publieke bronbestanden op de reguliere website downloadbaar waren. Dat hoort niet: de website toont producten en diensten; SQL-migraties en uitvoeringsscripts horen bij de besloten bouw- en uitvoeringsomgeving.

De eerste maatregel is een expliciete blokkade via Netlify voor bron-, CI-, database- en configuratiebestanden, ook als ze fysiek in de publicatiemap staan. De normale website, productpagina's, openbare assets en portaal blijven bereikbaar. Een test voorkomt dat de blokkade bij een latere wijziging ongemerkt verdwijnt. De bestaande wekelijkse beveiligingscontrole toetst ook de echte productieomgeving.

Deze maatregel vervangt nog **niet** de definitieve architectuuraanpassing waarbij een aparte, strikt afgebakende publicatiemap wordt samengesteld. Dat is een afzonderlijke beveiligde wijziging. Ook HTTP 404 op de actuele site zegt niets over eerder gedownloade kopieën. Publicatie is pas bevestigd als Netlify de wijziging uitrolt en de externe controle op de eerder blootgestelde paden HTTP 404 meet.

Voor de afzonderlijke PW MO14-1 Zaal/Veld-app heeft productie reeds een actieve hash-gebaseerde CSP, clickjackingbescherming, `nosniff` en HSTS; dat is apart daadwerkelijk gecontroleerd.
