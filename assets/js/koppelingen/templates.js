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

  // Branchegerichte quick-starts. Deze templates gebruiken de bestaande generieke API-route.
  // 'Beschikbaar' betekent nadrukkelijk niet 'ready': providerconfiguratie + safe-test blijven verplicht.
  template('bouw-4ps-datahub','4PS Construct naar Datahub','Projecten, uren, kosten en voortgang uit 4PS als stuurinformatie beschikbaar maken.','api',{documentType:'record',fields:['project','uren','kosten','voortgang'],connections:['4ps'],schedule:'uur'}),
  template('zorg-nedap-ons-datahub','Nedap Ons naar Datahub','Cliënt-, rooster- of operationele gegevens gecontroleerd beschikbaar maken voor managementinformatie.','api',{documentType:'record',fields:['record'],connections:['nedap-ons'],schedule:'uur'}),
  template('horeca-lightspeed-datahub','Lightspeed naar Datahub','Omzet, transacties, producten en vestigingsinformatie samenbrengen voor dagelijkse sturing.','api',{documentType:'record',fields:['transactie','product','vestiging','omzet'],connections:['lightspeed'],schedule:'uur'}),
  template('retail-shopify-datahub','Shopify naar Datahub','Orders, producten, voorraad en klanten veilig synchroniseren naar de Datahub.','api',{documentType:'record',fields:['order','product','voorraad','klant'],connections:['shopify'],schedule:'uur'}),
  template('retail-woocommerce-datahub','WooCommerce naar Datahub','Orders, producten, voorraad en klanten uit WooCommerce naar de Datahub brengen.','api',{documentType:'record',fields:['order','product','voorraad','klant'],connections:['woocommerce'],schedule:'uur'}),
  template('transport-mendrix-datahub','MendriX naar Datahub','Ritten, orders, planning en statusinformatie uit het TMS combineren met finance en HR.','api',{documentType:'record',fields:['rit','order','planning','status'],connections:['mendrix'],schedule:'kwartier'}),
  template('zakelijk-moneybird-datahub','Moneybird naar Datahub','Facturen, contacten en financiële status automatisch beschikbaar maken voor stuurinformatie.','api',{documentType:'record',fields:['factuur','contact','status','bedrag'],connections:['moneybird'],schedule:'uur'}),
  template('crm-salesforce-datahub','Salesforce naar Datahub','Accounts, opportunities en activiteiten combineren met operatie en finance.','api',{documentType:'record',fields:['account','opportunity','activiteit'],connections:['salesforce'],schedule:'uur'}),
  template('vastgoed-realworks-datahub','Realworks naar Datahub','Objecten, leads en CRM-informatie uit Realworks combineren met financiële en operationele data.','api',{documentType:'record',fields:['object','lead','contact','status'],connections:['realworks'],schedule:'uur'}),
  template('automotive-wincar-datahub','WinCar naar Datahub','Verkoop, werkplaats, voorraad en managementinformatie uit het DMS centraal beschikbaar maken.','api',{documentType:'record',fields:['verkoop','werkorder','voorraad','resultaat'],connections:['wincar'],schedule:'uur'}),
  template('productie-business-central-datahub','Business Central naar Datahub','ERP-data over orders, voorraad, finance en operatie combineren in één stuurbeeld.','api',{documentType:'record',fields:['order','voorraad','finance','operatie'],connections:['business-central'],schedule:'uur'}),
  template('hr-nmbrs-datahub','Nmbrs naar Datahub','HR- en salarisgegevens gecontroleerd koppelen aan finance en operationele KPI’s.','api',{documentType:'record',fields:['medewerker','salaris','contract','verzuim'],connections:['nmbrs'],schedule:'dag'}),
  template('email-review-queue','E-mail naar controlelijst','Onzekere of onvolledige e-mailinformatie wordt eerst ter controle aangeboden.','email',{documentType:'email',fields:['afzender','onderwerp','inhoud'],targets:['review-queue'],connections:['microsoft-365'],fallback:'review'})
]);

const byId=new Map(KOPPELING_TEMPLATES.map(item=>[item.id,item]));
export const findTemplate=id=>byId.get(id)||null;
