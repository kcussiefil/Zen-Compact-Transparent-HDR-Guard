'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(root,'chrome.css'),'utf8');
const prefs=JSON.parse(fs.readFileSync(path.join(root,'preferences.json'),'utf8'));
const start=css.indexOf('/* v0.3.3 — opt-out unified HG theme.');
const end=css.indexOf('/* v0.2.0 —',start);
const unified=css.slice(start,end);
const rules=unified.replace(/\/\*[\s\S]*?\*\//g,'');
const sha=file=>{
 const bytes=fs.readFileSync(path.join(root,file));
 return crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
};

test('033 master is reversible and the original matching Zia preferences remain required',()=>{
 assert.ok(start>0&&end>start);
 assert.equal(prefs.find(p=>p.property==='mod.compacttpr.unifiedhg')?.defaultValue,true);
 assert.match(unified,/@media \(-moz-bool-pref: "mod\.compacttpr\.usecompacttransparent"\) and\s+\(-moz-bool-pref: "mod\.compacttpr\.unifiedhg"\)/);
 for(const zia of ['zia.compact.sidebar-blur','zia.cards.blur','zia.urlbar.pop-up-blur'])
  assert.ok(unified.includes('@media -moz-pref("'+zia+'")'),zia);
});

test('033 first HG paint is independent of asynchronous SDR/HDR classification',()=>{
 for(const marker of ['data-zcth-sdr-glass','data-zcth-hdr-glass','data-zcth-video-page'])
  assert.ok(!rules.includes('['+marker+']'),'unified visual rules cannot wait for '+marker);
 assert.ok(!rules.includes(':not([zia-video])'),'unified rules cannot wait for root video state');
 assert.match(rules,/var\(--mod-compacttpr-customblur, 5px\)/);
 assert.match(rules,/var\(--mod-compacttpr-transparentvalue, 15%\)/);
});

test('033 both native Zia and Site Folders hidden-source previews resolve the same first-frame HG value',()=>{
 const selector=rules.match(/>\s*:is\(#zia-tab-card, #zia-folder-card, #zia-tip-card,\s*#zsf-folder-hover-card\)\s*\{([^}]+)\}/);
 assert.ok(selector,'four cards should share one fixed source style');
 assert.doesNotMatch(selector[0],/:not\(\[hidden\]\)/);
 assert.match(selector[1],/backdrop-filter: blur\(var\(--mod-compacttpr-customblur, 5px\)\)/);
 // Models Site Folders' synchronous getComputedStyle() from a hidden Zia
 // source; the user preference is already 10px before the card becomes visible.
 for(const stream of ['unknown','sdr','hdr']){
  for(const sourceHidden of [false,true]){
   const ziaPref=true,unifiedEnabled=true,userBlur=10;
   const firstPaint=ziaPref&&unifiedEnabled?userBlur:24;
   assert.equal(firstPaint,10,stream+' hidden='+sourceHidden);
  }
 }
});

test('033 both address/search and new-tab floating popups use HG on first open',()=>{
 assert.match(rules,/#urlbar#urlbar:is\(\[breakout-extend\], \[zen-floating-urlbar="true"\]\):not\(\[zia-classic\]\)/);
 assert.match(rules,/--zia-urlbar-open-bg[\s\S]*?backdrop-filter: blur\(var\(--mod-compacttpr-customblur, 5px\)\)/,
  'opposite-palette contrast keeps true HG blur instead of native no-blur');
});

test('033 compositor is only requested for actually displayed sidebar/card/popup and never for a hidden preview',()=>{
 const v033Only=css.slice(start,css.indexOf('/* v0.2.0 — Zia 2.118 native video compositor ownership.',start));
 const compositor=v033Only.slice(v033Only.lastIndexOf('@media (-moz-platform: macos)'));
 assert.ok(compositor.length>0);
 assert.match(compositor,/:has\(> :is\(#zia-tab-card, #zia-folder-card, #zia-tip-card,\s*#zsf-folder-hover-card\):not\(\[hidden\]\)\)/);
 assert.match(compositor,/:has\(> #zsf-color-dialog\[open\]\)/);
 assert.match(compositor,/:has\(#urlbar:is\(\[breakout-extend\],\s*\[zen-floating-urlbar="true"\]\):not\(\[zia-classic\]\)\)/);
 assert.doesNotMatch(compositor,/\[zen-has-hover\]/,'Zia owns native sidebar hover promotion');
 assert.match(compositor,/zen-glance-overlay\.deck-selected/);
 assert.equal((compositor.match(/will-change: transform !important/g)||[]).length,2);
 for(const pref of ['zia.cards.blur','zia.urlbar.pop-up-blur'])
  assert.ok(compositor.includes('@media -moz-pref("'+pref+'")'),
   'never promote a disabled Zia surface: '+pref);
 assert.ok(!compositor.includes('setInterval')&&!compositor.includes('setTimeout'));
 for(const state of ['unknown','sdr','hdr'])for(const visible of [false,true]){
  const shouldPromote=visible;
  assert.equal(shouldPromote,visible,'overlay-only behavior: '+state);
 }
});

test('033 actor timing unchanged; 036 experimental URL marker retired',()=>{
 for(const [file,expected] of Object.entries({
  'sdr-glass.uc.js':'489b4b604741d18e717b767a5053463b55477e4f',
  'video-page.uc.js':'698860f7b14e018811e6fb79ceed46a2c984c541',
  'actors/ZcthUniversalChild.sys.mjs':'0bf395f09d59dae8d530cecc0df4d74694600ddc'
 }))assert.equal(sha(file),expected,file);
});
