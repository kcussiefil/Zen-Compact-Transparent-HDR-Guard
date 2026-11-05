// Zen Compact Transparent HDR Guard v0.1.6
// One fresh playback snapshot, cross-validated against independent sources.
// This does not read monitor HDR capability or the availability of other formats.
function family(s) {
  const match = String(s ?? '').match(/\b(vp09|av01|avc1|hvc1|hev1)\./i);
  return match?.[1]?.toLowerCase() || '';
}
function hasHdrEvidence(s) {
  return /(?:bt[.\s_-]?2020|rec[.\s_-]?2020|smpte.?st.?2084|st.?2084|arib.?std.?b67|\bhlg\b|\bpq\b|\bhdr\b)/i.test(String(s ?? ''));
}
function isHighBitrate(s) {
  // 10-bit codec is not necessarily HDR; it is never affirmative SDR evidence.
  return /(?:vp09\.02\.|vp09\.0[01]\.\d+\.10\b|av01\.[0-3]\.\d+[mh]\.10\b|10.?bit)/i.test(String(s ?? ''));
}
function has8BitEvidence(s) {
  return /(?:\bavc1\.[\da-f]+|\bvp09\.0[01]\.\d+\.08\b|\bav01\.[0-3]\.\d+[mh]\.08\b)/i.test(String(s ?? ''));
}
export function classifyStream({stats,response,fmt,videoId,playingId,isAd}={}) {
  if (isAd || !videoId || playingId !== videoId) return 'unknown';
  const formats=response?.streamingData?.adaptiveFormats;
  const statCodec=String(stats?.codecs ?? '').toLowerCase();
  const statColor=String(stats?.color ?? stats?.color_space ?? stats?.color_info ?? '').toLowerCase();
  const selected=String(fmt ?? '').trim();
  const statFamily=family(statCodec);
  const matches=Array.isArray(formats) && /^\d+$/.test(selected)
    ? formats.filter(f=>String(f.itag)===selected && /^video\//i.test(f.mimeType||'')) : [];
  const chosen=matches.length===1?matches[0]:null;
  const videoCodec=String(chosen?.mimeType ?? '').toLowerCase();
  const transfer=String(chosen?.colorInfo?.transferCharacteristics ?? '').toLowerCase();
  // Positive HDR indicators override all possible SDR hints.
  if (hasHdrEvidence(statColor)||hasHdrEvidence(transfer)||hasHdrEvidence(statCodec)||
      hasHdrEvidence(videoCodec)||isHighBitrate(statCodec)||isHighBitrate(videoCodec)) return 'hdr';
  // The stats code is for the actively decoded stream. Missing stats are not
  // enough to assert SDR even if the format response merely offers an AVC itag.
  if (!statFamily || !statCodec) return 'unknown';
  if (selected && (!/^\d+$/.test(selected) || !chosen)) return 'unknown';
  // The video itag in "Stats for Nerds" is commonly written as (248).
  // Reject a stale response/format if it names a different current itag.
  const tagged=statCodec.match(/\b(?:vp09|av01|avc1|hvc1|hev1)\.[^()]+\((\d+)\)/i);
  if (selected && tagged && tagged[1]!==selected) return 'unknown';
  if (chosen && family(videoCodec)!==statFamily) return 'unknown';
  // Require two consistent items of current-stream evidence, without
  // a second IPC call or fixed time delay. Same-speed fast path as v0.1.5.
  const statsSDR=has8BitEvidence(statCodec) || /\bbt[.\s_-]?709\b/.test(statColor);
  const formatSDR=chosen && (
    has8BitEvidence(videoCodec) || /(?:bt.?709|smpte.?170m|iec.?61966.?2.?1)/i.test(transfer)
  );
  if (chosen && statsSDR && formatSDR) return 'sdr';
  // If fmt is unavailable, require an explicit BT.709 colour designation AND
  // an 8-bit current codec, rather than trusting one codec hint alone.
  if (!selected && /\bbt[.\s_-]?709\b/.test(statColor) && has8BitEvidence(statCodec)) return 'sdr';
  return 'unknown';
}

export class ZcthStreamV016Child extends JSWindowActorChild {
  #sample() {
    try {
      const win=this.contentWindow;
      if (!win || !/(^|\.)youtube\.com$/i.test(win.location.hostname) ||
          win.location.pathname!=='/watch') return 'unknown';
      const videoId=new URL(win.location.href).searchParams.get('v');
      const el=this.document?.getElementById('movie_player');
      const video=el?.querySelector('video');
      if (!el || !video || video.error || video.readyState<2 || !video.videoWidth)
        return 'unknown';
      const player=el.wrappedJSObject;
      const playingId=String(player?.getVideoData?.()?.video_id || '');
      const response=player?.getPlayerResponse?.();
      if (response?.videoDetails?.videoId!==videoId) return 'unknown';
      return classifyStream({videoId,playingId,response,
        stats:player?.getStatsForNerds?.(), fmt:player?.getVideoStats?.()?.fmt,
        isAd:el.classList.contains('ad-showing')});
    } catch (_) {return 'unknown';}
  }
  #push(state) {
    try {
      this.sendAsyncMessage('ZcthStreamV016:State', {
        state,href:this.contentWindow?.location?.href || ''
      });
    } catch (_) {}
  }
  handleEvent(event) {
    if (event.type==='pagehide') {this.#push('unknown');return;}
    if (!event.isTrusted || event.target?.localName!=='video' ||
        !event.target.closest?.('#movie_player')) return;
    // Invalidate immediately when the media source changes. No stale SDR blur.
    if (['loadstart','emptied','abort'].includes(event.type)) {
      this.#push('unknown');return;
    }
    this.#push(this.#sample());
  }
  receiveMessage(msg) {
    return msg.name==='ZcthStreamV016:Classify' ? this.#sample() : 'unknown';
  }
}
