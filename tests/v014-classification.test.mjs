import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.JSWindowActorChild=class {};
const {classifyStream}=await import('../actors/ZcthStreamV014Child.sys.mjs');
const mk=(codec,transfer='',color='')=>({
 videoId:'id',playingId:'id',fmt:248,
 response:{streamingData:{adaptiveFormats:[{itag:248,mimeType:codec,
 ...(transfer?{colorInfo:{transferCharacteristics:transfer}}:{})}]}},
 stats:{codecs:codec,color}
});
test('BT709 8-bit SDR and AVC are allowed',()=>{
 assert.equal(classifyStream(mk('video/webm; codecs="vp09.00.51.08"','COLOR_TRANSFER_BT709')),'sdr');
 assert.equal(classifyStream(mk('video/mp4; codecs="avc1.640028"')),'sdr');
});
test('SDR can use explicit current stats codec when format ID is absent',()=>{
 const v=mk('video/webm; codecs="vp09.00.51.08"'); delete v.fmt;
 assert.equal(classifyStream(v),'sdr');
});
test('PQ HLG BT2020 and AV1 ten-bit are never treated as SDR',()=>{
 assert.equal(classifyStream(mk('video/webm; codecs="vp09.02.51.10"','COLOR_TRANSFER_SMPTEST2084')),'hdr');
 assert.equal(classifyStream(mk('video/webm; codecs="vp09.02.51.10"','COLOR_TRANSFER_ARIB_STD_B67')),'hdr');
 assert.equal(classifyStream(mk('video/webm; codecs="vp09.02.51.10"','','bt2020')),'hdr');
 assert.equal(classifyStream(mk('video/mp4; codecs="av01.0.08M.10"','','bt709')),'hdr');
});
test('ad, mismatched video, and stale format fail closed',()=>{
 let p=mk('video/mp4; codecs="avc1.640028"');
 p.isAd=true;assert.equal(classifyStream(p),'unknown');
 p.isAd=false;p.playingId='wrong';assert.equal(classifyStream(p),'unknown');
 p.playingId=p.videoId;p.fmt=999;assert.equal(classifyStream(p),'unknown');
});
test('HDR evidence wins over an SDR-looking field',()=>{
 assert.equal(classifyStream(mk('video/webm; codecs="vp09.02.51.10"','','bt709')),'hdr');
});
