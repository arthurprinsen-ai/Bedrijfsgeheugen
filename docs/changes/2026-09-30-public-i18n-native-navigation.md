# Public i18n native navigation recovery — 30 september 2026

De productiepromotie stond exact live, maar de browser-readback liep vast bij de mobiele NL→EN-wissel op de prijzenpagina.

De publieke taalkeuze gebruikt voortaan gewone hyperlinks als navigatie-authority. JavaScript bewaart alleen de voorkeur en voorkomt dat concurrerende mobiele menu-handlers de klik opslokken. Daarnaast plaatst de runtime een dynamische taalswitcher alleen vóór een element dat daadwerkelijk een direct child van de host is.

De i18n assetversie is verhoogd zodat geen oude runtime uit cache kan blijven draaien.
