# Zen Compact Transparent HDR Guard v0.2.2

## v0.2.2 — HDR 自訂側欄毛玻璃，側欄收起不持續干擾 HDR

以已經實測正常的 **v0.2.1** 為基準，新增獨立「HDR 影片使用 HDR Guard 自訂毛玻璃」設定，**預設關閉**，可直接在 Sine 取消勾選，立即恢復 Zia 原生樣式。

### 使用條件
- Zia v2.118 的 **See-through surfaces keep blurring a video behind them** 必須開啟。
- HDR Guard 的「啟用浮動側欄毛玻璃」維持開啟。
- SDR 自訂毛玻璃開關完全獨立，沿用已確認正常的 v0.2.1 邏輯。
- HDR 的來源必須由既有串流判斷器**確認為 HDR**；未知格式仍維持 Zia 原生效果，避免冒然改變 HDR 顯示。

### 顯示狀態
| 影片／側欄 | HDR 設定關閉 | HDR 設定開啟 |
|---|---|---|
| HDR，側欄收起 | Zia 原生 HDR | Zia 原生 HDR，不添加任何強制影片合成 |
| HDR，側欄展開 | Zia 原生毛玻璃 | 使用 HDR Guard 自訂側欄透明度／模糊／背景／高度 |
| HDR，側欄收合 | 回到正常 HDR | 自訂樣式退出，交由 Zia 恢復影片合成 |
| SDR | v0.2.1 | v0.2.1，依獨立 SDR 開關 |
| 未知影片格式 | Zia 原生 | Zia 原生 |

### 實作範圍
新增 `mod.compacttpr.hdrrealblur`（預設 `false`）。沿用原有 `ZcthUniversal` 串流判斷器，只在已確認 HDR、Zia 允許影片模糊時設定 HDR 自訂樣式標記。CSS 再要求 Zia 的側欄／浮動介面可見狀態，才套用與現有 SDR 相同的自訂浮動側欄樣式。

**沒有新增 `will-change: transform`、`backface-visibility` 或亮度補償。** 影片層的合成啟閉仍完全由 Zia 決定。Zia 的 `Blur over video` 已知可能在側欄展開時讓 HDR 畫面略暗、失去 HDR 呈現；這是上游限制，本版只接管毛玻璃樣式。

### 回退保護
1. **立即回退外觀：** Sine 中取消勾選「HDR 影片使用 HDR Guard 自訂毛玻璃」，不必修改 SDR 設定，即恢復 Zia 原生效果。
2. **完整回退程式碼：** 已另建獨立 `backup/v0.2.1-tested-stable` 分支，指向 `7a6ae9990b3ebedc3a74c2973988440c5e1cd430`；亦保留 [v0.2.1 正式版](https://github.com/kcussiefil/Zen-Compact-Transparent-HDR-Guard/releases/tag/v0.2.1)。回到舊版後需重啟 Zen。
3. 如果新版 Sine 不支援直接安裝舊版本，可將備份版本原始碼以後續新版本號恢復發布，避免重寫 Git 歷史或覆蓋 v0.2.1 tag。

### 測試
執行 `node --test tests/*.test.*` 及 JavaScript 語法檢查。自動測試涵蓋 HDR 開關預設關閉、動態切換、Zia 功能關閉、HDR／SDR 與未知狀態切換、分割窗格和影片消失後清除。

**macOS 27.2＋OLED 的 HDR 亮度恢復及實際模糊呈現仍需實機驗證。** 不應以通過 Node 測試宣稱 HDR 畫面已實測正常。

---

## v0.2.1 歷史說明

## v0.2.1：修正 Zia 2.118 開啟「Blur over video」後 SDR 自訂樣式開關無效

**原因：**Zia 2.118 開啟影片上方毛玻璃時，會清除視窗根元素的 `zia-video` 標記，但保留影片所在瀏覽器的 `browser[zia-video]`。020 的 SDR 分類器只在根元素具有 `zia-video` 時才運作，因此開關勾選與否均只顯示 Zia 原生毛玻璃。

**修正：**
- Zia `Blur over video` 開啟、SDR 自訂樣式開關**關閉**：維持 Zia 原生影片毛玻璃。
- Zia `Blur over video` 開啟、SDR 自訂樣式開關**開啟**：若影片辨識為 SDR，套用 HDR Guard 原本的自訂浮動側欄背景色、透明度、模糊強度與高度；HDR 或未知格式仍由 Zia 管理。
- Zia `Blur over video` 關閉：維持 019／020 的保守影片保護；只有確認 SDR 且使用者開啟選項時才啟用自訂毛玻璃。
- 判斷實際可見影片而非只看網址，仍支援分割窗格，保留 HDR 優先、Bilibili／YouTube、一般 HTML5 和單支影片手動覆寫。
- **不添加任何 HDR 的常駐 `will-change: transform`。**側欄隱藏時的 HDR 顯示仍由 Zia 2.118 控制。

**如何辨識是否成功：**播放已確認的 SDR 影片，側欄展開後，切換 Sine「SDR 影片使用 HDR Guard 自訂毛玻璃」開關，應可明顯看到 Zia 原生模糊樣式與 HDR Guard 自訂背景／模糊差異。若沒有差異，先檢查目前播放格式是否已被識別為 SDR；未知格式一律不自動解除 HDR 保護。

自動化測試涵蓋開關動態切換、Zia 根元素影片標記切換、HDR 優先及影片離開視窗後清除狀態；你的 macOS 27.2 OLED HDR 視覺效果仍需實機確認。

---

## v0.2.0 變更紀錄

Zen／Sine 獨立 MOD，支援 [Zia v2.118.0](https://github.com/z1n-k/zia/releases/tag/v2.118.0) 的影片毛玻璃合成與舊版 HDR Guard 的 HDR／SDR 串流辨識。

## v0.2.0（020）：Zia 2.118 影片毛玻璃相容性

### 修正
- **移除 019 舊版影片頁面強制實心**：YouTube、Bilibili 的影片頁面不再額外把 `.zen-toolbar-background`、Zia 預覽卡片改成實色、關閉 `backdrop-filter`。
- **不再永久干預影片合成**：移除影片網址對應的 `will-change: auto !important`、`backface-visibility: visible !important`。由 Zia 2.118 在側欄實際顯示時啟用合成，隱藏後解除，不添加常駐的 `will-change: transform`。
- **非 YouTube／Bilibili 的 HTML5 影片也一致處理**：Zia 偵測到選中或分割窗格中的可見影片時，讓 Zia 原生模糊規則接手，而不是套用 019 的一般網頁自訂浮動背景。
- **保留 019 所有原功能**：HDR 優先判定、SDR 影片識別、YouTube／Bilibili 畫質偵測、未知網站與單支影片手動規則、浮動側欄外觀設定，以及分割畫面保護均未移除。

### 建議設定
1. Zia 2.118 的 **Look → Blur over video** 設為開啟。啟用後 Zia 讓影片上方的毛玻璃保留，但 HDR 影片在側欄顯示時可能失去 HDR；這是上游合成方式的限制。
2. HDR Guard 保留「啟用浮動側欄毛玻璃」。SDR 實驗性毛玻璃開關可維持既有設定；當 Zia 的 Blur over video 開啟時，由 Zia 自行管理，不需讓兩邊重複強制合成。
3. 完全退出 Zen 後重新開啟，以更新 Sine 樣式。

### 實測驗收
- HDR：側欄隱藏時正常；側欄展開後有毛玻璃，可接受略暗；收合後立即恢復正常。
- SDR：側欄、普通分頁卡片、Zen Site Folders 0.7.6 的群組預覽維持原有效果。
- 在影片頁面捲動到留言區、跨影片／分頁切換、開關預覽卡片，確認背景沒有變成實心或一直發灰。
- 關閉 Zia Blur over video 後，原本 019 的保守 HDR 影片保護及可選 SDR 毛玻璃仍可運作。

本版測試可驗證程式規則與自動化邏輯，但**不能代替 macOS 27.2＋OLED 上的 HDR／SDR 實機視覺驗收**。若有顯示異常，可在 Sine 停用此 MOD，或回到 019 commit `c2b1c048cc635c5023296a7f09854e872803243e`。

---

## v0.1.9 保留功能說明

Zen／Sine 獨立 MOD。以 [Zia v2.117.6](https://github.com/z1n-k/zia) 的 `[zia-video]` 畫面可見影片狀態作為共通入口，維持原本浮動側欄、預覽卡片、網址列／新分頁搜尋、尋找列、手勢箭頭和截圖工具等毛玻璃樣式。

## v0.1.9：跨網站通用偵測與手動網址備援

**不再只有 YouTube。** 使用共用 `ZcthUniversal` Firefox `JSWindowActor` 監測 HTTP／HTTPS 的 HTML5 影片與 iframe，配合 Zia 本身跨 iframe 的 `zia-video` 標記。不同影片來源共用一套 chrome 層毛玻璃控制，不再需要為每個網站新增 CSS。

| 辨識來源 | 判斷 | 限制 |
|---|---|---|
| YouTube | 沿用 v0.1.8 當前播放 itag＋codec 的精確判斷 | 主要支援 YouTube `/watch`；其他路徑保守處理 |
| Bilibili | 讀取目前播放器 `getQulity()`／`getQuality()`／`getCurrentQuality()` 畫質代碼，125、126、129 視為 HDR；已穩定選到常見 SDR 畫質視為 SDR | 播放器內部 API 可能改版；目前取得不到的資料會視為未知 |
| 通用 HTML5 | 從目前影片的明確 MIME／編碼與色彩標籤判斷（例如 AVC 8-bit、PQ、HLG） | Firefox 不一定會公開實際色彩資訊；僅副檔名、影片尺寸、顯示器支援 HDR，都**不是** SDR 證據 |
| 手動備援 | 可直接在 Sine 輸入網站規則或特定影片網址 | **已確認 HDR 永遠優先；未知影片仍有被誤指定為 SDR 的風險** |

### Sine 新增兩個設定

**「未知格式允許 SDR 毛玻璃的網站網址規則」**：可填入多筆網址規則，以分號 `;` 分隔。這是對**未知串流**的明確手動例外，不代表該網站所有影片確實都是 SDR。預設：

```text
www.bilibili.com/video/*;www.bilibili.com/bangumi/play/*
```

- 因此一般 Bilibili 影片即使沒有對外提供色彩資訊，也能在 Zia 偵測到可見影片、等待約 **350ms** 串流資訊後，恢復毛玻璃。
- 若 Bilibili 播放器已確認目前是 HDR／Dolby Vision／HDR Vivid，會**立即使用實色保護**，網址規則不能覆蓋。
- 若你不希望任何未知 HDR 冒險套用毛玻璃，請把上述欄位**清空**；只會對成功確認 SDR 的影片自動啟用。
- 可自行增加其他網站，例如 `media.example.com/watch/*` 或 `*.example.org/video/*`。請勿添加整個不確定的影音網站網域，以免未知 HDR 也被當成 SDR。

**「只對指定影片啟用 SDR 毛玻璃」**：將單支影片的完整網址貼入，例如 `https://www.bilibili.com/video/BV...`，不需要新增程式碼；確定不是 HDR 才建議使用。影片網址不再吻合時即不生效，清空可取消。此精確覆寫立即生效，不額外等待 350ms，但同樣無法覆蓋已確認 HDR。

### 決策優先順序

1. Zia 確認目前畫面有可見影片（含 iframe）；否則維持一般網頁毛玻璃。
2. **任何可見影片已確認 HDR：實色保護**，優先於一切手動網址規則。
3. 所有可見影片都確認 SDR：立即啟用真毛玻璃。
4. 無法確認：單支影片覆寫立即套用，或由符合網站規則者等待 350ms 後嘗試套用；未指定的未知影片維持實色。
5. Zen 分割畫面：如果同時看到多個影片，必須所有可見影片都確認 SDR，**不接受網址規則繞過**其他窗格的未知／HDR 影片。同一個頁面內若同時有多支可見影片，也不會僅憑其中一支 SDR 的畫質就解除全部保護。

### 重要安全與效能說明

- Bilibili **確實有** HDR、Dolby Vision 和 HDR Vivid。預設備援規則的目的是讓一般 Bilibili 影片至少能恢復真毛玻璃，不代表 HDR 已做到 100% 防誤判；當播放器資訊延遲、失效或被更改時，未知的 HDR 仍可能短暫被網址規則視為 SDR。
- 新的通用分類器使用約 50ms 的 chrome 補查，以及含可見影片頁面每 180ms 的 content 狀態檢查，可能比 v0.1.8 略耗資源；YouTube／Bilibili 播放器事件會優先推送，已確認 SDR 不需等待第二次 IPC。
- `[zia-video]` 只能確認畫面上有影片，**無法辨識 SDR／HDR**；通用 HTML5 接口也不能保證提供真正的傳遞函數。
- 真毛玻璃可能讓 Gecko 改變影片合成路徑，使 SDR／HDR 影片略微變暗；沒有對影片施加 `brightness()` 補償。
- 所有影像與播放器狀態只在本機處理，不向外部伺服器傳送資料。
- 舊的 `video-page.uc.js` 保護規則與 Zia／Site Folders 的原有主題設定保留，不修改第三方 MOD。

## 安裝與測試

1. 在 Sine 保留此獨立 HDR Guard，停用**原版** Zen Compact Transparent Mode，避免重複 CSS。
2. 更新至 **v0.1.9**，完整結束 Zen 再重開，使新版 `ZcthUniversal` Firefox Actor 載入。
3. 在 Sine 開啟「SDR 影片啟用真正毛玻璃（實驗性）」。
4. 在 Bilibili 一般 1080P 影片確認側欄、網址搜尋／浮動網址列、預覽卡片、Cmd+F 的真毛玻璃；再切換不同畫質。
5. 對 Bilibili HDR／Dolby Vision 影片確認實色保護。再檢查 YouTube SDR／HDR、未知網站與兩個分割窗格同時有影片的情況。
6. 如果新的網址規則欄位未出現，請在 Sine 更新後重新啟用此 MOD 並重啟 Zen，確認 `preferences.json` 已載入。

## 測試與版本回退

新版本包含 `tests/v019-universal.test.mjs` 與 `tests/structure.test.cjs`；可在 Node.js 22 執行：

```sh
node --check sdr-glass.uc.js
node --check actors/ZcthUniversalChild.sys.mjs
node --check actors/ZcthUniversalParent.sys.mjs
node --test tests/*.test.*
```

這些檢查是程式邏輯／模擬資料驗證，**不能取代使用者的 Zen macOS＋OLED 實際測試**，也不能保證任意網站的 HDR 判斷正確或固定於 100ms 內完成。

- 快速安全回退：關閉 Sine 的「SDR 影片啟用真正毛玻璃」，保留 Zia 影片實色保護。
- 完整回退：v0.1.8 commit `ea694e71e2d96419c0137954d6d9acdb081a10e4`。
- 先前已由使用者實機確認正常的 v0.1.2 commit `ebb192b4b630b0e842fa3238ce4e859d957e2478`。

不修改 Zia、Zen Site Folders 或 Black Sheep POS。
