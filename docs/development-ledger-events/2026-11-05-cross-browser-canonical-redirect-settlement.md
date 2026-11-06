# 2026-11-05 — website browser core request canonical redirect false-red

- Original owner: existing Website Cross-Browser Screenshot Assurance; parent incident #4447; no second publisher, scheduler or release writer.
- Provider observation: original GitHub run #42075945749 (main 19b46d540a721bbab0b43cfd7f2dc914ee38e95c), mobile /blog/wat-is-een-bedrijfsgeheugen document ERR_CONNECTION_RESET; resulting report 271 routes, 640 results, 24 interactions, 1 failure; artifact 13439631334.
- Independent Netlify: 499 no-slash aborted request; subsequent redirect 301 and canonical slash 200. No observed 5xx in window. Exact path equality in original settlement filter caused false-red after successful same-page load.
- Fix: narrowly scoped pure recovery helper; source import; actual positive and negative contract regression. All strict final HTTP, canonical path, script/CSS, UX/CLS and browser screenshot gates retained.
- ONE BRAIN fingerprint: `ci|cross-browser|canonical-trailing-slash-transient-document-reset|20261105-v1`; real original occurrence already recorded, maturity OBSERVED pending proof.
- Required closure: protected admission and merge, original postmerge full browser replay and artifact with failures=0, explicit independent readback; update original incident without claiming backup deploy was exercised.

## 2026-11-06 — agent/skill handoff en afsluitcontract (original #4447)

- Onderzoek: originele browser-run #42075945749 had 1 van 640 resultaten fout door `ERR_CONNECTION_RESET` rond canonieke slashredirect; Netlify zag 499→301→200. Oplossing PR #5474 op `c6a2718e0de7eea4fdb87fe2a54026db21dfc218` gemerged en echt gepubliceerd als deploy `6aecc573342de9b9ea08a889`.
- Onafhankelijk bewijs: originele run #42081117654, 271 mobiele + 271 desktop routes, 640 resultaten, 24 interacties, 0 fouten, screenshot artifact 13440742777. Acht originele ONE BRAIN-fingerprints werkelijk PROVEN en niet opnieuw synthetisch aangemaakt.
- Uitvoerende agent/owner: uitsluitend bestaande Website Cross-Browser Screenshot Assurance, Netlify Production Truth en Powerhouse Recovery Proof. Skillwijzigingen in oorspronkelijke GitHub-candidate PR #5477; centrale AGENTS.md update en afzonderlijke nieuwe regression file geweigerd door connector-veiligheidscontrole, niet omzeild.
- First-time-right herstel: vervang referenties naar geweigerd testbestand door werkelijk aanwezige `tests/brain-website-cross-browser-screenshot-assurance-v1.test.mjs` en `tests/brain-netlify-git-deploy-first-v1.test.mjs`. Bestaande machine learning JSON is aangevuld met actuele provider-/browserbewijzen; deze docs en append-only ledger zijn samen de drielaagse closure-onderbouwing.
- Preventie: vereis provider-ID, juiste commit, postmerge echte browsertest, skill- en ownerprovenance, test evidence, onafhankelijke provider-readback en afzonderlijke nood-back-upwrite. Never classify "health HTTP 200" or successful native Git-linked deployment as fallback provider side effect. `BACKUP_PROVIDER_EFFECT_DEPLOY_EVIDENCE_DUE` blijft open op issue #4447.
- Acceptatie: original protected Required + CodeQL, merge en readback van de skillbestanden; pas dan "agent skills live". Geen nieuwe scheduler, geforceerde productiebuild, security bypass, onware omzetclaim of gesimuleerde bron.
