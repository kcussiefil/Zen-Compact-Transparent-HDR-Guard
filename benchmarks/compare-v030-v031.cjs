'use strict';
// HG v0.3.1. Deterministic virtual-time simulation of the ACTUAL v0.3.0
// classifier vs v0.3.1. No browser, OLED, Gecko or GPU is emulated.
// Run: node benchmarks/compare-v030-v031.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {performance}=require('node:perf_hooks');
const root=path.resolve(__dirname,'..');
const sources={
 'v0.3.0':fs.readFileSync(path.join(__dirname,'baseline-v0.3.0.uc.js'),'utf8'),
 'v0.3.1':fs.readFileSync(path.join(root,'sdr-glass.uc.js'),'utf8')
};
const DURATION=60000;
function instrument(source){
 return source
  .replace('function render(){','function render(){__bench.renders++;')
  .replace('async function probe(){','async function probe(){__bench.probes++;')
  .replace('function videoBrowsers(){','function videoBrowsers(){__bench.videoBrowserChecks++;');
}
class Clock{
 constructor(){this.now=0;this.id=0;this.jobs=new Map();}
 schedule(fn,ms,repeating=false){
  const id=++this.id;
  const interval=Math.max(1,Number(ms)||0);
  this.jobs.set(id,{fn,at:this.now+(repeating?interval:Math.max(0,Number(ms)||0)),interval,repeating});
  return id;
 }
 cancel(id){this.jobs.delete(id)}
 async flush(){for(let i=0;i<6;i++)await Promise.resolve()}
 async until(end){
  let steps=0;
  while(true){
   let soonId=null,soon=null;
   for(const [id,job] of this.jobs){
    if(job.at<=end&&(!soon||job.at<soon.at||(job.at===soon.at&&id<soonId))){
     soonId=id;soon=job;
    }
   }
   if(!soon)break;
   if(++steps>20000)throw Error('runaway timers');
   this.now=soon.at;
   if(soon.repeating)soon.at+=soon.interval;
   else this.jobs.delete(soonId);
   soon.fn();
   await this.flush();
  }
  this.now=end;
  await this.flush();
 }
}
function makeEnv(source,{active=false}={}){
 const clock=new Clock(),listeners={},metrics={renders:0,probes:0,videoBrowserChecks:0,actorQueries:0,attrAttempts:0,attrChanges:0};
 const attributes=new Map();
 if(active)attributes.set('zia-video','');
 const rootElement={
  hasAttribute:n=>attributes.has(n),
  getAttribute:n=>attributes.get(n)??null,
  setAttribute(n,v){metrics.attrAttempts++;if(attributes.get(n)!==String(v))metrics.attrChanges++;attributes.set(n,String(v))},
  removeAttribute(n){metrics.attrAttempts++;if(attributes.has(n))metrics.attrChanges++;attributes.delete(n)},
  toggleAttribute(n,enabled){metrics.attrAttempts++;if(attributes.has(n)!==!!enabled)metrics.attrChanges++;if(enabled)attributes.set(n,'');else attributes.delete(n)}
 };
 const prefs={
  'mod.compacttpr.sdrrealblur':active,
  'mod.compacttpr.hdrrealblur':false,
  'zia.glass.blur-over-video':false
 };
 const prefObservers=new Map(), tabEvents={};
 let selected=null;
 function browser(name){
  const b={
   currentURI:{spec:'https://www.youtube.com/watch?v='+name},
   browsingContext:{currentWindowGlobal:{getActor:()=>({
    sendQuery:async()=>{metrics.actorQueries++;return {state:'sdr',count:1,mediaKey:'same-stream'};}
   })}}
  };
  return b;
 }
 const first=browser('one'),second=browser('two');
 selected=first;
 const win={
  gBrowser:{
   get selectedBrowser(){return selected;},
   tabContainer:{addEventListener:(name,fn)=>tabEvents[name]=fn,removeEventListener:()=>{}},
   addTabsProgressListener:p=>{listeners.progress=p},removeTabsProgressListener:()=>{}
  },
  setTimeout:(f,ms)=>clock.schedule(f,ms),
  clearTimeout:id=>clock.cancel(id),
  setInterval:(f,ms)=>clock.schedule(f,ms,true),
  clearInterval:id=>clock.cancel(id),
  addEventListener:()=>{}
 };
 const doc={documentElement:rootElement,querySelectorAll:()=>active?[selected]:[]};
 class MutationObserver{constructor(fn){listeners.rootChange=fn}observe(){}disconnect(){}}
 const ctx={window:win,document:doc,MutationObserver,URL,console,
  Date:{now:()=>clock.now},__bench:metrics,
  ChromeUtils:{registerWindowActor:()=>{}},
  Services:{prefs:{
   getBoolPref:(n,def)=>prefs[n]??def,
   getStringPref:(_,def)=>def,
   addObserver:(name,obj)=>prefObservers.set(name,obj),
   removeObserver:(name)=>prefObservers.delete(name)
  }}
 };
 vm.runInNewContext(instrument(source),ctx);
 const manager=win.__zcthUniversalV019;
 function syncStates(){
  if(!active)return;
  manager.onFrameState(first,'media-frame',{state:'sdr',count:1,mediaKey:'same-stream'});
  manager.onFrameState(second,'media-frame',{state:'sdr',count:1,mediaKey:'same-stream'});
 }
 function select(b){selected=b;tabEvents.TabSelect();return attributes.has('data-zcth-sdr-glass');}
 return {clock,metrics,attributes,first,second,syncStates,select};
}
async function run(version,active,withSwitches){
 const env=makeEnv(sources[version],{active});
 env.syncStates();
 let immediate=0;
 const started=performance.now();
 if(withSwitches){
  for(let t=10000;t<=50000;t+=10000){
   await env.clock.until(t);
   if(env.select(t%20000===0?env.first:env.second))immediate++;
  }
 }
 await env.clock.until(DURATION);
 return {version,scenario:!active?'ordinary-no-video':withSwitches?'confirmed-SDR-with-5-switches':'confirmed-SDR-stable',
  probes:env.metrics.probes,renders:env.metrics.renders,actorQueries:env.metrics.actorQueries,
  videoBrowserChecks:env.metrics.videoBrowserChecks,
  attrAttempts:env.metrics.attrAttempts,attrChanges:env.metrics.attrChanges,
  immediateSwitches:immediate,
  wallMs:Math.round((performance.now()-started)*1000)/1000};
}
(async()=>{
 const results=[];
 for(const mode of [[false,false],[true,false],[true,true]]){
  const before=await run('v0.3.0',...mode);
  const after=await run('v0.3.1',...mode);
  assert.ok(after.probes<before.probes,'watchdog must reduce probe executions');
  assert.ok(after.renders<before.renders,'watchdog must reduce render executions');
  assert.ok(after.attrAttempts<before.attrAttempts,'must reduce attempted DOM writes');
  assert.equal(after.attrChanges,before.attrChanges,'stable visual DOM output must be identical');
  if(mode[1])assert.equal(after.immediateSwitches,before.immediateSwitches,'known tabs must render immediately');
  results.push({scenario:after.scenario,baseline:before,optimized:after,
   probeReductionPct:Math.round((1-after.probes/before.probes)*10000)/100,
   renderReductionPct:Math.round((1-after.renders/before.renders)*10000)/100});
 }
 for(const x of results){
  console.log('\n'+x.scenario);
  console.log('  v0.3.0',JSON.stringify(x.baseline));
  console.log('  v0.3.1',JSON.stringify(x.optimized));
  console.log('  MAIN probe calls reduction:',x.probeReductionPct+'%');
  console.log('  MAIN render calls reduction:',x.renderReductionPct+'%');
 }
 console.log('\nLIMITATION: virtual timers, fake DOM/Actor. Wall time is Node simulation only, NOT Zen FPS or GPU latency.');
})().catch(err=>{console.error(err);process.exitCode=1});
