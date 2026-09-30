# AI Modelwijzer delivery classification recovery — 30 september 2026

De AI Modelwijzer capability stond al op actuele main, maar de centrale delivery-classifier kende enkele nieuwe publieke data/tool-paden niet. Daardoor kon Required de candidate afwijzen ondanks groene capability-, security- en previewtests.

Herstel:
- `data/ai-model-*` is website-delivery;
- `tools/ai-model-intelligence-*` is website-delivery;
- `tools/ai-modelwijzer-*` is website-delivery;
- regressietest voorkomt terugkeer van een unclassified delivery path.

Dit verandert geen modeladvies of commerciële logica; het sluit uitsluitend de beschermde delivery-lineage zodat actuele main naar productie kan worden gepromoveerd.
