'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const css=read('chrome.css'),theme=JSON.parse(read('theme.json')),prefs=JSON.parse(read('preferences.json'));
const tag='/* v0.4.0 — macOS context-menu border-only correction.';
const i=css.indexOf(tag),end=css.indexOf('/* v0.4.2 — opt-in card-only macOS backdrop compositing experiment.'),rules=css.slice(i,end),pref=prefs.find(x=>x.property==='mod.compacttpr.contextmenuglass');
test('v0.4.1 isolated menu correction keeps a reversible default-off Sine toggle',()=>{
 assert.equal(theme.version,'0.4.2');assert.ok(i>0);
 assert.equal(pref?.type,'checkbox');assert.equal(pref?.defaultValue,false);
 assert.match(pref.label,/黑色邊線/);
 assert.equal(prefs.filter(x=>x.property===pref.property).length,1);
});
test('menu styling is scoped to macOS nonnative context popups only',()=>{
 for(const s of ['@media (-moz-platform: macos)','@media (-moz-pref("widget.macos.native-context-menus", false))','mod.compacttpr.contextmenuglass','mod.compacttpr.usecompacttransparent','#contentAreaContextMenu','#tabContextMenu','#toolbar-context-menu','#placesContext','#zenWorkspaceMoreActions','.textbox-contextmenu','::part(content)'])assert.ok(rules.includes(s),s);
 assert.doesNotMatch(rules,/(^|\s)menupopup\s*,\s*panel\b/);
 assert.doesNotMatch(rules,/#urlbar|#zia-tab-card|#zsf-folder-hover-card/);
});
test('menu correction touches border and shadow but NEVER popup paint or layout',()=>{
 for(const s of ['--panel-border-color: transparent !important;','--panel-box-shadow: none !important;','border-color: transparent !important;','box-shadow: none !important;'])assert.ok(rules.includes(s),s);
 assert.doesNotMatch(rules,/-moz-window-shadow\s*:/, 'do not disable macOS window-shadow while testing native backplate');
 assert.doesNotMatch(rules,/(^|[;{}\s])(?:background(?:-[\w-]+)?|--panel-background(?:-[\w-]+)?|--panel-text-color|color-scheme|color|opacity|appearance|-moz-default-appearance|backdrop-filter|filter|border-radius|transform|display|order|transition|animation)\s*:/m);
 assert.doesNotMatch(rules,/color-mix\(|rgba?\(|will-change|backface-visibility|\.browserSidebarContainer|data-zcth-(?:sdr|hdr|video)|zia-video/);
});
