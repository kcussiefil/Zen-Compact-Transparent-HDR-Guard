'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const theme=JSON.parse(read('theme.json'));
const prefs=JSON.parse(read('preferences.json'));
const chrome=read('chrome.css');
const manager=read('sdr-glass.uc.js');
const actor=read('actors/ZcthUniversalChild.sys.mjs');
const parent=read('actors/ZcthUniversalParent.sys.mjs');

test('v0.3.3 is an independent Sine MOD that retains both original scripts',()=>{
 assert.equal(theme.id,'zen-compact-transparent-hdr-guard');
 assert.equal(theme.version,'0.3.9');
 assert.equal(theme.style.chrome,'chrome.css');
 assert.ok(theme.scripts['video-page.uc.js']);
 assert.ok(theme.scripts['sdr-glass.uc.js']);
 assert.equal(theme.preferences,'preferences.json');
});
test('unified theme has a reversible master setting; legacy feature options keep their defaults',()=>{
 const get=p=>prefs.find(x=>x.property===p);
 assert.equal(get('mod.compacttpr.unifiedhg')?.defaultValue,true);
 assert.equal(get('mod.compacttpr.sdrrealblur')?.defaultValue,false);
 assert.equal(get('mod.compacttpr.hdrrealblur')?.defaultValue,false,
   'HDR experiment should default to OFF for immediate rollback');
 assert.equal(get('mod.compacttpr.urlbarcustomblur')?.defaultValue,false,
   'URL pop-up experiment should default to OFF for immediate rollback');
 assert.equal(get('mod.compacttpr.previewcardcustomblur')?.defaultValue,false,
   'Preview cards must remain Zia-native until explicitly opted in');
 assert.equal(get('mod.compacttpr.bilibiliinstantglass')?.defaultValue,true,
   'Requested Bilibili URL-level immediate override is on by default');
 assert.equal(get('mod.compacttpr.sdrsitepatterns')?.type,'string');
 assert.equal(get('mod.compacttpr.sdrsitepatterns')?.defaultValue,'www.bilibili.com/*');
 assert.equal(get('mod.compacttpr.manualvideourl')?.type,'string');
 assert.equal(get('mod.compacttpr.manualvideourl')?.defaultValue,'');
 const keys=prefs.map(x=>x.property).filter(Boolean);
 assert.equal(keys.length,new Set(keys).size);
});
test('universal actor covers all frames and listens for video changes',()=>{
 assert.match(manager,/allFrames:true/);
 assert.match(manager,/https:\/\/\*\/\*/);
 assert.match(manager,/child:\{esModuleURI:BASE\+'ZcthUniversalChild\.sys\.mjs',events\}/);
 assert.ok(manager.includes('setInterval(()=>{render();void probe()},WATCHDOG_MS)'));
 assert.match(actor,/ZcthUniversal:State/);
 assert.match(parent,/__zcthUniversalV019/);
});
test('one safe policy controls all Zia glass surfaces',()=>{
 assert.match(manager,/root\.hasAttribute\('zia-video'\)/);
 assert.match(manager,/data-zcth-sdr-glass/);
 assert.match(manager,/data-zcth-hdr-glass/);
 assert.match(manager,/data-zcth-stream-state/);
 assert.match(manager,/some\(s=>s\.state==='hdr'\)/);
 assert.match(manager,/panes\.length===1/);
 assert.match(chrome,/data-zcth-sdr-glass/);
 assert.match(chrome,/zia\.urlbar\.pop-up-blur/);
 assert.match(chrome,/zia\.features\.find-bar/);
 assert.match(chrome,/zia-swipe-arrow/);
 assert.match(chrome,/screenshots-buttons/);
 assert.match(chrome,/#zsf-folder-hover-card/);
});
test('Bilibili adapter uses selected player quality, not available HDR options',()=>{
 assert.match(actor,/getQulity/);
 assert.match(actor,/realQ/);
 assert.match(actor,/HDR_TIERS=new Set\(\[125,126,129\]\)/);
 assert.match(actor,/__playinfo__/);
 assert.match(actor,/classifyYouTube/);
 assert.match(actor,/classifyGeneric/);
});
test('manual pattern is host and path scoped; HDR overrides the fallback',()=>{
 assert.ok(manager.includes("host==='*'"));
 assert.match(manager,/u\.searchParams\.get\('v'\)/);
 assert.match(manager,/state==='hdr'/);
 assert.match(manager,/unknownSince/);
 assert.match(manager,/elapsed>=FALLBACK_MS/);
 assert.match(manager,/mod\.compacttpr\.manualvideourl/);
});
test('original HDR compositor protection remains available when unified theme is disabled',()=>{
 assert.match(chrome,/data-zcth-video-page/);
 assert.match(chrome,/will-change:\s*transform\s*!important/);
 assert.match(chrome,/--mod-compacttpr-customblur/);
 assert.match(chrome,/--mod-compacttpr-transparentvalue/);
 const start=chrome.indexOf('/* v0.3.3 — opt-out unified HG theme.');
 const end=chrome.indexOf('/* v0.2.0 —',start);
 const legacy=chrome.slice(0,start)+chrome.slice(end);
 assert.doesNotMatch(legacy,/blur\(28px\)/);
});
