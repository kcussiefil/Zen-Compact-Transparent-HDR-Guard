'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const css=read('chrome.css'),prefs=JSON.parse(read('preferences.json'));
const marker='/* v0.4.0 — macOS context-menu border-only correction.';
const at=css.indexOf(marker),rules=css.slice(at);
test("restore Zen Context Menu's original popup background and appearance",()=>{
 assert.ok(at>0);
 assert.doesNotMatch(rules,/background(?:-color)?\s*:/);
 assert.doesNotMatch(rules,/--panel-background(?:-[\w-]+)?\s*:/);
 assert.doesNotMatch(rules,/appearance\s*:|backdrop-filter\s*:|(?:^|\s)opacity\s*:/);
 assert.doesNotMatch(rules,/--zcth-context-menu-(?:bg|tint)/);
});
test('do not alter item ordering, icons, separators or hidden items',()=>{
 assert.equal(prefs.find(x=>x.property==='mod.compacttpr.contextmenuglass')?.defaultValue,false);
 assert.doesNotMatch(rules,/\bmenuitem\b|menuseparator|:nth-child|pointer-events\s*:|(?:^|\s)(?:display|order|visibility|position)\s*:/);
 assert.match(rules,/#tabContextMenu/);
 assert.match(rules,/#contentAreaContextMenu/);
});
