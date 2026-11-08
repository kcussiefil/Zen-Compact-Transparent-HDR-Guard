'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(root,'chrome.css'),'utf8');
const prefs=JSON.parse(fs.readFileSync(path.join(root,'preferences.json'),'utf8'));
const theme=JSON.parse(fs.readFileSync(path.join(root,'theme.json'),'utf8'));
const start=css.indexOf('/* v0.3.4 — Opt-in Glance foreground');
const end=css.indexOf('/* v0.2.0 — Zia 2.118 native video compositor ownership.',start);
const block=css.slice(start,end);
const rule=block.replace(/\/\*[\s\S]*?\*\//g,'');
test('034 Glance opt-in defaults OFF and requires unified HG',()=>{
 assert.ok(start>0&&end>start);
 assert.equal(theme.version,'0.4.2');
 assert.equal(prefs.find(p=>p.property==='mod.compacttpr.glanceglass')?.defaultValue,false);
 for(const p of ['mod.compacttpr.usecompacttransparent','mod.compacttpr.unifiedhg','mod.compacttpr.glanceglass'])
  assert.ok(block.includes('(-moz-bool-pref: "'+p+'")'),p);
});
test('034 visible card, editor, sidebar and URL popup match only corresponding enabled Zia features',()=>{
 for(const p of ['zia.compact.sidebar-blur','zia.cards.blur','zia.urlbar.pop-up-blur'])
  assert.ok(block.includes('@media -moz-pref("'+p+'")'),p);
 for(const p of ['#zia-tab-card','#zia-folder-card','#zia-tip-card','#zsf-folder-hover-card','#zsf-color-dialog[open]','[zen-floating-urlbar="true"]','[breakout-extend]','[zen-has-hover]'])
  assert.ok(block.includes(p),p);
 assert.match(block,/#zsf-folder-hover-card\):not\(\[hidden\]\)/);
 assert.match(block,/:has\(\s*#tabbrowser-tabpanels > \.browserSidebarContainer\.zen-glance-overlay\.deck-selected\s*\)/);
});
test('034 only promotes foreground while Glance is selected, never hidden source or background video',()=>{
 assert.equal((rule.match(/will-change: transform !important/g)||[]).length,3);
 assert.equal((rule.match(/backface-visibility: hidden !important/g)||[]).length,3);
 assert.equal((rule.match(/\.browserSidebarContainer\.zen-glance-overlay\.deck-selected\s*\{/g)||[]).length,3);
 assert.doesNotMatch(rule,/\.zen-glance-background\.deck-selected\s*\{/);
 assert.doesNotMatch(rule,/\bbackdrop-filter\s*:|\bopacity\s*:|\bbrightness\s*\(|\bdisplay\s*:/);
});
test('034 introduces no interval, observer, video filter or unconditional compositor',()=>{
 assert.doesNotMatch(rule,/setInterval|MutationObserver|setTimeout/);
 assert.doesNotMatch(rule,/#tabbrowser-tabpanels\s+\.browserSidebarContainer\s*\{/);
 assert.doesNotMatch(rule,/\bfilter\s*:|browser\[zia-video\]\s*\{/);
});
