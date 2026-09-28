# Delivery Dependency Graph v1

## Waarom

Hot-paths verhoogden tot nu toe alleen de risicoklasse. Daardoor was bekend dát een wijziging zwaar was, maar niet expliciet welke downstream capabilities en regressies door een gedeelde root geraakt werden.

## Nieuwe werking

De Adaptive Delivery policy bevat nu een dependency graph met gedeelde roots zoals Required test, Integration Bundle, package manifests, Netlify runtime en Supabase authority. Een match:

1. verhoogt zo nodig het minimale risiconiveau;
2. activeert downstream capabilities;
3. voegt gerichte regressies toe;
4. wordt als `dependencyMatches` in het plan verklaarbaar vastgelegd.

Dit maakt de impactanalyse inhoudelijk en uitlegbaar in plaats van alleen generiek zwaar.

## Veiligheidsregel

Graph-propagatie kan uitsluitend bewijs toevoegen of risico verhogen. Bestaande security-, exact-head-, protected merge-, productie- en browser/provider-gates blijven onafhankelijk fail-closed.
