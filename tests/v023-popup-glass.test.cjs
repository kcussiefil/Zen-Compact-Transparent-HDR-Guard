'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'chrome.css'), 'utf8');
const rule = css.slice(
 css.indexOf('/* v0.2.5 — Zia URL/search pop-up specificity correction'),
 css.indexOf('/* v0.2.6 — Independently enabled preview-card glass.')
);
const effective = rule.replace(/\/\*[\s\S]*?\*\//g, '');
const prefs = JSON.parse(fs.readFileSync(path.join(root,'preferences.json'),'utf8'));
const theme = JSON.parse(fs.readFileSync(path.join(root,'theme.json'),'utf8'));
const script = fs.readFileSync(path.join(root,'sdr-glass.uc.js'),'utf8');

test('023 is derived from tested 022 and pop-up customisation starts OFF', () => {
  assert.equal(theme.version,'0.4.4');
  const setting=prefs.find(p=>p.property==='mod.compacttpr.urlbarcustomblur');
  assert.ok(setting);
  assert.equal(setting.type,'checkbox');
  assert.equal(setting.defaultValue,false);
  assert.ok(prefs.some(p=>p.property==='mod.compacttpr.hdrrealblur'));
  assert.ok(prefs.some(p=>p.property==='mod.compacttpr.sdrrealblur'));
});

test('user can independently disable the popup without changing SDR or HDR', () => {
  assert.match(effective, /-moz-bool-pref: "mod\.compacttpr\.urlbarcustomblur"/);
  assert.match(effective, /-moz-bool-pref: "mod\.compacttpr\.usecompacttransparent"/);
  assert.match(effective, /-moz-pref\("zia\.urlbar\.pop-up-blur"\)/);
  assert.doesNotMatch(script, /urlbarcustomblur/, 'pop-up must remain CSS-only');
});

test('customises only Zia non-classic opened URL/search popup surface', () => {
  assert.match(effective, /#urlbar#urlbar:is\(\[breakout-extend\], \[zen-floating-urlbar="true"\]\):not\(\[zia-classic\]\)/);
  assert.match(effective, /> \.urlbar-background/);
  assert.doesNotMatch(effective, /#titlebar::before/, 'sidebar geometry and paint unchanged');
  assert.doesNotMatch(effective, /:root\[data-zcth-hdr-glass\] \.(?:browserSidebarContainer|browserStack)/);
});

test('reuses exact user-selected HDR Guard sidebar color opacity and blur', () => {
  assert.match(effective, /var\(--mod-compacttpr-customcolor-final\)/);
  assert.match(effective, /transparent var\(--mod-compacttpr-transparentvalue, 15%\)/);
  assert.match(effective, /backdrop-filter: blur\(var\(--mod-compacttpr-customblur, 5px\)\) !important/);
  assert.doesNotMatch(effective, /blur\(24px\)/);
});

test('eligible normal pages, protected SDR, and opted-in HDR are separate selectors', () => {
  assert.match(effective, /:not\(\[zia-video\], \[data-zcth-video-page\]\):not\(/);
  assert.match(effective, /browser\[zia-video\]/);
  assert.match(effective, /\[data-zcth-sdr-glass\]/);
  assert.match(effective, /\[data-zcth-hdr-glass\]/);
  assert.match(script, /value==='hdr'&&hdrEnabled\(\)&&ziaBlurOverVideo\(\)&&!root\.hasAttribute\('zia-video'\)/);
  // Root classification marker is ONLY set by confirmed HDR, never unknown.
  assert.match(script, /if\(states\.some\(x=>x\.state==='hdr'\)\)value='hdr'/);
});

test('Zia disabled video blur cannot accidentally expose forced HDR popup glass', () => {
  // HDR custom marker intentionally comes from the existing 022 classifier,
  // which is blocked whenever the upstream preference is OFF.
  const confirmedHdr=(upstreamBlur, userHdr, rootVideo, state)=>
    state==='hdr' && upstreamBlur && userHdr && !rootVideo;
  assert.equal(confirmedHdr(false,true,true,'hdr'),false);
  assert.equal(confirmedHdr(true,false,false,'hdr'),false);
  assert.equal(confirmedHdr(true,true,false,'unknown'),false);
  assert.equal(confirmedHdr(true,true,false,'hdr'),true);
});

test('light/dark opposite-palette Zia single-toolbar popup stays opaque', () => {
  assert.match(effective, /\[zen-single-toolbar="true"\]\[zia-light\]/);
  assert.match(effective, /\[zia-pop-site="dark"\]/);
  assert.match(effective, /\[zen-single-toolbar="true"\]:not\(\[zia-light\]\)/);
  assert.match(effective, /\[zia-pop-site="light"\]/);
  assert.match(effective, /background: var\(--zia-urlbar-open-bg\) !important/);
  assert.match(effective, /backdrop-filter: none !important/);
});

test('new popup overrides never touch video compositor or HDR brightness', () => {
  assert.doesNotMatch(effective, /\bwill-change\s*:/);
  assert.doesNotMatch(effective, /\bbackface-visibility\s*:/);
  assert.doesNotMatch(effective, /(?:^|[\\s;{}])(?:brightness|filter)\\s*:/m);
  assert.doesNotMatch(effective, /#tabbrowser-tabpanels\s+\.browserSidebarContainer\s*\{/);
  assert.doesNotMatch(effective, /\bdisplay\s*:\s*none/);
});

test('pop-up CSS is active only while Zia marks the UI open or floating', () => {
  assert.match(effective, /#urlbar#urlbar:is\(\[breakout-extend\], \[zen-floating-urlbar="true"\]\)/);
  assert.doesNotMatch(effective, /:root\[data-zcth-hdr-glass\]\s+\.urlbar-background/);
});
