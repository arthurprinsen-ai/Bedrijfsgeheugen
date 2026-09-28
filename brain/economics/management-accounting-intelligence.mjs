const n=value=>Number.isFinite(Number(value))?Number(value):null;
const pct=value=>{const x=n(value);return x==null?null:x/100;};
const round=(value,digits=2)=>{if(!Number.isFinite(value))return null;const f=10**digits;return Math.round((value+Number.EPSILON)*f)/f;};
const ratio=(a,b)=>{const x=n(a),y=n(b);return x==null||y==null||y===0?null:x/y;};
const sum=(...values)=>values.every(value=>n(value)!=null)?values.reduce((total,value)=>total+Number(value),0):null;
const freeze=value=>Object.freeze(value);
const firstNumber=(...values)=>{for(const value of values){const x=n(value);if(x!=null)return x;}return null;};

export const MANAGEMENT_ACCOUNTING_FORMULA_VERSION='management-accounting-value-driver-v1';

export const MANAGEMENT_ACCOUNTING_SOURCES=freeze([
 freeze({id:'ifrs-management-commentary',label:'IFRS Practice Statement 1 Management Commentary',url:'https://www.ifrs.org/issued-standards/list-of-standards/management-commentary-practice-statement-1/',use:'value creation, cash-flow capacity, material management metrics'}),
 freeze({id:'ons-productivity',label:'Office for National Statistics — Labour productivity QMI',url:'https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/labourproductivity/methodologies/labourproductivityqmi',use:'output per hour as preferred labour-productivity measure'}),
 freeze({id:'bls-productivity',label:'U.S. Bureau of Labor Statistics — Productivity',url:'https://www.bls.gov/productivity/overview.htm',use:'labour and multifactor productivity concepts'}),
 freeze({id:'iso-30414',label:'ISO 30414:2025 Human capital reporting and disclosure',url:'https://www.iso.org/standard/30414',use:'human-capital areas including productivity, cost, turnover, wellbeing and skills'}),
 freeze({id:'shrm-revenue-fte',label:'SHRM CHRO benchmarking — Revenue per FTE',url:'https://www.shrm.org/content/dam/en/shrm/topics-tools/research/chro-benchmarking-data-brief.pdf',use:'revenue per FTE definition and workforce efficiency'}),
 freeze({id:'acca-performance',label:'ACCA — Divisional performance management',url:'https://www.accaglobal.com/gb/en/student/exam-support-resources/professional-exams-study-resources/p5/technical-articles/divisional-performance-management.html',use:'ROI, residual income, ROCE and controllability'}),
 freeze({id:'acca-eva',label:'ACCA — Economic value added',url:'https://www.accaglobal.com/uk/en/student/exam-support-resources/professional-exams-study-resources/p4/technical-articles/economic-value-added.html',use:'economic profit after capital charge'}),
 freeze({id:'cfa-fcf',label:'CFA Institute — Free Cash Flow Valuation',url:'https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/free-cash-flow-valuation',use:'FCFF/FCFE, WACC and enterprise-value linkage'}),
 freeze({id:'cfa-multiples',label:'CFA Institute — Market-Based Valuation',url:'https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/market-based-valuation-price-enterprise-value-multiples',use:'EV/EBITDA and valuation-multiple drivers'}),
 freeze({id:'pwc-fdd',label:'PwC — Financial due diligence',url:'https://www.pwc.com/us/en/services/consulting/deals/joint-ventures-alliances/financial-due-diligence.html',use:'quality of earnings, net working capital, cash-flow levers'}),
 freeze({id:'deloitte-dd',label:'Deloitte — Navigating the Due Diligence process',url:'https://www.deloitte.com/content/dam/assets-zone2/ie/en/docs/services/financial-advisory/2023/IE_CF_MA_Preparing_your_business_Due_Diligence_A4_2pp_0119_FINAL.pdf',use:'normalised EBITDA, working capital and net debt in transactions'}),
 freeze({id:'damodaran-growth',label:'Aswath Damodaran — Fundamental determinants of growth',url:'https://pages.stern.nyu.edu/adamodar/New_Home_Page/valquestions/growth.htm',use:'growth = reinvestment rate × return on capital'})
]);

export const METRIC_CATALOG=freeze([
 freeze({id:'revenue_per_employee',pillar:'productivity',label:'Omzet per medewerker',unit:'currency_per_fte',formula:'revenue / FTE',source_ids:['shrm-revenue-fte']}),
 freeze({id:'gross_profit_per_employee',pillar:'productivity',label:'Brutowinst per medewerker',unit:'currency_per_fte',formula:'revenue × gross margin / FTE',source_ids:['ons-productivity','bls-productivity']}),
 freeze({id:'ebitda_per_employee',pillar:'productivity',label:'EBITDA per medewerker',unit:'currency_per_fte',formula:'EBITDA / FTE',source_ids:['pwc-fdd']}),
 freeze({id:'revenue_per_hour',pillar:'productivity',label:'Omzet per gewerkt uur',unit:'currency_per_hour',formula:'revenue / hours worked',source_ids:['ons-productivity','bls-productivity']}),
 freeze({id:'gross_profit_per_hour',pillar:'productivity',label:'Brutowinst per gewerkt uur',unit:'currency_per_hour',formula:'gross profit / hours worked',source_ids:['ons-productivity','bls-productivity']}),
 freeze({id:'labour_cost_ratio',pillar:'people',label:'Loonkosten / omzet',unit:'percent',formula:'wages / revenue',source_ids:['iso-30414']}),
 freeze({id:'absence_pct',pillar:'people',label:'Verzuim',unit:'percent',formula:'absence %',source_ids:['iso-30414']}),
 freeze({id:'turnover_pct',pillar:'people',label:'Personeelsverloop',unit:'percent',formula:'turnover %',source_ids:['iso-30414']}),
 freeze({id:'billable_pct',pillar:'productivity',label:'Declarabel / productief',unit:'percent',formula:'productive or billable hours / available hours',source_ids:['iso-30414']}),
 freeze({id:'gross_margin_pct',pillar:'profitability',label:'Brutomarge',unit:'percent',formula:'gross profit / revenue',source_ids:['ifrs-management-commentary']}),
 freeze({id:'ebitda_margin_pct',pillar:'profitability',label:'EBITDA-marge',unit:'percent',formula:'EBITDA / revenue',source_ids:['pwc-fdd','deloitte-dd']}),
 freeze({id:'contribution_margin_pct',pillar:'profitability',label:'Dekkingsbijdrage',unit:'percent',formula:'(revenue - variable costs) / revenue',source_ids:['acca-performance']}),
 freeze({id:'break_even_revenue',pillar:'profitability',label:'Break-even omzet',unit:'currency',formula:'fixed costs / contribution margin ratio',source_ids:['acca-performance']}),
 freeze({id:'on_time_pct',pillar:'operations',label:'Op tijd geleverd',unit:'percent',formula:'on-time deliveries / deliveries',source_ids:['ifrs-management-commentary']}),
 freeze({id:'defect_pct',pillar:'operations',label:'Foutpercentage',unit:'percent',formula:'defects / output',source_ids:['ifrs-management-commentary']}),
 freeze({id:'lead_time_days',pillar:'operations',label:'Doorlooptijd',unit:'days',formula:'elapsed delivery lead time',source_ids:['ifrs-management-commentary']}),
 freeze({id:'orders_per_employee',pillar:'operations',label:'Orders per medewerker',unit:'number_per_fte',formula:'orders / FTE',source_ids:['bls-productivity']}),
 freeze({id:'quote_conversion_pct',pillar:'commercial',label:'Offerteconversie',unit:'percent',formula:'won quotes / submitted quotes',source_ids:['ifrs-management-commentary']}),
 freeze({id:'marketing_cost_per_new_customer',pillar:'commercial',label:'Marketingkosten per nieuwe klant',unit:'currency',formula:'marketing spend / new customers',source_ids:['ifrs-management-commentary']}),
 freeze({id:'average_revenue_per_customer',pillar:'commercial',label:'Gemiddelde omzet per klant',unit:'currency',formula:'revenue / customers',source_ids:['ifrs-management-commentary']}),
 freeze({id:'customer_churn_pct',pillar:'commercial',label:'Klantverloop',unit:'percent',formula:'customer churn %',source_ids:['ifrs-management-commentary']}),
 freeze({id:'customer_retention_pct',pillar:'commercial',label:'Klantbehoud',unit:'percent',formula:'100% - churn',source_ids:['ifrs-management-commentary']}),
 freeze({id:'largest_customer_pct',pillar:'risk',label:'Grootste klant',unit:'percent',formula:'largest customer revenue / revenue',source_ids:['pwc-fdd']}),
 freeze({id:'recurring_revenue_pct',pillar:'quality',label:'Terugkerende omzet',unit:'percent',formula:'recurring revenue / revenue',source_ids:['pwc-fdd']}),
 freeze({id:'dso_days',pillar:'cash',label:'DSO',unit:'days',formula:'receivables / revenue × 365',source_ids:['pwc-fdd']}),
 freeze({id:'inventory_days',pillar:'cash',label:'Voorraaddagen',unit:'days',formula:'inventory / cost of sales × 365',source_ids:['pwc-fdd']}),
 freeze({id:'dpo_days',pillar:'cash',label:'Crediteurendagen',unit:'days',formula:'payables / purchases × 365',source_ids:['pwc-fdd']}),
 freeze({id:'cash_conversion_cycle_days',pillar:'cash',label:'Cash conversion cycle',unit:'days',formula:'DSO + inventory days - DPO',source_ids:['pwc-fdd']}),
 freeze({id:'receivables_estimate',pillar:'cash',label:'Debiteurenbeslag (indicatief)',unit:'currency',formula:'revenue / 365 × DSO',source_ids:['pwc-fdd']}),
 freeze({id:'net_debt',pillar:'financing',label:'Netto schuld',unit:'currency',formula:'debt - cash',source_ids:['deloitte-dd']}),
 freeze({id:'net_debt_to_ebitda',pillar:'financing',label:'Netto schuld / EBITDA',unit:'multiple',formula:'net debt / EBITDA',source_ids:['deloitte-dd']}),
 freeze({id:'interest_coverage',pillar:'financing',label:'Rentedekking',unit:'multiple',formula:'EBITDA / interest',source_ids:['ifrs-management-commentary']}),
 freeze({id:'solvency_pct',pillar:'financing',label:'Solvabiliteit',unit:'percent',formula:'equity / total assets',source_ids:['ifrs-management-commentary']}),
 freeze({id:'free_cash_flow',pillar:'value',label:'Vrije kasstroom',unit:'currency',formula:'explicit free cash flow input',source_ids:['cfa-fcf']}),
 freeze({id:'fcf_margin_pct',pillar:'value',label:'Vrije-kasstroommarge',unit:'percent',formula:'free cash flow / revenue',source_ids:['cfa-fcf']}),
 freeze({id:'cash_conversion_ebitda_pct',pillar:'value',label:'Cash conversion van EBITDA',unit:'percent',formula:'free cash flow / EBITDA',source_ids:['cfa-fcf']}),
 freeze({id:'roic_pct',pillar:'value',label:'ROIC',unit:'percent',formula:'NOPAT / invested capital',source_ids:['acca-performance','damodaran-growth']}),
 freeze({id:'economic_profit',pillar:'value',label:'Economische winst',unit:'currency',formula:'NOPAT - invested capital × WACC',source_ids:['acca-eva']}),
 freeze({id:'enterprise_value_multiple',pillar:'valuation',label:'EV / EBITDA multiple',unit:'multiple',formula:'enterprise value / EBITDA or explicit transaction multiple',source_ids:['cfa-multiples']}),
 freeze({id:'enterprise_value',pillar:'valuation',label:'Indicatieve ondernemingswaarde',unit:'currency',formula:'normalised EBITDA × supported multiple',source_ids:['cfa-multiples','pwc-fdd']}),
 freeze({id:'equity_value',pillar:'valuation',label:'Indicatieve aandelenwaarde',unit:'currency',formula:'enterprise value - debt + cash',source_ids:['cfa-fcf']})
]);

function metric(id,value,{benchmark=null,benchmarkSource='',status='observed',note='',valueType='observed'}={}){
 const spec=METRIC_CATALOG.find(item=>item.id===id);
 const numeric=n(value);
 if(!spec||numeric==null)return null;
 const b=n(benchmark);
 return freeze({...spec,value:round(numeric,4),benchmark:b==null?null:round(b,4),benchmark_source:String(benchmarkSource||''),delta_to_benchmark:b==null?null:round(numeric-b,4),status,value_type:valueType,note});
}

function benchmarkIndex(state={}){
 const rows=Array.isArray(state?.portal?.market?.benchmarks)?state.portal.market.benchmarks:[];
 const map=new Map();
 for(const row of rows){
   const raw=String(row?.metric||'').trim().toLowerCase();
   if(!raw)continue;
   const key=raw.replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
   const value=n(row?.benchmark);
   if(value==null)continue;
   map.set(key,{value,source:String(row?.source||'')});
 }
 const aliases={
   omzet_per_medewerker:'revenue_per_employee',revenue_per_employee:'revenue_per_employee',
   brutowinst_per_medewerker:'gross_profit_per_employee',gross_profit_per_employee:'gross_profit_per_employee',
   ebitda_per_medewerker:'ebitda_per_employee',ebitda_per_employee:'ebitda_per_employee',
   loonkosten_omzet:'labour_cost_ratio',labour_cost_ratio:'labour_cost_ratio',
   verzuim:'absence_pct',absence:'absence_pct',absence_pct:'absence_pct',
   verloop:'turnover_pct',turnover:'turnover_pct',turnover_pct:'turnover_pct',
   declarabel:'billable_pct',productief:'billable_pct',billable_pct:'billable_pct',
   brutomarge:'gross_margin_pct',gross_margin:'gross_margin_pct',gross_margin_pct:'gross_margin_pct',
   ebitda_marge:'ebitda_margin_pct',ebitda_margin:'ebitda_margin_pct',ebitda_margin_pct:'ebitda_margin_pct',
   op_tijd:'on_time_pct',otif:'on_time_pct',on_time_pct:'on_time_pct',
   foutpercentage:'defect_pct',defects:'defect_pct',defect_pct:'defect_pct',
   doorlooptijd:'lead_time_days',lead_time:'lead_time_days',lead_time_days:'lead_time_days',
   offerteconversie:'quote_conversion_pct',quote_conversion:'quote_conversion_pct',quote_conversion_pct:'quote_conversion_pct',
   klantverloop:'customer_churn_pct',churn:'customer_churn_pct',customer_churn_pct:'customer_churn_pct',
   grootste_klant:'largest_customer_pct',largest_customer:'largest_customer_pct',largest_customer_pct:'largest_customer_pct',
   dso:'dso_days',dso_days:'dso_days',
   voorraaddagen:'inventory_days',inventory_days:'inventory_days',
   crediteurendagen:'dpo_days',dpo:'dpo_days',dpo_days:'dpo_days',
   cash_conversion_cycle:'cash_conversion_cycle_days',ccc:'cash_conversion_cycle_days',
   netto_schuld_ebitda:'net_debt_to_ebitda',net_debt_to_ebitda:'net_debt_to_ebitda',
   rentedekking:'interest_coverage',interest_coverage:'interest_coverage',
   solvabiliteit:'solvency_pct',solvency:'solvency_pct',solvency_pct:'solvency_pct',
   roic:'roic_pct',roic_pct:'roic_pct',
   terugkerende_omzet:'recurring_revenue_pct',recurring_revenue_pct:'recurring_revenue_pct'
 };
 const normalized=new Map();
 for(const [key,row] of map.entries())normalized.set(aliases[key]||key,row);
 return normalized;
}

function withBenchmark(id,value,index,options={}){
 const b=index.get(id);
 return metric(id,value,{...options,benchmark:b?.value,benchmarkSource:b?.source});
}

export function calculateManagementAccountingMetrics(state={}){
 const portal=state?.portal||{};
 const metrics=portal.metrics||{};
 const perf=metrics.performance||{};
 const profile=portal.profile||{};
 const people=portal.people||{};
 const finance=portal.valueFinance||{};
 const employees=firstNumber(profile.fte,profile.employees,metrics.fte);
 const revenue=n(metrics.revenue),grossMarginPct=n(metrics.grossMargin),ebitda=n(metrics.ebitda),wages=n(metrics.wages);
 const grossProfit=revenue!=null&&grossMarginPct!=null?revenue*(grossMarginPct/100):null;
 const hoursWorked=firstNumber(metrics.hoursWorked,perf.hoursWorked,portal.productivity?.hoursWorked);
 const index=benchmarkIndex(state);
 const dso=n(metrics.dso),inventoryDays=firstNumber(metrics.inventoryDays,finance.inventoryDays),dpo=firstNumber(metrics.creditorDays,metrics.dpo,finance.creditorDays);
 const variableCosts=firstNumber(metrics.variableCosts,finance.variableCosts);
 const fixedCosts=n(finance.fixed);
 const contributionMarginPct=revenue!=null&&variableCosts!=null&&revenue!==0?(revenue-variableCosts)/revenue*100:null;
 const debt=n(finance.debt),cash=n(finance.cash),equity=n(finance.equity),balance=n(finance.balance),interest=n(finance.interest);
 const netDebt=debt!=null&&cash!=null?debt-cash:null;
 const fcf=firstNumber(finance.freeCashFlow,metrics.freeCashFlow);
 const nopat=firstNumber(finance.nopat,metrics.nopat);
 const investedCapital=firstNumber(finance.investedCapital,metrics.investedCapital);
 const waccPct=n(finance.wacc);
 const explicitMultiple=n(finance.multiple);
 const normalizedEbitda=firstNumber(finance.normalizedEbitda,portal.dueDiligence?.normalizedEbitda,ebitda);
 const enterpriseValue=normalizedEbitda!=null&&explicitMultiple!=null?normalizedEbitda*explicitMultiple:null;
 const output=[
   withBenchmark('revenue_per_employee',ratio(revenue,employees),index),
   withBenchmark('gross_profit_per_employee',ratio(grossProfit,employees),index),
   withBenchmark('ebitda_per_employee',ratio(ebitda,employees),index),
   withBenchmark('revenue_per_hour',ratio(revenue,hoursWorked),index,{note:'Gebruik output per uur wanneer werkelijk gewerkte uren beschikbaar zijn.'}),
   withBenchmark('gross_profit_per_hour',ratio(grossProfit,hoursWorked),index,{note:'Brutowinst per gewerkt uur voorkomt vertekening door parttime/roosters.'}),
   withBenchmark('labour_cost_ratio',ratio(wages,revenue)==null?null:ratio(wages,revenue)*100,index),
   withBenchmark('absence_pct',people.absence,index),
   withBenchmark('turnover_pct',people.turnover,index),
   withBenchmark('billable_pct',perf.billable,index),
   withBenchmark('gross_margin_pct',grossMarginPct,index),
   withBenchmark('ebitda_margin_pct',ratio(ebitda,revenue)==null?null:ratio(ebitda,revenue)*100,index),
   withBenchmark('contribution_margin_pct',contributionMarginPct,index),
   withBenchmark('break_even_revenue',fixedCosts!=null&&contributionMarginPct>0?fixedCosts/(contributionMarginPct/100):null,index),
   withBenchmark('on_time_pct',perf.onTime,index),
   withBenchmark('defect_pct',perf.defects,index),
   withBenchmark('lead_time_days',perf.leadTime,index),
   withBenchmark('orders_per_employee',ratio(perf.orders,employees),index),
   withBenchmark('quote_conversion_pct',perf.quoteConversion,index),
   withBenchmark('marketing_cost_per_new_customer',ratio(metrics.marketing,metrics.newCustomers),index,{note:'Marketingkosten per nieuwe klant; geen volledige CAC tenzij alle acquisitiekosten zijn opgenomen.'}),
   withBenchmark('average_revenue_per_customer',ratio(revenue,metrics.customers),index),
   withBenchmark('customer_churn_pct',perf.churn,index),
   withBenchmark('customer_retention_pct',n(perf.churn)==null?null:100-n(perf.churn),index),
   withBenchmark('largest_customer_pct',metrics.largestCustomer,index),
   withBenchmark('recurring_revenue_pct',metrics.recurringRevenuePct,index),
   withBenchmark('dso_days',dso,index),
   withBenchmark('inventory_days',inventoryDays,index),
   withBenchmark('dpo_days',dpo,index),
   withBenchmark('cash_conversion_cycle_days',dso!=null&&inventoryDays!=null&&dpo!=null?dso+inventoryDays-dpo:null,index),
   withBenchmark('receivables_estimate',revenue!=null&&dso!=null?revenue/365*dso:null,index,{status:'estimated',valueType:'estimate'}),
   withBenchmark('net_debt',netDebt,index),
   withBenchmark('net_debt_to_ebitda',ratio(netDebt,normalizedEbitda),index),
   withBenchmark('interest_coverage',ratio(ebitda,interest),index),
   withBenchmark('solvency_pct',ratio(equity,balance)==null?null:ratio(equity,balance)*100,index),
   withBenchmark('free_cash_flow',fcf,index),
   withBenchmark('fcf_margin_pct',ratio(fcf,revenue)==null?null:ratio(fcf,revenue)*100,index),
   withBenchmark('cash_conversion_ebitda_pct',ratio(fcf,normalizedEbitda)==null?null:ratio(fcf,normalizedEbitda)*100,index),
   withBenchmark('roic_pct',ratio(nopat,investedCapital)==null?null:ratio(nopat,investedCapital)*100,index),
   withBenchmark('economic_profit',nopat!=null&&investedCapital!=null&&waccPct!=null?nopat-investedCapital*(waccPct/100):null,index),
   withBenchmark('enterprise_value_multiple',explicitMultiple,index,{status:'input',note:'Alleen gebruiken wanneer de multiple is onderbouwd door sector-/transactiebenchmarks.'}),
   withBenchmark('enterprise_value',enterpriseValue,index,{status:'estimated',valueType:'valuation_estimate',note:'Indicatie op basis van genormaliseerde EBITDA en expliciet onderbouwde multiple.'}),
   withBenchmark('equity_value',enterpriseValue!=null&&debt!=null&&cash!=null?enterpriseValue-debt+cash:null,index,{status:'estimated',valueType:'valuation_estimate'})
 ].filter(Boolean);
 return freeze(output);
}

const DIRECTION=freeze({
 revenue_per_employee:'higher',gross_profit_per_employee:'higher',ebitda_per_employee:'higher',revenue_per_hour:'higher',gross_profit_per_hour:'higher',
 labour_cost_ratio:'lower',absence_pct:'lower',turnover_pct:'lower',billable_pct:'higher',gross_margin_pct:'higher',ebitda_margin_pct:'higher',
 contribution_margin_pct:'higher',break_even_revenue:'lower',on_time_pct:'higher',defect_pct:'lower',lead_time_days:'lower',orders_per_employee:'higher',
 quote_conversion_pct:'higher',marketing_cost_per_new_customer:'lower',average_revenue_per_customer:'higher',customer_churn_pct:'lower',customer_retention_pct:'higher',
 largest_customer_pct:'lower',recurring_revenue_pct:'higher',dso_days:'lower',inventory_days:'lower',dpo_days:'context',cash_conversion_cycle_days:'lower',
 net_debt_to_ebitda:'lower',interest_coverage:'higher',solvency_pct:'higher',fcf_margin_pct:'higher',cash_conversion_ebitda_pct:'higher',roic_pct:'higher',economic_profit:'higher'
});

function benchmarkGap(item){
 if(item?.benchmark==null||item?.value==null)return null;
 const direction=DIRECTION[item.id]||'context';
 if(direction==='context')return null;
 const raw=direction==='higher'?item.benchmark-item.value:item.value-item.benchmark;
 return raw>0?raw:null;
}

function effortFor(id){
 const map={dso_days:32,absence_pct:55,turnover_pct:60,billable_pct:48,gross_margin_pct:58,ebitda_margin_pct:65,defect_pct:52,lead_time_days:52,quote_conversion_pct:45,customer_churn_pct:58,largest_customer_pct:72,cash_conversion_cycle_days:55,revenue_per_employee:68,labour_cost_ratio:62,inventory_days:50,net_debt_to_ebitda:70};
 return map[id]??60;
}
function dimensionFor(id){
 if(['dso_days','inventory_days','cash_conversion_cycle_days','net_debt_to_ebitda','interest_coverage','solvency_pct'].includes(id))return 'Finance & cash';
 if(['absence_pct','turnover_pct','labour_cost_ratio'].includes(id))return 'Mensen & organisatie';
 if(['quote_conversion_pct','customer_churn_pct','largest_customer_pct','average_revenue_per_customer'].includes(id))return 'Commercie & klant';
 if(['defect_pct','lead_time_days','on_time_pct','billable_pct','orders_per_employee'].includes(id))return 'Operatie';
 if(['gross_margin_pct','ebitda_margin_pct','revenue_per_employee','gross_profit_per_employee','ebitda_per_employee'].includes(id))return 'Waarde & performance';
 return 'Bedrijfsvoering';
}
function titleFor(id){
 const map={dso_days:'Versnel debiteuren en DSO',absence_pct:'Verlaag verzuim en bescherm capaciteit',turnover_pct:'Verlaag ongewenst verloop en kennisverlies',billable_pct:'Verhoog productieve/declarabele capaciteit',gross_margin_pct:'Verbeter brutomarge',ebitda_margin_pct:'Verhoog structurele EBITDA-marge',defect_pct:'Verlaag faalkosten en herstelwerk',lead_time_days:'Verkort doorlooptijd',quote_conversion_pct:'Verhoog offerteconversie',customer_churn_pct:'Verlaag klantverloop',largest_customer_pct:'Verlaag klantconcentratierisico',cash_conversion_cycle_days:'Verkort cash conversion cycle',revenue_per_employee:'Verhoog opbrengst per medewerker',labour_cost_ratio:'Verbeter arbeidskostenproductiviteit',inventory_days:'Verlaag voorraadbeslag',net_debt_to_ebitda:'Verlaag leverage / netto schuld'};
 return map[id]||'Verbeter '+id.replaceAll('_',' ');
}

function valuePotential(item,state){
 const revenue=n(state?.portal?.metrics?.revenue),employees=firstNumber(state?.portal?.profile?.fte,state?.portal?.profile?.employees);
 const grossMargin=pct(state?.portal?.metrics?.grossMargin),wages=n(state?.portal?.metrics?.wages);
 const gap=benchmarkGap(item);
 if(gap==null)return {amount:null,type:'unquantified'};
 if(item.id==='dso_days'&&revenue!=null)return {amount:round(revenue/365*gap,2),type:'working_capital_release'};
 if(item.id==='gross_margin_pct'&&revenue!=null)return {amount:round(revenue*(gap/100),2),type:'annual_gross_profit_potential'};
 if(item.id==='ebitda_margin_pct'&&revenue!=null)return {amount:round(revenue*(gap/100),2),type:'annual_ebitda_potential'};
 if(item.id==='revenue_per_employee'&&employees!=null&&grossMargin!=null)return {amount:round(gap*employees*grossMargin,2),type:'annual_gross_profit_potential'};
 if(item.id==='absence_pct'&&wages!=null)return {amount:round(wages*(gap/100),2),type:'capacity_value'};
 if(item.id==='billable_pct'&&wages!=null)return {amount:round(wages*(gap/100),2),type:'capacity_value'};
 return {amount:null,type:'unquantified'};
}

export function buildManagementAccountingRoadmap(state={}){
 const metrics=calculateManagementAccountingMetrics(state);
 const items=[];
 for(const item of metrics){
   const gap=benchmarkGap(item);
   if(gap==null)continue;
   const value=valuePotential(item,state);
   const severity=Math.min(100,Math.max(5,Math.abs(gap)/(Math.abs(item.benchmark)||1)*100));
   const effort=effortFor(item.id);
   items.push(freeze({
     id:'ma-'+item.id,
     sourceFingerprint:'management-accounting-value-driver-v1|'+item.id,
     source:'management-accounting-value-driver-v1',
     title:titleFor(item.id),
     dimension:dimensionFor(item.id),
     owner:'',
     sprint:severity>=35?1:severity>=15?2:3,
     start:severity>=35?1:severity>=15?2:3,
     duration:effort>=70?4:effort>=55?3:2,
     progress:0,
     done:false,
     metric_id:item.id,
     current:item.value,
     benchmark:item.benchmark,
     benchmark_source:item.benchmark_source,
     gap:round(gap,4),
     effort_score:effort,
     priority_score:round(severity*(100-effort/2)/100,1),
     expected_value:value.amount,
     value_type:value.type,
     impact_label:'POTENTIAL',
     confidence:item.benchmark_source?0.7:0.45,
     rationale:item.label+' wijkt ongunstig af van de expliciet vastgelegde benchmark. De waarde is een scenario/potentieel, geen gerealiseerde besparing.'
   }));
 }
 return freeze(items.sort((a,b)=>b.priority_score-a.priority_score));
}

export function buildValueDriverGraph(state={}){
 const metrics=calculateManagementAccountingMetrics(state);
 const byId=new Map(metrics.map(item=>[item.id,item]));
 const node=(id,label,metricIds)=>freeze({id,label,metrics:freeze(metricIds.map(metricId=>byId.get(metricId)).filter(Boolean))});
 const nodes=[
   node('people','Mensen',['absence_pct','turnover_pct','labour_cost_ratio']),
   node('productivity','Productiviteit',['revenue_per_employee','gross_profit_per_employee','revenue_per_hour','billable_pct']),
   node('operations','Operatie & kwaliteit',['on_time_pct','defect_pct','lead_time_days','orders_per_employee']),
   node('commercial','Commercie & klant',['quote_conversion_pct','customer_churn_pct','largest_customer_pct','average_revenue_per_customer']),
   node('profitability','Marge & EBITDA',['gross_margin_pct','ebitda_margin_pct','contribution_margin_pct','break_even_revenue']),
   node('cash','Cash & werkkapitaal',['dso_days','inventory_days','dpo_days','cash_conversion_cycle_days','receivables_estimate']),
   node('capital','Kapitaal & financiering',['net_debt_to_ebitda','interest_coverage','solvency_pct','roic_pct','economic_profit']),
   node('value','Ondernemingswaarde',['free_cash_flow','cash_conversion_ebitda_pct','enterprise_value_multiple','enterprise_value','equity_value'])
 ];
 const edges=freeze([
   freeze({from:'people',to:'productivity',label:'beschikbaarheid · skills · kosten'}),
   freeze({from:'productivity',to:'operations',label:'output per uur/FTE'}),
   freeze({from:'operations',to:'commercial',label:'kwaliteit · snelheid · klantwaarde'}),
   freeze({from:'commercial',to:'profitability',label:'volume · prijs · retentie'}),
   freeze({from:'profitability',to:'cash',label:'earnings → cash'}),
   freeze({from:'cash',to:'capital',label:'werkkapitaal · financieringsbehoefte'}),
   freeze({from:'capital',to:'value',label:'ROIC · risico · WACC'}),
   freeze({from:'profitability',to:'value',label:'duurzame EBITDA / FCF'})
 ]);
 return freeze({version:MANAGEMENT_ACCOUNTING_FORMULA_VERSION,nodes:freeze(nodes),edges,metrics,roadmap:buildManagementAccountingRoadmap(state)});
}

export function managementAccountingDataGaps(state={}){
 const present=new Set(calculateManagementAccountingMetrics(state).map(item=>item.id));
 const priority=['revenue_per_employee','gross_profit_per_employee','revenue_per_hour','ebitda_margin_pct','absence_pct','turnover_pct','dso_days','cash_conversion_cycle_days','free_cash_flow','roic_pct','recurring_revenue_pct'];
 const labels=new Map(METRIC_CATALOG.map(item=>[item.id,item.label]));
 return freeze(priority.filter(id=>!present.has(id)).map(id=>freeze({metric_id:id,label:labels.get(id)||id})));
}
