export function computeEscapedDefectPreventionRate({ escapedDefects = [], regressionEvidence = [] } = {}) {
  const ids = new Set(escapedDefects.map(item => item.id).filter(Boolean));
  const prevented = new Set(regressionEvidence.filter(item => item.catches_original_defect === true && ids.has(item.defect_id)).map(item => item.defect_id));
  const total = ids.size;
  return {
    total_escaped: total,
    prevented_after_escape: prevented.size,
    missing_regression: [...ids].filter(id => !prevented.has(id)).sort(),
    rate: total ? prevented.size / total : 1,
  };
}
