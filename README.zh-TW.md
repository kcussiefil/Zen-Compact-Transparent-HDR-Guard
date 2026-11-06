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
| **Zia 單頁／原生資料夾／提示卡片及 Site Folders 群組卡片**套用相同毛玻璃參數 | 關閉（v0.2.6 新增） |
| Bilibili 全站立即套用自訂毛玻璃 | **開啟**；刻意略過 SDR／HDR 檢查 |

所有實際設定名稱與預設值請以 [`preferences.json`](preferences.json) 為準。

## 安裝與設定

1. 使用 Zen Browser、Sine、**Zia 2.118**；如需群組卡片接管，另安裝 **Zen Site Folders 0.7.6**。
2. 若已裝原版 **Zen Compact Transparent Mode**，建議先停用，避免樣式互相覆蓋。
3. 在 Sine 安裝 `kcussiefil/Zen-Compact-Transparent-HDR-Guard`，完整重啟 Zen。
4. 先維持預設值，依需求分別開啟 SDR、HDR、Popup、預覽卡片選項。
5. 預覽卡片要接管毛玻璃時，也要開啟 Zia 的卡片毛玻璃；HDR 影片上的自訂效果另外需要 Zia *Blur over video*。

## HDR／SDR 注意事項

- 畫面上有影片，**不代表能可靠辨識 HDR 或 SDR**。判斷依播放器提供的可用資訊進行，無法辨識時不應假設就是 SDR。
- 已確認的 HDR 優先於一般 SDR 規則。但 **Bilibili 全站立即套用**是使用者可控制的明確例外，會跳過檢查；如果更在意 HDR 保護，請先關閉這個預設開啟的選項。
- v0.2.6 的預覽卡片樣式只調整毛玻璃外觀，不刻意改變卡片大小、動畫或使影片合成層常駐。
- 即使使用最新版本，Zia 在影片上啟用真正模糊時仍可能讓 HDR 變灰、變暗。應實際確認關閉側欄／卡片後亮度是否恢復。
- Node 自動測試不能證明 macOS＋OLED 的 GPU、HDR 亮度和視覺效果已驗收。

## 問題處理與文件

出現顏色或模糊問題時，先在 Sine 關閉對應的 HDR Guard 選項；必要時停用 MOD。完整退回程式可使用 [v0.2.5](https://github.com/kcussiefil/Zen-Compact-Transparent-HDR-Guard/releases/tag/v0.2.5)。

| 項目 | 連結 |
| --- | --- |
| 目前版本 | **v0.2.6**，以 [`theme.json`](theme.json) 為準 |
| 設定清單 | [`preferences.json`](preferences.json) |
| 各版重點 | [`CHANGELOG.md`](CHANGELOG.md) |
| 完整版本說明 | [`releases/`](releases/)／[GitHub Releases](https://github.com/kcussiefil/Zen-Compact-Transparent-HDR-Guard/releases) |
| 發布規範 | [`docs/RELEASE_POLICY.md`](docs/RELEASE_POLICY.md) |

**整理文件不需要升版，也不會自行讓 Sine 更新 MOD。**
