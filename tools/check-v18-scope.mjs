import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const policy = JSON.parse(fs.readFileSync(new URL('../site/v18-scope-policy.json', import.meta.url), 'utf8'));

function escapeRegex(value){
  return value.replace(/[.+^${}()|[\]\\]/g, '\\$&');
}

function globRegex(pattern){
  let source = '';
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    if (char === '*' && pattern[i + 1] === '*') {
      source += '.*';
      i++;
    } else if (char === '*') {
      source += '[^/]*';
    } else {
      source += escapeRegex(char);
    }
  }
  return new RegExp(`^${source}$`);
}

function matches(file, patterns = []){
  return patterns.some(pattern => globRegex(pattern).test(file));
}

function patternsFor(tags, rules){
  return tags.flatMap(tag => rules[tag] || []);
}

export function scopesOverlap(left = [], right = []){
  const leftSet = new Set(left.filter(tag => tag.startsWith('component:') || tag.startsWith('area:')));
  return right.some(tag => leftSet.has(tag) && (tag.startsWith('component:') || tag.startsWith('area:')));
}

export function checkScope({ declaredTags = [], changedFiles = [] } = {}){
  const components = declaredTags.filter(tag => tag.startsWith('component:'));
  const areas = declaredTags.filter(tag => tag.startsWith('area:'));
  const governance = declaredTags.filter(tag => tag.startsWith('scope:'));
  const componentPatterns = patternsFor(components, policy.componentRules);
  const areaPatterns = patternsFor(areas, policy.areaRules);
  const governancePatterns = patternsFor(governance, policy.governanceRules);
  const violations = [];

  for (const file of changedFiles) {
    if (matches(file, governancePatterns)) continue;
    const componentOwned = components.length > 0 && matches(file, componentPatterns);
    const areaOwned = areas.length > 0 && matches(file, areaPatterns);
    if (!(componentOwned && areaOwned)) violations.push(file);
  }

  return {
    ok: violations.length === 0,
    violations,
    declaredTags,
    changedFiles
  };
}

function cli(){
  const declaredTags = (process.env.V18_DECLARED_TAGS || '').split(',').map(v => v.trim()).filter(Boolean);
  const changedFiles = (process.env.V18_CHANGED_FILES || '').split('\n').map(v => v.trim()).filter(Boolean);
  const result = checkScope({ declaredTags, changedFiles });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) cli();
