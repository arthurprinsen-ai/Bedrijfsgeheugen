// Canonical deep merge for partial BusinessInput answers. When preserveMissing
// is explicit, absent keys preserve previous values; supplied null, false, zero,
// empty arrays and empty strings are intentional replacements. Arrays are atomic.
// Object.fromEntries avoids prototype mutation via user-controlled field names.
const plain=value=>Boolean(value&&typeof value==='object'&&!Array.isArray(value));
export function mergePreservedBusinessInputAnswers(previous={},incoming={}){
 if(!plain(previous)||!plain(incoming))return incoming;
 return Object.fromEntries([...new Set([...Object.keys(previous),...Object.keys(incoming)])].map(key=>[
  key,Object.prototype.hasOwnProperty.call(incoming,key)
   ?mergePreservedBusinessInputAnswers(previous[key],incoming[key])
   :previous[key]
 ]));
}
