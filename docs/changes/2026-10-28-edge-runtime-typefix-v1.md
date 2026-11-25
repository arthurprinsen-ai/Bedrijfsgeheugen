# 2026-10-28 — Edge-functies: runtimefouten uit deno check

Obligation: edge-runtime-typefix-20261028.

Deno check op alle edge-functies op main vond 99 typefouten in 18 functies (commit 1b8a20f). De meeste zijn alleen typefouten. Deze PR fixt de drie die echt in runtime breken:
- `powerhouse-runtime`: `uuid.test(...)` werd gebruikt zonder dat `uuid` gedefinieerd was (ReferenceError op de action-route). Nu bovenaan de file gedefinieerd.
- `powerhouse-seo-opportunity-resolver` en `powerhouse-dataforseo-intelligence`: `db.from(...).insert(...).catch(...)` is geen geldige methode op de Postgrest-builder (TypeError in de foutafhandeling). Vervangen door `.then(()=>{},()=>{})`, zelfde gedrag.

Niet in deze PR: de overige typefouten (vooral `await` op niet-Promise-waarden, `never[]`-types en `unknown`). Die blokkeren de bundel volgens de logs niet, en vragen per functie een eigen beoordeling.
