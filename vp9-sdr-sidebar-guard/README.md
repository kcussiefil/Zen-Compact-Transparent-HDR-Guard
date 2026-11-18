# Zen VP9 SDR Sidebar Guard v0.1.0

Zen Sine MOD：僅在 **Zen 緊湊模式側欄實際展開**且 YouTube `/watch` 影片已確認使用 **VP09 8-bit SDR** 時提高影片亮度。收合側欄會移除濾鏡。無法辨識格式時一律不補償。**HDR 不介入**。

## 安裝

這是獨立 MOD，暫時放在 HG 的 GitHub 儲存庫下，但有自己的 `theme.json`、設定及腳本，不會取代 HG，也不需停用 HG。

1. Zen 設定 → **Sine Mods**。
2. 如尚未開啟，允許從非官方來源安裝 JavaScript MOD。
3. 在安裝未發布 MOD 的欄位貼入：
   
   `kcussiefil/Zen-Compact-Transparent-HDR-Guard/tree/main/vp9-sdr-sidebar-guard`
4. 點選安裝、確認 MOD 已啟用，重新啟動 Zen。

## 設定

- `mod.zvp9.enabled`：預設啟用；可隨時關閉。
- `mod.zvp9.brightness`：側欄展開後補償倍率，預設 `1.10`（10%）；範圍 `1.00`–`1.25`。設定 `1.00` 即不增加亮度。

## 測試步驟

1. YouTube「統計資料」確認 `vp09.00.*.08` 或 `vp09.01.*.08`，且非 HDR。
2. 使用靜止畫面比較：側欄收合不增亮，展開後僅影片增亮。
3. 收合側欄後影片回到原始亮度。
4. 播放 AV1、VP9 10-bit、HDR、廣告或未知串流時應不生效。
5. 網頁 DOM 全螢幕下不應套用補償。切換瀏覽器分頁不應殘留。

## 回復

在 Sine Mods 停用或移除此 MOD，重新啟動 Zen。原 HG／Zia／Site Folders 不需修改。

## 限制

這是實驗性亮度補償，**不是 Gecko 合成器修復**。套用 CSS filter 可能造成高亮階調壓縮或改變硬體影片合成路徑；仍須使用者實機驗證。若純灰影片的畫面亮度仍不一致，先調整補償倍率，不要改動 HDR。

## 開發與版本

v0.1.0，2026-11-19（台灣）。已進行 VP09/AV1/HDR 判斷、側欄幾何條件與濾鏡啟閉單元測試。
