// YouTube content actor: selected-stream verification and VIDEO-ONLY filter.
// Fail closed whenever codec, bit depth, transfer or current itag is unknown.
const HDR_PATTERN = /(?:\bhdr\b|\bpq\b|\bhlg\b|bt[.\s_-]?2020|rec[.\s_-]?2020|smpte.?st.?2084|smpte.?2084|st.?2084|arib.?std.?b67|dolby.?vision)/i;
function codecFamily(value) {
  const s = String(value || '').toLowerCase();
  if (/\b(?:vp9|vp09)(?:[.\s;"']|$)/.test(s)) return 'vp9';
  if (/\bav01\./.test(s)) return 'av1';
  if (/\bavc1\./.test(s)) return 'avc';
  return '';
}
function liveItag(codecs) {
  const videoCodec = String(codecs || '').split(/\s+\/\s+/)[0];
  return videoCodec.match(/\b(?:vp09|vp9|av01|avc1)(?:\.[a-z0-9.]+)?\s*\((\d+)\)/i)?.[1] || '';
}
export function selectedVp9Sdr({ stats, response, fmt, videoId, playingId, isAd } = {}) {
  if (!videoId || !playingId || videoId !== playingId || isAd) return false;
  const codecs = String(stats?.codecs || '').toLowerCase();
  const color = String(stats?.color ?? stats?.color_space ?? stats?.color_info ?? '');
  // Explicitly require VP09 profile 0/1 + 8-bit. VP09 profile 2 is HDR-prone.
  if (!/\bvp09\.0[01]\.\d+\.08\b/.test(codecs)) return false;
  if (HDR_PATTERN.test(codecs) || HDR_PATTERN.test(color)) return false;
  const selectedFmt = fmt == null ? '' : String(fmt).trim();
  const statItag = liveItag(codecs);
  if (selectedFmt && !/^\d+$/.test(selectedFmt)) return false;
  if (statItag && selectedFmt && statItag !== selectedFmt) return false;
  const itag = selectedFmt || statItag;
  if (!itag || !Array.isArray(response?.streamingData?.adaptiveFormats)) return false;
  const formats = response.streamingData.adaptiveFormats.filter(f =>
    String(f?.itag) === itag && /^video\//i.test(String(f?.mimeType || ''))
  );
  if (formats.length !== 1) return false;
  const f = formats[0];
  if (codecFamily(f.mimeType) !== 'vp9') return false;
  const transfer = String(f.colorInfo?.transferCharacteristics || '');
  const primaries = String(f.colorInfo?.primaries || '');
  const matrix = String(f.colorInfo?.matrixCoefficients || '');
  if ([transfer, primaries, matrix, f.mimeType].some(v => HDR_PATTERN.test(v))) return false;
  if (/\b(?:vp09\.02\.|10.?bit|12.?bit)/i.test(f.mimeType)) return false;
  return true;
}

export class Zvp9SidebarGuardChild extends JSWindowActorChild {
  #state = { active: false, level: 1 };
  #timer = null;
  #applied = new Set();
  #style = null;
  #destroyed = false;
  #revision = 0;
  #eligibleVideo = null;
  #eligibleVideoId = '';
  #eligibleSource = '';
  #eligibleItag = '';

  actorCreated() {
    this.#requestState();
    this.#start();
    this.#apply();
  }
  #onYouTubeWatch() {
    try {
      const w = this.contentWindow;
      return /(^|\.)youtube\.com$/i.test(w.location.hostname) && w.location.pathname === '/watch';
    } catch (_) { return false; }
  }
  #requestState() {
    const revision = this.#revision;
    try {
      void this.sendQuery('Zvp9:GetState').then(state => {
        if (!this.#destroyed && revision === this.#revision) {
          this.#state = state || { active: false, level: 1 };
          this.#apply();
        }
      }).catch(() => {});
    } catch (_) {}
  }
  #currentVideo() {
    const d = this.document;
    const candidates = Array.from(d?.querySelectorAll('video.html5-main-video, #movie_player video') || []);
    return candidates.find(v => v.isConnected && !v.error && v.readyState >= 2) || null;
  }
  #forgetEligibility() {
    this.#eligibleVideo = null;
    this.#eligibleVideoId = '';
    this.#eligibleSource = '';
    this.#eligibleItag = '';
  }
  #isVp9Sdr(video) {
    if (!this.#onYouTubeWatch()) { this.#forgetEligibility(); return false; }
    try {
      const doc = this.document;
      const element = doc?.getElementById('movie_player');
      if (!element || element.classList.contains('ad-showing')) {
        this.#forgetEligibility();
        return false;
      }
      const player = element.wrappedJSObject || element;
      const call = name => { try { return player?.[name]?.(); } catch (_) { return undefined; } };
      const id = new URL(this.contentWindow.location.href).searchParams.get('v');
      const response = call('getPlayerResponse');
      const data = call('getVideoData');
      const playingId = String(data?.video_id || data?.videoId || '');
      if (!id || (playingId && playingId !== id) ||
          (response?.videoDetails?.videoId && response.videoDetails.videoId !== id)) {
        this.#forgetEligibility();
        return false;
      }

      const stats = call('getStatsForNerds');
      const codecs = String(stats?.codecs || '').toLowerCase();
      const color = String(stats?.color ?? stats?.color_space ?? stats?.color_info ?? '');
      const fmt = call('getVideoStats')?.fmt;
      const itag = String(fmt || liveItag(codecs) || '');
      const source = String(video.currentSrc || video.src || '');
      const format = response?.streamingData?.adaptiveFormats?.find(f =>
        String(f.itag) === itag && /^video\//i.test(String(f.mimeType || '')));
      const formatInfo = [
        format?.mimeType, format?.colorInfo?.transferCharacteristics,
        format?.colorInfo?.primaries, format?.colorInfo?.matrixCoefficients
      ].join(' ');

      // Never retain an SDR classification if the selected stream signals HDR,
      // AV1, 10-bit, a different itag, a different video or a new media source.
      if (HDR_PATTERN.test([codecs, color, formatInfo].join(' ')) ||
          (codecFamily(codecs) && codecFamily(codecs) !== 'vp9') ||
          (codecs && /\bvp09\./.test(codecs) &&
             !/\bvp09\.0[01]\.\d+\.08\b/.test(codecs)) ||
          (this.#eligibleVideoId && this.#eligibleVideoId !== id) ||
          (this.#eligibleVideo && this.#eligibleVideo !== video) ||
          (this.#eligibleSource && this.#eligibleSource !== source) ||
          (this.#eligibleItag && itag && this.#eligibleItag !== itag)) {
        this.#forgetEligibility();
        return false;
      }

      const eligible = selectedVp9Sdr({
        videoId: id, playingId,
        isAd: false, stats, fmt, response
      });
      if (eligible) {
        this.#eligibleVideo = video;
        this.#eligibleVideoId = id;
        this.#eligibleSource = source;
        this.#eligibleItag = itag;
        return true;
      }

      // YouTube getters briefly return empty/mismatching data between polls.
      // Keep the last strictly proven SDR state ONLY for the same stream.
      // This prevents the 400ms watchdog from unarming/rearming the filter.
      return this.#eligibleVideo === video &&
        this.#eligibleVideoId === id &&
        this.#eligibleSource === source &&
        (!itag || this.#eligibleItag === itag);
    } catch (_) { return false; }
  }
  #ensureStyle() {
    if (this.#style?.isConnected) return;
    const style = this.document.createElement('style');
    style.setAttribute('data-zvp9-style', '');
    // Keep the filter layer allocated for the entire confirmed SDR stream.
    // The closed sidebar uses brightness(1), not filter:none. Only the number
    // changes on opening/closing, so Gecko need not demote/promote the layer.
    style.textContent = 'video[data-zvp9-armed="true"] {' +
      'filter: brightness(var(--zvp9-sdr-level, 1)) !important;' +
      'transition: filter 90ms linear !important; }';
    (this.document.head || this.document.documentElement)?.appendChild(style);
    this.#style = style;
  }
  #clear() {
    for (const v of this.#applied) {
      try {
        v.removeAttribute('data-zvp9-armed');
        v.style.removeProperty('--zvp9-sdr-level');
      } catch (_) {}
    }
    this.#applied.clear();
    this.#forgetEligibility();
  }
  #apply() {
    if (this.#destroyed) return;
    const state = this.#state;
    // Arm at brightness(1) while the sidebar is closed, so its initial
    // transition never attaches a new CSS filter/compositor layer.
    const video = state.enabled === false ? null : this.#currentVideo();
    if (!video || !this.#isVp9Sdr(video)) {
      this.#clear();
      return;
    }
    this.#ensureStyle();
    for (const v of this.#applied) {
      if (v !== video) {
        v.removeAttribute('data-zvp9-armed');
        v.style.removeProperty('--zvp9-sdr-level');
        this.#applied.delete(v);
      }
    }
    const level = Number(state.level);
    const safe = Number.isFinite(level) ? Math.max(1, Math.min(1.25, level)) : 1.10;
    video.style.setProperty('--zvp9-sdr-level', String(state.active ? safe : 1));
    video.setAttribute('data-zvp9-armed', 'true');
    this.#applied.add(video);
  }
  #start() {
    if (this.#timer !== null || !this.#onYouTubeWatch()) return;
    try { this.#timer = this.contentWindow.setInterval(() => this.#apply(), 400); }
    catch (_) {}
  }
  #stop() {
    try { if (this.#timer !== null) this.contentWindow.clearInterval(this.#timer); }
    catch (_) {}
    this.#timer = null;
  }
  receiveMessage(message) {
    if (message.name !== 'Zvp9:SidebarState') return;
    this.#revision++;
    this.#state = message.data || { active: false, level: 1 };
    this.#start();
    this.#apply();
  }
  handleEvent(event) {
    if (event.type === 'pagehide') { this.#stop(); this.#clear(); return; }
    if (event.type === 'DOMContentLoaded' || event.type === 'pageshow') {
      this.#start(); this.#requestState(); this.#apply(); return;
    }
    if (event.target?.localName !== 'video') return;
    if (event.type === 'loadstart' || event.type === 'emptied') this.#clear();
    this.#start(); this.#apply();
  }
  didDestroy() {
    this.#destroyed = true;
    this.#stop();
    this.#clear();
    try { this.#style?.remove(); } catch (_) {}
  }
}
