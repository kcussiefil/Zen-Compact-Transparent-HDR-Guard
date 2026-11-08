'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(root,'chrome.css'),'utf8');
const prefs=JSON.parse(fs.readFileSync(path.join(root,'preferences.json'),'utf8'));
const theme=JSON.parse(fs.readFileSync(path.join(root,'theme.json'),'utf8'));
const prior=css.slice(
 css.indexOf('/* v0.2.6 — Independently enabled preview-card glass.'),
 css.indexOf('/* v0.2.7 — Site Folders')
);
const color=css.slice(
 css.indexOf('/* v0.2.7 — Site Folders'),
 css.indexOf('/* v0.2.8 — Selected-color dialog compositor:')
);
const cleaned=color.replace(/\/\*[\s\S]*?\*\//g,'');
const count=(s,x)=>s.split(x).length-1;

test('027 is visual-only and reuses preview card switch, no new prefs',()=>{
 assert.equal(theme.version,'0.4.3');
 const setting=prefs.find(x=>x.property==='mod.compacttpr.previewcardcustomblur');
 assert.equal(setting?.defaultValue,false,'instant rollback to original Site Folders card');
 assert.ok(setting.label.includes('選取分頁顏色'));
 assert.equal(count(prefs.map(p=>p.property).join('|'),'mod.compacttpr.previewcardcustomblur'),1);
 assert.match(cleaned,/-moz-bool-pref: "mod\.compacttpr\.usecompacttransparent"/);
 assert.match(cleaned,/-moz-bool-pref: "mod\.compacttpr\.previewcardcustomblur"/);
 assert.match(cleaned,/-moz-pref\("zia\.cards\.blur"\)/);
});

test('matches Site Folders nonmodal dialog DOM, only after it is opened',()=>{
 assert.match(cleaned,/> #zsf-color-dialog\[open\]\s*\{/);
 assert.doesNotMatch(cleaned,/#zsf-color-dialog\s*\{/,
  'must not show hidden dialog before its synchronous positioning');
 assert.equal(count(cleaned, '#zsf-color-dialog[open]'),1);
 assert.ok(prior.includes('#zsf-folder-hover-card'),'retains 026 group preview');
 assert.doesNotMatch(cleaned,/\bvisibility\s*:/,
  'do not override Site Folders setting visibility:hidden before positioning');
});

test('same exact background color transparency and blur as sidebar and hover card',()=>{
 const variables=[
  'var(--mod-compacttpr-customcolor-final)',
  'transparent var(--mod-compacttpr-transparentvalue, 15%)',
  'var(--mod-compacttpr-customblur, 5px)'
 ];
 for(const variable of variables){
  assert.ok(prior.includes(variable),'026 baseline '+variable);
  assert.ok(cleaned.includes(variable),'027 color dialog '+variable);
 }
 assert.match(cleaned,/background:\s*color-mix\(/,
  'background shorthand beats original Site Folders shorthand');
 assert.match(cleaned,/backdrop-filter:\s*blur\(var\(--mod-compacttpr-customblur, 5px\)\) !important/);
 assert.doesNotMatch(cleaned,/blur\(24px\)|saturate\(|78%/,
  'no old Site Folders hardcoded blur, saturation or opacity');
});

test('higher specificity than the Site Folders !important dialog backgrounds',()=>{
 const guards=':root:not(#zcth-color-editor-ghost-1):not(#zcth-color-editor-ghost-2):not(#zcth-color-editor-ghost-3)';
 assert.equal(count(cleaned,guards),1);
 assert.equal(count(guards,':not(#'),3);
 assert.match(cleaned,/\bbackground:\s*color-mix\([\s\S]*?\) !important/);
 assert.match(cleaned,/opacity:\s*1\s*!important/,
  'hover must not fade the entire dialog even as background remains translucent');
 assert.doesNotMatch(cleaned,/:hover\s*\{/,
  'no separate hover-only painting path with different glass behavior');
});

test('video-protected/unknown remains untouched and Bilibili quick mode is eligible',()=>{
 assert.match(cleaned,/:not\(\[zia-video\], \[data-zcth-video-page\]\):not\(/);
 assert.match(cleaned,/browser\[zia-video\]/);
 for(const k of ['data-zcth-bilibili-glass','data-zcth-sdr-glass','data-zcth-hdr-glass']){
  assert.ok(cleaned.includes('['+k+']'),k);
 }
 const eligible=({rootVideo=false,watch=false,visibleVideo=false,bili=false,sdr=false,hdr=false})=>
  (!rootVideo&&!watch&&!visibleVideo)||bili||sdr||hdr;
 assert.equal(eligible({rootVideo:false,watch:true,visibleVideo:true}),false);
 assert.equal(eligible({rootVideo:true,watch:true,visibleVideo:true}),false);
 assert.equal(eligible({rootVideo:false,watch:true,visibleVideo:true,hdr:true}),true);
 assert.equal(eligible({rootVideo:false,watch:true,visibleVideo:true,sdr:true}),true);
 assert.equal(eligible({rootVideo:false,watch:true,visibleVideo:true,bili:true}),true);
});

test('no extra background video compositor promotion when dialog is hovered or closed',()=>{
 for(const forbidden of [
  /\bwill-change\s*:/,
  /\bbackface-visibility\s*:/,
  /(?:^|[\s;{}])filter\s*:/,
  /\bbrightness\s*:/,
  /\btransform\s*:/,
  /\bdisplay\s*:/,
  /\bz-index\s*:/,
  /browserSidebarContainer\s*\{/
 ])assert.doesNotMatch(cleaned,forbidden);
});
