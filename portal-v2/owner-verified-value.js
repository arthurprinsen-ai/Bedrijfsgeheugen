/**
 * Business value shown to an MKB owner must come from the existing server
 * projectVerifiedValue gate, not expected economics, forecast or UI actions.
 *
 * Input: JWT-scoped /api/brain-operating-loop projection, only after the
 * client confirms the authoritative tenantId equals the expected tenant.
 * No extra fetch, no new store, no reclassification of unverified records.
 */
const clean=value=>typeof value==='string'?value.trim():'';
const values=items=>Array.isArray(items)?items:[];
const units=Object.freeze({eur:'eur','€':'eur',hour:'hours',hours:'hours',uur:'hours',uren:'hours'});
const money=n=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);
const count=n=>new Intl.NumberFormat('nl-NL',{maximumFractionDigits:1}).format(n);
const unknown=reason=>Object.freeze({status:'NOT_PROVEN',reason,items:Object.freeze([]),totals:Object.freeze({eur:null,hours:null}),records:0,unattributed:0,excluded:0});

export function buildOwnerVerifiedValueReport(projection,{expectedTenant}={}){
  const tenant=clean(expectedTenant);
  if(!tenant||clean(projection?.tenantId)!==tenant)return unknown('TENANT_SCOPE_NOT_PROVEN');
  const rows=projection?.verifiedValue?.verifiedValues;
  if(!Array.isArray(rows))return unknown('CANONICAL_VERIFIED_VALUE_UNAVAILABLE');
  const seenIds=new Set(),seenProofUnits=new Set(),accepted=[];
  let excluded=0;
  for(const record of rows){
    const id=clean(record?.id);
    const unit=units[clean(record?.valueUnit).toLowerCase()];
    const value=record?.realisedValue;
    const proof=values(record?.evidenceIds).filter(x=>typeof x==='string'&&x.trim()).map(x=>x.trim());
    if(!id||!unit||!Number.isFinite(value)||Math.abs(value)>1e10||proof.length===0){excluded++;continue;}
    if(seenIds.has(id)){excluded++;continue;}
    const uniqueProof=[...new Set(proof)].sort();
    // Repeated evidence of the same unit is not independent financial value.
    // Exclude ambiguous duplicates rather than inflate the customer's total.
    if(uniqueProof.some(ref=>seenProofUnits.has(unit+':'+ref))){excluded++;continue;}
    seenIds.add(id);
    uniqueProof.forEach(ref=>seenProofUnits.add(unit+':'+ref));
    const problemId=/^PH-P\d{3}$/.test(clean(record.problemId))?record.problemId:null;
    accepted.push(Object.freeze({
      id,subjectId:clean(record.subjectId),problemId,unit,value,
      display:unit==='eur'?money(value):count(value)+' uur',
      evidenceIds:Object.freeze(uniqueProof)
    }));
  }
  const eur=accepted.filter(x=>x.unit==='eur');
  const hours=accepted.filter(x=>x.unit==='hours');
  return Object.freeze({
    status:accepted.length?'PROVEN':'NO_SUPPORTED_VERIFIED_VALUE',
    reason:accepted.length?'SERVER_VERIFIED_WITH_EVIDENCE':'NO_INDEPENDENT_SUPPORTED_OUTCOMES',
    items:Object.freeze(accepted),records:accepted.length,excluded,
    unattributed:accepted.filter(x=>!x.problemId).length,
    totals:Object.freeze({eur:eur.length?eur.reduce((sum,x)=>sum+x.value,0):null,hours:hours.length?hours.reduce((sum,x)=>sum+x.value,0):null})
  });
}

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderOwnerValueReport(report){
  const proven=report?.status==='PROVEN';
  const euro=proven&&report.totals.eur!==null?money(report.totals.eur):'—';
  const hours=proven&&report.totals.hours!==null?count(report.totals.hours)+' uur':'—';
  const rows=proven?report.items:[];
  return `<section class="owner-value-report" aria-labelledby="ownerVerifiedValueTitle">
    <div class="owner-decision-head"><h3 id="ownerVerifiedValueTitle">Aantoonbaar gerealiseerde waarde</h3><span class="owner-proof-indicator">${proven?'Bronbewijs aanwezig':'Nog geen bewijs'}</span></div>
    <p>Uitsluitend werkelijk uitgevoerde, door Brain geverifieerde waarde-items met unieke bewijsreferenties. Geen offertes, aannames of prognoses. Zonder betrouwbare registratiedatum wordt géén maand- of 30-dagenclaim gedaan.</p>
    <div class="owner-value-totals">
      <div><small>Gerealiseerde waarde in euro</small><strong>${esc(euro)}</strong></div>
      <div><small>Teruggewonnen capaciteit</small><strong>${esc(hours)}</strong></div>
      <div><small>Gecontroleerde waarderegistraties</small><strong>${proven?report.records:'—'}</strong></div>
    </div>
    ${rows.length?`<details class="owner-value-details"><summary>Onderbouwing per uitkomst (${rows.length})</summary>
      ${rows.map(item=>`<article class="owner-fact">
        <div class="owner-fact-meta"><span>${esc(item.problemId||'Geen bewezen probleemkoppeling')}</span><span>${esc(item.unit==='eur'?'EUR':'Uren')}</span></div>
        <h4>${esc(item.display)}</h4>
        <p>Gekoppeld resultaat: ${esc(item.subjectId||item.id)}</p>
        <small>${item.evidenceIds.length} onafhankelijke bewijsreferentie(s) · ${esc(item.evidenceIds.join(' · ').slice(0,280))}</small>
      </article>`).join('')}
    </details>`: '<div class="owner-unknown"><strong>Nog geen meetbaar resultaat</strong><p>De bestaande Brain-projectie leverde geen voor dit overzicht aantoonbaar geverifieerde euro- of urenuitkomsten. Een uitgevoerd verzoek of akkoord telt niet als geldwaarde.</p></div>'}
    ${proven&&report.excluded?`<p class="owner-proof-note">Uitgesloten wegens ontbrekende, dubbele of niet-ondersteunde bewijsdetails: ${report.excluded} registratie(s).</p>`:''}
  </section>`;
}
