// Original GitHub P0 #5241 release incident, read-only; no second registry.
// The authenticated Powerhouse Observability endpoint owns authorization.
// Public GitHub issue state does not prove an underlying build root cause.
export const ORIGINAL_NETLIFY_INCIDENT_ID=5241;
export const ORIGINAL_NETLIFY_INCIDENT_URL='https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5241';
export const ORIGINAL_NETLIFY_INCIDENT_CONTRACT='original-netlify-release-incident-readback-v1';

const SHA=/^[a-f0-9]{40}$/i;
const fail=reason=>Object.freeze({
  contract:ORIGINAL_NETLIFY_INCIDENT_CONTRACT,status:'UNVERIFIED',
  incidentId:ORIGINAL_NETLIFY_INCIDENT_ID,issueUrl:ORIGINAL_NETLIFY_INCIDENT_URL,
  issueState:'UNKNOWN',productionCurrent:false,
  reason,owner:'original-production-source-snapshot',
  caveat:'Geen incidentstatus of productieherstel verzinnen bij ontbrekend providerbewijs.'
});

export function summarizeOriginalNetlifyIncident({issue=null,githubHeadSha=null,publishedSha=null,manifestVerified=false}={}){
  if(!issue||Number(issue.number)!==ORIGINAL_NETLIFY_INCIDENT_ID||
    !['open','closed'].includes(issue.state)||
    !Number.isFinite(Date.parse(issue.updated_at||'')))return fail('ORIGINAL_GITHUB_INCIDENT_READBACK_MISSING');
  const current=Boolean(manifestVerified&&SHA.test(githubHeadSha||'')&&
    SHA.test(publishedSha||'')&&githubHeadSha===publishedSha);
  return Object.freeze({
    contract:ORIGINAL_NETLIFY_INCIDENT_CONTRACT,
    status:'READBACK_COMPLETE',
    incidentId:ORIGINAL_NETLIFY_INCIDENT_ID,
    issueUrl:ORIGINAL_NETLIFY_INCIDENT_URL,
    issueState:issue.state.toUpperCase(),
    issueUpdatedAt:issue.updated_at,
    productionCurrent:current,
    rootCauseProof:'UNVERIFIED_FULL_BUILD_PHASE',
    nextAction:issue.state==='open'
      ?'Onderzoek de oorspronkelijke Netlify-buildfout met exacte provider-bouwfase en regressietest in bestaande incidentketen.'
      :'Controleer of de sluitingsnotitie onafhankelijke oorzaak-, herstel- en regressiebewijzen bevat.',
    owner:'original-production-source-snapshot',
    caveat:'Een actuele website-release en een open historische bouwfout mogen gelijktijdig bestaan. Geen groen op oorzaak zonder bewijs.'
  });
}
