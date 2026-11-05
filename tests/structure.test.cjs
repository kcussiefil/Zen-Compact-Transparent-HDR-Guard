'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const dir=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(dir,p),'utf8');
const css=read('chrome.css');
const meta=JSON.parse(read('theme.json'));
const prefs=JSON.parse(read('preferences.json'));
const script=read('sdr-glass.uc.js');

test('independent Sine package version 0.1.8 and expected scripts',()=>{
 assert.equal(meta.id,'zen-compact-transparent-hdr-guard');
 assert.equal(meta.version,'0.1.8');
 assert.equal(meta.style.chrome,'chrome.css');
 assert.ok(meta.scripts['video-page.uc.js']);
 assert.ok(meta.scripts['sdr-glass.uc.js']);
 assert.equal(meta.preferences,'preferences.json');
 assert.ok(!fs.existsSync(path.join(dir,'sliders.uc.js')));
});
test('SDR glass shares normal page’s exact css variables and sidebar geometry',()=>{
 assert.match(css,/:is\(:not\(\[zia-video\], \[data-zcth-video-page\]\), \[data-zcth-sdr-glass\]\[zia-video\]\)/);
 assert.match(css,/--mod-compacttpr-customblur,\s*5px/);
 assert.match(css,/--mod-compacttpr-transparentvalue,\s*15%/);
 assert.match(css,/--mod-compacttpr-customheight-final/);
 assert.doesNotMatch(css,/blur\(28px\)/);
});
test('Zia video guard persists, SDR true blur requires opt-in and confirmation',()=>{
 assert.match(css,/:root\[data-zcth-video-page\]:not\(\[zia-video\]\)/);
 assert.match(css,/mod.compacttpr.sdrrealblur/);
 assert.match(css,/will-change:\s*transform\s*!important/);
 assert.match(css,/#zsf-folder-hover-card/);
 const setting=prefs.find(p=>p.property==='mod.compacttpr.sdrrealblur');
 assert.equal(setting?.defaultValue,false);
 assert.equal(setting?.type,'checkbox');
});
test('SDR detection is event-driven and polling is faster',()=>{
 assert.match(script,/ZcthStreamV018/);
 assert.match(script,/onStreamState:publish/);
 assert.match(script,/},50\)/);
 assert.doesNotMatch(script,/sdrStreak>=2/);
 assert.match(script,/state==='sdr'/);
 assert.match(script,/queued=false;schedule\(0\)/);
 assert.match(script,/MutationObserver/);
});

test('Zia extended video-glass surfaces are all SDR-only', () => {
 const extra = css.slice(css.indexOf('/* v0.1.8: restore Zia'));
 assert.ok(extra.length > 1000);
 for(const name of ['zia.urlbar.pop-up-blur','zia.features.find-bar',
    'zia.cards.blur','[zia-swipe-arrow]','screenshots-buttons']) {
   assert.ok(extra.includes(name),name);
 }
 for(const piece of extra.split(/\}\s*(?=:root)/)) {
   if(piece.includes('backdrop-filter: blur(')) {
     assert.match(piece,/data-zcth-sdr-glass/);
   }
 }
 assert.match(extra,/zen-floating-urlbar="true"/);
 assert.match(extra,/--zia-urlbar-open-bg/);
 assert.match(extra,/--zia-shot-card/);
 assert.match(extra,/rgba\(248, 248, 250, 0\.82\)/);
 assert.match(extra,/\.browserSidebarContainer:has\(findbar:not\(\[hidden\]\)\)/);
 assert.match(extra,/\.browserSidebarContainer:has\(screenshots-buttons\)/);
});
test('Zia popup exceptions and folder tint are preserved',()=>{
 assert.match(css, /zia-pop-site="dark"/);
 assert.match(css, /zia-pop-site="light"/);
 assert.match(css, /zia\.folders\.tint-card/);
 assert.match(css, /--zia-folder-card-bg/);
});
test('experiment defaults remain opt-in and stream logic unchanged',()=>{
 const p=JSON.parse(read('preferences.json'));
 const setting=p.find(x=>x.property==='mod.compacttpr.sdrrealblur');
 assert.equal(setting.defaultValue,false);
 assert.match(script,/ZcthStreamV018/);
 assert.match(script,/setInterval\(\(\)=>\{void check\(\);\},50\)/);
});

test('v0.1.8 stream status exists and SDR actor module is connected',()=>{
 const actor=read('actors/ZcthStreamV018Child.sys.mjs');
 const parent=read('actors/ZcthStreamV018Parent.sys.mjs');
 assert.match(actor,/parseLiveItag/);
 assert.match(actor,/vp9\|vp09/);
 assert.match(actor,/ZcthStreamV018:Classify/);
 assert.match(parent,/__zcthSdrGlassV018/);
 assert.match(script,/data-zcth-stream-state/);
 assert.match(script,/ZcthStreamV018/);
});
