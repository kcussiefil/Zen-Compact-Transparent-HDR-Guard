'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('037 fully retires the ineffective 036 hidden-browser rule and synchronous YouTube marker',()=>{
 const css=read('chrome.css'),script=read('video-page.uc.js');
 assert.doesNotMatch(css,/data-zcth-youtube-page|v0\.3\.6 — YouTube-only offscreen compositor mitigation/);
 assert.doesNotMatch(script,/data-zcth-youtube-page|isYouTubeVideoPage/);
 const bytes=Buffer.from(script);
 const sha=crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length)).update(Buffer.from([0])).update(bytes).digest('hex');
 assert.equal(sha,'698860f7b14e018811e6fb79ceed46a2c984c541');
});
