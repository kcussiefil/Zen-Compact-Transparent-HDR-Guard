'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const css=fs.readFileSync(path.join(__dirname,'..','chrome.css'),'utf8');
const pref=JSON.parse(fs.readFileSync(path.join(__dirname,'..','preferences.json'),'utf8'));
const marker='/* v0.3.9 — HG styles Firefox-rendered context menus; Context Menu owns actions.';
const at=css.indexOf(marker);
const patch=css.slice(at);

test('039 Firefox popup uses actual CSS properties with a visible fallback',()=>{
 assert.ok(at>0);
 for(const v of [
  '--panel-background-color: var(--zcth-context-menu-bg, rgba(28, 28, 31, 0.93)) !important;',
  '--panel-text-color: rgb(246, 246, 248) !important;',
  'background-color: var(--zcth-context-menu-bg, rgba(28, 28, 31, 0.93)) !important;',
  'background: var(--zcth-context-menu-bg, rgba(28, 28, 31, 0.93)) !important;',
  'border-radius: var(--panel-border-radius, 12px) !important;',
  '--panel-box-shadow: none !important;',
  '--panel-box-shadow-margin: 0px !important;',
  '--panel-border-color: transparent !important;',
 ]) assert.ok(patch.includes(v),v);
 assert.doesNotMatch(patch,/(?:^|\s)(?:-moz-default-)?appearance:\s*none\s*!important/m);
 assert.doesNotMatch(patch,/background-color:\s*transparent\s*!important/);
 assert.doesNotMatch(patch,/--panel-background:\s/);
});
test('039 compatible with Zen Context Menu sorting and default-off user settings',()=>{
 const setting=pref.find(p=>p.property==='mod.compacttpr.contextmenuglass');
 assert.equal(setting?.defaultValue,false);
 assert.match(setting.label,/Zen Context Menu/);
 assert.match(patch,/@media \(-moz-pref\("widget\.macos\.native-context-menus", false\)\)/);
 for(const id of ['#tabContextMenu','#contentAreaContextMenu','#placesContext','#zenWorkspaceMoreActions','.textbox-contextmenu'])assert.ok(patch.includes(id),id);
 assert.doesNotMatch(patch,/(?:^|\s)(?:menuitem|menuseparator)\s*\{|:nth-child|(?:^|\s)order\s*:|(?:^|\s)display\s*:|(?:^|\s)visibility\s*:|pointer-events\s*:/);
});
test('039 inherits current HG tint, opacity, blur and no video compositor promotion',()=>{
 for(const name of ['--mod-compacttpr-customcolor-final','--mod-compacttpr-transparentvalue','--mod-compacttpr-customblur'])assert.ok(patch.includes(name),name);
 assert.match(patch,/backdrop-filter:\s*blur\(var\(--mod-compacttpr-customblur, 5px\)\)\s*!important/);
 assert.doesNotMatch(patch,/will-change|backface-visibility|browserSidebarContainer|zia-video|data-zcth-hdr-glass|setInterval|setTimeout/);
});
