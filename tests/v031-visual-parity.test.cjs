'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const blob=p=>{
 const bytes=fs.readFileSync(path.join(root,p));
 return crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
};
test('033 with unified theme OFF preserves exact v0.3.2 CSS, including 031 timing and first-frame preview fix',()=>{
 // The sole v0.3.2 visual change is one selector gate removal.
 // Re-insert the v0.3.1 comment and the old hidden gate. The resulting
 // stylesheet MUST be byte-for-byte the prior release (Git blob SHA).
 const complete=fs.readFileSync(path.join(root,'chrome.css'),'utf8');
 const contextMenu=complete.indexOf('/* v0.3.8 — opt-in macOS non-native context menu HG paint.');
 assert.ok(contextMenu>0,'v0.3.8 additive menu CSS must exist');
 const withGeometry=complete.slice(0,contextMenu).replace(/\s*$/,'\n');
 const geo=withGeometry.indexOf('/* v0.3.7 — video-independent compact sidebar geometry.');
 const unifiedBegin=withGeometry.indexOf('/* v0.3.3 — opt-out unified HG theme.',geo);
 assert.ok(geo>0&&unifiedBegin>geo);
 const full=withGeometry.slice(0,geo)+withGeometry.slice(unifiedBegin);
 const from=full.indexOf('/* v0.3.3 — opt-out unified HG theme.');
 const to=full.indexOf('/* v0.2.0 —',from);
 assert.ok(from>0&&to>from,'unified section must be independently removable');
 const original=full.slice(0,from)+'\n'+full.slice(to);
 const newNote=[
  ' * both live directly under :root. Resolve HG styles EVEN WHILE HIDDEN:',
  ' * Site Folders synchronously copies getComputedStyle() from Zia\'s normally',
  ' * hidden native card before its own first paint. Previously :not([hidden])',
  ' * made that source return Zia\'s 24px, then switch visibly to HG\'s setting.',
  ' * Both upstream mods already hide [hidden] cards with display:none!important,',
  ' * so the stored HG style does not paint or promote a hidden browser layer.'
 ].join('\n');
 const oldNote=[
  ' * both live directly under :root. Match only ACTUALLY VISIBLE cards so',
  ' * there is no background-filter paint when the preview is hidden.'
 ].join('\n');
 const present=') > :is(#zia-tab-card, #zia-folder-card, #zia-tip-card, #zsf-folder-hover-card) {';
 const prior=') > :is(#zia-tab-card, #zia-folder-card, #zia-tip-card, #zsf-folder-hover-card):not([hidden]) {';
 assert.equal(original.split(newNote).length,2,'exactly one new description');
 assert.equal(original.split(present).length,2,'exactly one simplified selector');
 const restored=original.replace(newNote,oldNote).replace(present,prior);
 const bytes=Buffer.from(restored,'utf8');
 const checksum=crypto.createHash('sha1')
   .update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
 assert.equal(checksum,'50aae335b40c894f000149a4c51db02ee2c19489',
   'no other CSS difference from v0.3.1 is permitted');
});
test('033 preserves all prior Sine preferences and defaults when unified theme is OFF',()=>{
 const raw=fs.readFileSync(path.join(root,'preferences.json'),'utf8');
 const full=JSON.parse(raw);
 const unified=full.filter(p=>p.property==='mod.compacttpr.unifiedhg');
 assert.equal(unified.length,1);
 assert.equal(unified[0].defaultValue,true);
 const from=raw.indexOf('  {\n    "property": "mod.compacttpr.unifiedhg"');
 const to=raw.indexOf('  {\n    "property": "mod.compacttpr.usefromzen"',from);
 assert.ok(from>0&&to>from);
 const prior=Buffer.from(raw.slice(0,from)+raw.slice(to));
 const oldSha=crypto.createHash('sha1')
  .update(Buffer.from('blob '+prior.length+'\0')).update(prior).digest('hex');
 assert.equal(oldSha,'75f1a798e592f05bb808fc3a1ad105c0cfdb7488');
});
test('031 video content actor remains on original 180ms to protect current-stream detection latency',()=>{
 assert.equal(blob('actors/ZcthUniversalChild.sys.mjs'),'0bf395f09d59dae8d530cecc0df4d74694600ddc');
});
test('031 URL/Bilibili behavior preserved and 036 YouTube marker tested independently',()=>{
 assert.equal(blob('video-page.uc.js'),'698860f7b14e018811e6fb79ceed46a2c984c541');
});
