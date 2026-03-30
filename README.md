# ㄏㄜˋ的沖繩之旅！🍍

這是一個以「沖繩五天四夜跨年之旅」為主題的靜態視覺化專案，使用 Vue 3、Tailwind CSS 與 Firebase 打造。

專案以單頁形式呈現旅行資訊，內容包含行程、航班、住宿、預算、購物清單、行前待辦與照片相簿，並支援 Google 登入後同步編輯購物、待辦資料及上傳相簿照片。

## 特色

- 行程總覽：依日期切換每日行程，並自動標示下一個事件
- 航班與住宿：集中查看去回程航班、飯店名稱、區域與備註
- 預算整理：快速檢視各項花費與總預估金額
- 購物清單：可新增、編輯、刪除、排序與篩選購物項目
- 行前待辦：登入後可建立與管理共同待辦清單
- 照片相簿功能：登入且有權限的使用者可批次上傳多張照片並增加描述，即時於相簿牆展示，亦可刪除自己上傳的照片
- Firebase 即時同步：購物、待辦資料與相簿圖片會透過 Firestore 與 Firebase Storage 即時更新
- 純靜態架構：不需要建置流程，適合直接部署到 GitHub Pages 或其他靜態主機

## 技術棧

- Vue 3
- Tailwind CSS
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
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

購物清單、待辦清單與相簿功能會使用 Firebase Authentication、Firestore 與 Firebase Storage。

目前 Firebase 設定寫在 `js/firebase.js`，如果你要改成自己的專案，可以檢查以下項目：

- `firebaseConfig`
- `appId`
- Firestore 規則與集合名稱
- Firebase Storage Bucket 及 CORS 規則

專案預設會使用 Google 登入來存取共同資料，因此如果 Firebase 專案尚未啟用 Google Authentication，請先在 Firebase Console 內完成設定。若部署至外部網域，需記得配置 Storage 的 CORS 設定。

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

## 給她的一段話

這段時間的思考讓我更確定了，我只想守護妳一個人。我會永遠愛妳、對妳忠誠。

我知道這陣子我的許多行為並不符合妳的期待，讓妳感到越來越失落，甚至讓妳對我失去了信心。過去的經歷讓我習慣有所保留，也常因為想太多而感到焦慮，甚至因此對妳做出了自以為是的試探與挑戰。現在我才明白，這些擔憂與不安不該由妳來承擔，我的這些行為傷害了妳對我的信任。

對妳，我不該有任何保留。我會完全地相信妳，也相信我們能一起變得更好，這才是通往幸福的路。我希望妳能再次打開內心的防備，放心地把自己交給我。我會照顧妳一輩子，我承諾會一直守護妳，絕不先離妳而去。

如果我們再次見面，我想告訴妳：我們結婚吧，讓我們永遠在一起。

我會在妳難過時跳支舞給妳看，在妳不舒服時煮粥給妳喝。妳想吃海鮮，我就去買大螃蟹；在冬天最美的季節，我們一起去採最大最甜的草莓。情人節我會送妳一束花，每天睡前給妳一個吻。我畢生的夢想，就是守護好這樣的現狀，直到永遠。
