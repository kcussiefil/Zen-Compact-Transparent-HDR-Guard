# Changelog

The current release is **v0.3.8**. This is a compact index; see the individual files in [`releases/`](releases/) and [GitHub Releases](https://github.com/kcussiefil/Zen-Compact-Transparent-HDR-Guard/releases) for complete notes, qualifications, and rollback points.

| Version | Summary |
| --- | --- |
| [v0.3.8](releases/v0.3.8.md) | Opt-in, default-OFF macOS context menu HG paint; no menu action or video compositor changes. |
| [v0.3.7](releases/v0.3.7.md) | Stabilize sidebar geometry independent of video classification; defer selected-page composition to Zia and retire ineffective 0.3.6 rule. |
| [v0.3.6](releases/v0.3.6.md) | Limit unneeded offscreen browser compositor churn on YouTube playback; HG appearance and selected pane unchanged, hardware verification pending. |
| [v0.3.5](releases/v0.3.5.md) | Keep the floating sidebar's Zia underlay styling constant when YouTube begins playback; no new timer, compositor promotion or other UI changes. |
| [v0.3.4](releases/v0.3.4.md) | Opt-in Glance foreground compositor handoff for visible HG sidebar, cards, and popups; no JS, polling or classifier changes. |
| [v0.3.3](releases/v0.3.3.md) | Default-ON, reversible unified HG appearance for sidebar, Zia/Site Folders cards and URL/new-tab popups from first frame, including unclassified video; macOS composition is limited to visible overlays. |
| [v0.3.2](releases/v0.3.2.md) | Precompute HG preview blur on hidden Zia native cards so Site Folders can copy the correct first-frame style; no JS or visual value change, v0.3.1 performance maintained. |
| [v0.3.1](releases/v0.3.1.md) | Event-first, exact HG visual parity; 50ms polling replaced with 1s fallback watchdog and independent 100ms site timer; unused Glance observer suspended. Virtual-time benchmark added. |
| [v0.3.0](releases/v0.3.0.md) | Reworked Glance/card compositing with a guarded post-close reset; retained confirmed per-tab SDR/HDR state for fast return and shortened unknown SDR fallback to 100 ms. |
| [v0.2.9](releases/v0.2.9.md) | Default-OFF experimental macOS Zen Glance floating-sidebar blur; only visible preview composition and protected background video. |
| [v0.2.8](releases/v0.2.8.md) | Fixed actual macOS page blur behind Site Folders color editor with open-only composition; release documents and CI publishing policy aligned. |
| [v0.2.7](releases/v0.2.7.md) | Site Folders selected-tab color editor matches the optional preview glass. No changes to Site Folders picker logic or HDR video compositing. |
| [v0.2.6](releases/v0.2.6.md) | Optional, default-off unified preview-card glass for Zia tab/folder/tip cards and Site Folders. |
| [v0.2.5](releases/v0.2.5.md) | Fixed custom URL/search popup glass style being overridden. |
| [v0.2.4](releases/v0.2.4.md) | Optional immediate Bilibili-wide glass, with an explicit HDR-detection tradeoff. |
| [v0.2.3](releases/v0.2.3.md) | Optional URL/search popup glass style. |
| [v0.2.2](releases/v0.2.2.md) | Separate HDR video custom-glass control, coordinated with Zia video blur. |
| [v0.2.1](releases/v0.2.1.md) | SDR custom-glass behavior when Zia Blur over video is enabled. |
| [v0.2.0](releases/v0.2.0.md) | Zia 2.118 video-state compatibility and removal of earlier forced solid-page styling. |

Older notes and rollback history remain in the Git repository history and release archive. An older version's advice may no longer describe the current build.

A documentation-only change does not make a new MOD release.
