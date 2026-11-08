'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const css=fs.readFileSync(path.join(root,'chrome.css'),'utf8');
const prefs=JSON.parse(fs.readFileSync(path.join(root,'preferences.json'),'utf8'));
const theme=JSON.parse(fs.readFileSync(path.join(root,'theme.json'),'utf8'));
const start=css.indexOf('/* v0.4.3 — opt-in background-tab compositor isolation for visible hover cards.');
const block=css.slice(start).replace(/\/\*[\s\S]*?\*\//g,'');
test('v0.4.2 failed visible-card will-change:backdrop-filter experiment is retired',()=>{
 assert.equal(theme.version,'0.4.3');
 assert.ok(start>0);
 assert.doesNotMatch(block,/will-change:\s*backdrop-filter/);
 assert.doesNotMatch(block,/>\s*:is\(#zia-tab-card, #zia-folder-card, #zia-tip-card,\s*#zsf-folder-hover-card\):not\(\[hidden\]\)\s*\{/);
 assert.equal(prefs.find(p=>p.property==='mod.compacttpr.previewcardstability')?.defaultValue,false);
});
test('v0.4.3 retains v0.4.1 context-menu background correction unchanged',()=>{
 const s=css.slice(css.indexOf('/* v0.4.0 — macOS context-menu border-only correction.'),start);
 assert.match(s,/#tabContextMenu/);
 assert.match(s,/--panel-border-color: transparent !important;/);
 assert.match(s,/--panel-box-shadow: none !important;/);
 assert.doesNotMatch(s,/-moz-window-shadow\s*:/);
 assert.doesNotMatch(s,/\bbackground(?:-color)?\s*:/);
});
