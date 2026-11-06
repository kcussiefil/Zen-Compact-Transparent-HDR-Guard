'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(base,'chrome.css'),'utf8');
const prefs=JSON.parse(fs.readFileSync(path.join(base,'preferences.json'),'utf8'));
const theme=JSON.parse(fs.readFileSync(path.join(base,'theme.json'),'utf8'));
const popup=css.slice(
 css.indexOf('/* v0.2.5 — Zia URL/search pop-up specificity correction.'),
 css.indexOf('/* v0.2.6 — Independently enabled preview-card glass.')
);
const clean=popup.replace(/\/\*[\s\S]*?\*\//g,'');
const ghost=':not(#zia-none):not(#zia-none-2):not(#zcth-popup-priority)';
const occurs=(text,needle)=>text.split(needle).length-1;

test('025 fixes 023 popup paint being overridden by Zia 2.118 high-specificity !important',()=>{
 assert.equal(theme.version,'0.2.7');
 assert.equal(occurs(clean,ghost),3,'main pop-up and two contrast rules all win the cascade');
 assert.match(clean,new RegExp('#urlbar#urlbar:is\\(\\[breakout-extend\\]'));
 // Zia's own normal popup selector carries 2 ghost ID conditions and
 // #urlbar#urlbar = four ID units, irrespective of source order.
 // Our extra ghost ID gives at least 5 units before :is(...) alternatives.
 assert.equal(occurs(ghost,':not(#'),3);
 assert.ok(occurs(ghost,':not(#')+occurs('#urlbar#urlbar','#urlbar')>4);
 assert.match(clean,/background: color-mix\([\s\S]*?\) !important;/);
 assert.match(clean,/backdrop-filter: blur\(var\(--mod-compacttpr-customblur, 5px\)\) !important/);
});

test('popup matches exact sidebar custom blur/color/transparency values',()=>{
 const before=css.slice(0,css.indexOf('/* v0.2.5 —'));
 const sidebar=before.slice(before.indexOf('#titlebar::before'),before.indexOf('/* v0.2.0 —'));
 assert.match(sidebar,/var\(--mod-compacttpr-customcolor-final\)/);
 assert.match(sidebar,/transparent var\(--mod-compacttpr-transparentvalue, 15%\)/);
 assert.match(sidebar,/var\(--mod-compacttpr-customblur, 5px\)/);
 for(const key of [
   'var(--mod-compacttpr-customcolor-final)',
   'transparent var(--mod-compacttpr-transparentvalue, 15%)',
   'var(--mod-compacttpr-customblur, 5px)'
 ])assert.ok(clean.includes(key),key);
 assert.doesNotMatch(clean,/blur\(24px\)/,'hardcoded upstream 24px must not replace user value');
});

test('popup override requires both Sine preference and Zia native preference',()=>{
 assert.equal(prefs.find(x=>x.property==='mod.compacttpr.urlbarcustomblur')?.defaultValue,false);
 assert.match(clean,/-moz-bool-pref: "mod\.compacttpr\.urlbarcustomblur"/);
 assert.match(clean,/-moz-bool-pref: "mod\.compacttpr\.usecompacttransparent"/);
 assert.match(clean,/-moz-pref\("zia\.urlbar\.pop-up-blur"\)/);
 assert.match(clean,/#urlbar#urlbar:is\(\[breakout-extend\], \[zen-floating-urlbar="true"\]\)/);
 assert.match(clean,/:not\(\[zia-classic\]\)/);
});

test('specificity correction does not change Bilibili instant, SDR, or HDR gating',()=>{
 for(const marker of ['data-zcth-bilibili-glass','data-zcth-sdr-glass','data-zcth-hdr-glass']){
   assert.ok(occurs(clean,'['+marker+']')===3,marker);
 }
 assert.match(clean,/browser\[zia-video\]/);
 assert.match(clean,/:not\(\[zia-video\], \[data-zcth-video-page\]\)/);
});

test('opposite-palette readability guard still wins even above custom popup selector',()=>{
 const opposite=clean.slice(clean.indexOf('/* Preserve Zia')+1);
 assert.match(clean,/\[zen-single-toolbar="true"\]\[zia-light\]/);
 assert.match(clean,/\[zia-pop-site="dark"\]/);
 assert.match(clean,/\[zen-single-toolbar="true"\]:not\(\[zia-light\]\)/);
 assert.match(clean,/\[zia-pop-site="light"\]/);
 assert.match(clean,/background: var\(--zia-urlbar-open-bg\) !important/);
 assert.match(clean,/backdrop-filter: none !important/);
 assert.ok(clean.indexOf('background: var(--zia-urlbar-open-bg) !important')>
   clean.indexOf('background: color-mix('),'contrast override is last');
});

test('no new compositor promotion or brightness transformation survives popup closure',()=>{
 assert.doesNotMatch(clean,/\bwill-change\s*:/);
 assert.doesNotMatch(clean,/\bbackface-visibility\s*:/);
 assert.doesNotMatch(clean,/(?:^|[;\s{}])brightness\s*:/);
 assert.doesNotMatch(clean,/(?:^|[;\s{}])filter\s*:/);
 assert.doesNotMatch(clean,/#tabbrowser-tabpanels\s+\.browserSidebarContainer\s*\{/);
});
