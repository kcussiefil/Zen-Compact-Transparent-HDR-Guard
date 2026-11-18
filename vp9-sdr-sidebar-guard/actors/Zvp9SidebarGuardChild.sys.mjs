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
  #isVp9Sdr() {
    if (!this.#onYouTubeWatch()) return false;
    try {
      const doc = this.document;
      const element = doc?.getElementById('movie_player');
      if (!element || element.classList.contains('ad-showing')) return false;
      const player = element.wrappedJSObject || element;
      const call = name => { try { return player?.[name]?.(); } catch (_) { return undefined; } };
      const id = new URL(this.contentWindow.location.href).searchParams.get('v');
      const response = call('getPlayerResponse');
      if (!id || String(response?.videoDetails?.videoId || '') !== id) return false;
      const data = call('getVideoData');
      const playingId = String(data?.video_id || data?.videoId || '');
      return selectedVp9Sdr({
        videoId: id, playingId,
        isAd: element.classList.contains('ad-showing'),
        stats: call('getStatsForNerds'),
        fmt: call('getVideoStats')?.fmt,
        response
      });
    } catch (_) { return false; }
  }
  #ensureStyle() {
    if (this.#style?.isConnected) return;
    const style = this.document.createElement('style');
    style.setAttribute('data-zvp9-style', '');
    style.textContent = 'video[data-zvp9-brightness-active="true"] { filter: brightness(var(--zvp9-sdr-level, 1)) !important; }';
    (this.document.head || this.document.documentElement)?.appendChild(style);
    this.#style = style;
  }
  #clear() {
    for (const v of this.#applied) {
      try {
        v.removeAttribute('data-zvp9-brightness-active');
        v.style.removeProperty('--zvp9-sdr-level');
      } catch (_) {}
    }
    this.#applied.clear();
  }
  #apply() {
    if (this.#destroyed) return;
    const state = this.#state;
    const video = state.active ? this.#currentVideo() : null;
    if (!video || !this.#isVp9Sdr()) {
      this.#clear();
      return;
    }
    this.#ensureStyle();
    for (const v of this.#applied) {
      if (v !== video) {
        v.removeAttribute('data-zvp9-brightness-active');
        v.style.removeProperty('--zvp9-sdr-level');
        this.#applied.delete(v);
      }
    }
    const level = Number(state.level);
    const safe = Number.isFinite(level) ? Math.max(1, Math.min(1.25, level)) : 1.10;
    video.style.setProperty('--zvp9-sdr-level', String(safe));
    video.setAttribute('data-zvp9-brightness-active', 'true');
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
