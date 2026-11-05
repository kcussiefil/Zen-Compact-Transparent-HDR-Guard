# Zen Compact Transparent HDR Guard v0.1.6

獨立 Zen／Sine MOD，改寫自 [Zen Compact Transparent Mode](https://github.com/rasyidrafi/zen-compact-transparent-mode)，保留 Apache-2.0 授權。

## v0.1.6 — 快速、保守的 YouTube SDR 真毛玻璃

保留 v0.1.5 的 **50ms 補充輪詢** 與單次查詢決策，不恢復固定 110ms 雙次等待。

- **事件優先：** YouTube 播放器透過獨立 `JSWindowActor` 在 `playing`、`loadeddata`、`canplay` 等影片事件主動推送辨識狀態，不需再額外等待 chrome → content 的一次查詢往返。
- **交叉核對：** 在同一份目前播放串流快照中，同時核對 `getVideoStats().fmt` 選用的格式、`getStatsForNerds().codecs` 目前解碼編碼，以及 `getPlayerResponse()` 對應的格式。遇到格式編號或編碼家族不一致、缺少解碼資訊、廣告與影片 ID 不一致，維持 `unknown` 的安全實色模式。
- **HDR 安全：** PQ、HLG、BT.2020、VP9 profile 2、AV1 10-bit 不被當作 SDR；即使顯示器支援 HDR，也不會直接視為目前影片是 HDR。
- **失效即保護：** YouTube 畫質／影片來源切換時立即撤銷舊 SDR 狀態；非當前分頁的影片事件不干擾現有側欄。非 YouTube 影片網站仍使用 v0.1.2 的 Zia 主題實色背景。
- **外觀不變：** SDR 真毛玻璃、一般網頁的模糊及透明度仍由同一組 Sine 設定控制；不修改 Site Folders 或 Zia 原始碼。

在 Sine 勾選 **「SDR 影片啟用真正毛玻璃（實驗性；預設關閉）」** 才開啟真毛玻璃。預設保留 v0.1.2 的 HDR 影片安全實色背景。

## 測試及速度比較

使用 Node.js 22 執行 30 項分類器、瀏覽器事件、跨程序延遲模擬及狀態競態測試，全部通過。15 組人工構造串流資料中，v0.1.5 有 4 組不可靠資料被當成 SDR；新版 0 組，且 4 組正確 SDR 仍全數辨識。

在**合成的** 2／8／20／45ms 跨程序通訊延遲下：
- 首次從 chrome 主動查詢的切換延遲：v0.1.5 與 v0.1.6 分別同為 2／8／20／45ms。
- 播放器事件已傳到瀏覽器 chrome 後：v0.1.5 額外耗時 2／8／20／64ms（45ms 情境有進行中的查詢）；v0.1.6 在回報到達當下立即切換。

以上都是**Node 模擬及人工測試資料，不是 macOS Zen 實機延遲或真實誤判率**。YouTube 的未公開播放器 API 可能更新，色彩中繼資料若尚未就緒，程式不會為了 100ms 目標猜測 SDR。因此不能保證所有切換均在 100ms 內。

## 安裝

1. 停用舊版原始 Zen Compact Transparent Mode，以免 CSS 同時修改側欄。
2. 保留 Zia 與 Site Folders，在 Sine 更新 `kcussiefil/Zen-Compact-Transparent-HDR-Guard` 至 **v0.1.6**。
3. **完整重新啟動 Zen**。此版使用新命名的 Firefox Actor，避免舊模組快取。
4. 依序測試 YouTube SDR、HDR、切換畫質、切換分頁、暫停／播放、捲動留言區及群組預覽。

## 限制與回退

SDR 真毛玻璃仍透過 Gecko 的 `will-change: transform` 路徑取樣網頁，側欄開啟時可能引起影片亮度變化；本版不額外調整影片亮度。需要以色彩準確性優先時，直接關閉 SDR 真毛玻璃選項。

- 關閉實驗開關，即退回安全的 Zia 原生影片實色背景。
- 完整版控回退：v0.1.5 commit `dc30a924799c54d82b49a1a6841730c71e003028`。
- 先前經使用者實機驗證的 v0.1.2 commit `ebb192b4b630b0e842fa3238ce4e859d957e2478`。

## 測試指令

```sh
node --check sdr-glass.uc.js
node --check actors/ZcthStreamV016Child.sys.mjs
node --test tests/*.test.*
```

本專案不更改 Zia、Zen-Site-Folders 或 POS。
