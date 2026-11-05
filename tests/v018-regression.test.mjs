import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

globalThis.JSWindowActorChild=class {};
globalThis.JSWindowActorParent=class {};
const {classifyStream,ZcthStreamV018Child}=await import(
  '../actors/ZcthStreamV018Child.sys.mjs');
const {ZcthStreamV018Parent}=await import(
  '../actors/ZcthStreamV018Parent.sys.mjs');

const response=(itag,codec,transfer)=>({
  videoDetails:{videoId:'test123'},
  streamingData:{adaptiveFormats:[{
    itag,mimeType:'video/webm; codecs="'+codec+'"',
    ...(transfer?{colorInfo:{transferCharacteristics:transfer}}:{})
  }]}
});
const classification=(codec,fmt,itags,extra={})=>classifyStream({
  videoId:'test123',playingId:'test123',
  fmt,stats:{codecs:codec,...extra},
  response:itags
});

test('regression: generic vp9 adaptive MIME matches detailed vp09 stats',()=>{
 assert.equal(classification('vp09.00.51.08 (248) / opus (251)',248,
   response(248,'vp9')),'sdr');
});
test('regression: missing getVideoStats fmt uses currently decoded itag',()=>{
 assert.equal(classification('vp09.00.51.08 (248) / opus (251)',null,
   response(248,'vp9')),'sdr');
});
test('SDR AVC, VP09 expanded and 8-bit AV1',()=>{
 assert.equal(classification('avc1.640028 (137) / opus (251)',137,
   response(137,'avc1.640028')),'sdr');
 assert.equal(classification('vp09.00.51.08 (248) / opus (251)',248,
   response(248,'vp09.00.51.08')),'sdr');
 assert.equal(classification('av01.0.08M.08 (399) / opus (251)',399,
   response(399,'av01.0.08M.08')),'sdr');
});
test('HDR ST2084/HLG VP9 profile2 and AV1 10-bit never enable glass',()=>{
 assert.equal(classification('vp09.02.51.10 (337) / opus (251)',337,
   response(337,'vp9','COLOR_TRANSFER_ST2084')),'hdr');
 assert.equal(classification('vp09.02.51.10 (337) / opus (251)',337,
   response(337,'vp9','COLOR_TRANSFER_ARIB_STD_B67')),'hdr');
 assert.equal(classification('av01.0.08M.10 (401) / opus (251)',401,
   response(401,'av01.0.08M.10')),'hdr');
});
test('stale selected itag, missing response and mismatched codec fail closed',()=>{
 assert.equal(classification('vp09.00.51.08 (248) / opus (251)',247,
   response(247,'vp9')),'unknown');
 assert.equal(classification('vp09.00.51.08 (248) / opus (251)',248,
   undefined),'unknown');
 assert.equal(classification('avc1.640028 (137) / opus (251)',137,
   response(137,'vp9')),'unknown');
});
test('video ID change and advertisements reject existing SDR evidence',()=>{
 const data={videoId:'test123',playingId:'old',fmt:248,
  stats:{codecs:'vp09.00.51.08 (248) / opus (251)'},
  response:response(248,'vp9')};
 assert.equal(classifyStream(data),'unknown');
 data.playingId='test123';data.isAd=true;
 assert.equal(classifyStream(data),'unknown');
});

test('content actor reads player data, sends event and clears on pagehide',()=>{
 const actor=new ZcthStreamV018Child(),messages=[];
 const player={
   getVideoData:()=>({video_id:'test123'}),
   getPlayerResponse:()=>response(248,'vp9'),
   getVideoStats:()=>({fmt:248}),
   getStatsForNerds:()=>({codecs:'vp09.00.51.08 (248) / opus (251)'})
 };
 const v={localName:'video',videoWidth:1920,readyState:4,closest:()=>({})};
 const element={wrappedJSObject:player,querySelector:()=>v,
   classList:{contains:()=>false}};
 actor.contentWindow={location:{hostname:'www.youtube.com',pathname:'/watch',
   href:'https://www.youtube.com/watch?v=test123'}};
 actor.document={getElementById:()=>element};
 actor.sendAsyncMessage=(name,data)=>messages.push([name,data]);
 actor.handleEvent({isTrusted:true,type:'playing',target:v});
 actor.handleEvent({isTrusted:true,type:'pagehide',target:{}});
 assert.equal(messages[0][1].state,'sdr');
 assert.equal(messages[1][1].state,'unknown');
});
test('parent forwards current stream classification',()=>{
 const actor=new ZcthStreamV018Parent(),events=[];
 const browser={ownerGlobal:{__zcthSdrGlassV018:{
   onStreamState:(...args)=>events.push(args)
 }}};
 actor.browsingContext={top:{embedderElement:browser}};
 actor.receiveMessage({name:'ZcthStreamV018:State',data:{
   state:'sdr',href:'https://www.youtube.com/watch?v=test123'}});
 assert.equal(events.length,1);
 assert.equal(events[0][1],'sdr');
});
test('chrome script and CSS share the classification marker',()=>{
 const css=fs.readFileSync(new URL('../chrome.css',import.meta.url),'utf8');
 const script=fs.readFileSync(new URL('../sdr-glass.uc.js',import.meta.url),'utf8');
 const theme=JSON.parse(fs.readFileSync(new URL('../theme.json',import.meta.url)));
 assert.equal(theme.version,'0.1.8');
 assert.match(script,/data-zcth-sdr-glass/);
 assert.match(css,/data-zcth-sdr-glass/);
 assert.match(script,/ZcthStreamV018/);
 assert.match(script,/},50\)/);
});
