'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(root,'chrome.css'),'utf8');
const prefs=JSON.parse(fs.readFileSync(path.join(root,'preferences.json'),'utf8'));
const theme=JSON.parse(fs.readFileSync(path.join(root,'theme.json'),'utf8'));
const unifiedStart=css.indexOf('/* v0.3.3 — opt-out unified HG theme.');
const unifiedEnd=css.indexOf('/* v0.3.4 — Opt-in Glance foreground',unifiedStart);
const unified=css.slice(unifiedStart,unifiedEnd);
const stableStart=unified.indexOf('/* v0.3.5 — keep the floating sidebar');
const videoStart=unified.indexOf('/* Zia otherwise changes this surface to NO blur',stableStart);
const stable=unified.slice(stableStart,videoStart);
const nativeVideo=unified.slice(videoStart,unified.indexOf('@media -moz-pref("zia.cards.blur")',videoStart));
const active=stable.replace(/\/\*[\s\S]*?\*\//g,'');
const getProp=(s,p)=>s.match(new RegExp(p+'\\s*:\\s*([^;]+);'))?.[1]?.trim();
test('035 stable underlay is only active in unified HG with matching Zia sidebar blur preference',()=>{
 assert.equal(theme.version,'0.3.6');
 assert.ok(unifiedStart>0&&stableStart>0&&videoStart>stableStart);
 assert.match(unified,/@media \(-moz-bool-pref: "mod\.compacttpr\.usecompacttransparent"\) and\s+\(-moz-bool-pref: "mod\.compacttpr\.unifiedhg"\)/);
 assert.ok(unified.slice(0,stableStart).includes('@media -moz-pref("zia.compact.sidebar-blur")'));
 assert.equal(prefs.find(p=>p.property==='mod.compacttpr.unifiedhg')?.defaultValue,true);
});
test('035 the floating native underlay always matches both pre- and post-video values',()=>{
 assert.match(active,/#navigator-toolbox \.zen-toolbar-background\s*\{/);
 assert.doesNotMatch(active,/\[zia-video\]|\[data-zcth-video-page\]|\[data-zcth-sdr-glass\]|\[data-zcth-hdr-glass\]/);
 for(const property of ['background','backdrop-filter','opacity']){
   const lhs=getProp(active,property);
   const rhs=getProp(nativeVideo,property);
   assert.equal(lhs,rhs,'support underlay must not jump values: '+property);
 }
 for(const state of ['watch-page-initial','unknown-video','sdr-playing','hdr-playing','pause','resume']){
   const underlay={background:getProp(active,'background'),blur:getProp(active,'backdrop-filter')};
   assert.deepEqual(underlay,{background:'transparent !important',blur:'blur(28px) saturate(1.6) !important'},state);
 }
});
test('035 custom HG 10px-first-frame surface and fallback remain intact',()=>{
 assert.match(unified,/#titlebar::before[\s\S]*?--mod-compacttpr-customblur/);
 assert.match(unified,/:root\[zen-compact-mode="true"\]\[zia-video\]/);
 assert.match(nativeVideo,/\.zen-toolbar-background\s*\{/);
 assert.equal(getProp(active,'opacity'),getProp(nativeVideo,'opacity'));
});
test('035 no extra GPU promotion, animation, timer or top-toolbar override',()=>{
 for(const pattern of [/will-change\s*:/,/backface-visibility\s*:/,/transform\s*:/,/transition\s*:/,/animation\s*:/,/setInterval|setTimeout|MutationObserver/])
  assert.doesNotMatch(active,pattern);
 assert.doesNotMatch(active,/#zen-appcontent-navbar-wrapper/);
 assert.ok(!active.includes('!important; !important;'));
});
