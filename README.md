# Zen Compact Transparent HDR Guard

**Customizable Zen/Zia glass effects with cautious video-state handling.**

[繁體中文](README.zh-TW.md) · [Latest release](https://github.com/kcussiefil/Zen-Compact-Transparent-HDR-Guard/releases/latest) · [Changelog](CHANGELOG.md)

HDR Guard is a standalone Sine mod for Zen Browser. It adjusts floating-sidebar glass, search/address popups and hover cards while coordinating with Zia's video behavior. SDR and HDR video overrides are **explicit opt-ins**. Unknown/protected video is handled conservatively, except where the user enables a site-specific exception.

## What you can customize

- Floating sidebar background color, blur, transparency and height.
- Whether the ordinary background color follows the Zen theme.
- **SDR video** custom glass (off by default).
- **HDR video** custom glass (off by default; requires Zia *Blur over video*).
- URL/search popup custom glass (off by default).
- **Zia and Site Folders preview cards** using the same HDR Guard glass variables (off by default; introduced in v0.2.6).
- Bilibili site-wide immediate custom glass (on by default; deliberately bypasses SDR/HDR checking for `www.bilibili.com/*`).

These settings live in Sine; the authoritative names and defaults are in [`preferences.json`](preferences.json).

## Install and configure

1. Install Zen Browser, Sine and Zia. The current integration targets **Zia 2.118** and, optionally, **Zen Site Folders 0.7.6**.
2. Disable the original **Zen Compact Transparent Mode** if installed, to avoid overlapping CSS.
3. Install the Sine repository `kcussiefil/Zen-Compact-Transparent-HDR-Guard` and restart Zen.
4. Start with the default settings. Enable SDR, HDR, popup and preview-card options individually as needed.
5. For preview-card custom glass, also enable Zia's preview-card blur. For custom glass over a confirmed HDR video, enable Zia's *Blur over video* and HDR Guard's separate HDR switch.

## Video/HDR limitations

- A page containing a video is not proof that its stream is SDR or HDR. The classifier uses available playback/codec evidence; unknown remains unknown.
- Confirmed HDR takes priority over ordinary SDR rules. **The Bilibili immediate-glass option is a deliberate opt-in exception** and can allow blur without waiting for HDR checks. Disable it if strict video protection matters more than glass effects.
- The v0.2.6 preview-card option follows the existing sidebar/popup style variables for Zia tab/folder/tip cards and Site Folders' independent group card. It does **not** intentionally change card layout or keep the video compositor active after the card disappears.
- Zia's video blur can still make HDR content appear darker or washed out on macOS. HDR Guard cannot guarantee HDR-preserving blur; verify that normal video presentation returns when the card/sidebar is hidden.
- Node regression tests check rules and selectors, **not actual OLED/GPU color or brightness**.

## Verification and rollback

- Test ordinary webpages, SDR videos, HDR videos, unknown-format videos, Bilibili, and preview cards separately. Restart Zen when applying a newly installed script.
- If a visual problem appears, first disable the specific HDR Guard option in Sine; you can also disable the mod without changing other projects.
- The previous [v0.2.5 release](https://github.com/kcussiefil/Zen-Compact-Transparent-HDR-Guard/releases/tag/v0.2.5) remains available as a full code rollback point.

## Project information

| Item | Location |
| --- | --- |
| Current version | **v0.2.6** ([`theme.json`](theme.json)) |
| Sine settings | [`preferences.json`](preferences.json) |
| Short changelog | [`CHANGELOG.md`](CHANGELOG.md) |
| Full per-version notes | [`releases/`](releases/) / [GitHub Releases](https://github.com/kcussiefil/Zen-Compact-Transparent-HDR-Guard/releases) |
| Release-writing convention | [`docs/RELEASE_POLICY.md`](docs/RELEASE_POLICY.md) |

Documentation updates alone do not change the mod version or trigger a new release.
