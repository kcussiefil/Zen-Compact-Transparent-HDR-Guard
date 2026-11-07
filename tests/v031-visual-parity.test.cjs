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
test('032 all CSS visual values identical to v0.3.1 apart from hidden-card eligibility',()=>{
 // The sole v0.3.2 visual change is one selector gate removal.
 // Re-insert the v0.3.1 comment and the old hidden gate. The resulting
 // stylesheet MUST be byte-for-byte the prior release (Git blob SHA).
 const original=fs.readFileSync(path.join(root,'chrome.css'),'utf8');
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
test('031 existing Sine preferences and default values remain byte-identical',()=>{
 assert.equal(blob('preferences.json'),'75f1a798e592f05bb808fc3a1ad105c0cfdb7488');
});
test('031 video content actor remains on original 180ms to protect current-stream detection latency',()=>{
 assert.equal(blob('actors/ZcthUniversalChild.sys.mjs'),'0bf395f09d59dae8d530cecc0df4d74694600ddc');
});
test('031 URL/Bilibili instant marker remains unchanged',()=>{
 assert.equal(blob('video-page.uc.js'),'698860f7b14e018811e6fb79ceed46a2c984c541');
});
