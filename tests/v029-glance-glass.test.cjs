'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(base,'chrome.css'),'utf8');
const prefs=JSON.parse(fs.readFileSync(path.join(base,'preferences.json'),'utf8'));
const theme=JSON.parse(fs.readFileSync(path.join(base,'theme.json'),'utf8'));
const marker='/* v0.2.9 — Opt-in macOS Zen Glance glass compositor.';
const rule=css.slice(css.indexOf(marker)).replace(/\/\*[\s\S]*?\*\//g,'');
const count=(s,needle)=>s.split(needle).length-1;

test('v029 requires independent default-off macOS Sine opt-in',()=>{
 assert.equal(theme.version,'0.2.9');
 assert.equal(prefs.find(p=>p.property==='mod.compacttpr.glanceglass')?.defaultValue,false);
 assert.ok(css.includes(marker));
 assert.match(rule,/-moz-platform: macos/);
 assert.match(rule,/-moz-bool-pref: "mod\.compacttpr\.glanceglass"/);
 assert.match(rule,/-moz-bool-pref: "mod\.compacttpr\.usecompacttransparent"/);
 assert.match(rule,/\[zen-compact-mode="true"\]/);
});

test('only selected Glance overlays activate compositor and styling',()=>{
 assert.ok(count(rule,'.zen-glance-overlay.deck-selected')>=4);
 assert.match(rule,/#navigator-toolbox:is\(\[zen-has-hover\]/);
 assert.doesNotMatch(rule,/MutationObserver|setTimeout|setInterval|data-zcth-glance-open/);
});

test('Glance foreground is gated against its own video and when the sidebar is hidden',()=>{
 assert.match(rule,/\.zen-glance-overlay\.deck-selected:not\(\s*:has\(browser\[zia-video\]\)/);
 assert.equal(count(rule,'will-change: transform !important'),2);
 assert.equal(count(rule,'backface-visibility: hidden !important'),2);
});

test('background HDR video is excluded from compositor promotion',()=>{
 assert.match(rule,/\[zia-video\], \[data-zcth-video-page\]/);
 assert.match(rule,/\.zen-glance-background browser\[zia-video\]/);
 assert.match(rule,/\.zen-glance-background\.deck-selected/);
 assert.doesNotMatch(rule,/#tabbrowser-tabpanels \.browserSidebarContainer\s*\{/);
});

test('custom glass parameters remain unchanged; no video color or layout changes',()=>{
 for(const x of ['--mod-compacttpr-customcolor-final','--mod-compacttpr-transparentvalue','--mod-compacttpr-customblur'])assert.ok(rule.includes(x));
 for(const x of [/brightness\s*\(/,/filter:\s*brightness/,/video\.html5/,/opacity\s*:/,/transform\s*:/,/width\s*:/,/height\s*:/,/position:\s*fixed/])assert.doesNotMatch(rule,x);
 assert.match(rule,/#titlebar::before/);
});
