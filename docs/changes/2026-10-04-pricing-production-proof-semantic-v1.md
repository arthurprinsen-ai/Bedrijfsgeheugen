# Pricing production proof semantic v1

De productiecontrole voor /prijzen valideert voortaan de inhoudelijke contracten van de live pagina in plaats van exacte taggrenzen.

De gate vereist nog steeds Powerhouse SaaS, Starter, Pro, Groei, Enterprise, de consulting-offers, beide data-tab contracten en de combinatiebelofte. Ontbreekt één onderdeel, dan faalt de release. Exacte productie-SHA en browserreadback blijven ongewijzigd verplicht.

Aanvulling: de statische content-proof controleert zichtbare tablabels en aanbod. De klik/interactie van de tabs blijft verplicht bewezen in de bestaande production-browsertest; runtime-only `data-tab` markup is geen statisch contentcontract.
