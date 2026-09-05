function n(v){const x=Number(v);return Number.isFinite(x)?x:null;}
function ratio(a,b){const aa=n(a),bb=n(b);return aa!==null&&bb!==null&&bb>0?Math.max(0,Math.min(1,aa/bb)):null;}

export function scoreGrowthWindow(input={}){
  const impressions=n(input.impressions),clicks=n(input.clicks),engaged=n(input.engaged_views),cta=n(input.cta_clicks),leads=n(input.leads),orders=n(input.orders),revenue=n(input.revenue);
  const components={visibility:impressions!==null?Math.min(1,Math.log10(impressions+1)/5):null,ctr:ratio(clicks,impressions),engagement:ratio(engaged,clicks),cta:ratio(cta,engaged??clicks),lead:ratio(leads,cta),order:ratio(orders,leads),revenue:revenue!==null?Math.min(1,Math.log10(Math.max(revenue,0)+1)/6):null};
  const weights={visibility:.08,ctr:.14,engagement:.12,cta:.18,lead:.18,order:.20,revenue:.10};let sum=0,w=0,known=0;
  for(const [k,weight] of Object.entries(weights)){const v=components[k];if(v===null)continue;sum+=v*weight;w+=weight;known++;}
  return Object.freeze({score:w?sum/w:0,confidence:known/Object.keys(weights).length,components,objective:'visibility>ctr>engagement>cta>lead>order>revenue'});
}
