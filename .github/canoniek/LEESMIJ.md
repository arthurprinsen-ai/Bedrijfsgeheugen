# Canonieke kop en voettekst

Deze twee bestanden zijn de enige juiste versie van de menubalk en de voettekst.
`seocontrole.py` vergelijkt elke pagina hiermee en meldt een fout van niveau
hoog zodra een pagina afwijkt.

Waarom: er waren zeven verschillende voetteksten op de site, waarvan een met het
verkeerde e-mailadres. Dat gebeurt niet door slordigheid maar doordat pagina's
op verschillende momenten zijn gemaakt en niemand ze daarna nog naast elkaar legt.

## Iets wijzigen aan het menu of de voettekst

1. Pas het aan in `kop.html` of `voet.html` in deze map.
2. Draai dezelfde vervanging over alle pagina's; de controle vertelt precies
   welke pagina's nog afwijken.
3. Laat de pull request groen worden voordat je merget.

`aria-current="page"` wordt bij het vergelijken genegeerd, want dat markeert de
actieve pagina en hoort per pagina te verschillen.

Het klantportaal heeft bewust een eigen opzet en valt buiten deze eis.
