# HG 預覽卡片毛玻璃診斷工具

這是獨立的 Sine 診斷 MOD，與 HG v0.4.3 同時安裝，不更改正式版 HG、Zia 或 Site Folders。只在手動開始後擷取，無遠端傳輸。

## 從 GitHub 測試分支安裝

Zen → 設定 → Sine Mods → 在自訂 GitHub MOD 安裝欄貼上：

    kcussiefil/Zen-Compact-Transparent-HDR-Guard/tree/hg-preview-trace-20261108/diagnostics/preview-trace

確認 Sine 的「Enable installing JS from unofficial sources」已啟用，安裝成功後重啟 Zen。此路徑是分支內的獨立子資料夾，不是替換 HG 主套件。若 Sine 不接受分支連結，請回報錯誤，不要解除安裝 HG 正式版。

## 操作

1. 保持 HG v0.4.3「macOS 預覽卡片穩定性測試」為關閉，其他設定不變。
2. 按畫面右下角的「開始紀錄」，移到 Zia 分頁／資料夾或 Site Folders 群組，使預覽卡片顯示。
3. 以中鍵或 Command + 點擊開啟背景分頁，直到卡片發生失去模糊的現象。
4. 異常時點選「標記異常」（來不及標記也沒關係），再按「停止」與「匯出 JSON」。
5. 將 JSON 與同次螢幕錄影提供分析。完成後在 Sine 停用或移除此診斷 MOD，再重啟 Zen。

## 紀錄範圍

- 逐影格計算樣式：backdrop-filter、background-color、opacity、display、will-change、backface-visibility、transform。
- 卡片：Zia 原生分頁、原生資料夾、說明卡與 Site Folders 預覽。
- 狀態：zia-video、HG SDR/HDR 旗標、Zia 卡片模糊設定、HG 設定的模糊值、目前顯示／分割畫面與第一個背景分頁的合成資訊。
- 事件：背景分頁建立、分頁選取、分頁關閉、文件載入開始／結束。
- 限制：最多 1800 影格或 90 秒；不會持續在背景取樣。
- **不記錄完整網址、分頁標題、頁面內容、畫面截圖、分頁識別碼、使用者代理字串；不發送網路請求。** 匯出檔僅儲存到使用者選擇的本機位置。

## 已知限制

此工具只觀察 DOM／CSS 計算值，不能直接讀出 Gecko 最終 GPU 合成畫面。如果模糊 CSS 始終存在，仍要另用 about:profiling 擷取 GPU／WebRender 相關事件。診斷本身有輕微取樣成本，極短閃爍仍有可能錯過。**尚未在 macOS 27.2 實機測試。**
