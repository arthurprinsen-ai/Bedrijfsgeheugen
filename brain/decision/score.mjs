const clamp01=n=>Math.max(0,Math.min(1,Number(n)||0));
export function scoreCandidate(c){
  const impact=Math.max(0,Number(c.expected_value)||0);
  const benefit=impact*clamp01(c.success_probability??c.confidence)*(.5+.5*clamp01(c.urgency))*(.5+.5*clamp01(c.strategic_fit))*(.5+.5*clamp01(c.evidence_quality))*(1+.25*clamp01(c.learning_value)+.25*clamp01(c.reusability));
  const burden=Math.max(1,(Number(c.cost)||0)+(Number(c.opportunity_cost)||0)+10*clamp01(c.risk)+Math.max(0,Number(c.time)||0));
  return Math.round((benefit/burden)*100)/100;
}
