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
test('031 byte-identical visual CSS: HG blur radius, transparency, colour, height and animations remain untouched',()=>{
 assert.equal(blob('chrome.css'),'50aae335b40c894f000149a4c51db02ee2c19489');
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
