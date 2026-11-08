'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=n=>fs.readFileSync(path.join(__dirname,'..',n),'utf8');
const css=read('chrome.css'),prefs=JSON.parse(read('preferences.json')),theme=JSON.parse(read('theme.json'));
const tag='/* v0.3.9 — HG styles Firefox-rendered context menus; Context Menu owns actions.';
const addition=css.slice(css.indexOf(tag));
test('038 Sine option is independently reversible, default off',()=>{
 assert.equal(theme.version,'0.3.10');const p=prefs.find(x=>x.property==='mod.compacttpr.contextmenuglass');
 assert.equal(p?.type,'checkbox');assert.equal(p?.defaultValue,false);
 assert.equal(prefs.filter(x=>x.property===p.property).length,1);
});
test('038 scope limited to macOS non-native contextual menus',()=>{
 assert.ok(css.indexOf(tag)>0);
 for(const s of ['@media (-moz-platform: macos)','@media (-moz-pref("widget.macos.native-context-menus", false))','mod.compacttpr.usecompacttransparent','mod.compacttpr.contextmenuglass','#contentAreaContextMenu','#tabContextMenu','#toolbar-context-menu','#placesContext','#zenWorkspaceMoreActions','.textbox-contextmenu'])assert.ok(addition.includes(s),s);
 assert.doesNotMatch(addition,/(^|\s)menupopup\s*,\s*panel\b/);
 assert.doesNotMatch(addition,/#urlbar|#zia-tab-card|#zsf-folder-hover-card/);
});
test('038 first-frame HG blur, opacity, color and fallback contrast',()=>{
 for(const s of ['--mod-compacttpr-customcolor-final','--mod-compacttpr-transparentvalue','--panel-background-color: var(--zcth-context-menu-bg, rgba(28, 28, 31, 0.93))','::part(content)','backdrop-filter: blur(var(--mod-compacttpr-customblur, 5px))','--panel-text-color: rgb(246, 246, 248)','rgb(17, 18, 21) 70%'])assert.ok(addition.includes(s),s);
});
test('038 avoids new video composition, menu mutations and scripts',()=>{
 assert.doesNotMatch(addition,/will-change|backface-visibility|\.browserSidebarContainer|zia-video|data-zcth-(sdr|hdr|video)/);
 assert.doesNotMatch(addition,/(?:display|order|pointer-events|position|transition|animation|transform)\s*:/);
 assert.doesNotMatch(addition,/setInterval|setTimeout|MutationObserver|@import|url\(/);
});
