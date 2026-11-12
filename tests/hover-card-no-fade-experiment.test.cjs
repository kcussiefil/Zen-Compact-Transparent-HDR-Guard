'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=path.join(__dirname,'../experiments/hover-card-no-fade');
const css=fs.readFileSync(path.join(base,'chrome.css'),'utf8');
const meta=JSON.parse(fs.readFileSync(path.join(base,'theme.json'),'utf8'));
const hgMeta=JSON.parse(fs.readFileSync(path.join(__dirname,'../theme.json'),'utf8'));
const rules=css.replace(/\/\*[\s\S]*?\*\//g,'');
test('experiment is an independent Sine CSS-only MOD; HG formal version unchanged',()=>{
 assert.equal(hgMeta.version,'0.4.3');
 assert.notEqual(meta.id,hgMeta.id);
 assert.equal(meta.version,'0.0.1');
 assert.equal(meta.style.chrome,'chrome.css');
 assert.equal(meta.scripts,undefined);
 assert.equal(meta.preferences,undefined);
});
test('macOS entry-only selectors cover Zia tabs and native folders and Site Folders group',()=>{
 assert.match(rules,/@media \(-moz-platform: macos\)/);
 assert.match(rules,/:root:not\(\[customizing\], \[inDOMFullscreen="true"\]\)/);
 assert.match(rules,/>\s*:is\(#zia-tab-card, #zia-folder-card\)\[zia-open\]:not\(\[zia-closing\], \[hidden\]\)/);
 assert.match(rules,/>\s*#zsf-folder-hover-card\[data-open\]:not\(\[data-closing\], \[hidden\]\)/);
 assert.doesNotMatch(rules,/#zia-tip-card|#tabbrowser-tabpanels|#navigator-toolbox|#urlbar|#tabContextMenu/);
});
test('opacity-only override leaves animation, scaling, blur, paint and menu untouched',()=>{
 const declarations=rules.slice(rules.indexOf('{',rules.indexOf('@media')+6)+1).replace(/^[^{]*\{/s,'').replace(/\}\s*\}\s*$/,'').trim();
 assert.equal(declarations,'opacity: 1 !important;');
 assert.equal((rules.match(/opacity:\s*1\s*!important/g)||[]).length,1);
 assert.doesNotMatch(rules,/\b(?:animation|transform|transition|backdrop-filter|will-change|backface-visibility|background|box-shadow|border-radius|display|visibility)\s*:/);
});
test('state model preserves Zia/Site Folders close fades and hidden initial state',()=>{
 function override({kind,visible,opening,closing,customizing=false,fullscreen=false,mac=true}){
   const supported=['zia-tab','zia-folder','zsf-folder'].includes(kind);
   return mac&&supported&&visible&&opening&&!closing&&!customizing&&!fullscreen;
 }
 for(const kind of ['zia-tab','zia-folder','zsf-folder']){
   assert.equal(override({kind,visible:true,opening:true,closing:false}),true);
   assert.equal(override({kind,visible:true,opening:true,closing:true}),false);
   assert.equal(override({kind,visible:true,opening:false,closing:true}),false);
   assert.equal(override({kind,visible:false,opening:true,closing:false}),false);
   assert.equal(override({kind,visible:true,opening:true,closing:false,fullscreen:true}),false);
 }
 assert.equal(override({kind:'zia-tip',visible:true,opening:true,closing:false}),false);
});
