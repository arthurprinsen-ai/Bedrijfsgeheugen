import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {allPageIds,findPage} from '../../portal-v2/page-registry.js';
import {functionalSchema} from '../../portal-v2/modules/functional-suite.js';
import {companyInputSchema} from '../../portal-v2/modules/company-input.js';
import {fullCompanyInputSchema} from '../../portal-v2/modules/full-company-input.js';
import {fieldMarkup} from '../../portal-v2/form-primitives.js';
import {classifyPortalInputPath,SUPPLEMENTAL_PORTAL_INPUT_SURFACES} from '../../portal-v2/input-impact-coverage.js';

// This is a generated declaration/render contract, NOT an authenticated browser,
// customer tenant, external provider or consumer-ACK observation. Treat missing
// evidence as unknown, not read-only and never as 100% verified.
export const MATRIX_CONTRACT='portal-input-coverage-matrix-v1';
const canonicalWrite='/api/portal-business-input';
const projectionRead='/api/portal-state';
const uniq=items=>[...new Set(items)];

function fieldsForPage(page){
  return [
    ...functionalSchema(page),
    ...(page==='profiel'?companyInputSchema('profiel'):[]),
    ...(page==='gegevens-invullen'?fullCompanyInputSchema():[])
  ];
}

export function buildPortalInputCoverageMatrix(){
  const pages=allPageIds();
  const rows=[];
  const errors=[];
  const nativeSeen=new Map();
  for(const page of pages){
    for(const field of fieldsForPage(page)){
      const fieldId=String(field?.id||field?.path||'');
      const canonicalPath=String(field?.path||'');
      const key=page+'::'+fieldId;
      if(!fieldId||!canonicalPath.startsWith('portal.')){
        errors.push({code:'INVALID_DECLARED_FIELD',page,fieldId,path:canonicalPath});
        continue;
      }
      if(nativeSeen.has(key)){
        const previous=nativeSeen.get(key);
        if(previous!==canonicalPath)errors.push({code:'AMBIGUOUS_FIELD_ID',page,fieldId,path:canonicalPath,previousPath:previous});
        continue;
      }
      nativeSeen.set(key,canonicalPath);
      const classification=classifyPortalInputPath(canonicalPath);
      const markup=fieldMarkup(field);
      const ids=[...markup.matchAll(/data-field-id="([^"]*)"/g)].map(match=>match[1]);
      const rendered=ids.length===1 && ids[0]===fieldId;
      if(!rendered)errors.push({code:'FORM_RENDERER_BINDING_UNPROVEN',page,fieldId,path:canonicalPath});
      if(classification.mappingStatus!=='MAPPED'||!classification.modelFamilies?.length||!classification.affectedPages?.length){
        errors.push({code:'MISSING_IMPACT_MAPPING',page,fieldId,path:canonicalPath});
      }
      rows.push({
        surface:'NATIVE_SCHEMA_RENDERER',page,fieldId,path:canonicalPath,
        type:field.type||'text',moduleOwner:'portal-v2',
        tenantContext:'AUTHENTICATED_TENANT_REQUIRED',
        access:'CUSTOMER_FIELD_AUTH_POLICY_TO_VERIFY',
        writeEndpoint:canonicalWrite,readbackEndpoint:projectionRead,
        sourceRevision:'SERVER_REVISION_LIVE_READBACK_REQUIRED',
        brainConsumerAck:'NOT_OBSERVED',
        modelFamilies:classification.modelFamilies||[],
        affectedPages:classification.affectedPages||[],
        mappingStatus:classification.mappingStatus,
        rendererControlVerified:rendered,
        browserDomVerified:false,
        authenticatedWriteVerified:false,
        repeatableColumns:field.type==='repeatable'?(field.columns||[]).map(col=>({id:col.id,type:col.type||'text',runtimeRowBinding:'REVIEW_REQUIRED'})):[],
        status:rendered&&classification.mappingStatus==='MAPPED'?'DECLARED_RENDERER_ONLY':'REVIEW_REQUIRED'
      });
    }
  }

  const supplementary=[];
  for(const surface of SUPPLEMENTAL_PORTAL_INPUT_SURFACES){
    if(!findPage(surface.page))errors.push({code:'SUPPLEMENTAL_UNKNOWN_PAGE',page:surface.page});
    if(!surface.module||!surface.writeContract||!surface.readback)errors.push({code:'SUPPLEMENTAL_CONTRACT_MISSING',page:surface.page});
    const paths=Array.isArray(surface.paths)?surface.paths:[];
    if(paths.length===0){
      supplementary.push({
        surface:'DYNAMIC_OR_EXTERNAL',page:surface.page,moduleOwner:surface.module,
        fieldId:null,path:null,writeContract:surface.writeContract,
        writeEndpoint:null,readbackEndpoint:null,
        sourceRevision:'NOT_OBSERVED',brainConsumerAck:'NOT_OBSERVED',
        tenantContext:'MUST_VERIFY',access:'MUST_CLASSIFY',
        browserDomVerified:false,authenticatedWriteVerified:false,
        status:'UNENUMERATED_FIELDS_REVIEW_REQUIRED'
      });
      continue;
    }
    for(const value of paths){
      const classification=classifyPortalInputPath(value);
      if(classification.mappingStatus!=='MAPPED')errors.push({code:'SUPPLEMENTAL_MAPPING_MISSING',page:surface.page,path:value});
      supplementary.push({
        surface:'CUSTOM_WORKSPACE_DECLARATION',page:surface.page,
        fieldId:null,path:value,moduleOwner:surface.module,
        writeContract:surface.writeContract,readbackContract:surface.readback,
        writeEndpoint:null,readbackEndpoint:null,
        sourceRevision:'NOT_OBSERVED',brainConsumerAck:'NOT_OBSERVED',
        tenantContext:'MUST_VERIFY',access:'MUST_CLASSIFY',
        affectedPages:classification.affectedPages,modelFamilies:classification.modelFamilies,
        mappingStatus:classification.mappingStatus,
        browserDomVerified:false,authenticatedWriteVerified:false,
        status:'DECLARED_CUSTOM_WRITE_UNVERIFIED'
      });
    }
  }

  const nativePages=new Set(rows.map(row=>row.page));
  const supplementalPages=new Set(supplementary.map(row=>row.page));
  const pagesWithoutDeclaredFields=pages.filter(page=>!nativePages.has(page)&&!supplementalPages.has(page));
  // Without inspected DOM and editability classification these pages CANNOT
  // be considered read-only. Protect against deceptively high coverage scores.
  const summary={
    registeredPages:pages.length,
    declaredNativeControls:rows.length,
    declaredNativePages:nativePages.size,
    supplementalSurfaces:SUPPLEMENTAL_PORTAL_INPUT_SURFACES.length,
    supplementalFieldsDeclared:supplementary.filter(row=>row.path).length,
    unenumeratedDynamicSurfaces:supplementary.filter(row=>!row.path).length,
    pagesWithoutDeclaredFields:pagesWithoutDeclaredFields.length,
    declarationErrors:errors.length,
    authenticatedTenantReadbacks:0,
    customerLiveVerified:false,
    closureReady:false
  };
  return {
    contract:MATRIX_CONTRACT,source:'GITHUB_SCHEMA_AND_RENDERER_ONLY',
    writeAuthority:'EXISTING_PORTAL_BUSINESS_INPUT',sourceRevisionPolicy:'LIVE_PROOF_REQUIRED',
    pagesWithoutDeclaredFields,errors,summary,
    rows:[...rows,...supplementary],
    tenantIsolation:'NOT_TESTED_BY_THIS_REPORT',
    externalProviderCoverage:'NOT_TESTED_BY_THIS_REPORT',
    officialCsrdApplicability:'CUSTOMER_SPECIFIC_LEGAL_REVIEW_REQUIRED'
  };
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const result=buildPortalInputCoverageMatrix();
  mkdirSync('.artifacts',{recursive:true});
  writeFileSync('.artifacts/p0-4215-portal-input-coverage-matrix.json',JSON.stringify(result,null,2)+'\n');
  process.stdout.write(JSON.stringify({contract:result.contract,...result.summary})+'\n');
  if(result.errors.length){
    process.stderr.write(JSON.stringify(result.errors.slice(0,40),null,2)+'\n');
    process.exitCode=1;
  }
}
