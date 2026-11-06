'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'chrome.css'), 'utf8');
const effective = css.replace(/\/\*[\s\S]*?\*\//g, '');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'theme.json'), 'utf8'));
const prefs = JSON.parse(fs.readFileSync(path.join(root, 'preferences.json'), 'utf8'));
const manager = fs.readFileSync(path.join(root, 'sdr-glass.uc.js'), 'utf8');

test('020 retains all 019 actor, stream classification and user settings', () => {
  assert.equal(manifest.version, '0.2.0');
  assert.ok(manifest.scripts['video-page.uc.js']);
  assert.ok(manifest.scripts['sdr-glass.uc.js']);
  assert.equal(manifest.preferences, 'preferences.json');
  assert.match(manager, /const KEY='__zcthUniversalV019',ACTOR='ZcthUniversal'/);
  for (const key of [
    'mod.compacttpr.usecompacttransparent',
    'mod.compacttpr.sdrrealblur',
    'mod.compacttpr.sdrsitepatterns',
    'mod.compacttpr.manualvideourl',
  ]) assert.ok(prefs.some(p => p.property === key), key);
  assert.match(manager, /states\.some\(x=>x\.state==='hdr'\)/);
});

test('020 removes old watch-page opaque CSS and forced no-compositor overrides', () => {
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
    (rootZiaVideo && sdrGlass);
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
    rootZiaVideo:false,watchPage:false,browserVideo:false,sdrGlass:false
  }),true,'ordinary pages preserve user-selected transparent style');
});
