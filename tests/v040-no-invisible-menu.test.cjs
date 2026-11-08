'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const css=fs.readFileSync(path.join(__dirname,'..','chrome.css'),'utf8');
const version=JSON.parse(fs.readFileSync(path.join(__dirname,'..','theme.json'),'utf8')).version;
const marker='/* v0.3.9 — HG styles Firefox-rendered context menus; Context Menu owns actions.';
const at=css.indexOf(marker);
const rule=css.slice(at);
test('040 safety regression: context menu cannot intentionally remove ALL menu backplates',()=>{
 assert.equal(version,'0.3.10');
 assert.ok(at>0);
 assert.doesNotMatch(rule,/(?:^|\s)(?:-moz-default-)?appearance:\s*none\s*!important/);
 assert.doesNotMatch(rule,/background-color:\s*transparent\s*!important/);
 assert.ok(rule.includes('background-color: var(--zcth-context-menu-bg, rgba(28, 28, 31, 0.93)) !important'));
 assert.ok(rule.includes('background: var(--zcth-context-menu-bg, rgba(28, 28, 31, 0.93)) !important'));
 assert.ok(rule.includes('border-radius: var(--panel-border-radius, 12px) !important'));
});
test('040 menu popup retains HG preferences and no unrequested geometry or interactions',()=>{
 const options=JSON.parse(fs.readFileSync(path.join(__dirname,'..','preferences.json'),'utf8'));
 assert.equal(options.find(x=>x.property==='mod.compacttpr.contextmenuglass')?.defaultValue,false);
 for(const x of ['--mod-compacttpr-customcolor-final','--mod-compacttpr-transparentvalue','--mod-compacttpr-customblur'])assert.ok(rule.includes(x));
 assert.doesNotMatch(rule,/will-change|backface-visibility|browserSidebarContainer|setInterval|setTimeout|MutationObserver/);
 assert.doesNotMatch(rule,/(?:^|\s)(?:display|order|pointer-events|transform|transition|animation):\s*/m);
});
