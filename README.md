# Zen Compact Transparent HDR Guard v0.1.7

獨立 Zen／Sine MOD，改寫自 [Zen Compact Transparent Mode](https://github.com/rasyidrafi/zen-compact-transparent-mode)，保留 Apache-2.0 授權。

## v0.1.7：完整對應 Zia 的影片毛玻璃限制

Zia v2.117.6 除側欄與預覽卡片以外，也會在可見影片上取消網址列彈出、尋找列、滑動箭頭與截圖按鈕的毛玻璃。本版沿用 **同一組 v0.1.6 的 SDR/HDR 串流確認結果**，只在 `[zia-video][data-zcth-sdr-glass]` 同時存在且使用者開啟「SDR 影片啟用真正毛玻璃」時，恢復相關樣式：

| 介面 | SDR 已確認 | HDR 或未知格式 |
|---|---|---|
| Zen 緊湊側欄／頂部工具列 | 原有真毛玻璃；沿用 Sine 模糊和透明設定 | Zen/Zia 原生實色 |
| Zia 分頁、群組、提示 Hover 卡片 | Zia 原生 24px 真毛玻璃 | Zia 原生實色 |
| Zen Site Folders 預覽卡片 | 與 Zia 卡片同一毛玻璃機制 | 由 Zia／Site Folders 的安全樣式接手 |
| 網址搜尋、搜尋建議與新增分頁浮動網址列 | 沿用 Zia 的 24px 毛玻璃及網站／工作區顏色 | Zia 原生實色 |
| Cmd+F 尋找列 | 沿用 Zia 的 18px 毛玻璃與明暗配色 | Zia 原生實色 |
| 手勢前進／返回浮動箭頭 | Zia 原生 24px 真毛玻璃 | Zia 原生實色 |
| 擷取畫面時的浮動操作按鈕 | 沿用 Zia 24px 毛玻璃及 `--zia-shot-card` | Zia 原生實色 |

所有合成提升只在對應 UI 真正出現時才啟用，避免常駐對影片強制合成。

### 尊重 Zia 設定

- Zia 的 `zia.cards.blur` 關閉時，不會強制模糊預覽卡片和手勢箭頭。
- Zia 的 `zia.urlbar.pop-up-blur` 關閉時，不會強制模糊網址列彈出。
- Zia 的 `zia.features.find-bar` 關閉時，不會覆寫原生尋找列。
- 單一工具列中，搜尋彈出配色與側欄相反時，沿用 Zia 原本的實色可讀性例外。
- Zia 的彩色群組卡片繼續沿用 `--zia-folder-card-bg`。
- 一般網頁沒有變動；本版不修改 SDR/HDR 偵測器，也不增加新的查詢。

**安全限制：** 「只有 HDR 沒有毛玻璃」是理想效果，但目前只在 **YouTube 已確認為 SDR** 時強制模糊。未能確認的 YouTube、Bilibili 或其他網站仍按 HDR 保護處理，這是避免誤判 HDR 的必要安全策略。

**色彩限制：** 真毛玻璃仍需要 Gecko 讓網頁進入 Firefox 的合成路徑，即使已確認 SDR，仍可能稍微改變影片亮度；本 MOD 不會以亮度濾鏡補償。尚未在使用者 macOS Zen／OLED 上完成本版實機驗證。

### 安裝與回退

Sine 更新 `kcussiefil/Zen-Compact-Transparent-HDR-Guard` 至 **v0.1.7**，重新啟動 Zen。維持 Zia／Site Folders 既有版本，並先停用原版 Transparent Mode，避免重複 CSS。

建議實測 YouTube SDR 與 HDR 各一次：側欄、網址搜尋、新分頁浮動網址列、Cmd+F、卡片、返回箭頭及截圖操作。檢查是否維持原本 Zia 動畫，以及 HDR 色彩不發灰。

若不符合需求，可直接在 Sine 取消「SDR 影片啟用真正毛玻璃」；完整回退至 v0.1.6 提交 `df37281fee97b162caf961ad66a6999a02a0ce50`。先前已通過使用者實機測試的 v0.1.2 提交為 `ebb192b4b630b0e842fa3238ce4e859d957e2478`。

本次只更動 HDR Guard 的 CSS、版本說明與測試，不修改 Zia、Zen Site Folders 或 POS。

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
