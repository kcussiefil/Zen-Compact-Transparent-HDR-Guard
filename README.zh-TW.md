# Zen Compact Transparent HDR Guard

**讓 Zen／Zia 的浮動側欄、彈出視窗與預覽卡片套用可調整的毛玻璃，同時保守處理影片狀態。**

[English](README.md) · [最新正式版](https://github.com/kcussiefil/Zen-Compact-Transparent-HDR-Guard/releases/latest) · [更新紀錄](CHANGELOG.md)

這是獨立的 Sine MOD。v0.3.3 預設啟用「統一 HG 主題」：側欄、Zia／Site Folders 預覽卡片、網址搜尋與新增分頁彈出視窗，從第一幀就使用 HG 自訂模糊與透明度，即使影片尚未辨識 SDR／HDR。macOS 影片合成只在這些介面顯示期間額外啟用，可能造成 HDR 暫時發灰；關閉此主題開關即可恢復 v0.3.2 的保守影片策略。

## 目前可調整項目

| 功能 | 預設 |
| --- | --- |
| 啟用浮動側欄毛玻璃 | 開啟 |
| **統一 HG 主題：所有指定介面直接使用 HG 外觀** | **開啟，可在 Sine 關閉回復舊行為** |
| 一般背景色、模糊、透明度、側欄高度 | 依 Sine 設定調整 |
| 舊模式 SDR 影片自訂毛玻璃 | 關閉；統一 HG 模式開啟時由主題接管 |
| 舊模式 HDR 影片自訂毛玻璃 | 關閉，需 Zia *Blur over video*；統一 HG 模式另採可見介面合成 |
| 舊模式網址列／搜尋彈出視窗獨立開關 | 關閉；統一 HG 模式開啟時由主題接管 |
| 舊模式 Zia／Site Folders 預覽卡片及選色視窗獨立開關 | 關閉；統一 HG 模式開啟時由主題接管 |
| **macOS 右鍵選單黑色邊線修正** | **關閉**；僅調整外框與陰影，保留 Zen Context Menu 原本的背景、模糊、圓角及排序 |
| **Zen Glance 開啟時的浮動側欄毛玻璃修補** | **關閉**（避免預覽卡片合成衝突；關閉 Glance 後嘗試恢復合成層） |
| Bilibili 全站立即套用自訂毛玻璃 | **開啟**；刻意略過 SDR／HDR 檢查 |

所有實際設定名稱與預設值請以 [`preferences.json`](preferences.json) 為準。

## 安裝與設定

1. 使用 Zen Browser、Sine、**Zia 2.121.0**；如需群組卡片接管，另安裝 **Zen Site Folders 0.7.6**。
2. 若已裝原版 **Zen Compact Transparent Mode**，建議先停用，避免樣式互相覆蓋。
3. 在 Sine 安裝 `kcussiefil/Zen-Compact-Transparent-HDR-Guard`，完整重啟 Zen。
4. 「統一 HG 主題」預設開啟。請確認 Zia 對應的側欄、卡片、網址列彈窗模糊選項已啟用，HG 才會接管各介面。
5. 若 HDR 發灰過重或視窗文字難以閱讀，可直接在 Sine 關閉「統一 HG 主題」，恢復 v0.3.2 規則；舊有的 SDR、HDR、Popup 與預覽卡片個別開關仍可使用。

右鍵選單黑線修正：**保留 Zen Context Menu MOD**，並保持「Zen's own menus on macOS」開啟（`widget.macos.native-context-menus=false`）。原有的排序、隱藏項目、圖示、漸層及主題色不用調整；在 Sine 開啟 HG「macOS 右鍵選單黑色邊線修正」後，只移除非原生右鍵選單的邊框與視窗陰影，不再接管背景、透明度、顏色、圓角或 `backdrop-filter`。若出現異常，只需關閉 HG 此選項。白色頁面四角是否改善仍需 macOS 實機驗證。

Glance 修補須另行在 Sine 開啟「Zen Glance 開啟時修正浮動側欄毛玻璃」。v0.3.0 已縮小 Glance 開啟時的合成處理，並在關閉後進行一次不涉及影片的合成重整；仍需 OLED 實機驗證。若 HDR 亮度或預覽卡片模糊異常，請關閉選項並完整重啟 Zen。

v0.3.3 不再為側欄、預覽卡片、網址／搜尋及新增分頁浮動網址列等待影片格式判定才套用 HG 外觀。macOS 必要的網頁合成僅在對應介面實際顯示期間啟用；不會因背景影片存在而持續提升合成層。Glance 保留獨立的處理方式。此版沒有更改 JavaScript、50ms／1000ms 輪詢或影片識別演算法。

v0.3.2 將 HG 的預覽卡片 CSS 提前適用於尚未顯示的 Zia 原生卡片，讓 Site Folders v0.7.6 開啟群組預覽時同步讀取到你設定的模糊值（例如 10px），減少先出現 Zia 24px 再轉為 HG 的視覺跳變。隱藏的卡片仍由 Zia／Site Folders 的 display:none 保護，不會額外進行 GPU 模糊；未新增 JavaScript、計時器、輪詢，也不改動 v0.3.1 的性能改善。此為以原始碼與模擬流程驗證的修補，macOS GPU 首畫格仍需實機確認。

v0.3.1 不更動任何 HG 毛玻璃色彩、透明度、模糊強度或側欄高度。切換已辨識分頁、影片狀態與 Sine 開關變動時即時更新 HG 外觀；主程式備援輪詢從每 50 ms 改為每 1000 ms，指定未知 SDR 網站仍用獨立 100 ms 計時器，無須等待輪詢。影片端每 180 ms 的原有檢查不變，以維持 HDR 安全。Glance 選項關閉時停用其 DOM 監聽。模擬實驗放在 [`benchmarks/compare-v030-v031.cjs`](benchmarks/compare-v030-v031.cjs)，不能視為 macOS GPU 的實測加速。

切回先前已確認格式的影片分頁時，會優先使用該分頁快取，避免先清空毛玻璃狀態。重新載入、切換影片網址等仍會重新檢查；未知網站 SDR 備援從 350 ms 改為 100 ms。

## HDR／SDR 注意事項

- 畫面上有影片，**不代表能可靠辨識 HDR 或 SDR**。判斷依播放器提供的可用資訊進行，無法辨識時不應假設就是 SDR。統一 HG 模式明確允許在未知格式影片上，只於覆蓋介面可見期間啟動合成。
- 已確認的 HDR 優先於一般 SDR 規則。但 **Bilibili 全站立即套用**是使用者可控制的明確例外，會跳過檢查；如果更在意 HDR 保護，請先關閉這個預設開啟的選項。
- v0.2.8 修正 Site Folders「選取分頁顏色」視窗背景模糊：在 macOS 上僅於視窗開啟時啟用必要的網頁合成圖層，關閉時立即移除條件。影片可能在視窗開啟期間變暗，關閉後應恢復 HDR；須實機驗證。選色、預覽、儲存、取消等功能仍由 Site Folders 負責。
- 即使使用最新版本，Zia 在影片上啟用真正模糊時仍可能讓 HDR 變灰、變暗。應實際確認關閉側欄／卡片後亮度是否恢復。
- Node 自動測試不能證明 macOS＋OLED 的 GPU、HDR 亮度和視覺效果已驗收。

## 問題處理與文件

出現顏色或模糊問題時，先在 Sine 關閉「統一 HG 主題」回復 v0.3.2 行為；必要時停用 MOD。完整退回程式可使用 [v0.3.2](https://github.com/kcussiefil/Zen-Compact-Transparent-HDR-Guard/releases/tag/v0.3.2)。

| 項目 | 連結 |
| --- | --- |
| 目前版本 | **v0.4.0**，以 [`theme.json`](theme.json) 為準 |
| 設定清單 | [`preferences.json`](preferences.json) |
| 各版重點 | [`CHANGELOG.md`](CHANGELOG.md) |
| 完整版本說明 | [`releases/`](releases/)／[GitHub Releases](https://github.com/kcussiefil/Zen-Compact-Transparent-HDR-Guard/releases) |
| 發布規範 | [`docs/RELEASE_POLICY.md`](docs/RELEASE_POLICY.md) |

**整理文件不需要升版，也不會自行讓 Sine 更新 MOD。**
