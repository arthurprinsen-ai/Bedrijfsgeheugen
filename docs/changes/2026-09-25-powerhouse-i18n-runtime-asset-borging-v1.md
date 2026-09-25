# Powerhouse borging — NL/EN runtime-assets

De NL/EN-storing op de publieke prijzenpagina is structureel geborgd als Powerhouse-leerpunt.

De kernregel is dat een gedeelde HTML-marker nooit meer mag gelden als bewijs dat een complete frontend-capability aanwezig is. Voor i18n worden stylesheet en runtime-script afzonderlijk gecontroleerd en afzonderlijk idempotent geïnjecteerd. Daarna moet de actieve mobiele navigatiehost daadwerkelijk een zichtbare taalkeuze bevatten.

Terminale productie-evidence blijft altijd:
1. protected main;
2. exact Netlify `commit_ref`;
3. relevante content/readiness;
4. echte browserinteractie;
5. NL → EN → NL roundtrip zonder zichtbare runtime-fout.

Deze regel geldt voor nieuwe pagina's, bestaande pagina's, rebuilds, recovery en toekomstige shell-/navigationvarianten.
