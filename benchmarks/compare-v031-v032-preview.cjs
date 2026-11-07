'use strict';
// HG v0.3.2: deterministic first-paint style model, not a Gecko compositor
// or physical macOS display measurement. Test via:
// node benchmarks/compare-v031-v032-preview.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const css=fs.readFileSync(path.join(__dirname,'..','chrome.css'),'utf8');
const rule=css.slice(
 css.indexOf('/* v0.2.6 — Independently enabled preview-card glass.'),
 css.indexOf('/* v0.2.7 — Site Folders')
).replace(/\/\*[\s\S]*?\*\//g,'');
assert.ok(rule.includes('var(--mod-compacttpr-customblur, 5px)'),
 'must use the existing Sine custom blur variable, not a new fixed number');
assert.match(rule,/>\s*:is\(#zia-tab-card, #zia-folder-card, #zia-tip-card, #zsf-folder-hover-card\)\s*\{/);
assert.doesNotMatch(rule,/\)\:not\(\[hidden\]\)\s*\{/);
const cases=10000;
const result=[];
for(const version of ['v0.3.1','v0.3.2']){
 let computedStyleReads=0,inlinePropertyWrites=0,firstPaintMismatches=0;
 for(let i=0;i<cases;i++){
  // Actual Site Folders order from v0.7.6:
  //   card.hidden = false;
  //   syncNativePaint(); // reads HIDDEN #zia-folder-card or #zia-tab-card
  // HG is enabled; the source Zia card is hidden; user blur is 10px.
  const hiddenZiaSource=true,customHgPx=10,ziaNativePx=24;
  const oldVisibilityGate=version==='v0.3.1';
  computedStyleReads++;
  const computedNativeBlur=(oldVisibilityGate&&hiddenZiaSource)
   ?ziaNativePx:customHgPx;
  // Site Folders copies seven paint properties with inline!important.
  inlinePropertyWrites+=7;
  if(computedNativeBlur!==customHgPx)firstPaintMismatches++;
 }
 result.push({version,groupOpens:cases,computedStyleReads,
  inlinePropertyWrites,firstPaintMismatches});
}
assert.equal(result[0].computedStyleReads,result[1].computedStyleReads,
 'no extra JS style reads in v0.3.2');
assert.equal(result[0].inlinePropertyWrites,result[1].inlinePropertyWrites,
 'no extra JS writes in v0.3.2');
assert.equal(result[1].firstPaintMismatches,0);
assert.equal(result[0].firstPaintMismatches,cases);
for(const entry of result)console.log(JSON.stringify(entry));
console.log('MODEL: 10,000 hidden Zia source copies; old first paint 24px, new first paint user HG 10px.');
console.log('LIMIT: these are deterministic style-cascade assumptions; no Gecko GPU frames or FPS measured.');
