// Privacy-preserving, read-only classification of the currently selected YouTube stream.
// Never assume that an HDR-capable display or HDR-uploaded video means HDR playback.
// Any missing, conflicting or untrusted evidence is 'unknown' (safe/solid).

export function classifyStream({ stats, response, fmt, videoId, playingId, isAd } = {}) {
  if (isAd || !videoId || playingId !== videoId) return 'unknown';
  const current = String(fmt ?? '').trim();
  const all = response?.streamingData?.adaptiveFormats;
  const matched = Array.isArray(all) && /^\d+$/.test(current)
    ? all.find(f => String(f.itag) === current && /video\//i.test(f.mimeType || '')) : null;
  const color = String(stats?.color ?? stats?.color_space ?? stats?.color_info ?? '').toLowerCase();
  const currentCodec = String(stats?.codecs ?? '').toLowerCase();
  const transfer = String(matched?.colorInfo?.transferCharacteristics ?? '').toLowerCase();
  const codec = String(matched?.mimeType ?? '').toLowerCase();
  const hdr = /(?:bt[.\s_-]?2020|rec[.\s_-]?2020|smpte.?st.?2084|st.?2084|arib.?std.?b67|\bhlg\b|\bpq\b|\bhdr\b)/i;
  if (hdr.test(color) || hdr.test(transfer) || /vp09\.02\.|av01\.[0-3]\.\d+[mh]\.10\./.test(currentCodec)) return 'hdr';
  if (matched && (hdr.test(codec) || /vp09\.02\./.test(codec))) return 'hdr';
  // Statistics describe the currently selected stream, not merely available formats.
  if (/\bbt[.\s_-]?709\b/.test(color) && !hdr.test(currentCodec) && !hdr.test(codec)) return 'sdr';
  // A matching itag and explicitly SDR transfer is also authoritative.
  if (matched && /(?:bt.?709|smpte.?170m|iec.?61966.?2.?1)/i.test(transfer)) return 'sdr';
  // Some YouTube SDR variants omit colorInfo. The currently *selected* format
  // being 8-bit AVC/VP9 profile 0 is SDR; 10-bit/ambiguous streams stay unknown.
  if (matched && !transfer && /(?:avc1\.|vp09\.00\.|vp09\.01\.)/.test(codec) &&
      !/vp09\.0[01]\.\d+\.10\./.test(codec)) return 'sdr';
  return 'unknown';
}

export class ZcthStreamChild extends JSWindowActorChild {
  receiveMessage(message) {
    if (message.name !== 'ZcthStream:Classify') return 'unknown';
    try {
      const win = this.contentWindow;
      if (!win || !/(^|\.)youtube\.com$/i.test(win.location.hostname) ||
          win.location.pathname !== '/watch') return 'unknown';
      const targetId = new URL(win.location.href).searchParams.get('v');
      const page = this.document?.getElementById('movie_player');
      const video = page?.querySelector('video');
      if (!page || !video || video.error || video.readyState < 2 || !video.videoWidth) return 'unknown';
      const player = page.wrappedJSObject;
      const playingId = String(player?.getVideoData?.()?.video_id || '');
      const response = player?.getPlayerResponse?.();
      const stats = player?.getStatsForNerds?.();
      const fmt = player?.getVideoStats?.()?.fmt;
      if (response?.videoDetails?.videoId !== targetId) return 'unknown';
      return classifyStream({ stats, response, fmt, videoId:targetId, playingId,
        isAd: page.classList.contains('ad-showing') });
    } catch (_) {
      return 'unknown';
    }
  }
}
