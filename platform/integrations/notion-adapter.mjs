import { createCanonicalObject, LIFECYCLE_STATES, TRUTH_CLASSES } from '../contracts/canonical-object.mjs';

export function adaptNotionRecord({ tenantId, databaseId, pageId, objectType, properties, version = 1 }) {
  if (!tenantId || !databaseId || !pageId || !objectType || !properties) throw new TypeError('notion adapter requires tenantId, databaseId, pageId, objectType and properties');
  return createCanonicalObject({
    id: `${objectType.toUpperCase()}-NOTION-${pageId}`,
    type: objectType,
    tenantId,
    truthClass: TRUTH_CLASSES.SOURCE_FACT,
    lifecycle: LIFECYCLE_STATES.ACTIVE,
    version,
    provenance: { sourceType: 'notion', sourceRef: `${databaseId}/${pageId}` },
    data: { ...properties },
  });
}
