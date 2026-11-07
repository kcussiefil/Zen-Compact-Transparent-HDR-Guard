'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(root,'chrome.css'),'utf8');
const prefs=JSON.parse(fs.readFileSync(path.join(root,'preferences.json'),'utf8'));
const theme=JSON.parse(fs.readFileSync(path.join(root,'theme.json'),'utf8'));
const marker='/* v0.3.0 — macOS Glance glass with explicit hover-card priority and recovery.';
const rule=css.slice(css.indexOf(marker)).replace(/\/\*[\s\S]*?\*\//g,'');
test('030 preserves the default-OFF Glance opt-in through v0.3.3',()=>{
 assert.equal(theme.version,'0.3.7');
 assert.equal(prefs.find(p=>p.property==='mod.compacttpr.glanceglass')?.defaultValue,false);
 assert.equal(theme.scripts['glance-recovery.uc.js'].loadOrder,80);
 assert.ok(css.includes(marker));
 assert.match(rule,/-moz-platform: macos/);
 assert.match(rule,/-moz-bool-pref: "mod\.compacttpr\.glanceglass"/);
});
test('030 selected Glance alone can paint glass; no page promotion while a preview card is open',()=>{
 assert.match(rule,/\.zen-glance-overlay\.deck-selected/);
 assert.match(rule,/:not\(\s*:has\(> :is\(#zia-tab-card, #zia-folder-card, #zia-tip-card,/);
 assert.match(rule,/#zsf-folder-hover-card\):not\(\[hidden\]\)\)/);
 assert.match(rule,/\[zen-has-hover\]/);
 assert.match(rule,/will-change: transform !important/);
});
test('030 excludes root and Glance foreground/background video from promotion',()=>{
 assert.match(rule,/\[zia-video\], \[data-zcth-video-page\]/);
 assert.match(rule,/:is\(\s*\.zen-glance-background, \.zen-glance-overlay/);
 assert.match(rule,/browser\[zia-video\]/);
 assert.doesNotMatch(rule,/#tabbrowser-tabpanels \.browserSidebarContainer\s*\{/);
});
test('030 recovery clears compositor for one frame only, after Glance, never video',()=>{
 assert.match(rule,/:root\[data-zcth-glance-recover\]:not/);
 assert.match(rule,/will-change: auto !important/);
 assert.match(rule,/backface-visibility: visible !important/);
 assert.match(rule,/:not\(:has\(browser\[zia-video\]\)\)/);
 assert.match(rule,/:not\(\s*:has\(#tabbrowser-tabpanels > \.browserSidebarContainer\.zen-glance-overlay\.deck-selected\)/);
});
test('030 preserves custom appearance and does not alter video geometry or brightness',()=>{
 for(const x of ['--mod-compacttpr-customcolor-final','--mod-compacttpr-transparentvalue','--mod-compacttpr-customblur'])assert.ok(rule.includes(x));
 for(const x of [/brightness\s*\(/,/filter:\s*brightness/,/video\.html5/,/opacity\s*:/,/transform\s*:/,/width\s*:/,/height\s*:/,/position:\s*fixed/])assert.doesNotMatch(rule,x);
 assert.match(rule,/#titlebar::before/);
});
