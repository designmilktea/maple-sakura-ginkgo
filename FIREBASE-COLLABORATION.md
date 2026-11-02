# Firebase 共編行程

專案：maple-sakura-ginkgo；Web App：MSG map；資料庫：(default)，Standard，asia-east1。

## 2026-11-02 清單與載入互動

- 景點清單移除可見的英文標題、地區及篩選摘要；與詳情共用拖曳、三段高度、把手及鍵盤互動。地圖空白處收合、×關閉；清單中的週末更動仍會同步到保留的詳情狀態。
- 新增「所有已存週末」，包含過去與未來日期，仍與地區／見頃條件交集篩選。標題依目前行程顯示「行程名稱的賞楓週末」，本機為「瀏覽器暫存的賞楓週末」；管理入口改為同行鉛筆圖示。
- 開啟共編時使用原生modal dialog阻擋背景操作，收到伺服器確認的安排後才解除；提供取消及20秒逾時返回本機。取消、登出或逾時後，舊請求不得回填。載入動畫尊重降低動態效果設定。
- 景點清單按鈕明確設定深色文字與Safari文字填色，計數仍保留品牌紅色。實體iPhone Safari外觀需人工驗證。
- 此輪不變更Firebase設定、資料結構或Security Rules，不修改正式資料。新增本機UI回歸涵蓋篩選、面板手勢與載入中／取消／逾時／延遲回應；發布前CI仍執行169項Emulator權限測試。

## 2026-11-02 行程管理與資訊架構

- 詳情顯示真實繁體中文名稱（同日文亦照常顯示），個人週末安排先於例年見頃。手機圖例移至底部安全區上方24px。
- 週末篩選取消「全部景點」；再點已選條件即取消，既有清除篩選仍可使用。
- 登入後先「選擇行程」再「建立共編行程」，新增按鈕為「新增行程」。本機統一稱「瀏覽器暫存」，選單預設本機；「選擇其他行程」只切換管理頁面，明確開啟後才切換資料範圍。
- 「目前行程」下集中「管理行程」；刪除限建立者，使用具行程名稱及不可復原說明的確認對話框，預設焦點取消。
- deletePlan 先交易標記 deletingAt，規則立即停止成員存取及所有共編寫入；伺服器分頁清除 spots、invites、members 與現有成員索引，最後原子寫入無個資的永久刪除標記並刪除父行程及建立者索引。中斷可由建立者重新開啟並繼續刪除。本機安排始終保留。
- 永久刪除標記 weekendPlanDeletions/{planId} 僅含 deletedAt，不可讀取、更新或刪除；禁止重用舊ID，以免殘留子文件被新建行程重新授權。規則無法證明子集合已空，官方客戶端會先完成伺服器分頁清理；測試同時覆蓋惡意提早刪父文件時的舊ID防重建。
- 已移除的歷史成員若仍有私人索引，客戶端會過濾失效行程，不擴大建立者權限去讀取或掃描其他帳號資料。既有 /users、/users/{uid}/saves 原樣保留。
- node check-mvp.cjs、node check-collaboration.cjs 與兩個 research --check；另新增 check-firestore-rules.cjs，Standard Emulator 通過169項規則與實際客戶端整合檢查（含121景點、121邀請、19成員分頁及中斷續刪）。僅 demo 專案測試，未刪除正式行程。
- firebase.emulator.json 提供獨立本機設定；Pages CI 使用固定版本 Firebase 工具與 Java21，每次發布前執行此測試，發布仍只上傳 dist。
- 前一輪 Google 登入／雙帳號邀請與同步已由使用者回報全部正常；本輪新刪除功能尚無正式站雙帳號破壞性實測。

安全審核：
```json
{"score":4,"summary":"新增刪除限建立者且不可回復；刪除期間權限凍結、分頁清理、原子永久標記及防重建經Emulator驗證。規則為prototype，仍需正式帳號驗證。","findings":[{"check":"legacy validation","severity":"minor","issue":"沿用users/saves原規則不限制schema，本輪保持不變。","recommendation":"另行盤點既有資料後強化。"},{"check":"subcollection completeness","severity":"minor","issue":"規則無法查證所有子集合已空；惡意建立者可能跳過清理。","recommendation":"官方客戶端已先分頁清理，永久刪除標記阻擋重建並令孤兒資料無法再次取得權限；大量使用後可另評估可信伺服器清理。"}]}
```

## 2026-11-02 登入與介面分流修復

- 已讀取 Authentication 設定：Google provider 原已啟用；前端設定與現有 Web App 一致，authDomain 保持 maple-sakura-ginkgo.firebaseapp.com。
- 僅以 authorizedDomains 欄位更新加入 designmilktea.github.io，讀回確認保留 localhost、maple-sakura-ginkgo.firebaseapp.com、maple-sakura-ginkgo.web.app。未加入 Shooboost 網域。
- 已讀取現有 (default) Standard / asia-east1 資料庫及已部署規則；本次不修改或部署 Firestore 規則、資料或 Auth provider。
- 共編容器預設 hidden + inert；登入確認中只有簡短提示，未登入只呈現登入及狀態，登入後依未開啟／目前行程顯示操作。成員不顯示建立者管理功能。
- 收到邀請仍使用本機安排，登入後保留 fragment，必須明確接受才加入。登出及切換帳號會停止訂閱、清除共編介面並恢復本機安排；延遲回應不得重新填入舊共編資料。
- 自動測試：node check-mvp.cjs、node check-collaboration.cjs、兩個 research --check 均通過。新增涵蓋 HTML 預設隱藏及 inert、登入確認／成功／取消／失敗／登出、登入恢復、邀請明確接受、建立者 UI、本機安排及拒絕匯入保存、舊訂閱與清單回應失效。
- 測試限制：SDK/UI 使用模擬，不能替代真實 Google OAuth 與雙帳號權限測試；本機缺少 Java，未執行 Firestore Emulator。本次發布流程仍僅上傳 dist 到 GitHub Pages，不操作舊 Shooboost Sites。

以下為先前開發紀錄；其中未發布或尚未修復授權網域的描述不代表本次狀態。

## 本輪交付與狀態

最新瀏覽器驗證（2026-11-02）：HTTP 預覽 http://127.0.0.1:4173/ 可正常載入，Firebase SDK 與行程管理介面已就緒；點擊 Google 登入後確認回傳 auth/unauthorized-domain。須先在 Firebase Authentication > Settings > Authorized domains 加入 127.0.0.1（及要使用的 localhost；不含協定或埠），才能繼續真實登入與雙帳號共編測試。本輪未變更 Auth 設定，未建立雲端測試資料。

已接入 Google 登入、空白行程建立、已加入行程選擇、明確接受邀請、即時週末安排、7天邀請、撤銷邀請與移除成員。本機舊資料不自動上傳、不更換儲存鍵。網站尚未部署。

**2026-11-02：取得使用者明確批准後，共編安全規則已發布至 maple-sakura-ginkgo 的 (default) Firestore，並讀回確認與本機版本完全一致。** 最初 MCP 發布工作回報成功但規則未更新，經 dry-run 確認後使用官方 CLI 僅發布 firestore:rules，取得 released 成功訊息並再次讀回驗證。規則 SHA-256：5928a288562e39d818e6719ace61a9d6960dc863c62835802cc98edf32d36c8a。未新增、搬移或刪除文件，未改 Auth 設定或部署網站。真實雙帳號驗證仍未完成。

## 操作方式

1. 在「我的行程／共編」使用 Google 登入。
2. 輸入名稱，建立空白共編行程；或選擇已加入的行程。
3. 建立者產生邀請連結，分享給信任的人。持連結者登入後必須按「接受邀請並加入共編」，不會自動加入。
4. 清單與詳情的同一組週末選單改為編輯目前行程。圖示紅底表示此行程已安排，暖白咖啡字表示未安排；種類符號不變。
5. 可明確匯入瀏覽器安排；需確認，不覆蓋已存在或已清除的雲端景點。原本地端安排保留，可隨時切回。

本機網址不是朋友可用的遠端分享網址；須另行部署至可存取的網站，並確認 Auth Authorized Domains 包含實際網站網域（本機使用 localhost／127.0.0.1，網域設定不加協定或埠號）。本輪不變更現有 Auth provider 設定。

## 資料與權限

- weekendPlans/{planId}：title、ownerUid、createdAt；20字元自動ID。禁止列出全部行程。
- weekendPlans/{planId}/members/{uid}：editor 成員，加入需要有效的48位十六進位邀請。僅本人與建立者可讀取成員紀錄；僅建立者可列出及移除成員。
- weekendPlans/{planId}/invites/{token}：建立與到期時間、撤銷狀態。客戶端產生192-bit隨機值；非建立者無法列出邀請，只能讀取已知token。只有建立者可產生／撤銷。
- weekendPlans/{planId}/spots/{spotId}：weekend（Saturday 00:00 UTC Timestamp或null）、revision、updatedBy、updatedAt。僅行程成員讀寫；規則限定96個已知景點、日期範圍、星期六、欄位及型別。
- weekendPlanUsers/{uid}/plans/{planId}：僅本人可讀取的行程索引；建立時驗證行程權限，不能靠寫索引取得行程存取權。移除成員後其舊索引可能保留，但無法開啟行程。
- 現有 /users 與 /users/{uid}/saves 規則原樣保留；不新增、刪除或搬移其中的文件。舊規則備份於 research/firestore-rules.before-collaboration.rules。

所有新增資料均不儲存 email、照片或顯示名稱。Firebase Web App 設定是公開識別設定，不含 Admin 金鑰。

## 同步、衝突及離線

以 onSnapshot 訂閱目前行程的 spots。不同景點分別寫入，不覆蓋整張安排表。同一景點用交易讀取 revision，若已被他人更動則拒絕此次提交，使用者確認最新安排後重選。

清除以 null tombstone 並增加 revision，避免舊畫面將已清除安排當成全新文件覆寫。雲端寫入不修改舊 localStorage；只有收到更新才呈現結果。Firestore 使用預設記憶體快取，不開啟持久化共編資料快取。離線或等待伺服器確認時停用共編選單；交易離線失敗不佇列至日後偷偷覆寫。

邀請放在 URL fragment，不送到伺服器 Referer；一般景點分享仍清除行程與邀請資訊。撤銷邀請只阻止日後加入，不移除既有成員。若要移除某成員並防止再次加入，應先撤銷邀請，再移除成員。Firebase Auth 自身登入狀態依SDK預設保存。

## 安全審核（prototype，非安全保證）

```json
{
  "score": 4,
  "summary": "新增共編範圍經靜態對抗檢查與Firebase語法驗證；尚無Emulator及真實雙帳號驗證，不適合直接宣稱生產安全。",
  "findings": [
    {"check":"legacy schema validation","severity":"minor","issue":"沿用的個人 users/saves 規則只有本人權限，未限制欄位與大小；本輪不擅自改變其他功能。","recommendation":"另行評估舊資料schema後強化。"},
    {"check":"authorization coverage","severity":"moderate","issue":"目前沒有Java，尚未執行Emulator權限測試。","recommendation":"廣泛分享前用Emulator及兩個真實帳號測試未登入、非成員、過期／撤銷邀請、自行升權、跨行程、型別／欄位污染及移除成員後讀寫。"}
  ]
}
```

對抗檢查：全域列出與未登入讀寫被拒；行程權限源自owner或已加入成員，索引不能授權；建立者與建立時間不可竄改；編輯者不能改成owner或產生邀請；失效token不能加入；新增與更新均驗證資料欄位、長度、型別、身份及revision；清除不刪除版本；無公開PII文件。無全域公開列表、計數器、任意狀態轉移或Storage路徑，相關攻擊面不適用。父行程須存在，原始父資料刪除被拒，避免孤兒權限；查詢均為單一已授權行程／本人索引，不需要新增複合索引。這些是靜態判斷，不替代實際規則執行測試。

## 檢查與待辦

- node check-mvp.cjs：原有96景點、85標記、分享／篩選／週末回歸。
- node check-collaboration.cjs：mock SDK／UI測試：版本衝突、登入前寫入拒絕、清除tombstone、本機資料保留、離線鎖定、權限變更清空、登入前邀請保留。
- Firebase MCP firebase_validate_security_rules：已通過語法檢查。
- 已依明確批准發布 firestore:rules，並驗證雲端規則與本機一致；未部署 indexes、Auth或網站，未建立新資料庫。
- 待真實兩帳號 Google 登入／加入／編輯／撤銷驗證；目前未為測試建立生產資料或使用者。

I've set up prototype Security Rules to keep the data in Firestore safe. They are designed to be secure for authenticated, plan-scoped collaboration with owner-controlled invitations and validated per-spot writes. However, you should review and verify them before broadly sharing your app. If you'd like, I can help you harden these rules.
