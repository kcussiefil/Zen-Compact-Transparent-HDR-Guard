# HG／Zia 預覽卡片淡入修補 — 獨立測試 MOD v0.0.1

**不是 HG 正式更新。** 此工具只將 Zia 原生分頁／原生資料夾及 Zen Site Folders 群組預覽卡片的「開啟中」透明度固定在 1。原本 0.26 秒的縮放與彈跳保留；關閉動畫的淡出及縮小不變。沒有 JS、計時器、監控、模糊覆寫，也不修改 HG v0.4.3、Zia、Site Folders 原始檔案。

## 原始碼依據

- Zia `v2.121.6`，`src/css/07-hover-cards.css`：`[zia-open]` 使用 `zia-tab-card-in`，先 `opacity:0;transform:scale(.7)` 再 `opacity:1;transform:scale(1)`；`[zia-closing]` 使用另外的 `zia-tab-card-out`。
- Site Folders `v0.7.8`，`userChrome.css`：`#zsf-folder-hover-card[data-open]` 使用相同方向的入場透明度及縮放；`[data-closing]` 另外處理退出。
- 實機 HG Trace 診斷顯示兩次 Zia 卡片的 `backdrop-filter` 都維持 `blur(10px)`，但入場時 `opacity` 約從 0 增至 1。**這不證明所有載入期間的模糊失效都來自淡入。**

## 安裝

在 Sine 的自訂 GitHub MOD 安裝欄貼上：

`kcussiefil/Zen-Compact-Transparent-HDR-Guard/tree/hover-card-no-fade-20261108/experiments/hover-card-no-fade`

這是 GitHub 測試分支下的**獨立 MOD 子資料夾**。若 Sine 不接受這個路徑，不要改動正式 HG；回報錯誤訊息即可。

## 逐項驗證

1. 保留 HG v0.4.3、自訂模糊 10px、Zia 與 Site Folders；關閉 v0.4.3 **失敗的背景分頁合成實驗選項**。
2. 不安裝本測試 MOD 時，觀察開啟卡片前幾幀，記錄透明淡入、縮放、結尾。
3. 在 Sine 安裝並啟用本測試 MOD，重啟 Zen；比較 Zia 原生分頁、原生資料夾及 Site Folders 群組卡片開啟時是否**第一個可見畫格就為不透明**，且仍能從 70% 縮放到 100% 並保有彈跳。
4. 觀察關閉卡片是否仍有 0.12 秒的淡出／縮小；重複背景開啟分頁，確認是否還有*卡片已全顯示仍失去背景模糊*的現象。
5. 檢查 SDR／HDR 影片、Glance、分割檢視、側欄和右鍵選單。這些不應受到新 CSS 影響。

## 預期與限制

- 本 MOD **只修正動畫本身造成的透明階段**。如果 CSS `opacity:1` 且 `blur(10px)`，但畫面仍透出清晰網頁，則需要調查 Gecko／WebRender 合成，不應繼續疊加 CSS。
- 靜態／模擬測試只能驗證 CSS 限定範圍與優先權設計，**不能代替 macOS 實機像素驗收**。
- 此分支只建立 Draft PR，不合併、不發布 HG 正式版。

## 回復

在 Sine 停用或移除此獨立測試 MOD，必要時重啟 Zen。HG v0.4.3 正式版未更動。
