'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const css=read('chrome.css'),theme=JSON.parse(read('theme.json')),prefs=JSON.parse(read('preferences.json'));
const sha=file=>{const b=fs.readFileSync(path.join(root,file));return crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');};
const keys=prefs.map(x=>x.property);

test('044 retires both failed macOS compositor experiments at the preference, CSS and JS levels',()=>{
 assert.equal(theme.version,'0.4.4');
 for(const retired of ['mod.compacttpr.previewcardstability','mod.compacttpr.glanceglass']){
   assert.ok(!keys.includes(retired),'old Sine preference survived: '+retired);
   assert.ok(!css.includes(retired),'old compositor CSS survived: '+retired);
 }
 assert.equal(theme.scripts['glance-recovery.uc.js'],undefined);
 assert.equal(fs.existsSync(path.join(root,'glance-recovery.uc.js')),false);
 assert.doesNotMatch(css,/data-zcth-glance-recover/);
 for(const removedBlock of [
  'v0.3.0 — macOS Glance glass with explicit hover-card priority and recovery.',
  'v0.3.4 — Opt-in Glance foreground compositor',
  'v0.4.3 — opt-in background-tab compositor isolation for visible hover cards.',
  'v0.4.2 — opt-in card-only macOS backdrop compositing'
 ])assert.ok(!css.includes(removedBlock),removedBlock);
 const configuredKeys=keys.filter(k=>typeof k==='string');
 assert.equal(new Set(configuredKeys).size,configuredKeys.length);
});

test('044 preserves generic Glance exclusions without force-promoting a selected Glance overlay',()=>{
 const main=css.slice(css.indexOf('/* v0.3.3 — opt-out unified HG theme.'),css.indexOf('/* v0.2.0 — Zia 2.118 native video compositor ownership.'));
 assert.ok(main.length>0);
 assert.match(main,/zen-glance-overlay\.deck-selected/);
 assert.match(main,/\.browserSidebarContainer:is\(\.deck-selected, \[zen-split="true"\]\):not\(/);
 assert.match(main,/\.zen-glance-overlay, \.zen-glance-background/);
 assert.doesNotMatch(css,/#titlebar::before\s*\{[\s\S]*?data-zcth-glance-recover/);
 assert.doesNotMatch(css,/\.browserSidebarContainer\.zen-glance-overlay\.deck-selected\s*\{\s*will-change/);
});

test('044 HG 10px user-configurable glass, Zia cards and popup selectors are retained',()=>{
 assert.equal(prefs.find(p=>p.property==='mod.compacttpr.unifiedhg')?.defaultValue,true);
 assert.equal(prefs.find(p=>p.property==='mod.compacttpr.customblur')?.defaultValue,'5px');
 for(const v of ['#zia-tab-card','#zia-folder-card','#zia-tip-card','#zsf-folder-hover-card','#zsf-color-dialog[open]','zia.cards.blur','zia.urlbar.pop-up-blur','#urlbar#urlbar','--mod-compacttpr-customblur'])assert.ok(css.includes(v),v);
 assert.match(css,/backdrop-filter: blur\(var\(--mod-compacttpr-customblur, 5px\)\) !important;/);
 for(const [p,v] of Object.entries({'mod.compacttpr.bilibiliinstantglass':true,'mod.compacttpr.sdrrealblur':false,'mod.compacttpr.hdrrealblur':false,'mod.compacttpr.contextmenuglass':false})){
   assert.equal(prefs.find(x=>x.property===p)?.defaultValue,v,p);
 }
});

test('044 video detection actors and existing Bilibili/SDR/HDR script bytes unchanged',()=>{
 assert.deepEqual(Object.keys(theme.scripts).sort(),['sdr-glass.uc.js','video-page.uc.js']);
 for(const [file,hash] of Object.entries({
   'sdr-glass.uc.js':'489b4b604741d18e717b767a5053463b55477e4f',
   'video-page.uc.js':'698860f7b14e018811e6fb79ceed46a2c984c541',
   'actors/ZcthUniversalChild.sys.mjs':'0bf395f09d59dae8d530cecc0df4d74694600ddc'
 }))assert.equal(sha(file),hash,file);
 assert.match(css,/\[data-zcth-bilibili-glass\]/);
 assert.match(css,/\[data-zcth-sdr-glass\]/);
 assert.match(css,/\[data-zcth-hdr-glass\]/);
});

test('044 maintains v0.4.1 menu border/shadow-only safety and removes NO native window background',()=>{
 const marker='/* v0.4.0 — macOS context-menu border-only correction.';
 const start=css.indexOf(marker);
 assert.ok(start>0);
 const menu=css.slice(start);
 for(const s of ['#tabContextMenu','#contentAreaContextMenu','--panel-border-color: transparent !important;','--panel-box-shadow: none !important;','border-color: transparent !important;','box-shadow: none !important;'])assert.ok(menu.includes(s),s);
 assert.doesNotMatch(menu,/-moz-window-shadow\s*:/);
 assert.doesNotMatch(menu,/(^|[;{}\s])(?:background(?:-[\w-]+)?|--panel-background(?:-[\w-]+)?|opacity|backdrop-filter|display|animation|transform|will-change)\s*:/m);
});
