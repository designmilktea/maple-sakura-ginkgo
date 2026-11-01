# 東京與近郊賞楓景點研究

查證日期：2026-11-01。已加入現有專案，共新增 24 個景點，總數為 60。每個景點均具備日文名稱、中文名稱、地址、區域座標、Google Maps、X 最新圖片搜尋與來源。

## 範圍與資料判讀

東京市區、多摩山區、東京出發一日遊分開篩選。近郊一日遊包含神奈川、埼玉與栃木，並非全部位於東京都。日光需要預留完整一天；沒有將其標成市區附近短程景點。

以 [GO TOKYO 東京官方賞楓指南](https://www.gotokyo.org/en/story/guide/autumn-leaves-forecast/index.html)、東京都公園協會及各景點管理單位為主要來源。表列季節為歷年規劃參考範圍；來源不同可能有差異，並非 2026 即時見頃或每日更新預報。官方頁面僅列月份者，園內實際紅葉仍須看照片或現場公告。

## 已加入的景點

| 區域 | 景點 | 主要觀賞內容 |
| --- | --- | --- |
| 東京市區 | 六義園 | 楓樹與日本庭園 |
| 東京市區 | 小石川後楽園 | 楓樹與池泉庭園 |
| 東京市區 | 旧古河庭園 | 楓樹、銀杏與洋館 |
| 東京市區 | 浜離宮恩賜庭園 | 楓樹、唐楓 |
| 東京市區 | 新宿御苑 | 楓樹與銀杏 |
| 東京市區 | 代々木公園 | 銀杏、櫸木及楓樹 |
| 東京市區 | 明治神宮外苑 いちょう並木 | 銀杏為主，已明確標示非紅楓 |
| 東京市區 | 日比谷公園 | 銀杏與楓樹 |
| 東京市區 | 清澄庭園 | 野漆樹等混合紅葉 |
| 東京市區 | 旧芝離宮恩賜庭園 | 楓樹等庭園紅葉 |
| 多摩 | 井の頭恩賜公園 | 楓樹、櫻樹與池畔 |
| 多摩 | 国営昭和記念公園 | 日本庭園楓樹與銀杏大道 |
| 多摩 | 殿ヶ谷戸庭園 | 楓樹與紅葉亭 |
| 多摩 | 神代植物公園 | 楓樹 |
| 山區 | 高尾山 | 楓樹與山林紅葉 |
| 山區 | 御岳山 | 楓樹與山林紅葉 |
| 山區 | 秋川渓谷 石舟橋 | 溪谷楓樹 |
| 山區 | 奥多摩湖 | 山林紅葉與湖面倒影 |
| 箱根 | 箱根美術館 | 日本庭園楓樹 |
| 箱根 | 芦ノ湖 恩賜箱根公園 | 湖畔與楓樹 |
| 鎌倉 | 円覚寺 | 寺院楓樹 |
| 鎌倉 | 明月院 | 楓樹、季節性後庭園 |
| 日光 | 日光山輪王寺 逍遥園 | 池泉庭園楓樹 |
| 長瀞 | 月の石もみじ公園 | 楓樹 |

## 來源連結

- [東京都公園協會](https://www.tokyo-park.or.jp/)：六義園、小石川後樂園、舊古河庭園、濱離宮、代代木、日比谷、清澄、舊芝離宮、井之頭、殿谷戶、神代。各景點的直接網址均已放進景點卡及 `dist/tokyo-spots.js`。
- [新宿御苑管理單位](https://policies.env.go.jp/national-garden/shinjukugyoen/guide/information/)
- [明治神宮外苑管理單位](https://www.meijijingugaien.jp/walk/sight/)
- [昭和紀念公園花與植物資訊](https://www.showakinen-koen.jp/flower-information/)
- [高尾山遊客中心紅葉資訊](https://takaovc.ces-net.jp/wordpress/?page_id=729)
- [御岳山官方活動頁](https://www.gotokyo.org/jp/spot/ev073/index.html)
- [秋川溪谷](https://www.gotokyo.org/jp/spot/54/index.html)
- [奧多摩湖](https://www.gotokyo.org/jp/spot/53/index.html)
- [箱根美術館](https://www.hakone.or.jp/559)、[箱根季節參考](https://www.hakone.or.jp/4413)
- [恩賜箱根公園管理單位](https://kanagawa-park.or.jp/onsisite/)
- [圓覺寺官方觀光資料](https://education.trip-kamakura.com/enkakuji/)、[明月院](https://www.trip-kamakura.com/facility/detail.php?id=70)
- [鎌倉市觀光協會紅葉紀錄](https://www.trip-kamakura.com/association-news/detail.php?id=30)：包含歷年照片，未當作今年現況。
- [輪王寺逍遙園](https://www.rinnoji.or.jp/history/temple/syouyouen.html)、[日光觀光協會](https://www.nikko-kankou.org/spot/1031)
- [長瀞觀光協會花曆](https://www.nagatoro.gr.jp/spot/spot_flower/)

## 實作與驗證

原本北陸 36 個景點與既有保存鍵保留。新增「東京・近郊」快速切換，以及市區、多摩山區、一日遊三種子篩選。切換地區不會清除使用者的週末安排。

全部 X 連結使用日文地點名稱、`filter:images`、`f=live`，不加入「紅葉」；複合目的地使用較常見的日文地名（例如「石舟橋」「逍遥園」）避免完整長名稱造成搜尋結果過少。

地圖標記為賞楓區域示意，非逐一核對的停車場或入口。山頂、湖區與溪谷另附規劃提醒。

已通過資料、X URL、分區、日期、保存與組合篩選檢查。實際瀏覽器確認東京顯示 24 張卡片及 24 個標記；六義園週末安排在重新整理後仍保存。測試安排已還原。

本次只更新本機專案。先前的遠端原始碼上傳授權仍未取得，沒有嘗試重新上傳或發布。
