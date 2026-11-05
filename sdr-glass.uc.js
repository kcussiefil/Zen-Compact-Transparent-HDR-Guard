// Zen Compact Transparent HDR Guard v0.1.6
// Event-first, single-IPC fallback; two-source corroboration within ONE snapshot.
(() => {
  'use strict';
  const KEY='__zcthSdrGlassV016', ACTOR='ZcthStreamV016';
  if (window[KEY]) return;
  const BASE='chrome://sine/content/zen-compact-transparent-hdr-guard/actors/';
  const root=document.documentElement;
  let generation=0,pending=null,inFlight=false,queued=false,stopped=false;
  let registrationOk=false;
  try {
    const events={};
    for(const name of ['loadeddata','loadedmetadata','playing','pause','canplay',
      'resize','loadstart','emptied','abort']) {
      events[name]={capture:true,mozSystemGroup:true};
    }
    events.pagehide={}; // Match Zia's own window-actor pagehide registration.
    ChromeUtils.registerWindowActor(ACTOR,{
      parent:{esModuleURI:BASE+'ZcthStreamV016Parent.sys.mjs'},
      child:{esModuleURI:BASE+'ZcthStreamV016Child.sys.mjs',events},
      matches:['https://youtube.com/*','https://*.youtube.com/*'],
      allFrames:false,messageManagerGroups:['browsers'],
      safeForUntrustedWebProcess:true
    });
    registrationOk=true;
  }catch(e){
    // Firefox may already have registered the actor in another chrome window.
    if(e?.name==='NotSupportedError')registrationOk=true;
    else console.warn('[HDR Guard] Actor registration failed',e);
  }
  function enabled() {
    return Services.prefs.getBoolPref('mod.compacttpr.sdrrealblur',false);
  }
  function reset() {
    generation++;
    root.removeAttribute('data-zcth-sdr-glass');
  }
  function valid(browser,href=null) {
    if (!enabled() || !root.hasAttribute('zia-video') ||
        browser!==window.gBrowser?.selectedBrowser) return false;
    let uri='';
    try {uri=browser.currentURI?.spec||'';}catch(_){return false;}
    let url;
    try{url=new URL(uri);}catch(_){return false;}
    if (url.protocol!=='https:' || !/(^|\.)youtube\.com$/i.test(url.hostname) ||
        url.pathname!=='/watch' || !url.searchParams.get('v')) return false;
    if(href!==null && href!==uri) return false;
    return true;
  }
  function publish(browser,state,href) {
    // Content process proactively reports a fresh state on video media events.
    // This does not add a second wait or any IPC query to the event fast-path.
    if(browser!==window.gBrowser?.selectedBrowser)return;
    if(stopped || !valid(browser,href)) {
      if(root.hasAttribute('data-zcth-sdr-glass'))reset();
      return;
    }
    generation++;  // invalidate any older in-flight query result
    root.toggleAttribute('data-zcth-sdr-glass',state==='sdr');
  }
  function schedule(delay=0) {
    if(stopped)return;
    if(pending!==null)window.clearTimeout(pending);
    pending=window.setTimeout(()=>{pending=null;void check();},delay);
  }
  async function check(){
    if(stopped)return;
    const browser=window.gBrowser?.selectedBrowser;
    if(!valid(browser)) {
      if(root.hasAttribute('data-zcth-sdr-glass'))reset();
      return;
    }
    if(!registrationOk){reset();return;}
    if(inFlight){queued=true;return;}
    let actor;
    try{actor=browser?.browsingContext?.currentWindowGlobal?.getActor(ACTOR);}catch(_){}
    if(!actor){reset();return;}
    const token=generation,href=browser.currentURI?.spec;
    inFlight=true;
    try {
      const state=await actor.sendQuery('ZcthStreamV016:Classify');
      if(!stopped && token===generation && valid(browser,href))
        root.toggleAttribute('data-zcth-sdr-glass',state==='sdr');
    }catch(_){reset();}
    finally{
      inFlight=false;
      if(queued&&!stopped){queued=false;schedule(0);}
    }
  }
  const tabs=window.gBrowser?.tabContainer;
  function onTab(){reset();schedule(0);}
  tabs?.addEventListener('TabSelect',onTab);
  const progress={onLocationChange(browser){
    if(browser===window.gBrowser?.selectedBrowser)onTab();
  }};
  try{window.gBrowser?.addTabsProgressListener(progress);}catch(_){}
  const observer=new MutationObserver(changes=>{
    if(changes.some(x=>x.attributeName==='zia-video')){
      reset();schedule(0);
    }
  });
  observer.observe(root,{attributes:true,attributeFilter:['zia-video']});
  const interval=window.setInterval(()=>{void check();},50);
  schedule(0);
  function cleanup(){
    if(stopped)return;
    stopped=true;reset();
    observer.disconnect();window.clearInterval(interval);
    if(pending!==null)window.clearTimeout(pending);
    tabs?.removeEventListener('TabSelect',onTab);
    try{window.gBrowser?.removeTabsProgressListener(progress);}catch(_){}
    delete window[KEY];
  }
  window[KEY]={cleanup,onStreamState:publish};
  window.addEventListener('unload',cleanup,{once:true});
})();
