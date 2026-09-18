export function buildCustomerForesightView(packet={}){
  return {
    title:'Vooruitblik & benchmark',
    subtitle:'Wat gebeurt er waarschijnlijk als niets verandert — en wat kan er verbeteren?',
    generatedAt:packet.observed_at??null,
    forecasts:(packet.forecasts??[]).map(f=>({
      id:f.id,
      horizon:f.horizon,
      expected:f.expected_path,
      upside:f.upside_case,
      downside:f.downside_case,
      benchmark:f.benchmark,
      benchmarkGap:f.benchmark_gap,
      confidence:f.confidence,
      uncertainty:f.uncertainty,
      leadingIndicators:f.leading_indicators??[],
      actions:f.recommended_actions??[],
      freshness:f.freshness??'unknown',
      provenance:f.provenance??[],
      caveat:'Voorspelling op basis van beschikbare data, benchmark en aannames; geen zekerheid.'
    }))
  };
}
