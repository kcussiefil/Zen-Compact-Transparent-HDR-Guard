# Zen Compact Transparent HDR Guard

**讓 Zen／Zia 的浮動側欄、彈出視窗與預覽卡片套用可調整的毛玻璃，同時保守處理影片狀態。**

[English](README.md) · [最新正式版](https://github.com/kcussiefil/Zen-Compact-Transparent-HDR-Guard/releases/latest) · [更新紀錄](CHANGELOG.md)

這是獨立的 Sine MOD。HDR Guard 提供側欄背景色、透明度、模糊強度、高度及部分 Zia 元件的自訂外觀。**SDR 與 HDR 影片上的自訂毛玻璃預設都關閉**，必須個別開啟；對格式不明的影片採保守處理，但使用者主動開啟的網站例外規則除外。

## 目前可調整項目

| 功能 | 預設 |
| --- | --- |
| 啟用浮動側欄毛玻璃 | 開啟 |
| 一般背景色、模糊、透明度、側欄高度 | 依 Sine 設定調整 |
| SDR 影片自訂毛玻璃 | 關閉 |
| HDR 影片自訂毛玻璃 | 關閉，需 Zia *Blur over video* |
| 網址列／搜尋彈出視窗套用自訂毛玻璃 | 關閉 |
| **Zia 單頁／原生資料夾／提示卡片、Site Folders 群組預覽與選取分頁顏色視窗**套用相同毛玻璃參數 | 關閉（v0.2.8 修正 macOS 的實際模糊） |
| **Zen Glance 開啟時的浮動側欄毛玻璃修補** | **關閉**（避免預覽卡片合成衝突；關閉 Glance 後嘗試恢復合成層） |
| Bilibili 全站立即套用自訂毛玻璃 | **開啟**；刻意略過 SDR／HDR 檢查 |

所有實際設定名稱與預設值請以 [`preferences.json`](preferences.json) 為準。

## 安裝與設定

1. 使用 Zen Browser、Sine、**Zia 2.118**；如需群組卡片接管，另安裝 **Zen Site Folders 0.7.6**。
2. 若已裝原版 **Zen Compact Transparent Mode**，建議先停用，避免樣式互相覆蓋。
3. 在 Sine 安裝 `kcussiefil/Zen-Compact-Transparent-HDR-Guard`，完整重啟 Zen。
4. 先維持預設值，依需求分別開啟 SDR、HDR、Popup、預覽卡片選項。
5. 預覽卡片要接管毛玻璃時，也要開啟 Zia 的卡片毛玻璃；HDR 影片上的自訂效果另外需要 Zia *Blur over video*。

Glance 修補須另行在 Sine 開啟「Zen Glance 開啟時修正浮動側欄毛玻璃」。v0.3.0 已縮小 Glance 開啟時的合成處理，並在關閉後進行一次不涉及影片的合成重整；仍需 OLED 實機驗證。若 HDR 亮度或預覽卡片模糊異常，請關閉選項並完整重啟 Zen。

v0.3.1 不更動任何 HG 毛玻璃色彩、透明度、模糊強度或側欄高度。切換已辨識分頁、影片狀態與 Sine 開關變動時即時更新 HG 外觀；主程式備援輪詢從每 50 ms 改為每 1000 ms，指定未知 SDR 網站仍用獨立 100 ms 計時器，無須等待輪詢。影片端每 180 ms 的原有檢查不變，以維持 HDR 安全。Glance 選項關閉時停用其 DOM 監聽。模擬實驗放在 [`benchmarks/compare-v030-v031.cjs`](benchmarks/compare-v030-v031.cjs)，不能視為 macOS GPU 的實測加速。

切回先前已確認格式的影片分頁時，會優先使用該分頁快取，避免先清空毛玻璃狀態。重新載入、切換影片網址等仍會重新檢查；未知網站 SDR 備援從 350 ms 改為 100 ms。

## HDR／SDR 注意事項

- 畫面上有影片，**不代表能可靠辨識 HDR 或 SDR**。判斷依播放器提供的可用資訊進行，無法辨識時不應假設就是 SDR。
- 已確認的 HDR 優先於一般 SDR 規則。但 **Bilibili 全站立即套用**是使用者可控制的明確例外，會跳過檢查；如果更在意 HDR 保護，請先關閉這個預設開啟的選項。
- v0.2.8 修正 Site Folders「選取分頁顏色」視窗背景模糊：在 macOS 上僅於視窗開啟時啟用必要的網頁合成圖層，關閉時立即移除條件。影片可能在視窗開啟期間變暗，關閉後應恢復 HDR；須實機驗證。選色、預覽、儲存、取消等功能仍由 Site Folders 負責。
- 即使使用最新版本，Zia 在影片上啟用真正模糊時仍可能讓 HDR 變灰、變暗。應實際確認關閉側欄／卡片後亮度是否恢復。
- Node 自動測試不能證明 macOS＋OLED 的 GPU、HDR 亮度和視覺效果已驗收。

## 問題處理與文件

出現顏色或模糊問題時，先在 Sine 關閉對應的 HDR Guard 選項；必要時停用 MOD。完整退回程式可使用 [v0.3.0](https://github.com/kcussiefil/Zen-Compact-Transparent-HDR-Guard/releases/tag/v0.3.0)；若只是外觀問題，可在 Sine 關閉預覽卡片毛玻璃選項。

| 項目 | 連結 |
| --- | --- |
| 目前版本 | **v0.3.1**，以 [`theme.json`](theme.json) 為準 |
| 設定清單 | [`preferences.json`](preferences.json) |
| 各版重點 | [`CHANGELOG.md`](CHANGELOG.md) |
| 完整版本說明 | [`releases/`](releases/)／[GitHub Releases](https://github.com/kcussiefil/Zen-Compact-Transparent-HDR-Guard/releases) |
| 發布規範 | [`docs/RELEASE_POLICY.md`](docs/RELEASE_POLICY.md) |

**整理文件不需要升版，也不會自行讓 Sine 更新 MOD。**
