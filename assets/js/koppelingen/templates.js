const template=(id,title,result,sourceType,{documentType='custom',fields=[],targets=['datahub'],schedule='dag',filters={},connections=[],fallback='review',questions=[]}={})=>Object.freeze({
  id,
  title,
  result,
  source:Object.freeze({type:sourceType}),
  filters:Object.freeze({...filters}),
  documentType,
  fields:Object.freeze([...fields]),
  targets:Object.freeze([...targets]),
  defaultSchedule:schedule,
  connections:Object.freeze([...connections]),
  testStrategy:'safe-test',
  fallback,
  questions:Object.freeze([...questions])
});

export const KOPPELING_TEMPLATES=Object.freeze([
  template('outlook-pdf-facturen','Facturen uit Outlook verwerken','PDF-facturen worden gelezen en als gestructureerde data opgeslagen.','email',{documentType:'invoice',fields:['factuurnummer','factuurdatum','leverancier','bedrag','btw','valuta'],filters:{attachmentType:'pdf'},connections:['microsoft-365']}),
  template('outlook-bijlagen-sharepoint','Outlook-bijlagen naar SharePoint','Nieuwe bijlagen worden automatisch op de juiste plek opgeslagen.','email',{documentType:'attachment',fields:['bestandsnaam','afzender','onderwerp','ontvangenOp'],targets:['sharepoint'],connections:['microsoft-365','sharepoint']}),
  template('outlook-aanvragen-datahub','Aanvragen uit Outlook registreren','Nieuwe aanvragen worden als bruikbare records in de Datahub gezet.','email',{documentType:'request',fields:['afzender','onderwerp','aanvraag','datum'],connections:['microsoft-365']}),
  template('sharepoint-documenten-database','SharePoint-documenten naar database','Documentinformatie wordt gecontroleerd en naar de database geschreven.','sharepoint',{documentType:'document',fields:['bestandsnaam','titel','datum','categorie'],targets:['database'],connections:['sharepoint','database']}),
  template('sharepoint-csv-datahub','CSV uit SharePoint naar Datahub','Nieuwe CSV-bestanden worden ingelezen in de Datahub.','sharepoint',{documentType:'csv',fields:['rows'],connections:['sharepoint']}),
  template('onedrive-sharepoint','OneDrive-bestanden naar SharePoint','Geselecteerde bestanden worden automatisch overgezet.','onedrive',{documentType:'file',fields:['bestandsnaam','pad','gewijzigdOp'],targets:['sharepoint'],connections:['microsoft-365','sharepoint']}),
  template('afas-datahub','AFAS-data naar Datahub','Geselecteerde AFAS-data wordt veilig naar de Datahub gebracht.','afas',{documentType:'record',fields:['record'],connections:['afas']}),
  template('exact-datahub','Exact-data naar Datahub','Geselecteerde Exact-data wordt veilig naar de Datahub gebracht.','exact',{documentType:'record',fields:['record'],connections:['exact']}),
  template('afas-exact','AFAS naar Exact','Geselecteerde gegevens worden gecontroleerd van AFAS naar Exact overgezet.','afas',{documentType:'record',fields:['record'],targets:['exact'],connections:['afas','exact']}),
  template('sql-datahub','SQL-data naar Datahub','Een gekozen dataset wordt periodiek naar de Datahub geladen.','sql',{documentType:'rows',fields:['rows'],connections:['sql']}),
  template('api-database','API naar database','API-resultaten worden gecontroleerd en als records opgeslagen.','api',{documentType:'json',fields:['records'],targets:['database'],connections:['api','database']}),
  template('database-api','Database naar API','Nieuwe of gewijzigde records worden gecontroleerd naar een API gestuurd.','database',{documentType:'rows',fields:['records'],targets:['api'],connections:['database','api']}),
  template('webformulier-datahub','Webformulier naar Datahub','Formulierinzendingen komen direct als gestructureerde data binnen.','webform',{documentType:'form',fields:['velden'],connections:['webform']}),
  template('csv-database','CSV naar database','CSV-gegevens worden gevalideerd en naar een database geschreven.','upload',{documentType:'csv',fields:['rows'],targets:['database'],connections:['database']}),
  template('pdf-extractie-datahub','PDF uitlezen naar Datahub','Informatie uit PDF-documenten wordt uitgelezen en opgeslagen.','upload',{documentType:'document',fields:['velden'],filters:{attachmentType:'pdf'}}),
  template('sharepointlijst-database','SharePoint-lijst naar database','Lijstitems worden gecontroleerd en in een database bijgewerkt.','sharepoint-list',{documentType:'rows',fields:['records'],targets:['database'],connections:['sharepoint','database']}),
  template('database-sharepointlijst','Database naar SharePoint-lijst','Geselecteerde databaserecords worden naar een SharePoint-lijst gesynchroniseerd.','database',{documentType:'rows',fields:['records'],targets:['sharepoint-list'],connections:['database','sharepoint']}),
  template('email-review-queue','E-mail naar controlelijst','Onzekere of onvolledige e-mailinformatie wordt eerst ter controle aangeboden.','email',{documentType:'email',fields:['afzender','onderwerp','inhoud'],targets:['review-queue'],connections:['microsoft-365'],fallback:'review'})
]);

const byId=new Map(KOPPELING_TEMPLATES.map(item=>[item.id,item]));
export const findTemplate=id=>byId.get(id)||null;
