'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const css=fs.readFileSync(path.join(__dirname,'..','chrome.css'),'utf8');
const pref=JSON.parse(fs.readFileSync(path.join(__dirname,'..','preferences.json'),'utf8'));
const start=css.indexOf('/* v0.3.9 — HG styles Firefox-rendered context menus; Context Menu owns actions.');
const patch=css.slice(start);

test('039 fixes Firefox popup.css actual paint and removes macOS Menu underlay only for context menus',()=>{
 assert.ok(start>0);
 assert.match(patch,/--panel-background-color:\s*var\(--zcth-context-menu-bg\)\s*!important/);
 assert.match(patch,/--panel-text-color:\s*rgb\(246, 246, 248\)\s*!important/);
 assert.match(patch,/::part\(content\)\s*\{\s*background:\s*var\(--zcth-context-menu-bg\)\s*!important/);
 assert.match(patch,/appearance:\s*none\s*!important/);
 assert.match(patch,/-moz-default-appearance:\s*none\s*!important/);
 assert.match(patch,/background-color:\s*transparent\s*!important/);
 assert.match(patch,/-moz-window-shadow:\s*none\s*!important/);
 assert.match(patch,/--panel-box-shadow:\s*none\s*!important/);
 assert.match(patch,/--panel-box-shadow-margin:\s*0px\s*!important/);
 assert.match(patch,/--panel-border-color:\s*transparent\s*!important/);
 assert.match(patch,/background-clip:\s*padding-box\s*!important/);
 assert.match(patch,/border-color:\s*transparent\s*!important/);
 assert.doesNotMatch(patch,/--panel-background:\s/);
});
test('039 compatible with Zen Context Menu ordering and existing Sine options',()=>{
 const setting=pref.find(p=>p.property==='mod.compacttpr.contextmenuglass');
 assert.equal(setting?.defaultValue,false);
 assert.match(setting.label,/Zen Context Menu/);
 assert.match(patch,/@media \(-moz-pref\("widget\.macos\.native-context-menus", false\)\)/);
 for(const id of ['#tabContextMenu','#contentAreaContextMenu','#placesContext','#zenWorkspaceMoreActions','.textbox-contextmenu'])assert.ok(patch.includes(id),id);
 assert.doesNotMatch(patch,/(?:^|\s)(?:menuitem|menuseparator)\s*\{|:nth-child|(?:^|\s)order\s*:|(?:^|\s)display\s*:|(?:^|\s)visibility\s*:|pointer-events\s*:/);
});
test('039 preserves first-frame HG colour, opacity, blur; never promotes webpage video layer',()=>{
 for(const name of ['--mod-compacttpr-customcolor-final','--mod-compacttpr-transparentvalue','--mod-compacttpr-customblur'])assert.ok(patch.includes(name),name);
 assert.match(patch,/backdrop-filter:\s*blur\(var\(--mod-compacttpr-customblur, 5px\)\)\s*!important/);
 assert.doesNotMatch(patch,/will-change|backface-visibility|browserSidebarContainer|zia-video|data-zcth-hdr-glass|setInterval|setTimeout/);
});
