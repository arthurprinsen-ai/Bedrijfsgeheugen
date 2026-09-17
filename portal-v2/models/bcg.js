export const BCG_QUADRANTS = Object.freeze(['Sterren','Cash cows','Vraagtekens','Dogs']);

function numeric(value){
  const number=Number(value);
  return Number.isFinite(number)?number:null;
}

export function classifyBcgItem(item={}, {growthThresholdPct=10, shareThreshold=1}={}){
  const share=numeric(item.relativeMarketShare);
  const growth=numeric(item.marketGrowthPct);
  if(share===null||growth===null)return null;
  if(share>=shareThreshold&&growth>=growthThresholdPct)return 'Sterren';
  if(share>=shareThreshold&&growth<growthThresholdPct)return 'Cash cows';
  if(share<shareThreshold&&growth>=growthThresholdPct)return 'Vraagtekens';
  return 'Dogs';
}

function portfolioItems(state={}){
  const candidates=[
    state?.models?.bcg?.items,
    state?.bcg?.items,
    state?.portfolio?.items,
  ];
  return candidates.find(Array.isArray)||[];
}

export function buildBcgModel(state={}, options={}){
  const source=portfolioItems(state);
  const items=[];
  const excluded=[];
  for(const raw of source){
    const quadrant=classifyBcgItem(raw,options);
    if(!quadrant){
      excluded.push({id:raw?.id??null,name:raw?.name??raw?.label??'Onbekend',reason:'missing_numeric_input'});
      continue;
    }
    items.push({
      id:raw?.id??`${raw?.name??raw?.label??'item'}:${items.length+1}`,
      name:raw?.name??raw?.label??'Onbenoemd portfolio-item',
      relativeMarketShare:Number(raw.relativeMarketShare),
      marketGrowthPct:Number(raw.marketGrowthPct),
      quadrant,
      evidenceRef:raw?.evidenceRef??raw?.sourceRef??null,
      freshness:raw?.freshness??null,
      confidence:raw?.confidence??null,
    });
  }
  const quadrants=BCG_QUADRANTS.map(label=>({label,items:items.filter(item=>item.quadrant===label)}));
  return {
    derived:items.length>0,
    items,
    excluded,
    quadrants,
    thresholds:{relativeMarketShare:options.shareThreshold??1,marketGrowthPct:options.growthThresholdPct??10},
  };
}
