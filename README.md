# Zen Compact Transparent HDR Guard v0.1.4

獨立 Zen／Sine MOD，改寫自 [Zen Compact Transparent Mode](https://github.com/rasyidrafi/zen-compact-transparent-mode)，保留 Apache-2.0 授權。

## v0.1.4 更新

1. **更快的 SDR/HDR 分類：** 影片載入、開始播放、更新媒體資料、頁面切換及 Zia 的 `[zia-video]` 改變時優先檢查，另以 **240ms** 間隔保守補查（取代 v0.1.3 的 1350ms）。需要連續兩次確認 SDR 才會強制模糊；HDR、未知格式或辨識失敗立即維持 Zia 原生實色背景。
2. **真正共用側欄設定：** 已確認 SDR 的影片模式使用與一般網頁完全相同的 `#titlebar::before`，包括 Sine 的「一般模式模糊強度」、「一般模式透明度」和側欄高度。不再硬寫另一組 `28px` 模糊及 `78%` 背景圖層比例。
3. **HDR 安全保護：** 偵測 AV1 10-bit、VP9 profile 2、PQ、HLG、BT.2020、影片 ID／格式不一致時，採保守策略。只支援 YouTube `/watch` 的目前播放串流。Bilibili 等網站依舊使用 v0.1.2 的實色保護。
4. **保留實驗開關：** Sine 設定「SDR 影片啟用真正毛玻璃（實驗性；預設關閉）」。更新後會保留你目前的勾選狀態。

## 重要限制：開啟側欄時影片稍微變暗

Zia 需要透過 Gecko／WebRender 的 `will-change: transform` 讓網頁進入另一種合成路徑，才能讓側欄真正模糊後方網頁；這也可能讓 SDR 或 HDR 影片的亮度或色彩稍有變化。**目前無法只靠 CSS 同時保證真實動態毛玻璃、完全相同的影片亮度及零合成成本**。

本版不對影片使用 `filter: brightness()` 或改寫色彩管理設定，因為那會使色彩不準確甚至影響 HDR。畫質優先時，請取消「SDR 影片啟用真正毛玻璃」，保留 Zia 影片模式的實色背景。

## 安裝／測試

1. 先在 Sine 停用原版 **Zen Compact Transparent Mode**，避免兩份相同 CSS 同時執行。
2. 保留 Zia 與 Zen Site Folders，從 Sine 更新 `kcussiefil/Zen-Compact-Transparent-HDR-Guard` 到 **v0.1.4**。
3. **完整重新啟動 Zen**，新版本使用新命名的 Firefox JSWindowActor。
4. 在一般網頁設定你想要的模糊與透明度，例如 `10px` 和 `50%`；開啟實驗選項後，確認 YouTube SDR 側欄使用相同設定。
5. 測試 HDR YouTube、SDR YouTube、切換畫質、捲到留言區、分頁切換與群組預覽。

注意：「透明度 100%」代表背景色完全透明，並不是不透明度 100%；如果沒有成功模糊後方網頁，文字可能變得難以閱讀。

## 測試與回退

在 Node 22 可執行 `node --test tests/*.{test.cjs,test.mjs}`。含分類器、瀏覽器事件模擬、CSS 結構與預設設定測試；這不是 macOS／OLED 實際 HDR 色彩測試。

若畫質或效能不理想，可先取消 SDR 實驗開關，立即回到 v0.1.2 影片模式；完整回退時：
- v0.1.3 commit: `9a7933963c9989978632eea7338350ba342acf2f`
- 已實機確認穩定的 v0.1.2 commit: `ebb192b4b630b0e842fa3238ce4e859d957e2478`

不修改 Zia、Zen Site Folders 或 POS 專案。
