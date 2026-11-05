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

test('independent Sine package version 0.1.5 and expected scripts',()=>{
 assert.equal(meta.id,'zen-compact-transparent-hdr-guard');
 assert.equal(meta.version,'0.1.5');
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
 assert.match(script,/ZcthStreamV014/);
 assert.match(script,/onVideoChange:mediaChanged/);
 assert.match(script,/},50\)/);
 assert.doesNotMatch(script,/sdrStreak>=2/);
 assert.match(script,/result === 'sdr'/);
 assert.match(script,/queued=false; schedule\(0\)/);
 assert.match(script,/MutationObserver/);
});
