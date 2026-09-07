const field=(key,label,type='string',required=false,confidenceThreshold=.8)=>({key,label,type,required,confidenceThreshold});

export const SOURCE_ADAPTERS=[
  {id:'email',label:'E-mail / gedeelde mailbox',supportsConfig:true,runtimeCapability:'server-provider-required'},
  {id:'upload',label:'Bestandsupload',supportsConfig:true,runtimeCapability:'native-safe-test'},
  {id:'sharepoint',label:'SharePoint / Teams',supportsConfig:true,runtimeCapability:'server-provider-required'},
  {id:'api',label:'API',supportsConfig:true,runtimeCapability:'server-provider-required'},
  {id:'webhook',label:'Webhook',supportsConfig:true,runtimeCapability:'server-provider-required'},
  {id:'sftp',label:'SFTP / file drop',supportsConfig:true,runtimeCapability:'server-provider-required'},
  {id:'database',label:'Database event',supportsConfig:true,runtimeCapability:'server-provider-required'}
];

export const LOOKUP_ADAPTERS=[
  {id:'supabase',label:'Supabase / Postgres',supportsConfig:true,runtimeCapability:'server-provider-required'},
  {id:'sql',label:'SQL database',supportsConfig:true,runtimeCapability:'server-provider-required'},
  {id:'afas-get',label:'AFAS GetConnector',supportsConfig:true,runtimeCapability:'server-provider-required'},
  {id:'exact',label:'Exact Online API',supportsConfig:true,runtimeCapability:'server-provider-required'},
  {id:'rest',label:'REST API',supportsConfig:true,runtimeCapability:'server-provider-required'},
  {id:'static',label:'Vaste tenanttabel',supportsConfig:true,runtimeCapability:'native-safe-test'}
];

export const TARGET_ADAPTERS=[
  {id:'afas',label:'AFAS',supportsConfig:true,runtimeCapability:'server-provider-required'},
  {id:'exact',label:'Exact Online',supportsConfig:true,runtimeCapability:'server-provider-required'},
  {id:'supabase',label:'Supabase / Postgres',supportsConfig:true,runtimeCapability:'server-provider-required'},
  {id:'sql',label:'SQL database',supportsConfig:true,runtimeCapability:'server-provider-required'},
  {id:'sharepoint',label:'SharePoint',supportsConfig:true,runtimeCapability:'server-provider-required'},
  {id:'datahub',label:'Bedrijfsgeheugen Datahub',supportsConfig:true,runtimeCapability:'server-provider-required'},
  {id:'rest',label:'REST API',supportsConfig:true,runtimeCapability:'server-provider-required'},
  {id:'webhook',label:'Webhook',supportsConfig:true,runtimeCapability:'server-provider-required'},
  {id:'make',label:'Make',supportsConfig:true,runtimeCapability:'server-provider-required'},
  {id:'power-automate',label:'Power Automate',supportsConfig:true,runtimeCapability:'server-provider-required'}
];

const invoiceFields=[
  field('supplier_name','Leverancier','string',true,.9),
  field('supplier_number','Leveranciersnummer'),
  field('invoice_number','Factuurnummer','string',true,.95),
  field('invoice_date','Factuurdatum','date',true,.9),
  field('due_date','Vervaldatum','date'),
  field('purchase_order_number','Inkoopordernummer'),
  field('subtotal','Subtotaal','currency'),
  field('vat_amount','BTW-bedrag','currency'),
  field('total_amount','Totaalbedrag','currency',true,.95),
  field('currency','Valuta'),
  field('iban','IBAN'),
  field('project_code','Projectcode'),
  field('cost_center','Kostenplaats')
];

const isoFields=[
  field('organization_name','Organisatie','string',true,.9),
  field('standard','ISO-norm','string',true,.95),
  field('certificate_number','Certificaatnummer','string',true,.95),
  field('scope','Scope'),
  field('issuer','Certificerende instelling'),
  field('issue_date','Uitgiftedatum','date'),
  field('expiry_date','Vervaldatum','date',true,.9),
  field('sites','Locaties','array'),
  field('status','Status')
];

const base=(id,name)=>({
  id,name,
  source:{type:'upload',config:{}},
  documentSchema:{id:`${id}-schema`,version:1,name,fields:[]},
  lookups:[],mappings:[],target:{type:'datahub',config:{}},
  reviewPolicy:{requiredBelowConfidence:.8},
  dedupe:{strategy:'content-hash'}
});

export const CONNECTOR_TEMPLATES=[
  {
    ...base('email-pdf-afas','E-mail PDF → AFAS Document Intake'),
    source:{type:'email',acceptedMimeTypes:['application/pdf'],config:{}},
    documentSchema:{id:'afas-document-intake-schema',version:1,name:'AFAS Document Intake',fields:[field('document_type','Documenttype','string',true,.9),field('subject','Onderwerp','string',true,.8)]},
    target:{type:'afas',profile:'KnSubject',config:{}},
    legacy:{solutionPattern:'AFAS Document Intake',flowPattern:'PA - Intake - Loonbeslag Email to AFAS',reviewPattern:'AFAS Document Intake Review'}
  },
  {...base('purchase-invoice','Inkoopfactuur'),documentSchema:{id:'purchase-invoice-schema',version:1,name:'Inkoopfactuur',fields:invoiceFields}},
  {...base('iso-document','ISO-document'),documentSchema:{id:'iso-document-schema',version:1,name:'ISO-certificaat / audit',fields:isoFields}},
  {...base('blank','Lege koppeling'),documentSchema:{id:'custom-document-schema',version:1,name:'Eigen documenttype',fields:[]}}
];
