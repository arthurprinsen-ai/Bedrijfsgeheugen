export function routeCompute(x){
  if(x.cache_hit) return {tier:'CACHE',reason:'cache_hit'};
  if(x.deterministic_possible) return {tier:'DETERMINISTIC',reason:'deterministic'};
  if(x.query_possible) return {tier:'DATA_QUERY',reason:'query'};
  if(x.statistics_possible) return {tier:'STATISTICS',reason:'statistics'};
  const value=Number(x.expected_value||0),confidence=Number(x.confidence||0),complexity=Number(x.complexity||0);
  if(!x.needs_reasoning) return {tier:'NO_AI',reason:'reasoning_not_needed'};
  if(value<25) return {tier:'SMALL_MODEL',reason:'low_value_cap'};
  if(value>=250&&confidence<.6&&complexity>.7) return {tier:'LARGE_MODEL',reason:'high_value_uncertainty'};
  return {tier:'SMALL_MODEL',reason:'default_cheapest_reliable'};
}
