# Human Commercial Conversion Engine v1

Powerhouse now treats sales technique, ethical persuasion, copy quality and brand voice as runtime decision inputs rather than documentation-only guidance.

The canonical chain is:

signal / relationship evidence → identity + company context → intent / buying window → sales play → persuasion principles → human message composer → quality gate → channel capability / consent / pressure / dedupe → provider execution → outcome / revenue → strategy performance → future message decisions.

The implementation reuses the existing `powerhouse_sales_actions`, outcomes, relationship intelligence, NBA, persuasion optimizer and provider executors. It does not create a parallel CRM or send path.

Key guarantees:
- no external commercial message without a named message strategy;
- no role/company-name-only personalization;
- no generic praise, generic template opening, unsupported generalization, fake urgency or reply guilt;
- one primary problem and at most one micro-commitment;
- facts remain distinct from hypotheses;
- Gmail and SalesRobot require composer-v2 quality evidence;
- failed copy stays held for enrichment/recomposition rather than being sent;
- bounded composer dispatch runs every 15 minutes;
- outcome/revenue data remains joinable to message strategy for empirical learning.
