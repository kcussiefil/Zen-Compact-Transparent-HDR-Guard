# Zen Compact Transparent HDR Guard v0.1.3

獨立的 Zen／Sine MOD，改寫自 [Zen Compact Transparent Mode](https://github.com/rasyidrafi/zen-compact-transparent-mode)（Apache-2.0）。

## 工作模式

- **一般網頁：** 保留原版 Transparent Mode 的毛玻璃、透明度、側欄高度及主題背景。
- **HDR 或未知影片：** 沿用使用者已實測成功的 v0.1.2，使用 Zen／Zia 原生主題實色背景，避免網頁留言文字透出與 HDR 發灰。
- **已確認 SDR 的 YouTube 影片：** 新增實驗開關「SDR 影片啟用真正毛玻璃（實驗性；預設關閉）」。開啟後，只在 Zia 偵測到影片可見、且 YouTube 目前選用串流的色彩資訊確認為 SDR 時，啟用真正 backdrop-filter 模糊與 Zia 類似的合成設定，並可讓 Zia／Site Folders 預覽卡片恢復毛玻璃。
- **影片捲出畫面：** 回到 v0.1.2 的原生背景保護，保留 YouTube 與 Bilibili 播放頁識別。

## 安裝與更新

1. 在 Sine 停用舊版 Zen Compact Transparent Mode，只保留本 MOD、Zia 與其他既有 MOD。
2. 從 Sine 安裝或更新 GitHub 來源：kcussiefil/Zen-Compact-Transparent-HDR-Guard
3. 重新啟動 Zen，確認版本 v0.1.3。
4. 若要測試，在本 MOD 的齒輪設定中勾選「SDR 影片啟用真正毛玻璃（實驗性；預設關閉）」。
5. 比較 YouTube SDR、HDR、畫質切換、暫停、留言區，以及 Site Folders 卡片。

## 偵測條件

以 Firefox JSWindowActor 在目前 YouTube 播放分頁讀取 getVideoStats().fmt、getPlayerResponse() 與 getStatsForNerds()，核對目前選用的 itag、影片 ID、色彩中繼資料或可辨識的 8-bit SDR codec；PQ／HLG／BT.2020 或無法辨識的格式不會強制模糊。

**這不是保證零誤判的公開 YouTube API**。在變更畫質時可能有約 1.35 秒的狀態延遲，SDR 也可能因 Gecko 合成方式而發灰。為降低風險，實驗功能預設關閉；僅目前可見影片與已確認 SDR 時啟用，切換頁面或變成未知格式會取消模糊。

Bilibili 或其他網站的 SDR 判斷未實作，依舊使用 v0.1.2 的安全實色背景。關閉實驗開關時不查詢 YouTube 播放器。

## 測試與回退

在 Node.js 22 執行：
- node --check sdr-glass.uc.js
- node --check actors/ZcthStreamChild.sys.mjs
- node --test tests/*.test.mjs

已建立 SDR、HDR、未知格式、播放廣告、影片切換、網頁切換、可見性與開關的單元測試。**尚未在使用者的 macOS Zen 上進行新版本的 HDR 實機測試。**

若發現 SDR 或 HDR 畫面異常，首先取消勾選實驗開關，即回到 v0.1.2 的介面行為。需要完整回退時，v0.1.2 的 Git 提交為 ebb192b4b630b0e842fa3238ce4e859d957e2478。

本專案不修改 Zia、Zen-Site-Folders 或 Black Sheep POS。

## 授權

保留上游 Apache License 2.0，詳見 LICENSE。
