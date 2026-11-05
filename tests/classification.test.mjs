import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.JSWindowActorChild = class {};
const { classifyStream } = await import('../actors/ZcthStreamChild.sys.mjs');
const mk = (mime, transfer='', color='') => ({
  videoId:'abc12345678',playingId:'abc12345678',fmt:248,
  response:{streamingData:{adaptiveFormats:[{itag:248,mimeType:mime,
    ...(transfer?{colorInfo:{transferCharacteristics:transfer}}:{})}]}},
  stats:{color,codecs:mime}
});
test('SDR BT709 or matched 8-bit AVC permits glass',()=>{
  assert.equal(classifyStream(mk('video/webm; codecs="vp09.00.51.08"','COLOR_TRANSFER_BT709')),'sdr');
  assert.equal(classifyStream(mk('video/mp4; codecs="avc1.640028"')),'sdr');
});
test('HDR PQ, HLG and BT2020 remain solid',()=>{
  assert.equal(classifyStream(mk('video/webm; codecs="vp09.02.51.10"','COLOR_TRANSFER_SMPTEST2084')),'hdr');
  assert.equal(classifyStream(mk('video/webm; codecs="vp09.02.51.10"','COLOR_TRANSFER_ARIB_STD_B67')),'hdr');
  assert.equal(classifyStream(mk('video/webm; codecs="vp09.02.51.10"','','bt2020 / bt2020')),'hdr');
});
test('unknown, wrong itag, ad, or stale video ID fail closed',()=>{
  const p=mk('video/webm; codecs="av01.0.08M.10"');
  p.fmt=300;assert.equal(classifyStream(p),'unknown');
  p.fmt=248;p.playingId='bad';assert.equal(classifyStream(p),'unknown');
  p.playingId=p.videoId;p.isAd=true;assert.equal(classifyStream(p),'unknown');
});
test('HDR codec overrules apparently SDR colour metadata',()=>{
  assert.equal(classifyStream(mk('video/webm; codecs="vp09.02.51.10"','','bt709 / bt709')),'hdr');
});
