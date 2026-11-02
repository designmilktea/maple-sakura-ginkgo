# 富士山周邊與輕井澤：紅葉／銀杏擴充研究

研究日：2026-11-02（Asia/Taipei）。基準版本：`35cacbc`，現有 96 個景點及共編筆記功能。

**本文件保留研究快照；使用者後續已授權將6個具官方代表座標的景點加入專案。** 詳見 FUJI-KARUIZAWA-AUDIT.md 文末整合更新。以下「不修改／未整合」指研究階段。 不修改 dist、Firebase、Security Rules、登入設定或發布流程。候選網址目前並非可用的正式景點路由。

共 29 筆研究紀錄：23 筆優先候選、5 筆暫緩、1 筆可選延伸。優先候選亦有待核項目，不等於可無審核匯入。第二輪已取得6個官方來源代表座標（非實地測量或入口保證）；沒有自動可上圖的候選。位置／開放條件補核與12筆第一批建議，請先讀 [第二輪審核](FUJI-KARUIZAWA-AUDIT.md)。

富士山周邊是地理範圍，不代表每處都可同框拍到富士山與紅葉／銀杏；此構圖證據另核。

## 研究規則

- 楓樹與銀杏各自保存存在證據及 peak。未確認使用 null；不因某地是紅葉名所而將另一種類填 false。
- `autumnReference` 是整體紅葉參考期，不等於各樹種 peak，也不是今年預報。混合日期不自動參與兩種類篩選。
- 只在來源明確分種時填 species peak；官方來源互異時保留 seasonCandidates，peak 暫空。
- 活動日、舊照片拍攝日、色づき始め、落葉松／春榆黃葉、網站通用「黃（銀杏等）」分類標籤均不自動當銀杏存在或峰期。
- 官方有資料不代表來源每項都同樣新。營業日、道路、停車、步道開放仍須在整合時逐點重核。
- 繁中名字為編輯譯名，不聲稱為場館官方譯名；保持一個目的地一個 ID，兩個不同地區的白絲瀑布分開。
- 地址與入口分開；查不到門牌不填造，辦公室／住宅區中心不可當觀賞點。

## 先處理的來源差異

1. **河口湖紅葉迴廊**：地方觀光地點頁寫10月下旬至11月中旬；縣級舊總覽段落涵蓋11月上旬至下旬，表格又較窄。地方專頁較具體，但未直接覆蓋其他來源。第二輪採具體地方專頁作楓樹例年參考，廣域差異仍保留；理由見審核文件。
2. **舊碓冰峠展望台**：地方供稿範圍為10月中旬至11月上旬，Walker資料較短。另有長野／群馬兩種行政分類，不能因此新增兩筆。
3. **雲場池停車**：舊長野觀光資料提過40台；較新長野及地方觀光資料說無專用停車場。採新公告，不沿用舊容量。
4. **新倉山位置**：最新地點頁用浅間2-4-1，舊名錄及網路文章有不同字地地址或其他停車場。採新頁作地址參考，實際觀賞區代表點另核。
5. **富士吉田舊連結**：舊 `/spot/13` 不可直接視為鐘山瀑布；目前 `index.php?p=13` 是雷達館。必須檢查開啟頁標題，而非只信網址數字。

## 富士山周邊優先候選

| 繁中名稱／日文名稱 | 類型證據 | 紅葉參考期／已分種見頃 | 處理重點 |
|---|---|---|---|
| 河口湖紅葉迴廊<br>河口湖もみじ回廊 | 楓 | 楓：10月下旬〜11月中旬（第二輪採地方專頁） | 與隧道不同；廣域來源差異保留，不合併峰期。 [fuji-corridor](#fuji-corridor)、[yamanashi-overview](#yamanashi-overview) |
| 河口湖紅葉隧道<br>もみじトンネル | 楓 | 楓：11月上旬〜11月中旬（分種） | 道路型觀賞點，座標需核對可安全停留的位置。 [fuji-tunnel](#fuji-tunnel) |
| 久保田一竹美術館庭園<br>久保田一竹美術館 庭 | 紅葉已知；種類待核 | 獨立見頃未確認 | 確認秋季庭園，不由染織作品的楓葉推定實際植栽；樹種與入園規則待核。 [itchiku-garden](#itchiku-garden)、[itchiku-access](#itchiku-access) |
| 富士山博物館公園<br>ふじさんミュージアムパーク | 楓 | 整體：10月下旬〜11月上旬 | 戶外回廊與博物館入館需分清；與鄰近鐘山瀑布建立關聯，不將兩者誤判同一入口。 [yoshida-park](#yoshida-park)、[yoshida-autumn](#yoshida-autumn)、[yoshida-course](#yoshida-course) |
| 鐘山瀑布<br>鐘山の滝 | 楓 | 獨立見頃未確認 | 獨立瀑布觀賞點，近博物館公園；只確認イロハモミジ，不複製相鄰回廊日期。 [yoshida-autumn](#yoshida-autumn)、[yoshida-course](#yoshida-course) |
| 新倉山淺間公園・忠靈塔<br>新倉山浅間公園・忠霊塔 | 楓（次級） | 獨立見頃未確認 | 鐵道旅遊資料明列モミジ，市／觀光專頁未分樹種峰期；舊地址與不同停車場不可混用。 [arakura-place](#arakura-place)、[arakura-access](#arakura-access)、[fuji-railway](#fuji-railway)、[yoshida-autumn](#yoshida-autumn) |
| 恩賜林雞爪楓迴廊<br>恩賜林イロハモミジの回廊 | 楓 | 獨立見頃未確認 | 官方紅葉頁確認有回廊；庭園、組合辦公室、道路回廊入口仍須分辨。 [yoshida-autumn](#yoshida-autumn) |
| 旭日丘湖畔綠地公園<br>旭日丘湖畔緑地公園 | 楓 | 整體：10月下旬〜11月上旬 | 別名夕焼けの渚；2026祭典日期另有變動，總體紅葉參考期不直接當樹種峰期。 [asahigaoka](#asahigaoka)、[asahigaoka-event](#asahigaoka-event)、[yamanashi-overview](#yamanashi-overview) |
| 田貫湖<br>田貫湖 | 楓 | 整體：11月10日〜20日頃 | 市府把カエデ與其他樹木合列；湖岸範圍不等於單一入口。 [fujinomiya-season](#fujinomiya-season) |
| 白絲瀑布（富士宮）<br>白糸の滝 | 楓 | 整體：11月10日〜20日頃 | 別名白糸ノ滝；與輕井澤同名瀑布必須使用不同ID。 [fujinomiya-season](#fujinomiya-season) |
| 西山本門寺<br>西山本門寺 | 銀杏 | 獨立見頃未確認 | 銀杏存在已確認；歷史照片與11月祭典不能推出銀杏例年峰期。 [nishiyama-place](#nishiyama-place)、[shizuoka-autumn](#shizuoka-autumn) |
| 村山淺間神社<br>村山浅間神社 | 銀杏 | 獨立見頃未確認 | 採文化財樹木所在地1151；不將所有者聯絡址1238當觀賞樹木入口。 [murayama-tree](#murayama-tree)、[shizuoka-autumn](#shizuoka-autumn) |
| 富士岡銀杏地藏尊<br>富士岡銀杏地蔵尊 | 銀杏 | 銀杏：12月上旬（分種） | 可採銀杏獨立例年範圍；地圖仍需實際觀賞點核對。 [fujioka-season](#fujioka-season)、[fujioka-address](#fujioka-address) |
| 二之岡神社<br>二の岡神社 | 銀杏 | 獨立見頃未確認 | 官方觀光文章確認銀杏；御殿場全市日期不套到此神社。 [gotemba-autumn](#gotemba-autumn) |
| 新橋淺間神社<br>新橋浅間神社 | 楓＋銀杏 | 獨立見頃未確認 | 兩種類存在有依據，但尚無各自見頃，不保證同時最佳。 [gotemba-autumn](#gotemba-autumn) |
| 秩父宮紀念公園<br>秩父宮記念公園 | 楓＋銀杏 | 獨立見頃未確認 | 楓樹及草坪廣場銀杏分別有證據；保留2024觀察作存在證據，不作2026見頃。 [gotemba-autumn](#gotemba-autumn)、[chichibu-observation](#chichibu-observation) |
| 北口本宮冨士淺間神社<br>北口本宮冨士浅間神社 | 銀杏 | 獨立見頃未確認 | 官方行程頁明列手水舍附近銀杏；不因整體紅葉頁而臆測楓樹或分種日期。 [yoshida-course](#yoshida-course)、[yoshida-autumn](#yoshida-autumn) |

## 輕井澤優先候選

| 繁中名稱／日文名稱 | 類型證據 | 紅葉參考期／已分種見頃 | 處理重點 |
|---|---|---|---|
| 雲場池<br>雲場池 | 楓 | 整體：10月中旬〜11月上旬 | 混合紅葉含モミジ與杜鵑；不把黃葉或通用黃色分類視為銀杏。舊資料停車場40台與新公告不一致，採新公告重查。 [kumoba-place](#kumoba-place)、[kumoba-j47](#kumoba-j47)、[kumoba-nagano](#kumoba-nagano) |
| 舊碓冰峠展望台<br>旧碓氷峠見晴台 | 楓 | 整體：10月中旬〜11月上旬（地方供稿） | 次級較短範圍保留；縣界景點；不同平台分在長野或群馬，地圖／行政歸屬仍需確認。不要拆成兩個目的地。 [usui-j47](#usui-j47)、[usui-weather](#usui-weather)、[usui-walker](#usui-walker) |
| 白絲瀑布（輕井澤）<br>白糸の滝 | 紅葉已知；種類待核 | 整體：10月中旬 | 官方僅確認紅葉；樹種仍未分離，不能因網站「黃（銀杏等）」標籤就放銀杏圖示。 [karuizawa-shiraito](#karuizawa-shiraito)、[shiraito-walker](#shiraito-walker) |
| 輕井澤塔列辛・鹽澤湖<br>軽井沢タリアセン | 楓（次級）＋銀杏待核 | 整體：10月中旬〜11月中旬 | 塩沢湖與塔列辛同一目的地；攝影商家的銀杏說法待園方確認，不先採成兩種類標記。 [taliesin-place](#taliesin-place)、[taliesin-walker](#taliesin-walker)、[taliesin-photo](#taliesin-photo) |
| 輕井澤湖畔花園<br>軽井沢レイクガーデン | 楓 | 獨立見頃未確認 | 園方明列大楓、雞爪楓等；只說10月中旬後可看紅葉，未給完整峰期。另核對當年季節營業截止日。 [lakegarden-autumn](#lakegarden-autumn)、[lakegarden-access](#lakegarden-access) |
| 輕井澤王子大道<br>軽井沢プリンス通り | 楓（次級）＋銀杏（次級） | 整體：10月中旬〜11月中旬 | 兩種類列於樹種欄，非黃色標籤推論；仍待道路管理者或現場樹木資料。不是王子購物廣場同一範圍。 [prince-road](#prince-road) |

### 輕井澤銀杏的研究結論

本輪尚未找到可採為獨立銀杏峰期的輕井澤官方資料，不代表當地沒有銀杏。王子大道有明確次級樹種清單；塔列辛只有攝影業者銀杏說法待核；湯川公園／TSURUYA屬合列觀察；本通東雲路口只有2013年的具體觀察。這些不能全部升格成官方確認的銀杏景點。

## 暫緩與可選延伸

| 地點 | 狀態 | 原因 |
|---|---|---|
| 湯川故鄉公園／湯川ふるさと公園 | 暫緩 | 報導將商店街道與公園合列，需分別確認樹木位置後才可標兩種類。 [yukawa-news](#yukawa-news) |
| 輕井澤本通・東雲路口／軽井沢本通り 東雲交差点 | 暫緩 | 只有2013年銀杏觀察，需重查現存樹與人行停留位置，不用舊照片推見頃。 [hondori-history](#hondori-history) |
| 三笠大道／三笠通り | 暫緩 | 一般紅葉道路候選，未取得可採的楓樹或銀杏個別證據；不可把落葉松黃色當銀杏。 [mikasa-road](#mikasa-road) |
| 榆樹街小鎮／ハルニレテラス | 暫緩 | 園方明列春榆林；不要套用星野住宿區楓樹日期，亦不把榆樹黃葉當銀杏。 [hoshino-area](#hoshino-area) |
| 紅葉臺／紅葉台 | 暫緩 | 區域紅葉觀景台，樹種及登山道路／展望設施入口待核，來源時段有差異。 [koyodai-national](#koyodai-national)、[yamanashi-overview](#yamanashi-overview) |
| 小諸城址懷古園／小諸城址懐古園 | 可選延伸 | 可選延伸行程，實際在小諸市，不應標成輕井澤町；兩樹種各自見頃未明。 [komoro-official](#komoro-official)、[komoro-season](#komoro-season) |

## 下一階段建議

先核對候選的觀賞區座標、入口與開放條件，再決定正式加入的景點。第一批可優先從紅葉隧道、博物館公園、旭日丘、富士宮白絲瀑布、田貫湖、村山、西山、富士岡，以及雲場池／展望台／湖畔花園著手；一般紅葉期仍只作參考。銀杏證據薄弱的輕井澤候選先補官方或管理者資料。

### 現有程式的整合限制（本輪不修改）

1. `dist/foliage.js` 目前的 `initFoliageData()` 只匯入 `ginkgo.present === true`，不能直接拿既有銀杏流程加入這批楓樹為主的景點；也不能把未知銀杏強改為 true。
2. 現有區域推定只認富山／金澤／東京；`matchesArea("hokuriku")` 以「非 tokyo-*」判北陸。新增 fuji-*／karuizawa-* 前需改成明確區域歸屬，否則會漏入北陸。
3. `filters-ui.js` 的地區群組與快捷範圍需設計富士山周邊／輕井澤；小諸延伸須另明示，不能灌進輕井澤町。
4. `firestore.rules` 的 `knownSpot()` 目前限制既有96個 ID，新增景點的週末和筆記都會受限。未來實作才依 AGENTS／Firebase 技能補 allowlist；不得放寬為所有登入者可讀寫。
5. 測試有96景點基準、季節來源、座標與連結檢查。實作時改驗「舊96筆完整保留＋核准新增」，保留原 ID、分享、週末、這次不去、本機資料與共編筆記。
6. 不新增種類篩選；同一目的地仍只有一個週末值及一份筆記；楓／杏／✉圖示採各自已確認時段。未知日期不假裝已符合篩選。

## 交付與驗證

- 機器可讀主表：`research/fuji-karuizawa-inventory.source.json`。
- 第二輪逐點審核：`FUJI-KARUIZAWA-AUDIT.md`、`research/fuji-karuizawa-coordinate-audit.source.json`。
- 接續提示：`research/FUJI-KARUIZAWA-HANDOFF.md`。
- 結構檢查：ID唯一、來源鍵完整、日期格式／上下界、關聯ID、與既有景點ID及名稱比對；兩個異地白絲瀑布為預期同名。
- 本輪不新增地圖點、不提交推送、不部署；既有網站與 Firebase 不變。

## 來源目錄

<a id="fuji-corridor"></a>
### fuji-corridor
[河口湖もみじ回廊](https://fujisan.ne.jp/sightseeing/4218/) — 富士河口湖町觀光連盟；official_tourism；核對 2026-11-02。
地點專頁的例年範圍與縣級總覽不一致，保留衝突。

<a id="yamanashi-overview"></a>
### yamanashi-overview
[紅葉スポット特集](https://www.yamanashi-kankou.jp/special/koyo-spot.html) — 山梨縣觀光推進機構；official_tourism；核對 2026-11-02。
總覽含混合紅葉；不把區域日期複製到各樹種。

<a id="fuji-tunnel"></a>
### fuji-tunnel
[もみじトンネル](https://www.yamanashi-kankou.jp/kankou/spot/p1_4342.html) — 山梨縣觀光推進機構；official_tourism；核對 2026-11-02。
明列モミジ（カエデ）見頃與大石地址。

<a id="itchiku-garden"></a>
### itchiku-garden
[庭](https://www.itchiku-museum.com/museum/approach.html) — 久保田一竹美術館；operator；核對 2026-11-02。
僅確認庭園秋季紅葉，不能由展覽作品名稱推定園內樹種。

<a id="itchiku-access"></a>
### itchiku-access
[交通案内](https://www.itchiku-museum.com/museum/access.html) — 久保田一竹美術館；operator；核對 2026-11-02。
地址為河口2255；開館日及庭園參觀條件需重查。

<a id="yoshida-autumn"></a>
### yoshida-autumn
[2026年 富士吉田市内の紅葉情報](https://www.fujiyoshida.net/feature/index.php?p=kouyou) — ふじよしだ觀光振興服務；official_tourism；核對 2026-11-02。
明列鐘山滝イロハモミジ、恩賜林回廊；觀察日期不轉成例年見頃。

<a id="yoshida-park"></a>
### yoshida-park
[ふじさんミュージアムパーク](https://www.fujiyoshida.net/feature/index.php?p=mt_fujimuseum_park) — ふじよしだ觀光振興服務；official_tourism；核對 2026-11-02。
明列イロハモミジ與每年10月下旬至11月上旬的紅葉描述。

<a id="yoshida-course"></a>
### yoshida-course
[富士吉田の紅葉を楽しむ日帰り旅](https://www.fujiyoshida.net/course/index.php?p=course-322) — ふじよしだ觀光振興服務；official_tourism；核對 2026-11-02。
含北口本宮神社銀杏與各景點地址；頁內活動日期有舊資料，不採作2026行事。

<a id="arakura-place"></a>
### arakura-place
[新倉山浅間公園・忠霊塔](https://www.fujiyoshida.net/spot/index.php?p=12) — ふじよしだ觀光振興服務；official_tourism；核對 2026-11-02。
採最新專頁地址浅間2-4-1，非舊名錄新倉3353-1。

<a id="arakura-access"></a>
### arakura-access
[新倉山浅間公園](https://www.city.fujiyoshida.yamanashi.jp/page/13101.html) — 富士吉田市；government；核對 2026-11-02。
有2026停車與通行資訊；正式整合前重查。

<a id="fuji-railway"></a>
### fuji-railway
[富士急行線沿線の紅葉情報](https://www.fujikyu-railway.jp/event/info.php?no=1239) — 富士山麓電氣鐵道；secondary_operator_travel；核對 2026-11-02。
搜尋索引明列忠靈塔旁及園內散步路モミジ；完整頁面文字擷取不全。

<a id="asahigaoka"></a>
### asahigaoka
[旭日丘湖畔緑地公園](https://lake-yamanakako.com/spot/10352) — 山中湖觀光協會；official_tourism；核對 2026-11-02。
樹種明列モミジ、ケヤキ等；活動期間不等於每種樹的見頃。

<a id="asahigaoka-event"></a>
### asahigaoka-event
[山中湖夕焼けの渚 紅葉まつり](https://www.yamanashi-kankou.jp/yamanakako/event/koyo-fes.html) — 山梨縣觀光推進機構；official_tourism；核對 2026-11-02。
用於核對地址平野506-296；不把活動起訖日當樹種見頃。

<a id="fujinomiya-season"></a>
### fujinomiya-season
[紅葉情報](https://www.city.fujinomiya.lg.jp/1025200000/p001822.html) — 富士宮市；government；核對 2026-11-02。
白糸滝（ウルシ、カエデ）及田貫湖（カエデ他）為11月10至20日頃，屬混合紅葉範圍。

<a id="nishiyama-place"></a>
### nishiyama-place
[西山本門寺](https://fujinomiya.gr.jp/guide/1130/) — 富士宮市觀光協會；official_tourism；核對 2026-11-02。
核對地址西山671。

<a id="shizuoka-autumn"></a>
### shizuoka-autumn
[秋の富士山と紅葉フォトスポット10選](https://hellonavi.jp/article/fujisan_kouyou) — 靜岡縣觀光協會 Hello Navi；official_tourism；核對 2026-11-02。
西山與村山銀杏有具體歷史拍攝日期，不能當2026即時狀態或例年峰期。

<a id="murayama-tree"></a>
### murayama-tree
[村山浅間神社のイチョウ](https://www.pref.shizuoka.jp/kankosports/bunkageijutsu/bunkazai/1002825/1041003/1041889/1004987/1021581.html) — 靜岡縣；government；核對 2026-11-02。
樹木所在地村山1151，與所有者聯絡址1238不同；載明可公開。

<a id="fujioka-season"></a>
### fujioka-season
[富士岡銀杏地蔵尊（紅葉）](https://www.city.fuji.shizuoka.jp/1005330000/miryoku/p007533.html) — 富士市；government；核對 2026-11-02。
明列銀杏見頃12月上旬。

<a id="fujioka-address"></a>
### fujioka-address
[景観重要樹木 富士岡地蔵尊](https://www.city.fuji.shizuoka.jp/documents/4010/fmervo0000001txa.pdf) — 富士市；government；核對 2026-11-02。
資料表核對富士岡81。

<a id="gotemba-autumn"></a>
### gotemba-autumn
[御殿場紅葉スポット](https://gotembatourism.jp/gotembakouyouspot/) — 御殿場觀光資訊 INDEX GOTEMBA；official_tourism；核對 2026-11-02。
二之岡銀杏、新橋銀杏與モミジ、秩父宮モミジ；文中舊活動日不可當2026日期。

<a id="chichibu-observation"></a>
### chichibu-observation
[園内の花たち 2024/11/27](https://www.chichibunomiya.jp/p-info/61554.html) — 秩父宮紀念公園；operator；核對 2026-11-02。
明列草坪廣場銀杏；モミジバフウ為楓香，不能單憑它確認Acer楓樹。

<a id="kumoba-place"></a>
### kumoba-place
[雲場池](https://karuizawa-kankokyokai.jp/spot/23234) — 輕井澤觀光協會；official_tourism；核對 2026-11-02。
地點地址與駐車資訊；不是樹種專屬日曆。

<a id="kumoba-j47"></a>
### kumoba-j47
[軽井沢（雲場池）の紅葉](https://www.japan47go.travel/ja/detail/20347b0f-1f3a-4a0c-bc89-cd88e2bc8a7d) — 輕井澤町觀光經濟課／JAPAN 47 GO；official_supplied_tourism；核對 2026-11-02。
明列モミジ與ドウダンツツジ、總體最盛期10月中旬至11月上旬。

<a id="kumoba-nagano"></a>
### kumoba-nagano
[2026 長野紅葉名所](https://www.go-nagano.net/nature-and-outdoors/id16956) — 長野縣觀光機構；official_tourism；核對 2026-11-02。
雲場池有モミジ、落葉松等；最新資料說明無專用停車場。

<a id="usui-j47"></a>
### usui-j47
[旧碓氷峠見晴台の紅葉](https://www.japan47go.travel/ja/detail/a36309d1-10d0-41e9-bc64-65cda90e0b93) — 輕井澤町觀光經濟課／JAPAN 47 GO；official_supplied_tourism；核對 2026-11-02。
10月中旬至11月上旬；縣界行政歸屬整合前核對。

<a id="usui-weather"></a>
### usui-weather
[旧碓氷峠見晴台](https://weathernews.jp/koyo/spot/24831/?fm=pref) — Weathernews（資料提供：輕井澤町觀光經濟課）；official_supplied_weather；核對 2026-11-02。
明列モミジ；同頁使用者照片與預報不作例年資料。

<a id="usui-walker"></a>
### usui-walker
[旧碓氷峠見晴台 紅葉データ](https://koyo.walkerplus.com/detail/ar0310e13047/data.html) — KADOKAWA Walkerplus；secondary_travel；核對 2026-11-02。
資料寫10月中旬；保留與地方供稿範圍的差異。

<a id="karuizawa-shiraito"></a>
### karuizawa-shiraito
[白糸の滝](https://www.town.karuizawa.lg.jp/page/1193.html) — 輕井澤町；government；核對 2026-11-02。
確認紅葉景點和小瀬位置，未明列楓樹或銀杏。

<a id="shiraito-walker"></a>
### shiraito-walker
[軽井沢 白糸の滝 紅葉データ](https://koyo.walkerplus.com/detail/ar0420e13048/data.html) — KADOKAWA Walkerplus；secondary_travel；核對 2026-11-02。
主樹種寫雜木林；通用「黃（銀杏等）」標籤不算銀杏證據。

<a id="taliesin-place"></a>
### taliesin-place
[軽井沢タリアセン](https://karuizawa-kankokyokai.jp/spot/1203/) — 輕井澤觀光協會；official_tourism；核對 2026-11-02。
確認塩沢湖與設施是一個目的地，地址長倉塩沢217。

<a id="taliesin-walker"></a>
### taliesin-walker
[軽井沢タリアセン 紅葉データ](https://koyo.walkerplus.com/detail/ar0420e478562/data.html) — KADOKAWA Walkerplus；secondary_travel；核對 2026-11-02。
明列モミジ與落葉松等，未明列銀杏；總體10月中旬至11月中旬。

<a id="taliesin-photo"></a>
### taliesin-photo
[紅葉シーズン予約受付中](https://photo.decollte.co.jp/stores/15/blogs/7080) — STUDIO AQUA 輕井澤店；secondary_local_business；核對 2026-11-02。
攝影商家稱塔列辛有銀杏，但不是園方樹木調查；待植物與地點交叉核對。

<a id="lakegarden-autumn"></a>
### lakegarden-autumn
[フラワーカレンダー 秋](https://www.karuizawa-lakegarden.jp/calendar-autumn/) — 輕井澤 Lake Garden；operator；核對 2026-11-02。
有Acer樹種；10月中旬後可賞紅葉，沒有完整樹種峰期上下界。

<a id="lakegarden-access"></a>
### lakegarden-access
[アクセス](https://www.karuizawa-lakegarden.jp/access/) — 輕井澤 Lake Garden；operator；核對 2026-11-02。
地址只列Lake New Town，不能把整個住宅區中心當入口。

<a id="prince-road"></a>
### prince-road
[軽井沢プリンス通り 紅葉データ](https://koyo.walkerplus.com/detail/ar0420e483739/data.html) — KADOKAWA Walkerplus；secondary_travel；核對 2026-11-02。
樹種欄明列カエデ與イチョウ；總體見頃不得各自套用。

<a id="yukawa-news"></a>
### yukawa-news
[軽井沢各所で紅葉が進む](https://karuizawa.keizai.biz/headline/204/) — 輕井澤經濟新聞；secondary_local_news；核對 2026-11-02。
將TSURUYA周邊與湯川公園合寫，尚待逐點分離銀杏位置。

<a id="hondori-history"></a>
### hondori-history
[マリンの紅葉情報 2013/10/25](https://www.karuizawa.co.jp/topics/2013/10/post_287/) — 輕井澤新聞社；secondary_local_news；核對 2026-11-02。
東雲交叉口銀杏的舊觀察，不能保證2026仍同株／可停留。

<a id="mikasa-road"></a>
### mikasa-road
[三笠通りの紅葉](https://koyo.walkerplus.com/detail/ar0420e482582/) — KADOKAWA Walkerplus；secondary_travel；核對 2026-11-02。
本輪只取得道路紅葉介紹；銀杏通用標籤不可採為樹種證據。

<a id="hoshino-area"></a>
### hoshino-area
[軽井沢星野エリア](https://www.hoshino-area.jp/) — 星野 Resorts；operator；核對 2026-11-02。
ハルニレテラス明列ハルニレ林，不等於銀杏林；不將住宿區日期套到公共商店區。

<a id="koyodai-national"></a>
### koyodai-national
[紅葉台](https://www.ktr.mlit.go.jp/chiiki/fujimi0119.html) — 國土交通省關東地方整備局；government；核對 2026-11-02。
10月中旬至11月上旬與其他觀光總覽時段不一致；描述為區域紅葉而非樹種專屬。

<a id="komoro-official"></a>
### komoro-official
[小諸城址懐古園 紅葉まつり2026](https://www.city.komoro.lg.jp/citypromotion/places/7473.html) — 小諸市；government；核對 2026-11-02。
明列モミジ、イチョウ；2026活動起訖不作兩樹種各自見頃。

<a id="komoro-season"></a>
### komoro-season
[小諸懐古園の紅葉](https://db.go-nagano.net/themelist/detail/id%3D16947) — 長野縣觀光機構；official_tourism；核對 2026-11-02。
總體例年11月上旬至中旬，不能分派成銀杏專屬日期。


## 第二輪補核更新

第二輪審核23筆優先候選，建議第一批12筆，但只有6筆已取得可追溯來源代表座標；不等於完成入口／視覺核圖。主表現有51個來源。旭日丘頁尾辦公室地址已撤回；紅葉迴廊與舊碓冰峠補上來源採用決策；湖畔花園補入2026營業資訊。詳細採用／未決清單以第二輪審核文件為準。
