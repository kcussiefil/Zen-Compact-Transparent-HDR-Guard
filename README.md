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
- **Zia / Site Folders preview cards and the Site Folders selected-tab color editor** with matching HDR Guard glass variables (off by default; the macOS dialog blur is corrected in v0.2.8).
- **Zen Glance** floating-sidebar glass (default-OFF): avoids competing card compositing while a preview is visible and performs a bounded non-video recovery after Glance closes.
- Bilibili site-wide immediate custom glass (on by default; deliberately bypasses SDR/HDR checking for `www.bilibili.com/*`).

These settings live in Sine; the authoritative names and defaults are in [`preferences.json`](preferences.json).

## Install and configure

1. Install Zen Browser, Sine and Zia. The current integration targets **Zia 2.118** and, optionally, **Zen Site Folders 0.7.6**.
2. Disable the original **Zen Compact Transparent Mode** if installed, to avoid overlapping CSS.
3. Install the Sine repository `kcussiefil/Zen-Compact-Transparent-HDR-Guard` and restart Zen.
4. Start with the default settings. Enable SDR, HDR, popup and preview-card options individually as needed.
5. For preview-card custom glass, also enable Zia's preview-card blur. For custom glass over a confirmed HDR video, enable Zia's *Blur over video* and HDR Guard's separate HDR switch.

Glance glass stays optional in Sine. In v0.3.1 its Glance DOM observer is disconnected while the option is OFF, and reconnects immediately when enabled. v0.3.0 narrows its compositor overrides during hover cards and adds a one-frame, video-excluded recovery after Glance closes. It still needs on-device macOS verification; disable the option and restart Zen to roll back an unstable GPU state.

v0.3.2 applies the same HG preview appearance declaration to Zia's hidden native card as well. Site Folders 0.7.6 synchronously samples that source on first opening; it can now read the user's actual HG blur (for example 10px), rather than initially copying Zia's 24px. Hidden cards remain display:none in upstream mods; this does not create GPU blur on hidden cards. No JS, timer or polling change was made. A mocked first-frame comparison and strict CSS difference check are included in CI; real macOS first-frame validation remains necessary.

v0.3.1 keeps every custom glass CSS pixel identical to v0.3.0. The video classifier now paints on tab, video, preference and Zia visibility events; a 1000 ms watchdog replaces the earlier 50 ms polling, while an independent one-shot 100 ms fallback timer handles explicitly whitelisted unknown SDR sites. Video-side 180 ms stream checks remain unchanged for HDR safety. A reproducible deterministic simulation lives in [`benchmarks/compare-v030-v031.cjs`](benchmarks/compare-v030-v031.cjs); simulated work reduction is **not** a measured Zen/GPU rendering speed increase.

When switching back to a previously verified video tab, confirmed SDR/HDR stream data can be reused synchronously until URL, reload, or media evidence changes. Unknown-site SDR fallback is now 100 ms rather than 350 ms; this does not waive HDR protection for unknown videos.

## Video/HDR limitations

- A page containing a video is not proof that its stream is SDR or HDR. The classifier uses available playback/codec evidence; unknown remains unknown.
- Confirmed HDR takes priority over ordinary SDR rules. **The Bilibili immediate-glass option is a deliberate opt-in exception** and can allow blur without waiting for HDR checks. Disable it if strict video protection matters more than glass effects.
- The preview-card option styles Site Folders' non-modal selected-tab color dialog. Since v0.2.8, the browser content is promoted for actual macOS background blur **only while that editor is open**; closing it removes the condition. Site Folders still owns all picker functionality. It uses the same sidebar/popup style variables for Zia tab/folder/tip cards and Site Folders' independent group card. It does **not** intentionally change card layout or keep the video compositor active after the card disappears.
- Zia's video blur can still make HDR content appear darker or washed out on macOS. HDR Guard cannot guarantee HDR-preserving blur; verify that normal video presentation returns when the card/sidebar is hidden.
- Node regression tests check rules and selectors, **not actual OLED/GPU color or brightness**.

## Verification and rollback

- Test ordinary webpages, SDR videos, HDR videos, unknown-format videos, Bilibili, and preview cards separately. Restart Zen when applying a newly installed script.
- If a visual problem appears, first disable the specific HDR Guard option in Sine; you can also disable the mod without changing other projects.
- The previous [v0.3.1 release](https://github.com/kcussiefil/Zen-Compact-Transparent-HDR-Guard/releases/tag/v0.3.1) remains available as a full code rollback point; you can disable the preview-card setting for immediate rollback.

## Project information

| Item | Location |
| --- | --- |
| Current version | **v0.3.2** ([`theme.json`](theme.json)) |
| Sine settings | [`preferences.json`](preferences.json) |
| Short changelog | [`CHANGELOG.md`](CHANGELOG.md) |
| Full per-version notes | [`releases/`](releases/) / [GitHub Releases](https://github.com/kcussiefil/Zen-Compact-Transparent-HDR-Guard/releases) |
| Release-writing convention | [`docs/RELEASE_POLICY.md`](docs/RELEASE_POLICY.md) |

Documentation updates alone do not change the mod version or trigger a new release.
