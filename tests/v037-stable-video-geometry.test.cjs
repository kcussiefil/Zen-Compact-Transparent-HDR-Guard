'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(root,'chrome.css'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'theme.json'),'utf8'));
const a=css.indexOf('/* v0.3.7 — video-independent compact sidebar geometry.');
const b=css.indexOf('/* v0.3.3 — opt-out unified HG theme.',a);
const geom=css.slice(a,b),uni=css.slice(b,css.indexOf('/* v0.3.4 — Opt-in Glance foreground',b));
test('037 stable sidebar geometry does not depend on any video state',()=>{
 assert.equal(manifest.version,'0.4.3');
 assert.ok(a>0&&b>a);
 for(const m of ['[zia-video]','[data-zcth-video-page]','[data-zcth-sdr-glass]','[data-zcth-hdr-glass]','[data-zcth-youtube-page]'])assert.ok(!geom.includes(m),m);
 assert.equal((geom.match(/top: 50% !important;/g)||[]).length,4);
 assert.equal((geom.match(/transform: translateY\(-50%\) !important;/g)||[]).length,4);
 assert.match(geom,/overflow: hidden !important/);
 assert.match(geom,/display: none !important/);
});
test('037 restores exactly the original four height/expansion gates',()=>{
 for(const s of ['zen.view.compact.hide-tabbar','zen.view.use-single-toolbar','mod.compacttpr.leftsidebaronlycollapsed','[zen-compact-animating]','[animate="true"]','[zen-sidebar-expanded="true"]','[zen-single-toolbar="true"]','[customizing]','[inDOMFullscreen="true"]'])assert.ok(geom.includes(s),s);
 assert.equal((geom.match(/--zen-compact-float/g)||[]).length,2);
 assert.equal((geom.match(/--zen-compact-top-toolbar-hidden-fix/g)||[]).length,2);
});
test('037 adds no paint changes or extra compositor or scheduler',()=>{
 for(const p of [/backdrop-filter\s*:/,/background-color\s*:/,/will-change\s*:/,/backface-visibility\s*:/,/transition\s*:/,/animation\s*:/,/setInterval|setTimeout|MutationObserver/])assert.doesNotMatch(geom,p);
 assert.match(uni,/#titlebar::before[\s\S]*?--mod-compacttpr-customblur/);
});
test('037 Zia now owns normal sidebar composition, cards and popups remain visible-only',()=>{
 const mac=uni.slice(uni.indexOf('/* A hidden card only has a computed style;'));
 assert.equal((mac.match(/will-change: transform !important/g)||[]).length,2);
 assert.doesNotMatch(mac,/@media -moz-pref\("zia\.compact\.sidebar-blur"\)/);
 assert.match(mac,/zia\.cards\.blur/);
 assert.match(mac,/zia\.urlbar\.pop-up-blur/);
 assert.match(mac,/\.browserSidebarContainer:is\(\.deck-selected, \[zen-split="true"\]\)/);
});
