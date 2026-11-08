'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(base,'chrome.css'),'utf8');
const segment=css.slice(
 css.indexOf('/* v0.2.6 — Independently enabled preview-card glass.'),
 css.indexOf('/* v0.2.7 — Site Folders')
);
const effective=segment.replace(/\/\*[\s\S]*?\*\//g,'');
const prefs=JSON.parse(fs.readFileSync(path.join(base,'preferences.json'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(base,'theme.json'),'utf8'));
const count=(s,x)=>s.split(x).length-1;

test('026 preview-card glass is independently toggleable and defaults off',()=>{
 assert.equal(manifest.version,'0.4.1');
 const pref=prefs.find(x=>x.property==='mod.compacttpr.previewcardcustomblur');
 assert.ok(pref,'separate Sine setting');
 assert.equal(pref.type,'checkbox');
 assert.equal(pref.defaultValue,false,'switch OFF must retain exact 025 appearance');
 assert.match(effective,/-moz-bool-pref: "mod\.compacttpr\.previewcardcustomblur"/);
 assert.match(effective,/-moz-bool-pref: "mod\.compacttpr\.usecompacttransparent"/);
 assert.match(effective,/-moz-pref\("zia\.cards\.blur"\)/,
   'Zia upstream card-glass policy remains authoritative');
});

test('026 styles all three requested card types plus Zia tooltips, no page geometry',()=>{
 const cards=['#zia-tab-card','#zia-folder-card','#zsf-folder-hover-card','#zia-tip-card'];
 for(const card of cards)assert.ok(effective.includes(card),card);
 assert.match(effective,/> :is\(#zia-tab-card, #zia-folder-card, #zia-tip-card, #zsf-folder-hover-card\)\s*\{/);
 assert.doesNotMatch(effective,/width\s*:|height\s*:|position\s*:|border-radius\s*:|corner-shape\s*:|animation\s*:/,
   'card position, sizes, shape and animation stay owned by Zia and Site Folders');
});

test('026 uses exactly the sidebar custom color, translucency and blur, no Zia 24px/76% fallback',()=>{
 const before=css.slice(0,css.indexOf('/* v0.2.6'));
 const sidebar=before.slice(before.indexOf('#titlebar::before'),before.indexOf('/* v0.2.0'));
 for(const variable of [
   'var(--mod-compacttpr-customcolor-final)',
   'transparent var(--mod-compacttpr-transparentvalue, 15%)',
   'var(--mod-compacttpr-customblur, 5px)'
 ]) {
  assert.ok(sidebar.includes(variable),'baseline sidebar '+variable);
  assert.ok(effective.includes(variable),'new cards '+variable);
 }
 assert.match(effective,/background-color:\s*color-mix\(/);
 assert.match(effective,/backdrop-filter:\s*blur\(var\(--mod-compacttpr-customblur, 5px\)\) !important/);
 assert.doesNotMatch(effective,/blur\(24px\)|76%|saturate\(/,
   'no Zia hardcoded fallback or extra saturation that changes blur look');
});

test('026 beats Zia 2.118 and Site Folders 0.7.6 !important selector specificity',()=>{
 const roots=':root:not(#zcth-card-ghost-1):not(#zcth-card-ghost-2):not(#zcth-card-ghost-3)';
 assert.equal(count(effective,roots),1,'one safely scoped card paint selector');
 assert.equal(count(roots,':not(#'),3);
 assert.ok(effective.includes('> :is(#zia-tab-card, #zia-folder-card, #zia-tip-card, #zsf-folder-hover-card)'),
   'direct chrome root card matches Zia and Site Folders real DOM');
 // Old CSS Zia: :root:not([zia-video]) :is(#zia-tab-card ...)
 // Old CSS Site Folders: :root:not([zia-video]) #zsf-folder-hover-card.
 // Our three ID-only guards outrank these even with Zia loaded later.
});

test('026 does not accidentally style unclassified video or protected HDR',()=>{
 assert.match(effective,/:not\(\[zia-video\], \[data-zcth-video-page\]\):not\(/);
 assert.match(effective,/:has\(#tabbrowser-tabpanels > \.browserSidebarContainer:is\(\.deck-selected, \[zen-split="true"\]\) browser\[zia-video\]\)/);
 for(const marker of ['data-zcth-bilibili-glass','data-zcth-sdr-glass','data-zcth-hdr-glass'])
  assert.match(effective,new RegExp('\\['+marker+'\\]'),marker);
 const eligible=({rootVideo,watchPage,visibleVideo,bili,sdr,hdr})=>
   Boolean((!rootVideo&&!watchPage&&!visibleVideo)||bili||sdr||hdr);
 assert.equal(eligible({rootVideo:false,watchPage:false,visibleVideo:false}),true,'ordinary');
 assert.equal(eligible({rootVideo:false,watchPage:true,visibleVideo:true}),false,'HDR unknown');
 assert.equal(eligible({rootVideo:true,watchPage:true,visibleVideo:true}),false,'Zia no-HDR-blur');
 assert.equal(eligible({rootVideo:false,watchPage:true,visibleVideo:true,hdr:true}),true,'HDR expressly enabled');
 assert.equal(eligible({rootVideo:false,watchPage:true,visibleVideo:true,sdr:true}),true,'SDR expressly enabled');
 assert.equal(eligible({rootVideo:false,watchPage:true,visibleVideo:true,bili:true}),true,'Bilibili fast mode');
});

test('032 hidden Zia cards can pre-resolve HG styles without GPU painting',()=>{
 assert.doesNotMatch(effective,/\bdisplay\s*:|\bvisibility\s*:/,'upstream [hidden] display remains authoritative');
 for(const banned of [
  /\bwill-change\s*:/,/\bbackface-visibility\s*:/,/(?:^|[\s;{}])filter\s*:/,
  /\bbrightness\s*:/,/browserSidebarContainer\s*\{/,/\btransform\s*:/
 ])assert.doesNotMatch(effective,banned);
 assert.ok(!effective.includes('data-zcth-video-page] #tabbrowser-tabpanels'),
   'no forced legacy video composition on video page');
});

test('026 preserves existing independent video and popup defaults',()=>{
 const lookup=k=>prefs.find(x=>x.property===k)?.defaultValue;
 assert.equal(lookup('mod.compacttpr.urlbarcustomblur'),false);
 assert.equal(lookup('mod.compacttpr.sdrrealblur'),false);
 assert.equal(lookup('mod.compacttpr.hdrrealblur'),false);
 assert.equal(lookup('mod.compacttpr.bilibiliinstantglass'),true);
 assert.ok(css.includes('/* v0.2.5 — Zia URL/search pop-up specificity correction.'));
 assert.equal(count(css,'/* v0.2.6 — Independently enabled preview-card glass.'),1);
});
