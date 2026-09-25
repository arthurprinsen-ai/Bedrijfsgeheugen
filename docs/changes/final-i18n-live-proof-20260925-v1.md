# Final NL/EN production proof — 25 september 2026

De functionele NL/EN-recovery, immutable Engelse cache en cache-completeness gate zijn beschermd naar `main` gemerged. De laatste stap is het exact promoten van de nieuwste `main` naar Netlify-productie.

Deze promotion wijzigt geen productgedrag. Hij triggert de canonieke latest-main Production Source Snapshot en sluit pas wanneer:
- Netlify productie exact dezelfde SHA toont;
- de pricing-contentgate groen is;
- de browsercheck NL → EN → NL groen is;
- de Nederlandse route niet naar `/nl/*` lekt.

Belangrijk leerpunt: ook een pure production-trigger is materiële delivery en draagt daarom Brain-learning, ledger en menselijke documentatie in dezelfde lineage.
