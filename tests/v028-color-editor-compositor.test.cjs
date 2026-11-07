'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(root,'chrome.css'),'utf8');
const prefs=JSON.parse(fs.readFileSync(path.join(root,'preferences.json'),'utf8'));
const theme=JSON.parse(fs.readFileSync(path.join(root,'theme.json'),'utf8'));
const start=css.indexOf('/* v0.2.8 — Selected-color dialog compositor:');
const rule=css.slice(start,css.indexOf('/* v0.3.0 — macOS Glance glass with explicit hover-card priority and recovery.'));
const clean=rule.replace(/\/\*[\s\S]*?\*\//g,'');
const count=(s,x)=>s.split(x).length-1;
test('028 uses existing Sine opt-in with disabled-by-default rollback',()=>{
 assert.equal(theme.version,'0.3.3');
 assert.ok(start>0);
 assert.equal(prefs.find(x=>x.property==='mod.compacttpr.previewcardcustomblur')?.defaultValue,false);
 assert.match(clean,/-moz-bool-pref: "mod\.compacttpr\.previewcardcustomblur"/);
 assert.match(clean,/-moz-bool-pref: "mod\.compacttpr\.usecompacttransparent"/);
 assert.match(clean,/-moz-pref\("zia\.cards\.blur"\)/);
 assert.match(clean,/-moz-platform: macos/);
});
test('028 only promotes the webpage while the real nonmodal color dialog is open',()=>{
 assert.match(clean,/:has\(> #zsf-color-dialog\[open\]\)/);
 assert.equal(count(clean,':has(> #zsf-color-dialog[open])'),1);
 assert.match(clean,/#tabbrowser-tabpanels \.browserSidebarContainer\s*\{/);
 assert.match(clean,/will-change: transform !important/);
 assert.match(clean,/backface-visibility: hidden !important/);
 assert.doesNotMatch(clean,/#zsf-color-dialog\s*[:{]/,
  'no dialog paint or permanent visibility manipulation');
 assert.doesNotMatch(clean,/:has\(> #zsf-color-dialog\)(?!\[open\])/);
});
test('028 never forces compositor through Zia no-video-blur protection',()=>{
 assert.match(clean,/:root:not\(\[zia-video\]\):is\(/);
 assert.match(clean,/:not\(\[data-zcth-video-page\]\):not\(/);
 assert.match(clean,/browser\[zia-video\]/);
 assert.match(clean,/\[data-zcth-bilibili-glass\]/);
 assert.match(clean,/\[data-zcth-sdr-glass\]/);
 assert.match(clean,/\[data-zcth-hdr-glass\]/);
 const allow=({open=false,rootVideo=false,watch=false,visibleVideo=false,bili=false,sdr=false,hdr=false})=>
  Boolean(open&&!rootVideo&&((!watch&&!visibleVideo)||bili||sdr||hdr));
 assert.equal(allow({open:false}),false);
 assert.equal(allow({open:true}),true);
 assert.equal(allow({open:true,watch:true,visibleVideo:true}),false);
 assert.equal(allow({open:true,rootVideo:true,sdr:true}),false);
 assert.equal(allow({open:true,watch:true,visibleVideo:true,hdr:true}),true);
 assert.equal(allow({open:true,watch:true,visibleVideo:true,bili:true}),true);
});
test('028 does not alter chosen color, dialog position, alpha or sidebar height',()=>{
 for(const wrong of [/(?:^|[\s;{}])opacity\s*:/,/(?:^|[\s;{}])background\s*:/,/(?:^|[\s;{}])backdrop-filter\s*:/,/(?:^|[\s;{}])display\s*:/,/(?:^|[\s;{}])visibility\s*:/,/(?:^|[\s;{}])transform\s*:/,/(?:^|[\s;{}])position\s*:/,/(?:^|[\s;{}])height\s*:/,/(?:^|[\s;{}])filter\s*:/]){
  assert.doesNotMatch(clean,wrong);
 }
 assert.match(css,/\[data-zsf-color-sidebar-hold\]/,
  'HDR Guard considers the Site Folders deliberate sidebar hold');
 const oldCard=css.slice(css.indexOf('/* v0.2.7 — Site Folders'),start);
 assert.match(oldCard,/#zsf-color-dialog\[open\]/);
 assert.match(oldCard,/var\(--mod-compacttpr-customcolor-final\)/);
 assert.match(oldCard,/var\(--mod-compacttpr-customblur, 5px\)/);
 assert.match(oldCard,/opacity: 1 !important/);
});
test('028 leaves ordinary Zia card and Site Folders compositor rules untouched',()=>{
 assert.equal(count(clean,'will-change: transform !important'),1);
 assert.equal(count(clean,'backface-visibility: hidden !important'),1);
 assert.match(css,/#zsf-folder-hover-card/);
 assert.match(css,/#zia-tab-card/);
 assert.match(css,/zia\.urlbar\.pop-up-blur/);
});
