# Zen Compact Transparent HDR Guard v0.1.1

獨立的 Sine MOD；改寫自 [Zen Compact Transparent Mode](https://github.com/rasyidrafi/zen-compact-transparent-mode)，保留 Apache-2.0 授權。

## 外觀模式

- **一般頁面：** 保留原 Transparent Mode 真正的背景毛玻璃、透明度與浮動側欄高度。
- **影片頁面：** 停用 Transparent Mode 自己的 `#titlebar::before` 透明／模糊層，重新顯示 **Zen／Zia 原生的背景圖層**。會跟隨使用者目前在 Zen／Zia 設定的主題或工作區顏色，不套用固定深色或固定百分比。
- **影片偵測：** 尊重 Zia 的 `[zia-video]`；另用輕量的 URL 判斷讓 YouTube `/watch`、`/live/`、`/shorts/`、嵌入播放器、youtu.be 與 Bilibili 影片／番劇播放頁，即使捲到留言區，也繼續使用主題實色背景。
- **卡片：** 保留 Zia 原生影片卡片配色；不再套用上一版的 96% 透明遮蔽層。對播放器已捲出可視區的影片頁，使用 `--zia-tab-card-bg`（有資料夾專屬配色時可用 `--zia-folder-card-bg`）作為 CSS 色彩備援。

## Sine 設定

Sine 不支援原生滑桿；v0.1.1 改用**原生文字輸入欄位**，名稱直接標示預設值：

| 項目 | 預設值 |
|---|---|
| 一般模式模糊強度 | `5px` |
| 一般模式透明度 | `15%` |
| 浮動側欄高度 | `80%` |
| 一般模式自訂背景色 | `rgba(23, 23, 26, 1)` |
| 影片保護 | 啟用 |

影片模式不再提供獨立的側欄／卡片背景不透明度調整，因為它直接使用 Zia 當前主題色。更新後不會覆寫你已儲存的一般模式輸入數值。

## 安裝及更新

1. 在 Sine 停用原版 **Zen Compact Transparent Mode**，避免重複的 CSS。
2. 保留 Zia v2.117.6 和 Zen Site Folders v0.7.4。
3. 從 Sine 的 GitHub MOD 安裝或更新：`kcussiefil/Zen-Compact-Transparent-HDR-Guard`。
4. 更新到 **v0.1.1** 並重新啟動 Zen，驗證一般網頁、YouTube 播放頁、捲到留言區、HDR、卡片和側欄切換。

## 保護邊界

- 不對 `.browserSidebarContainer` 加 `will-change: transform`、`backface-visibility` 或其他新的強制合成設定。
- 新增的 `data-zcth-video-page` 只識別少數已知的影片播放網址，不讀取頁面內容，也不重新載入影片。
- 沒有 Zia 時，仍會辨識上述影片網址並嘗試使用 Zen 原生背景，但不能保證跨其他 MOD 完全相同。
- Site Folders 的群組、拖曳、快照、還原程式碼均未修改；其預覽卡片可能有自身的 inline style，仍需要實機驗證。
- **尚未通過 macOS Zen + Zia + Site Folders + HDR 影片的實機測試。**

## 測試

```sh
node --check video-page.uc.js
node --test tests/*.test.cjs
```
