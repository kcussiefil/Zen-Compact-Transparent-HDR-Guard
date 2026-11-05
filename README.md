# Zen Compact Transparent HDR Guard v0.1.2

獨立 Sine MOD，改寫自 [Zen Compact Transparent Mode](https://github.com/rasyidrafi/zen-compact-transparent-mode)，沿用 Apache-2.0 授權。

## v0.1.2：修復影片頁面側欄只剩文字

**原因：** 之前仍讓原版 Transparent Mode 的 `.zen-browser-generic-background.zen-toolbar-background { display:none!important }` 套用在影片頁面。v0.1.1 試圖以另一條 CSS 恢復，但遭原樣式的優先權壓過。

**修正：** 只有一般網頁才套用 Transparent Mode 的原版側欄 CSS。當 Zia 的 `[zia-video]` 或本 MOD 的影片播放頁標記 `[data-zcth-video-page]` 存在時，整套透明化側欄 CSS 停止套用，交由 Zen／Zia 自己的 `.zen-toolbar-background` 原生圖層顯示你設定的工作區與主題顏色。**沒有硬編碼一個灰色，也不另外覆蓋透明遮罩。**

Zen 原生背景的繪製變數：
- `--zen-main-browser-background-toolbar`
- `--zen-main-browser-background-toolbar-old`
- `--zen-background-opacity`

若播放器捲出視窗，使 Zia 暫時清除 `[zia-video]`，本 MOD 仍透過現有的 YouTube／Bilibili 影片頁判定，讓原生背景圖層保持正常不透明度，並停用其 backdrop blur。**不強制升級影片合成圖層**。

## 模式

- **一般網頁：** 原版 Transparent Mode 的真正背景模糊與透明度。
- **影片顯示中：** 由 Zia 原本的 `[zia-video]` 控制並使用 Zen 原生主題背景，避免網頁文字透出。
- **播放頁（播放器捲走）：** 改回 Zen 原生主題背景顏色，並保護 HDR 合成；不是再加另一層色板。

## 設定預設

- 一般模糊：`5px`
- 一般透明度：`15%`
- 浮動側欄高度：`80%`
- 自訂背景色：`rgba(23, 23, 26, 1)`

Sine 不支援原生滑桿；使用正常文字輸入框，欄位名稱直接標示預設值。影片模式跟隨目前主題色，故沒有額外的百分比遮罩設定。

## 安裝／驗證

1. 在 Sine **停用原版** Zen Compact Transparent Mode，避免同時載入。
2. 保留 Zia v2.117.6、Site Folders v0.7.4。
3. 從 Sine 更新 `kcussiefil/Zen-Compact-Transparent-HDR-Guard` 到 v0.1.2，重新啟動 Zen。
4. 驗證：一般網頁毛玻璃；YouTube 影片正顯示時的 Zia 原生背景；捲到留言區時背景不透出文字；HDR 色彩；分頁快速預覽、群組切換。

本專案**尚未在你的 macOS Zen 上完成實機驗證**。若仍透明，需要查核 Sine 是否同時載入舊 MOD、Zia 的 `[zia-video]` 標記以及 `video-page.uc.js` 是否有正確載入。

**不修改** Site Folders、Zia 或任何非此儲存庫的程式。
