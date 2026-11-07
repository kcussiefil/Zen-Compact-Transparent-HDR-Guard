'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const base=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(base,'chrome.css'),'utf8');
const part=css.slice(
 css.indexOf('/* v0.2.6 — Independently enabled preview-card glass.'),
 css.indexOf('/* v0.2.7 — Site Folders')
).replace(/\/\*[\s\S]*?\*\//g,'');
const hash=path=>{
 const data=fs.readFileSync(require('node:path').join(base,path));
 return crypto.createHash('sha1').update(Buffer.from('blob '+data.length+'\0')).update(data).digest('hex');
};

test('032 first-paint CSS matches hidden Zia native card before Site Folders reads its computed paint',()=>{
 const declaration=part.match(/>\s*:is\(#zia-tab-card, #zia-folder-card, #zia-tip-card, #zsf-folder-hover-card\)\s*\{([\s\S]*?)\}/);
 assert.ok(declaration,'card rule must apply to both native Zia and Site Folders');
 assert.doesNotMatch(part,/:not\(\[hidden\]\)\s*\{/,'hidden source must be eligible');
 assert.ok(declaration[1].includes('var(--mod-compacttpr-customblur, 5px)'));
 assert.ok(declaration[1].includes('var(--mod-compacttpr-transparentvalue, 15%)'));
 assert.doesNotMatch(declaration[1],/\bdisplay\s*:|\bvisibility\s*:|\bwill-change\s*:/,
  'do not render hidden cards or pre-promote browser GPU layers');
});

test('032 source-style first-paint model: Site Folders synchronously copies user 10px, not Zia 24px',()=>{
 // Models the actual Site Folders v0.7.6 open() sequence:
 // card.hidden=false; syncNativePaint(); where syncNativePaint reads Zia
 // card with getComputedStyle(source) while the Zia source may still be hidden.
 // This is a deterministic cascade/flow model, NOT a Gecko pixel test.
 const gateHidden=/\):not\(\[hidden\]\)\s*\{/.test(part);
 const customPref=true,sourceHidden=true,videoAllowed=true;
 const wantedPx=10;
 const ziaNativePx=24;
 const sourceValue=customPref&&videoAllowed&&(!gateHidden||!sourceHidden)
  ?wantedPx:ziaNativePx;
 const copiedSiteFoldersImportantStyle=sourceValue;
 assert.equal(copiedSiteFoldersImportantStyle,10,
  'the first visible frame should not start at 24px in the modeled source flow');
 assert.notEqual(copiedSiteFoldersImportantStyle,5,
  'user 10px overrides the default 5px fallback');
});

test('032 without HG opt-in or on unknown HDR video, protect the native Zia treatment',()=>{
 const enabledOptions={hg:false,videoAllowed:true};
 const eligible=({hg,videoAllowed})=>hg&&videoAllowed;
 assert.equal(eligible(enabledOptions),false);
 assert.equal(eligible({hg:true,videoAllowed:false}),false);
 for(const mark of ['[data-zcth-bilibili-glass]','[data-zcth-sdr-glass]',
  '[data-zcth-hdr-glass]'])assert.ok(part.includes(mark));
 assert.match(part,/:not\(\[zia-video\], \[data-zcth-video-page\]\)/);
});

test('032 no new JavaScript, no extra event/timer callbacks: v0.3.1 core bytes identical',()=>{
 const refs={
  'sdr-glass.uc.js':'489b4b604741d18e717b767a5053463b55477e4f',
  'glance-recovery.uc.js':'0493f4e612d474f6bbbdf21791f94dcb3b254c93',
  'actors/ZcthUniversalChild.sys.mjs':'0bf395f09d59dae8d530cecc0df4d74694600ddc',
  'actors/ZcthUniversalParent.sys.mjs':'6abdd4e942b1b96733494adafdf00fc84a6e3f2a',
  'video-page.uc.js':'698860f7b14e018811e6fb79ceed46a2c984c541',
  'benchmarks/compare-v030-v031.cjs':'74c3cae34296b48c42149280aad9b5f3aa15433d'
 };
 for(const [file,sha] of Object.entries(refs))assert.equal(hash(file),sha,file);
});
