'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'chrome.css'), 'utf8');
// v0.3.3 adds an independently switchable unified-glass override. Legacy tests
// must continue to verify the exact protected-video path when it is OFF.
const beforeUnified = css.indexOf('/* v0.3.3 — opt-out unified HG theme.');
const afterUnified = css.indexOf('/* v0.2.0 —', beforeUnified);
const legacyCss = css.slice(0, beforeUnified) + '\n' + css.slice(
  afterUnified, css.indexOf('/* v0.3.0 — macOS Glance glass with explicit hover-card priority and recovery.')
);
const effective = legacyCss.replace(/\/\*[\s\S]*?\*\//g, '');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'theme.json'), 'utf8'));
const prefs = JSON.parse(fs.readFileSync(path.join(root, 'preferences.json'), 'utf8'));
const manager = fs.readFileSync(path.join(root, 'sdr-glass.uc.js'), 'utf8');

test('024 retains all 019 actor, stream classification and user settings', () => {
  assert.equal(manifest.version,'0.4.4');
  assert.ok(manifest.scripts['video-page.uc.js']);
  assert.ok(manifest.scripts['sdr-glass.uc.js']);
  assert.equal(manifest.preferences, 'preferences.json');
  assert.match(manager, /const KEY='__zcthUniversalV019',ACTOR='ZcthUniversal'/);
  for (const key of [
    'mod.compacttpr.usecompacttransparent',
    'mod.compacttpr.sdrrealblur',
    'mod.compacttpr.hdrrealblur',
    'mod.compacttpr.urlbarcustomblur',
    'mod.compacttpr.sdrsitepatterns',
    'mod.compacttpr.manualvideourl',
  ]) assert.ok(prefs.some(p => p.property === key), key);
  assert.match(manager, /states\.some\(x=>x\.state==='hdr'\)/);
});

test('023 removes old watch-page opaque CSS and forced no-compositor overrides', () => {
  assert.doesNotMatch(effective, /:root\[data-zcth-video-page\]:not\(\[zia-video\]\)/,
    'watch URL is never a reason to force solid video paint');
  assert.doesNotMatch(effective, /will-change:\s*auto\s*!important/,
    'Zia is free to promote video layers when and only when overlays open');
  assert.doesNotMatch(effective, /backface-visibility:\s*visible\s*!important/,
    'no competing video compositor state');
  assert.doesNotMatch(effective, /:root\[data-zcth-video-page\][^{}]*:is\(#zia-tab-card/,
    'do not force Zia cards solid on a watch URL');
  assert.doesNotMatch(effective, /#titlebar\s+\.zen-toolbar-background\s*\{\s*background:/,
    'do not override Zia 2.118 video sidebar surface');
});

test('visible embedded video uses Zia 2.118 native glass (including split view)', () => {
  assert.match(effective, /:not\(\[zia-video\],\s*\[data-zcth-video-page\]\):not\(/);
  assert.ok(effective.includes(
    '#tabbrowser-tabpanels > .browserSidebarContainer:is(.deck-selected, [zen-split="true"]) browser[zia-video]'
  ), 'chrome actor visibility is authoritative instead of video-site URL');
  assert.match(effective, /\[data-zcth-sdr-glass\]\s*,/,
    'SDR custom glass is selectable regardless of Zia root video flag');
  assert.doesNotMatch(effective, /\[data-zcth-sdr-glass\]\[zia-video\]\s*\)/,
    'old gate made SDR checkbox ineffective with Zia Blur over video enabled');
  // No unconditional compositor promotion: ordinary web pages and video
  // overlays are managed by Zia only while the sidebar is actually shown.
  const promoted = [...effective.matchAll(/will-change:\s*transform\s*!important/g)];
  assert.ok(promoted.length > 0, '019 confirmed-SDR opt-in remains supported');
  for (const match of promoted) {
    const left = effective.slice(0, match.index);
    const selector = left.slice(left.lastIndexOf('}'), left.lastIndexOf('{'));
    assert.match(selector, /data-zcth-sdr-glass/, '010/019 optional compositor only');
  }
});

test('state matrix keeps HDR protected when upstream blur is disabled', () => {
  // Root zia-video is ON only with visible video and upstream blur OFF.
  // A Zia 2.118 Blur over video = ON policy sets root zia-video OFF.
  const appliesOriginalTransparentMode = ({ rootZiaVideo, watchPage, browserVideo, sdrGlass }) =>
    (!rootZiaVideo && !watchPage && !browserVideo) ||
    sdrGlass;
  assert.equal(appliesOriginalTransparentMode({
    rootZiaVideo:false,watchPage:true,browserVideo:true,sdrGlass:false
  }),false,'HDR watch pages use Zia native blur when upstream allows it');
  assert.equal(appliesOriginalTransparentMode({
    rootZiaVideo:false,watchPage:false,browserVideo:true,sdrGlass:false
  }),false,'generic video players also use Zia native blur');
  assert.equal(appliesOriginalTransparentMode({
    rootZiaVideo:true,watchPage:true,browserVideo:true,sdrGlass:false
  }),false,'protected HDR must not be blurred by ordinary-mode CSS');
  assert.equal(appliesOriginalTransparentMode({
    rootZiaVideo:true,watchPage:true,browserVideo:true,sdrGlass:true
  }),true,'confirmed SDR optional legacy glass remains available');
  assert.equal(appliesOriginalTransparentMode({
    rootZiaVideo:false,watchPage:true,browserVideo:true,sdrGlass:true
  }),true,'confirmed SDR opt-in takes over native Zia Blur over video surface');
  assert.equal(appliesOriginalTransparentMode({
    rootZiaVideo:false,watchPage:false,browserVideo:false,sdrGlass:false
  }),true,'ordinary pages preserve user-selected transparent style');
});

test('023 HDR custom appearance is strictly gated by sidebar visibility',()=>{
 const start=effective.indexOf('[data-zcth-hdr-glass]:is(');
 const end=effective.indexOf(')\n    ) {',start);
 assert.ok(start>=0 && end>start, 'HDR selector must exist in primary custom sidebar paint');
 const gate=effective.slice(start,end);
 assert.match(gate,/\[zen-has-hover\]/,'visible sidebar hover state');
 assert.match(gate,/\[zen-user-show\]/,'explicit sidebar reveal state');
 assert.match(gate,/\[zen-compact-mode-active\]/,'compact sidebar active state');
 assert.match(gate,/:has\(#navigator-toolbox:is\(/,'only Zia-style visible overlays');
 assert.match(gate,/\[data-zsf-preview-sidebar-hold\]/,'group preview can hold open sidebar');
 assert.ok(!effective.includes(':root[data-zcth-hdr-glass] #tabbrowser-tabpanels'),
   'HDR cannot directly promote the selected video layer');
 const blocks=[...effective.matchAll(/[^{}]+\{[^{}]*\}/g)].map(m=>m[0]);
 assert.ok(blocks.filter(x=>/will-change:\s*transform\s*!important/.test(x))
   .every(x=>x.includes('[data-zcth-sdr-glass]')),
   'HDR must never force will-change; only preserved 021 SDR guarded rules may do so');
});
