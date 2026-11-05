// Zen Compact Transparent HDR Guard — Sine preference sliders
// Sine 2026-11 does not have a native slider preference type.
// Enhance its ordinary string inputs without changing Sine itself.
(() => {
  'use strict';
  const FLAG = '__zenCompactHdrGuardSlidersV010';
  if (window[FLAG]) return;
  const WIN = window;
  const XHTML = 'http://www.w3.org/1999/xhtml';
  const CONFIG = Object.freeze([
    { name: 'customblur', min: 0, max: 30, step: 1, unit: 'px', fallback: 5 },
    { name: 'transparentvalue', min: 0, max: 60, step: 1, unit: '%', fallback: 15 },
    { name: 'leftsidebarheight', min: 40, max: 100, step: 1, unit: '%', fallback: 80 },
    { name: 'videosidebaropacity', min: 85, max: 100, step: 1, unit: '%', fallback: 97 },
    { name: 'videocardopacity', min: 85, max: 100, step: 1, unit: '%', fallback: 96 }
  ]);
  const observed = new Map();
  let timer = null;
  function clamp(spec, value) {
    if (!Number.isFinite(value)) return spec.fallback;
    return Math.min(spec.max, Math.max(spec.min, Math.round(value / spec.step) * spec.step));
  }
  function enhance(doc, spec) {
    const row = doc.getElementById('mod-compacttpr-' + spec.name);
    if (!row || row.querySelector('[data-hdrguard-slider]')) return;
    const original = row.querySelector('input[type="text"]');
    if (!original) return;
    const slider = doc.createElementNS(XHTML, 'input');
    slider.type = 'range';
    slider.min = String(spec.min);
    slider.max = String(spec.max);
    slider.step = String(spec.step);
    slider.setAttribute('data-hdrguard-slider', spec.name);
    slider.setAttribute('aria-label', '調整 ' + spec.name);
    slider.style.cssText = 'flex:1 1 140px;min-width:110px;max-width:240px;accent-color:AccentColor;cursor:pointer;';
    const valueText = doc.createElementNS(XHTML, 'span');
    valueText.style.cssText = 'font-variant-numeric:tabular-nums;min-width:3.4em;text-align:right;font-size:12px;opacity:.86;';
    const holder = doc.createElementNS(XHTML, 'span');
    holder.style.cssText = 'display:inline-flex;align-items:center;justify-content:flex-end;gap:10px;min-width:170px;flex:1;';
    holder.setAttribute('data-hdrguard-slider-holder', spec.name);
    const syncFromField = () => {
      slider.value = String(clamp(spec, Number.parseFloat(original.value)));
      valueText.textContent = slider.value + spec.unit;
    };
    syncFromField();
    original.style.display = 'none';
    holder.append(slider, valueText);
    row.appendChild(holder);
    slider.addEventListener('input', () => {
      valueText.textContent = slider.value + spec.unit;
      try {
        WIN.document.documentElement.style.setProperty('--mod-compacttpr-' + spec.name, slider.value + spec.unit);
      } catch (_) {}
    });
    slider.addEventListener('change', () => {
      original.value = slider.value + spec.unit;
      const E = doc.defaultView?.Event;
      if (E) original.dispatchEvent(new E('change', { bubbles: true }));
      WIN.setTimeout(() => {
        try { WIN.document.documentElement.style.removeProperty('--mod-compacttpr-' + spec.name); }
        catch (_) {}
      }, 650);
    });
    original.addEventListener('change', syncFromField);
  }
  function enhanceAll(doc) {
    for (const spec of CONFIG) enhance(doc, spec);
  }
  function observe(doc) {
    if (!doc || observed.has(doc)) return;
    const host = doc.getElementById('sineModsList');
    if (!host) return;
    const Obs = doc.defaultView?.MutationObserver;
    if (!Obs) return;
    const observer = new Obs(() => enhanceAll(doc));
    observer.observe(host, { childList: true, subtree: true });
    observed.set(doc, observer);
    enhanceAll(doc);
  }
  function scan() {
    const tabs = WIN.gBrowser?.tabs || [];
    for (const tab of tabs) {
      try {
        const content = tab.linkedBrowser?.contentWindow;
        if (!content || !['/preferences', '/settings'].includes(content.location?.pathname)) continue;
        observe(content.document);
      } catch (_) {
        // Restricted settings documents fall back to Sine's text fields.
      }
    }
    for (const [doc, observer] of observed) {
      try {
        if (!doc.defaultView || doc.defaultView.closed) {
          observer.disconnect(); observed.delete(doc);
        }
      } catch (_) { observer.disconnect(); observed.delete(doc); }
    }
  }
  timer = WIN.setInterval(scan, 1200);
  WIN.setTimeout(scan, 250);
  const api = { cleanup() {
    if (timer !== null) WIN.clearInterval(timer);
    for (const observer of observed.values()) observer.disconnect();
    observed.clear();
    delete WIN[FLAG];
  }};
  WIN[FLAG] = api;
  WIN.addEventListener('unload', () => api.cleanup(), { once: true });
})();
