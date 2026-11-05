// HDR Guard v0.1.8 — event-first SDR glass, fail-closed HDR handling.
(() => {
  'use strict';
  const KEY='__zcthSdrGlassV018', ACTOR='ZcthStreamV018';
  if(window[KEY])return;
  const BASE='chrome://sine/content/zen-compact-transparent-hdr-guard/actors/';
  const root=document.documentElement;
  let generation=0,pending=null,inFlight=false,queued=false,stopped=false;
  let registered=false;
  try {
    const events={};
    for(const name of ['loadeddata','loadedmetadata','playing','pause',
      'canplay','resize','loadstart','emptied','abort'])
      events[name]={capture:true,mozSystemGroup:true};
    events.pagehide={};
    ChromeUtils.registerWindowActor(ACTOR,{
      parent:{esModuleURI:BASE+'ZcthStreamV018Parent.sys.mjs'},
      child:{esModuleURI:BASE+'ZcthStreamV018Child.sys.mjs',events},
      matches:['https://youtube.com/*','https://*.youtube.com/*'],
      allFrames:false,messageManagerGroups:['browsers'],
      safeForUntrustedWebProcess:true
    });
    registered=true;
  }catch(err) {
    if(err?.name==='NotSupportedError')registered=true;
    else console.warn('[HDR Guard] Stream actor unavailable',err);
  }
  const enabled=()=>Services.prefs.getBoolPref(
    'mod.compacttpr.sdrrealblur',false);
  function clear(){
    generation++;
    root.removeAttribute('data-zcth-sdr-glass');
    root.removeAttribute('data-zcth-stream-state');
  }
  function selection(browser){
    if(stopped||!enabled()||browser!==window.gBrowser?.selectedBrowser||
       !root.hasAttribute('zia-video'))return null;
    try {
      const url=new URL(browser.currentURI.spec);
      if(url.protocol!=='https:'||!/(^|\.)youtube\.com$/i.test(url.hostname)||
         url.pathname!=='/watch')return null;
      const videoId=url.searchParams.get('v');
      return videoId ? {url,videoId} : null;
    }catch(_){return null;}
  }
  function sameVideo(browser,href){
    const selected=selection(browser);
    if(!selected)return false;
    if(href==null)return true;
    try{
      const current=new URL(href);
      return current.origin===selected.url.origin &&
        current.pathname===selected.url.pathname &&
        current.searchParams.get('v')===selected.videoId;
    }catch(_){return false;}
  }
  function paint(state){
    const safe=state==='sdr'||state==='hdr'?''+state:'unknown';
    root.setAttribute('data-zcth-stream-state',safe);
    root.toggleAttribute('data-zcth-sdr-glass',safe==='sdr');
  }
  function onStreamState(browser,state,href){
    if(browser!==window.gBrowser?.selectedBrowser)return;
    if(!sameVideo(browser,href)){clear();return;}
    generation++; // supersede older IPC results
    paint(state);
  }
  function schedule(delay=0){
    if(stopped)return;
    if(pending!==null)window.clearTimeout(pending);
    pending=window.setTimeout(()=>{pending=null;void check();},delay);
  }
  async function check(){
    if(stopped)return;
    const browser=window.gBrowser?.selectedBrowser;
    if(!sameVideo(browser,null)){if(root.hasAttribute('data-zcth-sdr-glass')||
       root.hasAttribute('data-zcth-stream-state'))clear();return;}
    if(!registered){paint('unknown');return;}
    if(inFlight){queued=true;return;}
    let actor;
    try{actor=browser.browsingContext?.currentWindowGlobal?.getActor(ACTOR);}catch(_){}
    if(!actor){paint('unknown');return;}
    const token=generation;
    const href=browser.currentURI.spec;
    inFlight=true;
    try{
      const state=await actor.sendQuery('ZcthStreamV018:Classify');
      if(!stopped&&token===generation&&sameVideo(browser,href))paint(state);
    }catch(_){if(token===generation)paint('unknown');}
    finally{
      inFlight=false;
      if(queued&&!stopped){queued=false;schedule(0);}
    }
  }
  function navigation(){clear();schedule(0);}
  const tabs=window.gBrowser?.tabContainer;
  tabs?.addEventListener('TabSelect',navigation);
  const progress={onLocationChange(browser){
    if(browser===window.gBrowser?.selectedBrowser)navigation();
  }};
  try{window.gBrowser?.addTabsProgressListener(progress);}catch(_){}
  const observer=new MutationObserver(changes=>{
    if(changes.some(x=>x.attributeName==='zia-video')){
      clear();schedule(0);
    }
  });
  observer.observe(root,{attributes:true,attributeFilter:['zia-video']});
  const interval=window.setInterval(()=>{void check();},50);
  schedule(0);
  function cleanup(){
    if(stopped)return;
    stopped=true;clear();
    observer.disconnect();
    window.clearInterval(interval);
    if(pending!==null)window.clearTimeout(pending);
    tabs?.removeEventListener('TabSelect',navigation);
    try{window.gBrowser?.removeTabsProgressListener(progress);}catch(_){}
    delete window[KEY];
  }
  window[KEY]={cleanup,onStreamState};
  window.addEventListener('unload',cleanup,{once:true});
})();
