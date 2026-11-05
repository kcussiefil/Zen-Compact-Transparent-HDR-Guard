// HDR Guard v0.1.8 — classify the ACTUAL selected stream.
// YouTube sometimes reports a generic "vp9" adaptive MIME while its live
// statistics say "vp09.00.51.08". These are the same codec family.
function family(input) {
  const text=String(input ?? '').toLowerCase();
  if (/\b(?:vp9|vp09)(?:[.\s;"]|$)/.test(text)) return 'vp9';
  if (/\bav01\./.test(text)) return 'av1';
  if (/\bavc1\./.test(text)) return 'avc';
  if (/\b(?:hev1|hvc1)\./.test(text)) return 'hevc';
  return '';
}
function isHdr(input) {
  return /(?:bt[.\s_-]?2020|rec[.\s_-]?2020|smpte.?st.?2084|st.?2084|arib.?std.?b67|\bhlg\b|\bpq\b|\bhdr\b)/i.test(String(input ?? ''));
}
function isTenBit(input) {
  return /(?:vp09\.02\.|vp09\.0[01]\.\d+\.10\b|av01\.[0-3]\.\d+[mh]\.10\b|10.?bit)/i.test(String(input ?? ''));
}
function is8Bit(input) {
  return /(?:\bavc1\.[0-9a-f]+|\bvp09\.0[01]\.\d+\.08\b|\bav01\.[0-3]\.\d+[mh]\.08\b)/i.test(String(input ?? ''));
}
function parseLiveItag(codecs) {
  // getStatsForNerds(): "vp09.00.51.08 (248) / opus (251)".
  const first=String(codecs ?? '').split(/\s+\/\s+/)[0];
  const m=first.match(/\b(?:vp09|vp9|av01|avc1|hvc1|hev1)(?:\.[a-z0-9.]+)?\s*\((\d+)\)/i);
  return m?.[1] || '';
}
export function classifyYouTube({stats,response,fmt,videoId,playingId,isAd}={}) {
  if (!videoId || videoId!==playingId || isAd) return 'unknown';
  const codecs=String(stats?.codecs ?? '').toLowerCase();
  const color=String(stats?.color ?? stats?.color_space ?? stats?.color_info ?? '').toLowerCase();
  const videoFormats=response?.streamingData?.adaptiveFormats;
  const selected=fmt==null?'':String(fmt).trim();
  const statItag=parseLiveItag(codecs);
  if (selected && !/^\d+$/.test(selected)) return 'unknown';
  if (statItag && selected && statItag!==selected) return 'unknown';
  const itag=selected||statItag;
  const matches=Array.isArray(videoFormats) && itag
    ? videoFormats.filter(f=>String(f.itag)===itag && /^video\//i.test(f.mimeType||'')) : [];
  const format=matches.length===1?matches[0]:null;
  const formatCodec=String(format?.mimeType ?? '').toLowerCase();
  const transfer=String(format?.colorInfo?.transferCharacteristics ?? '').toLowerCase();
  const formatColor=String(format?.colorInfo?.primaries ?? '').toLowerCase();
  // Strong HDR evidence must ALWAYS be processed before accepting SDR.
  if (isHdr(codecs)||isHdr(color)||isHdr(transfer)||isHdr(formatColor)||
      isHdr(formatCodec)||isTenBit(codecs)||isTenBit(formatCodec)) return 'hdr';
  const currentFamily=family(codecs);
  if (!currentFamily || !is8Bit(codecs)) return 'unknown';
  if (!format || family(formatCodec)!==currentFamily) return 'unknown';
  // No broad assumptions about AV1/VP9/H.264 uploads: verify selected
  // 8-bit decoder statistics AND a format tied to the current itag.
  // A generic vp9 MIME is not proof on its own, but is consistent with
  // vp09 profile 0/1 in the ACTUALLY decoded stats.
  if (itag && (statItag || selected)) return 'sdr';
  return 'unknown';
}


const HDR_TIERS=new Set([125,126,129]);
const qualityNumber=v=>{const n=Number(v);return Number.isFinite(n)&&n>0?n:null};
export function classifyBilibili({quality,initialQuality,label,generic='unknown'}={}) {
  let real=null,now=null,next=null;
  if(quality&&typeof quality==='object'){
    real=qualityNumber(quality.realQ);now=qualityNumber(quality.nowQ);
    next=qualityNumber(quality.newQ);
  }else real=qualityNumber(quality);
  const selected=real??now;
  if(HDR_TIERS.has(selected)||HDR_TIERS.has(now)||HDR_TIERS.has(next)||
     (selected===null&&HDR_TIERS.has(qualityNumber(initialQuality)))||
     /(?:\bhdr\b|HDR\s*Vivid|Dolby Vision|杜比視界|杜比视界)/i.test(String(label??''))||
     generic==='hdr')return 'hdr';
  if(selected!==null&&
     ((now!==null&&real!==null&&now!==real)||
      (next!==null&&next!==selected)))return 'unknown';
  if(selected!==null&&selected<125)return 'sdr';
  if(generic==='sdr')return 'sdr';
  return 'unknown';
}
export function classifyGeneric({type='',transfer='',primaries=''}={}) {
  const s=[type,transfer,primaries].join(' ').toLowerCase();
  if(/(?:\bhdr\b|\bpq\b|\bhlg\b|smpte.?st.?2084|smpte2084|st.?2084|arib.?std.?b67|bt[.\s_-]?2020|rec[.\s_-]?2020|dolby.?vision)/i.test(s))return 'hdr';
  if(/(?:vp09\.02\.|av01\.[0-3]\.\d+[mh]\.10\b|10.?bit)/i.test(s))return 'unknown';
  if(/\bavc1\.[a-f0-9]+\b/i.test(s))return 'sdr';
  return 'unknown';
}
export class ZcthUniversalChild extends JSWindowActorChild {
  #last=''; #timer=null;
  #visible(v) {
    if(!v?.isConnected||v.error||v.readyState<2||!(v.videoWidth>0))return false;
    try{
      const r=v.getBoundingClientRect(),w=this.contentWindow;
      return r.width>0&&r.height>0&&r.right>0&&r.bottom>0&&
        r.top<(w.innerHeight||99999)&&r.left<(w.innerWidth||99999);
    }catch(_){return false}
  }
  #probe() {
    try{
      const w=this.contentWindow,doc=this.document;
      const host=String(w?.location?.hostname||'').toLowerCase();
      const path=String(w?.location?.pathname||'');
      const videos=Array.from(doc?.querySelectorAll('video')||[]).filter(v=>this.#visible(v));
      if(!videos.length)return {state:'none',count:0,mediaKey:''};
      let state='unknown';
      if(/(^|\.)youtube\.com$/.test(host)&&path==='/watch') {
        const el=doc?.getElementById('movie_player'),p=el?.wrappedJSObject||el;
        const call=n=>{try{return p?.[n]?.()}catch(_){return undefined}};
        const id=new URL(w.location.href).searchParams.get('v');
        const response=call('getPlayerResponse');
        if(id&&response?.videoDetails?.videoId===id&&!el.classList.contains('ad-showing'))
          state=classifyYouTube({
            videoId:id,playingId:String(call('getVideoData')?.video_id||''),
            response,stats:call('getStatsForNerds'),fmt:call('getVideoStats')?.fmt
          });
      } else if(/(^|\.)bilibili\.com$/.test(host)&&
                 (/^\/video\//.test(path)||/^\/bangumi\/play\//.test(path))) {
        const page=w.wrappedJSObject||w,p=page.player||page.__player;
        const call=n=>{try{return p?.[n]?.()}catch(_){return undefined}};
        const quality=call('getQulity')??call('getQuality')??call('getCurrentQuality');
        const initial=page.__playinfo__?.data?.quality??page.__playinfo__?.result?.quality;
        const node=doc.querySelector('.bpx-player-ctrl-quality-result, .bpx-player-ctrl-quality-menu-item.bpx-state-active');
        state=classifyBilibili({quality,initialQuality:initial,label:node?.textContent||''});
      }
      const keys=[];
      for(const v of videos){
        const current=String(v.currentSrc||v.src||'');
        let hash=2166136261;
        for(let i=0;i<current.length;i++)
          hash=Math.imul(hash^current.charCodeAt(i),16777619);
        keys.push((hash>>>0).toString(16));
        const source=v.querySelector?.('source[type]');
        const type=source?.getAttribute('type')||v.getAttribute?.('type')||'';
        const generic=classifyGeneric({
          type,transfer:v.dataset?.colorTransfer||'',primaries:v.dataset?.colorPrimaries||''
        });
        if(generic==='hdr')return {state:'hdr',count:videos.length,
          mediaKey:keys.join('|').slice(0,384)};
        if(state==='unknown'&&generic==='sdr')state='sdr';
      }
      // Multiple visible videos in the SAME frame: the single site's quality
      // API cannot establish every video's color range; fail closed.
      if(videos.length>1&&state!=='hdr')state='unknown';
      return {state,count:videos.length,mediaKey:keys.join('|').slice(0,384)};
    }catch(_){return {state:'unknown',count:1,mediaKey:''}}
  }
  #emit(force=false){
    const snapshot=this.#probe();
    const key=[snapshot.state,snapshot.count,snapshot.mediaKey].join(':');
    if(!force&&key===this.#last)return;
    this.#last=key;
    try{this.sendAsyncMessage('ZcthUniversal:State',{
      ...snapshot,href:this.contentWindow?.location?.href||''
    })}catch(_){}
  }
  #start(){
    if(this.#timer!==null||!this.document?.querySelector('video'))return;
    try{this.#timer=this.contentWindow.setInterval(()=>this.#emit(),180)}catch(_){}
  }
  #stop(){
    try{if(this.#timer!==null)this.contentWindow.clearInterval(this.#timer)}catch(_){}
    this.#timer=null;
  }
  handleEvent(event) {
    if(event.type==='pagehide'){
      this.#stop();this.#last='';
      try{this.sendAsyncMessage('ZcthUniversal:State',{
        state:'none',count:0,mediaKey:'',href:''
      })}catch(_){}
      return;
    }
    if(event.type==='DOMContentLoaded'||event.type==='pageshow'){
      this.#start();this.#emit(true);return;
    }
    if(event.target?.localName!=='video')return;
    this.#start();
    if(['loadstart','emptied','abort'].includes(event.type)){
      this.#last='';
      try{this.sendAsyncMessage('ZcthUniversal:State',{
        state:'unknown',count:1,mediaKey:'',href:this.contentWindow?.location?.href||''
      })}catch(_){}
    }else this.#emit(true);
  }
  receiveMessage(message){
    return message.name==='ZcthUniversal:Probe'?this.#probe():null;
  }
  didDestroy(){this.#stop()}
}
