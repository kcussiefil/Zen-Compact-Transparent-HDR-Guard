'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const css=fs.readFileSync(path.join(root,'chrome.css'),'utf8');
const prefs=JSON.parse(fs.readFileSync(path.join(root,'preferences.json'),'utf8'));
const theme=JSON.parse(fs.readFileSync(path.join(root,'theme.json'),'utf8'));
const marker='/* v0.4.3 — opt-in background-tab compositor isolation for visible hover cards.';
const at=css.indexOf(marker);
const raw=css.slice(at);
const rules=raw.replace(/\/\*[\s\S]*?\*\//g,'');
test('043 is strictly opt-in with pre-existing Sine setting and scoped to macOS',()=>{
 assert.equal(theme.version,'0.4.3');
 assert.ok(at>0);
 const control=prefs.filter(x=>x.property==='mod.compacttpr.previewcardstability');
 assert.equal(control.length,1);
 assert.equal(control[0].defaultValue,false);
 assert.match(control[0].label,/背景分頁合成/);
 for(const token of [
   '@media (-moz-platform: macos)',
   'mod.compacttpr.usecompacttransparent',
   'mod.compacttpr.unifiedhg',
   'mod.compacttpr.previewcardstability',
   '@media -moz-pref("zia.cards.blur")',
   ':not([customizing], [inDOMFullscreen="true"], [zia-video])',
   '.zen-glance-overlay.deck-selected',
   '#zia-tab-card','#zia-folder-card','#zia-tip-card','#zsf-folder-hover-card',
   ':not([hidden])'
 ])assert.ok(rules.includes(token),token);
});
test('043 excludes selected, split, Glance and protected video instead of changing the visible page',()=>{
 assert.match(rules,/#tabbrowser-tabpanels\s*>\s*\.browserSidebarContainer:not\(\s*\.deck-selected,\s*\[zen-split="true"\],\s*\.zen-glance-overlay,\s*\.zen-glance-background\s*\)/);
 assert.match(rules,/:has\(>\s*:is\(#zia-tab-card, #zia-folder-card, #zia-tip-card,\s*#zsf-folder-hover-card\):not\(\[hidden\]\)\)/);
 assert.equal((rules.match(/will-change:\s*auto !important;/g)||[]).length,1);
 assert.equal((rules.match(/backface-visibility:\s*visible !important;/g)||[]).length,1);
 assert.doesNotMatch(rules,/will-change:\s*(?:transform|backdrop-filter)/);
});
test('043 only undoes background browser-page promotion; no blur, card, sidebar, menu or JS changes',()=>{
 assert.doesNotMatch(rules,/\b(?:background(?:-color)?|backdrop-filter|color|opacity|filter|transform|box-shadow|animation|transition|border-radius|pointer-events|display|position)\s*:/);
 assert.doesNotMatch(rules,/(?:^|[;{]\s*)visibility\s*:/m);
 assert.doesNotMatch(rules,/#tabContextMenu|#contentAreaContextMenu|#urlbar|#titlebar|#navigator-toolbox/);
 assert.doesNotMatch(rules,/\b(?:setInterval|setTimeout|MutationObserver)\b/);
 assert.doesNotMatch(rules,/>\s*:is\(#zia-tab-card, #zia-folder-card, #zia-tip-card,\s*#zsf-folder-hover-card\):not\(\[hidden\]\)\s*\{/);
});
test('043 retains the original unified HG 10px setting path and v041 menu window shadow safety',()=>{
 const preview=css.slice(css.indexOf('/* v0.3.3 — opt-out unified HG theme.'),css.indexOf('/* v0.3.4 — Opt-in Glance foreground'));
 assert.match(preview,/#zia-tab-card, #zia-folder-card, #zia-tip-card,\s*#zsf-folder-hover-card/);
 assert.match(preview,/backdrop-filter: blur\(var\(--mod-compacttpr-customblur, 5px\)\) !important;/);
 const menu=css.slice(css.indexOf('/* v0.4.0 — macOS context-menu border-only correction.'),at);
 assert.match(menu,/#tabContextMenu/);
 assert.doesNotMatch(menu,/-moz-window-shadow\s*:/);
});
