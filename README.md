# Zen Compact Transparent HDR Guard v0.1.0

獨立的 Zen／Sine MOD。基於 [Zen Compact Transparent Mode](https://github.com/rasyidrafi/zen-compact-transparent-mode)（Apache-2.0），額外整合 Zia 的可見影片偵測 `[zia-video]`。

## 功能

- **一般網頁：** 沿用原版 Transparent Mode 的真實毛玻璃、透明度、背景色與浮動側欄高度。
- **可見影片：** Zia 標記 `[zia-video]` 後停用此 MOD 的背景模糊，改以預設 97% 不透明度的漸層遮蔽，降低網頁文字透出與 HDR 發灰風險。
- **預覽卡片：** 對 Zia 及 Zen Site Folders v0.7.4 的卡片施加不取樣影片畫面的背景色（預設不透明度 96%），保留原有尺寸、動畫與事件。
- **可調整滑桿：** 一般模糊 0–30px（預設 5px）、透明度 0–60%（15%）、浮動側欄高度 40–100%（80%）、影片側欄遮蔽 85–100%（97%）、影片卡片遮蔽 85–100%（96%）。

## 安裝

1. 請先在 Sine **停用原版 Zen Compact Transparent Mode**，避免相同的 CSS 節點與偏好設定衝突。
2. 保留 Zia（以 v2.117.6 為相容性目標）與 Zen Site Folders v0.7.4。
3. 在 Sine 新增 GitHub MOD，輸入 `kcussiefil/Zen-Compact-Transparent-HDR-Guard`。
4. 重新啟動 Zen，從 Sine 此 MOD 的齒輪開啟設定，測試一般頁面、SDR/HDR YouTube、卡片與側欄。

## Sine 滑桿的實作與限制

目前 Sine 原生僅支援 checkbox/string/dropdown/separator，**不支援原生 slider**。
本 MOD 透過 `sliders.uc.js` 增強 Sine 設定介面的五個文字輸入欄位：以真實滑桿調整，放開時觸發 Sine 既有的 `change` 事件保存。若 Zen 或 Sine 的設定頁無法存取，會回退成原本的文字欄位。這不是 Sine 官方內建的滑桿功能，需實機確認顯示是否成功。

## 安全與相容性

- **影片畫質優先。** 影片模式並非真模糊後方網頁，而是高遮蔽率的仿玻璃背景。
- 不會在 `.browserSidebarContainer` 加入 `will-change: transform`，不刻意重新強制合成 HDR 影片。
- 影片偵測只依靠 Zia 的 `[zia-video]`。沒有 Zia 時，無獨立影片偵測器，不能保證 HDR 保護。
- 只修改介面背景，不變更 Site Folders 的群組、快照、還原、拖曳行為。
- **尚未完成 macOS Zen + Zia + Site Folders 的實機測試**；卡片的計算樣式同步及 MOD CSS 載入順序仍可能影響最終效果。

## 測試

```sh
node --check sliders.uc.js
node --test tests/*.test.cjs
```

## 授權

本專案改寫自 rasyidrafi 的 Zen Compact Transparent Mode，沿用 Apache License 2.0。詳見 LICENSE。
