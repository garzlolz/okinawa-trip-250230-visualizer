# ㄏㄜˋ的沖繩之旅！🍍

這是一個以「沖繩五天四夜跨年之旅」為主題的靜態視覺化專案，使用 Vue 3、Tailwind CSS 與 Firebase 打造。

專案以單頁形式呈現旅行資訊，內容包含行程、航班、住宿、預算、購物清單與行前待辦，並支援 Google 登入後同步編輯購物與待辦資料。

## 特色

- 行程總覽：依日期切換每日行程，並自動標示下一個事件
- 航班與住宿：集中查看去回程航班、飯店名稱、區域與備註
- 預算整理：快速檢視各項花費與總預估金額
- 購物清單：可新增、編輯、刪除、排序與篩選購物項目
- 行前待辦：登入後可建立與管理共同待辦清單
- Firebase 即時同步：購物與待辦資料會透過 Firestore 即時更新
- 純靜態架構：不需要建置流程，適合直接部署到 GitHub Pages 或其他靜態主機

## 技術棧

- Vue 3
- Tailwind CSS
- Firebase Authentication
- Cloud Firestore
- ES Modules

## 專案結構

```text
index.html
js/
  main.js
  data.js
  firebase.js
  utils.js
  components/
  views/
assets/
  data/
  js/
css/
```

## 如何執行

本專案沒有打包流程，直接以靜態網站方式開啟即可。不建議直接用 `file://` 開啟，因為專案使用了 ES Modules 與外部資源載入。

### 方法 1：使用 VS Code Live Server

1. 在 VS Code 安裝並啟用 Live Server
2. 以 Live Server 開啟 `index.html`

### 方法 2：使用本機簡易伺服器

如果你的環境有 Python，可以在專案根目錄執行：

```bash
python -m http.server 8000
```

然後在瀏覽器打開：

```text
http://localhost:8000
```

## Firebase 設定

購物清單與待辦清單會使用 Firebase Authentication 與 Firestore。

目前 Firebase 設定寫在 `js/firebase.js`，如果你要改成自己的專案，可以檢查以下項目：

- `firebaseConfig`
- `appId`
- Firestore 規則與集合名稱

專案預設會使用 Google 登入來存取共同資料，因此如果 Firebase 專案尚未啟用 Google Authentication，請先在 Firebase Console 內完成設定。

## 資料來源

- 靜態旅遊資料主要定義在 `js/data.js`
- Firebase 相關讀寫邏輯集中在 `js/firebase.js` 與各個 `views` 元件中

## 部署建議

因為這是純靜態專案，可以直接部署到：

- GitHub Pages
- Firebase Hosting
- Netlify
- Vercel 靜態站點

部署時只要確保根目錄能正確載入 `index.html` 即可。

## 備註

這個專案的介面風格是偏卡通、繽紛與旅行手帳感，如果你要擴充內容，可以直接在 `js/data.js` 新增行程或調整現有資料。
