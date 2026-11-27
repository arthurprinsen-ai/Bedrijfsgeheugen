// One honest catalogue of possible integrations. A listed provider is NOT
// an installed adapter, an OAuth session or proof that any customer can sync.
// All unimplemented adapters remain DRAFT / provider authorization due.
const provider=(id,name,group,transport='api',auth='provider-authorized',capability='DESIGN_ONLY')=>
 Object.freeze({id,name,group,transport,auth,capability});
export const CONNECTOR_PROVIDER_CATALOG=Object.freeze([
 provider('datahub','Bedrijfsgeheugen Datahub','Intern','datahub','tenant-authorized','INTERNAL_DESTINATION'),
 provider('afas','AFAS Profit','ERP & finance','afas','afas-xml-token','VERIFIED_READ_ONLY_ADAPTER'),
 provider('exact','Exact Online','ERP & finance','api','oauth2'),
 provider('moneybird','Moneybird','ERP & finance','api','oauth2'),
 provider('business-central','Dynamics 365 Business Central','ERP & finance','api','oauth2'),
 provider('dynamics','Dynamics 365 Sales','CRM & verkoop','api','oauth2'),
 provider('salesforce','Salesforce','CRM & verkoop','api','oauth2'),
 provider('hubspot','HubSpot','CRM & verkoop','api','oauth2'),
 provider('pipedrive','Pipedrive','CRM & verkoop','api','oauth2'),
 provider('servicenow','ServiceNow','Service & operatie','api','oauth2-or-provider'),
 provider('jira','Jira Cloud','Service & operatie','api','oauth2'),
 provider('zendesk','Zendesk','Service & operatie','api','oauth2'),
 provider('4ps','4PS Construct','Branches','api','provider-authorized'),
 provider('nedap-ons','Nedap Ons','Branches','api','provider-authorized'),
 provider('lightspeed','Lightspeed','Branches','api','oauth2'),
 provider('mendrix','MendriX','Branches','api','provider-authorized'),
 provider('realworks','Realworks','Branches','api','provider-authorized'),
 provider('wincar','WinCar','Branches','api','provider-authorized'),
 provider('shopify','Shopify','Webshops','api','oauth2'),
 provider('woocommerce','WooCommerce','Webshops','api','provider-authorized'),
 provider('magento','Adobe Commerce / Magento','Webshops','api','oauth2'),
 provider('nmbrs','Nmbrs','HR & payroll','api','provider-authorized'),
 provider('afas-hr','AFAS HR','HR & payroll','api','provider-authorized'),
 provider('microsoft365','Microsoft 365 / Outlook','Bestanden & samenwerking','email','oauth2'),
 provider('sharepoint','Microsoft SharePoint','Bestanden & samenwerking','sharepoint','oauth2'),
 provider('onedrive','Microsoft OneDrive','Bestanden & samenwerking','onedrive','oauth2'),
 provider('google-drive','Google Drive','Bestanden & samenwerking','api','oauth2'),
 provider('google-sheets','Google Sheets','Bestanden & samenwerking','api','oauth2'),
 provider('ga4','Google Analytics 4','Marketing & analytics','api','oauth2'),
 provider('google-ads','Google Ads','Marketing & analytics','api','oauth2'),
 provider('meta-ads','Meta Ads','Marketing & analytics','api','oauth2'),
 provider('postgresql','PostgreSQL','Databases & datawarehouse','database','service-credential'),
 provider('sqlserver','Microsoft SQL Server','Databases & datawarehouse','sql','service-credential'),
 provider('mysql','MySQL','Databases & datawarehouse','sql','service-credential'),
 provider('snowflake','Snowflake','Databases & datawarehouse','api','service-credential'),
 provider('bigquery','Google BigQuery','Databases & datawarehouse','api','oauth2'),
 provider('databricks','Databricks','Databases & datawarehouse','api','oauth2'),
 provider('sftp','SFTP-bestanden','Bestanden & samenwerking','sftp','service-credential'),
 provider('file','CSV / Excel upload','Bestanden & samenwerking','upload','tenant-authorized'),
 provider('rest-api','Eigen REST API','API & events','api','provider-authorized'),
 provider('webhook','Webhook event','API & events','webhook','signed-webhook')
]);
const byId=new Map(CONNECTOR_PROVIDER_CATALOG.map(p=>[p.id,p]));
export const findConnectorProvider=id=>byId.get(id)||null;
export const CONNECTOR_PROVIDER_GROUPS=Object.freeze([...new Set(CONNECTOR_PROVIDER_CATALOG.map(p=>p.group))]);
const FIELD=/^[\p{L}_][\p{L}\p{N}_-]{0,79}$/u;
export function buildCustomConnectorTemplate({sourceId,targetId,fields}={}){
 const source=byId.get(sourceId),target=byId.get(targetId);
 if(!source||!target||sourceId===targetId||!Array.isArray(fields)||!fields.length||fields.length>40)
  throw Object.assign(new Error('INVALID_CUSTOM_CONNECTOR'),{code:'INVALID_CUSTOM_CONNECTOR'});
 const chosen=[...new Set(fields)];
 if(chosen.length!==fields.length||chosen.some(f=>typeof f!=='string'||!FIELD.test(f)))
  throw Object.assign(new Error('INVALID_CUSTOM_CONNECTOR_FIELDS'),{code:'INVALID_CUSTOM_CONNECTOR_FIELDS'});
 if(targetId==='file'||targetId==='webhook'||targetId==='sftp')
  throw Object.assign(new Error('TARGET_WRITE_ADAPTER_NOT_VERIFIED'),{code:'TARGET_WRITE_ADAPTER_NOT_VERIFIED'});
 return Object.freeze({
  id:'custom-'+sourceId+'-to-'+targetId,title:source.name+' → '+target.name,
  result:'Ontwerp voor '+source.name+' naar '+target.name+'; live adapter en toestemming nog vereist',
  source:Object.freeze({type:source.transport,providerId:sourceId}),
  targetProviderId:targetId,
  documentType:'custom-record',
  fields:Object.freeze([...fields]),targets:Object.freeze([target.transport]),
  defaultSchedule:'handmatig',connections:Object.freeze([sourceId]),
  filters:Object.freeze({}),fallback:'review',questions:Object.freeze([]),
  adapterCapability:'DESIGN_ONLY'
 });
}
export function providerCapabilityLabel(id){
 const provider=byId.get(id);
 if(!provider)return 'Onbekende aanbieder';
 if(provider.capability==='VERIFIED_READ_ONLY_ADAPTER')return 'Alleen AFAS lezen is ingebouwd; eigen toestemming vereist';
 if(provider.capability==='INTERNAL_DESTINATION')return 'Interne bestemming, alleen met toegestane bron';
 return 'Ontwerp mogelijk; echte providerconnector nog niet aangesloten';
}
