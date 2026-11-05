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
export function classifyStream({stats,response,fmt,videoId,playingId,isAd}={}) {
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

export class ZcthStreamV018Child extends JSWindowActorChild {
  #sample() {
    try {
      const win=this.contentWindow;
      if (!win || !/(^|\.)youtube\.com$/i.test(win.location.hostname) ||
          win.location.pathname!=='/watch') return 'unknown';
      const videoId=new URL(win.location.href).searchParams.get('v');
      const element=this.document?.getElementById('movie_player');
      const video=element?.querySelector('video');
      if (!element || !video || video.error || video.readyState<2 ||
          !(video.videoWidth>0)) return 'unknown';
      const player=element.wrappedJSObject || element;
      const safe=(key)=>{try{return player?.[key]?.();}catch(_){return undefined;}};
      const videoData=safe('getVideoData');
      const response=safe('getPlayerResponse');
      if (response?.videoDetails?.videoId &&
          response.videoDetails.videoId!==videoId) return 'unknown';
      return classifyStream({
        videoId,playingId:String(videoData?.video_id||''),
        stats:safe('getStatsForNerds'),fmt:safe('getVideoStats')?.fmt,
        response,isAd:element.classList.contains('ad-showing')
      });
    } catch (_) {return 'unknown';}
  }
  #push(state) {
    try {
      this.sendAsyncMessage('ZcthStreamV018:State',{
        state,href:this.contentWindow?.location?.href||''
      });
    }catch(_){}
  }
  handleEvent(event) {
    if(event.type==='pagehide'){this.#push('unknown');return;}
    if(!event.isTrusted || event.target?.localName!=='video' ||
       !event.target.closest?.('#movie_player'))return;
    if(['loadstart','emptied','abort'].includes(event.type)){
      this.#push('unknown');return;
    }
    this.#push(this.#sample());
  }
  receiveMessage(message){
    return message.name==='ZcthStreamV018:Classify' ? this.#sample() : 'unknown';
  }
}
