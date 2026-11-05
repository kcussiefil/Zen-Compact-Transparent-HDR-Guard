import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
globalThis.JSWindowActorChild=class{};
globalThis.JSWindowActorParent=class{};
const {classifyStream,ZcthStreamV016Child}=await import('../actors/ZcthStreamV016Child.sys.mjs');
const {ZcthStreamV016Parent}=await import('../actors/ZcthStreamV016Parent.sys.mjs');
const src=fs.readFileSync(new URL('../sdr-glass.uc.js',import.meta.url),'utf8');
function input(codec,statsCodec=codec,color='bt709',fmt=248) {
 return {fmt,videoId:'abc',playingId:'abc',
 stats:{codecs:statsCodec,color},response:{streamingData:{adaptiveFormats:[
 {itag:248,mimeType:'video/mp4; codecs="'+codec+'"}
 ]}}};
}
test('confirmed matching selected SDR stream',()=>{
 assert.equal(classifyStream(input('avc1.640028','avc1.640028 (248) / opus')),'sdr');
 assert.equal(classifyStream(input('vp09.00.51.08','vp09.00.51.08 (248) / opus')),'sdr');
});
test('HDR, PQ/HLG and 10-bit streams never force blur',()=>{
 assert.equal(classifyStream(input('vp09.02.51.10','vp09.02.51.10 (248) / opus')),'hdr');
 assert.equal(classifyStream(input('av01.0.08M.10','av01.0.08M.10 (248) / opus')),'hdr');
});
test('stale family or itag cannot be mistaken for SDR',()=>{
 assert.equal(classifyStream(input('avc1.640028','vp09.00.51.08 (248) / opus')),'unknown');
 assert.equal(classifyStream(input('avc1.640028','avc1.640028 (299) / opus')),'unknown');
});
test('missing active codec and missing selected format fail closed',()=>{
 assert.equal(classifyStream(input('avc1.640028','')),'unknown');
 assert.equal(classifyStream(input('avc1.640028','avc1.640028 (248) / opus','',null)),'unknown');
});
test('nonmatching video or ad fails closed',()=>{
 const p=input('avc1.640028');
 p.playingId='old';assert.equal(classifyStream(p),'unknown');
 p.playingId='abc';p.isAd=true;assert.equal(classifyStream(p),'unknown');
});
test('video event can push SDR immediately and pagehide retracts it',()=>{
 const a=new ZcthStreamV016Child();
 const v={localName:'video',readyState:4,videoWidth:1920,
 closest:()=>({})};
 const player={getVideoData:()=>({video_id:'abc'}),
 getPlayerResponse:()=>({...input('avc1.640028').response,videoDetails:{videoId:'abc'}}),
 getStatsForNerds:()=>({codecs:'avc1.640028 (248) / opus',color:'bt709'}),
 getVideoStats:()=>({fmt:248})};
 a.contentWindow={location:{hostname:'www.youtube.com',pathname:'/watch',
 href:'https://www.youtube.com/watch?v=abc'}};
 a.document={getElementById:()=>({querySelector:()=>v,wrappedJSObject:player,
 classList:{contains:()=>false}})};
 const messages=[];a.sendAsyncMessage=(name,data)=>messages.push({name,data});
 a.handleEvent({type:'playing',isTrusted:true,target:v});
 a.handleEvent({type:'pagehide',isTrusted:true,target:{}});
 assert.equal(messages[0].data.state,'sdr');
 assert.equal(messages[1].data.state,'unknown');
});
test('chrome script retains 50ms check, instant event and HDR fail-closed logic',()=>{
 assert.match(src,/setInterval\(\(\)=>\{void check\(\);\},50\)/);
 assert.match(src,/onStreamState:publish/);
 assert.match(src,/state==='sdr'/);
 assert.match(src,/generation\+\+/);
 assert.doesNotMatch(src,/sdrStreak|schedule\(110\)/);
});
test('actor parent routes selected state without changing content',()=>{
 const a=new ZcthStreamV016Parent(),calls=[];
 const browser={ownerGlobal:{__zcthSdrGlassV016:{
 onStreamState:(...args)=>calls.push(args)}}};
 a.browsingContext={top:{embedderElement:browser}};
 a.receiveMessage({name:'ZcthStreamV016:State',data:{
 state:'hdr',href:'https://www.youtube.com/watch?v=abc'}});
 assert.equal(calls.length,1);assert.equal(calls[0][1],'hdr');
});
