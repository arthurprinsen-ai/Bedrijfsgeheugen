# Main rood: vastgepinde migratie-aantallen en letterlijke brontekst — 2026-11-19

Vier tests faalden op main: drie pinden het totaal aantal migraties in de lock (882/883/884) en brachten elke nieuwe migratie (#6051, #6052) tot falen; één pinde de letterlijke volgorde van een conditie in `powerhouse-content-loop` die #6050 legitiem uitbreidde. De tests assert nu de uitkomst: de eigen migratie staat precies één keer in de lock, versies zijn uniek en geordend, en beide identifiers staan in dezelfde conditie. Lock en bron ongewijzigd; geen test overgeslagen.
