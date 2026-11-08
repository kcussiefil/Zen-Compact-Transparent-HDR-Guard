'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const css=fs.readFileSync(path.join(__dirname,'..','chrome.css'),'utf8');
const marker='/* v0.4.0 — macOS context-menu border-only correction.';
const at=css.indexOf(marker),end=css.indexOf('/* v0.4.2 — opt-in card-only macOS backdrop compositing experiment.'),p=css.slice(at,end);
test('0.4.1 keeps native macOS popup window shadow in place while isolating backplate rendering',()=>{
 assert.ok(at>0);
 for(const banned of ['background:','background-color:','background-image:','--panel-background:','--panel-background-color:','appearance:','-moz-default-appearance:','backdrop-filter:','border-radius:','color-mix(','--panel-text-color:'])assert.ok(!p.includes(banned),banned);
 assert.doesNotMatch(p,/-moz-window-shadow\s*:/, 'window-shadow override must be absent, including nested menus');
 assert.ok(p.includes('--panel-border-color: transparent !important;'));
});
test('0.4.1 leaves historical HDR and Zia styling before the menu block untouched',()=>{
 assert.ok(css.slice(0,at).includes('/* v0.3.7 — video-independent compact sidebar geometry.'));
 assert.ok(css.slice(0,at).includes('/* v0.3.3 — opt-out unified HG theme.'));
 assert.doesNotMatch(p,/(^|\s)(?:transform|will-change|animation|pointer-events|display|order|position)\s*:/m);
});
