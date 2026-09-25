import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const NON_PRODUCTION_PREFIXES = Object.freeze([
  'docs/',
  '.agents/',
  'tests/',
  '.github/',
  'brain/learning/',
]);

export const NON_PRODUCTION_EXACT = Object.freeze(new Set([
  'config/delivery-prevention-rules.json',
]));

export function isNonProductionPath(path = '') {
  const value=String(path);
  return NON_PRODUCTION_EXACT.has(value) || NON_PRODUCTION_PREFIXES.some(prefix => value.startsWith(prefix));
}

export function evaluateSafeProductionSupersession({
  expectedCommit,
  observedCommit,
  expectedIsAncestor = false,
  changedPaths = [],
} = {}) {
  const expected=String(expectedCommit||'').toLowerCase();
  const observed=String(observedCommit||'').toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(expected) || !/^[0-9a-f]{40}$/.test(observed)) {
    return Object.freeze({ ok:false, mode:'invalid-sha', expected, observed, unsafePaths:[] });
  }
  if (expected === observed) {
    return Object.freeze({ ok:true, mode:'exact', expected, observed, unsafePaths:[] });
  }
  const unsafePaths=[...new Set(changedPaths.map(String).filter(path => !isNonProductionPath(path)))];
  if (expectedIsAncestor === true && unsafePaths.length === 0) {
    return Object.freeze({ ok:true, mode:'safe-descendant', expected, observed, unsafePaths:[] });
  }
  return Object.freeze({
    ok:false,
    mode:expectedIsAncestor === true ? 'runtime-affecting-descendant' : 'not-descendant',
    expected,
    observed,
    unsafePaths,
  });
}

export function resolveProductionSupersession({ expectedCommit, observedCommit } = {}) {
  const expected=String(expectedCommit||'').trim();
  const observed=String(observedCommit||'').trim();
  if (expected === observed) {
    return evaluateSafeProductionSupersession({expectedCommit:expected, observedCommit:observed, expectedIsAncestor:true, changedPaths:[]});
  }
  let expectedIsAncestor=false;
  try {
    execFileSync('git',['merge-base','--is-ancestor',expected,observed],{stdio:'ignore'});
    expectedIsAncestor=true;
  } catch {}
  let changedPaths=[];
  if (expectedIsAncestor) {
    changedPaths=execFileSync('git',['diff','--name-only',`${expected}...${observed}`],{encoding:'utf8'})
      .split(/\r?\n/).filter(Boolean);
  }
  return evaluateSafeProductionSupersession({expectedCommit:expected, observedCommit:observed, expectedIsAncestor, changedPaths});
}

function parseArgs(argv){
  const out={};
  for(let i=0;i<argv.length;i+=1) if(argv[i].startsWith('--')) out[argv[i].slice(2)]=argv[i+1];
  return out;
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  const args=parseArgs(process.argv.slice(2));
  const result=resolveProductionSupersession({expectedCommit:args.expected,observedCommit:args.observed});
  console.log(JSON.stringify(result));
  if(!result.ok) process.exitCode=1;
}
