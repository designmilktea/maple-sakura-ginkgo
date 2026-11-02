const spots = [
  {id:'kenrokuen',ja:'兼六園',zh:'兼六園',area:'kanazawa',region:'金澤市區',address:'石川県金沢市兼六町1',lat:36.5621,lng:136.6627,peak:'11月中旬〜下旬'},
  {id:'kanazawa-castle',ja:'金沢城公園・玉泉院丸庭園',zh:'金澤城公園・玉泉院丸庭園',area:'kanazawa',region:'金澤市區',address:'石川県金沢市丸の内1-1',lat:36.5655,lng:136.6597,peak:'11月上旬〜中旬'},
  {id:'american-maple',ja:'アメリカ楓通り',zh:'美國楓大道',area:'kanazawa',region:'金澤市區',address:'石川県金沢市広坂2丁目',lat:36.5627,lng:136.6562,peak:'10月下旬〜11月上旬'},
  {id:'shiko-park',ja:'いしかわ四高記念公園',zh:'石川四高紀念公園',area:'kanazawa',region:'金澤市區',address:'石川県金沢市広坂2-2',lat:36.5631,lng:136.6552,peak:'11月上旬'},
  {id:'honda-forest',ja:'本多の森公園',zh:'本多之森公園',area:'kanazawa',region:'金澤市區',address:'石川県金沢市出羽町',lat:36.5586,lng:136.6608,peak:'11月中旬〜下旬'},
  {id:'gyokusenen',ja:'西田家庭園 玉泉園',zh:'西田家庭園 玉泉園',area:'kanazawa',region:'金澤市區',address:'石川県金沢市小将町8-3',lat:36.5650,lng:136.6668,peak:'11月中旬〜下旬'},
  {id:'terashima',ja:'武家屋敷 寺島蔵人邸',zh:'武家屋敷 寺島藏人邸',area:'kanazawa',region:'金澤市區',address:'石川県金沢市大手町10-3',lat:36.5704,lng:136.6630,peak:'11月中旬'},
  {id:'utatsuyama',ja:'卯辰山公園',zh:'卯辰山公園',area:'kanazawa',region:'金澤市區',address:'石川県金沢市末広町',lat:36.5762,lng:136.6816,peak:'11月中旬〜下旬'},
  {id:'metasequoia',ja:'太陽が丘のメタセコイア並木',zh:'太陽之丘水杉林蔭道',area:'ishikawa',region:'石川近郊',address:'石川県金沢市太陽が丘',lat:36.5101,lng:136.6970,peak:'11月中旬〜下旬'},
  {id:'natadera',ja:'那谷寺',zh:'那谷寺',area:'ishikawa',region:'石川近郊',address:'石川県小松市那谷町ユ122',lat:36.3127,lng:136.4207,peak:'11月上旬〜下旬'},
  {id:'murodo',ja:'立山室堂',zh:'立山室堂',area:'toyama',region:'富山・立山',address:'富山県中新川郡立山町芦峅寺室堂',lat:36.5782,lng:137.5950,peak:'9月中旬〜下旬'},
  {id:'midagahara',ja:'弥陀ヶ原',zh:'彌陀原',area:'toyama',region:'富山・立山',address:'富山県中新川郡立山町芦峅寺弥陀ヶ原',lat:36.5656,lng:137.5420,peak:'9月下旬〜10月上旬'},
  {id:'daikanbo',ja:'大観峰',zh:'大觀峰',area:'toyama',region:'富山・立山',address:'富山県中新川郡立山町芦峅寺',lat:36.5676,lng:137.6570,peak:'9月下旬〜10月中旬'},
  {id:'shomyo',ja:'称名滝',zh:'稱名瀑布',area:'toyama',region:'富山・立山',address:'富山県中新川郡立山町芦峅寺',lat:36.5755,lng:137.5234,peak:'10月中旬〜下旬'},
  {id:'bijodaira',ja:'美女平',zh:'美女平',area:'toyama',region:'富山・立山',address:'富山県中新川郡立山町芦峅寺',lat:36.5835,lng:137.4451,peak:'10月下旬〜11月上旬'},
  {id:'kurobe-dam',ja:'黒部ダム',zh:'黑部水壩',area:'toyama',region:'富山・立山',address:'富山県中新川郡立山町芦峅寺',lat:36.5664,lng:137.6617,peak:'10月上旬〜中旬'},
  {id:'kurobe-gorge',ja:'黒部峡谷鉄道 宇奈月駅',zh:'黑部峽谷鐵道 宇奈月站',area:'toyama',region:'富山・立山',address:'富山県黒部市黒部峡谷口11',lat:36.8158,lng:137.5848,peak:'10月中旬〜11月中旬'},
  {id:'takaoka',ja:'高岡古城公園',zh:'高岡古城公園',area:'toyama',region:'富山・立山',address:'富山県高岡市古城1-1',lat:36.7490,lng:137.0194,peak:'11月上旬〜下旬'},
  {id:'shogawa',ja:'庄川峡',zh:'庄川峽',area:'gokayama',region:'五箇山・庄川',address:'富山県砺波市庄川町小牧',lat:36.5645,lng:136.9896,peak:'10月中旬〜11月中旬'},
  {id:'suganuma',ja:'菅沼合掌造り集落',zh:'菅沼合掌造聚落',area:'gokayama',region:'五箇山・庄川',address:'富山県南砺市菅沼',lat:36.3419,lng:136.8987,peak:'10月下旬〜11月中旬'},
  {id:'ainokura',ja:'相倉合掌造り集落',zh:'相倉合掌造聚落',area:'gokayama',region:'五箇山・庄川',address:'富山県南砺市相倉',lat:36.4256,lng:136.9355,peak:'10月下旬〜11月中旬'},
  {id:'katsurako',ja:'桂湖',zh:'桂湖',area:'gokayama',region:'五箇山・庄川',address:'富山県南砺市桂',lat:36.3332,lng:136.8474,peak:'10月下旬〜11月上旬'},
  {id:'arimine',ja:'有峰森林文化村公園',zh:'有峰森林文化村公園',area:'toyama',region:'富山・立山',address:'富山県富山市有峰26-15',lat:36.486,lng:137.419,peak:'10月中旬〜11月上旬',source:'https://tenki.jp/kouyou/4/19/30315.html'},
  {id:'miyajima',ja:'稲葉山・宮島峡県定公園',zh:'稻葉山・宮島峽縣定公園',area:'toyama',region:'富山・立山',address:'富山県小矢部市名ヶ滝',lat:36.728,lng:136.873,peak:'11月中旬〜12月上旬',source:'https://tenki.jp/kouyou/4/19/30320.html'},
  {id:'jinzu',ja:'神通峡',zh:'神通峽',area:'toyama',region:'富山・立山',address:'富山県富山市片掛',lat:36.485,lng:137.236,peak:'10月中旬〜11月中旬',source:'https://tenki.jp/kouyou/4/19/30692.html'},
  {id:'folk-village',ja:'富山市民俗民芸村',zh:'富山市民俗民藝村',area:'toyama',region:'富山・立山',address:'富山県富山市安養坊1118-1',lat:36.709,lng:137.188,peak:'10月下旬〜11月中旬',source:'https://tenki.jp/kouyou/4/19/30319.html'},
  {id:'meditation',ja:'瞑想の郷',zh:'瞑想之鄉',area:'gokayama',region:'五箇山・庄川',address:'富山県南砺市利賀村上畠101',lat:36.428,lng:137.048,peak:'10月中旬〜11月上旬',source:'https://tenki.jp/kouyou/4/19/30318.html'},
  {id:'ropeway',ja:'立山ロープウェイ',zh:'立山纜車',area:'toyama',region:'富山・立山',address:'富山県中新川郡立山町芦峅寺（大観峰〜黒部平）',lat:36.566,lng:137.63,peak:'10月上旬〜中旬',source:'https://tenki.jp/kouyou/4/19/'},
  {id:'kakusenkei',ja:'鶴仙渓',zh:'鶴仙溪',area:'ishikawa',region:'石川近郊',address:'石川県加賀市山中温泉河鹿町地内',lat:36.246,lng:136.376,peak:'11月中旬〜12月上旬',source:'https://tenki.jp/kouyou/4/20/30306.html'},
  {id:'hakusan-road',ja:'白山市白峰県道白山公園線沿線',zh:'白峰縣道白山公園線沿線',area:'ishikawa',region:'石川近郊',address:'石川県白山市白峰（市ノ瀬方面）',lat:36.154,lng:136.694,peak:'10月中旬〜11月上旬',source:'https://tenki.jp/kouyou/4/20/30301.html'},
  {id:'hodatsusan',ja:'宝達山',zh:'寶達山',area:'ishikawa',region:'石川近郊',address:'石川県羽咋郡宝達志水町紺屋町',lat:36.783,lng:136.813,peak:'10月下旬〜11月上旬',source:'https://tenki.jp/kouyou/4/20/30716.html'},
  {id:'shiramine',ja:'白峰集落',zh:'白峰聚落',area:'ishikawa',region:'石川近郊',address:'石川県白山市白峰',lat:36.176,lng:136.625,peak:'10月中旬〜11月中旬',source:'https://tenki.jp/kouyou/4/20/30300.html'},
  {id:'white-road',ja:'白山白川郷ホワイトロード ふくべの大滝',zh:'白山白川鄉白色公路・姥瀑布',area:'ishikawa',region:'石川近郊',address:'石川県白山市中宮（白山白川郷ホワイトロード内）',lat:36.261,lng:136.781,peak:'10月中旬〜11月上旬',source:'https://travelhub.slt-inc.jp/koyo/ishikawa/'},
  {id:'tedori',ja:'手取峡谷',zh:'手取峽谷',area:'ishikawa',region:'石川近郊',address:'石川県白山市下吉谷町',lat:36.361,lng:136.62,peak:'11月上旬〜中旬',source:'https://www.hot-ishikawa.jp/spot/detail_5855.html'},
  {id:'aramata',ja:'荒俣峡',zh:'荒俣峽',area:'ishikawa',region:'石川近郊',address:'石川県小松市赤瀬町',lat:36.265,lng:136.502,peak:'11月上旬〜下旬',source:'https://www.komatsuguide.jp/spot/detail_6.html'},
  {id:'oyama',ja:'尾山神社',zh:'尾山神社神苑',area:'kanazawa',region:'金澤市區',address:'石川県金沢市尾山町11-1',lat:36.5665,lng:136.6554,peak:'11月中旬',source:'https://www.kanazawa-kankoukyoukai.or.jp/everyone/spot/detail_50021.html'}
];

spots.push(...tokyoSpots);

const sourceDefaults = {
  kanazawa:'https://www.kanazawa-kankoukyoukai.or.jp/article/detail_152.html',
  ishikawa:'https://travelhub.slt-inc.jp/koyo/ishikawa/',
  toyama:'https://www.info-toyama.com/stories/koyou',
  gokayama:'https://www.info-toyama.com/stories/koyou'
};
spots.forEach(spot => { spot.source ||= sourceDefaults[spot.area]; spot.peakWindow=parsePeakWindow(spot.peak); });
spots.find(s=>s.id==='metasequoia').source='https://www.hot-ishikawa.jp/spot/detail_21472.html';
spots.find(s=>s.id==='kurobe-gorge').searchName='黒部峡谷';
// Map pins locate the destination area; external maps resolve the named entrance.
spots.find(s=>s.id==='daikanbo').lng=137.615;
initFoliageData(spots);

const STORAGE_KEY = 'hokuriku-maple-weekends-v1';
let storageAvailable = true;
let saved = {};
try {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  if(data && typeof data==='object' && !Array.isArray(data)) {
    saved = Object.fromEntries(Object.entries(data).filter(([id,date])=>spots.some(s=>s.id===id) && /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date))));
  }
} catch { storageAvailable = false; }
let activeWeekend = 'all';
const areaLabels = {
  all:'全部地區', hokuriku:'北陸全部', 'tokyo-all':'東京與近郊全部',
  kanazawa:'金澤市區', ishikawa:'石川近郊', toyama:'富山・立山', gokayama:'五箇山・庄川',
  'tokyo-city':'東京市區', 'tokyo-west':'多摩・山區', 'tokyo-daytrip':'東京出發一日遊',
  'ishikawa-all':'石川縣全部','toyama-all':'富山縣全部','tokyo-prefecture':'東京都全部',
  kanagawa:'神奈川縣全部',saitama:'埼玉縣全部',tochigi:'栃木縣全部',chiba:'千葉縣全部',ibaraki:'茨城縣全部',
  kamakura:'鎌倉',hakone:'箱根',nagatoro:'長瀞',nikko:'日光'
};
const initialArea = new URLSearchParams(window.location.search).get('area');
let activeArea = Object.hasOwn(areaLabels,initialArea) ? initialArea : 'all';
let markers = new Map();

function pad(n){ return String(n).padStart(2,'0'); }
function isoDate(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function displayDate(d){ return `${d.getMonth()+1}/${d.getDate()}`; }
function weekday(d){ return ['日','一','二','三','四','五','六'][d.getDay()]; }
function getUpcomingWeekends(today = new Date()){
  const now = new Date(today); now.setHours(0,0,0,0);
  const daysToSaturday = now.getDay()===0 ? -1 : (6 - now.getDay() + 7) % 7;
  const first = new Date(now); first.setDate(now.getDate() + daysToSaturday);
  return [0,7,14].map(offset => {
    const start = new Date(first); start.setDate(first.getDate()+offset);
    const end = new Date(start); end.setDate(start.getDate()+1);
    return {value:isoDate(start), label:`${start.getFullYear()}/${displayDate(start)}（${weekday(start)}）– ${displayDate(end)}（${weekday(end)}）`, short:`${displayDate(start)}–${displayDate(end)}`};
  });
}
let weekends = getUpcomingWeekends();
function oldWeekends(){ return [...new Set(Object.values(saved))].filter(date=>!weekends.some(w=>w.value===date)).sort(); }

function xUrl(name){ return `https://x.com/search?q=${encodeURIComponent(`\"${name}\" filter:images`)}&src=typed_query&f=live`; }
function mapsUrl(spot){ return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${spot.ja} ${spot.address}`)}`; }
function optionMarkup(value=''){
  const retained = value && !weekends.some(w=>w.value===value) ? `<option value="${value}" selected>已保存：${value} 起的週末</option>` : '';
  return `<option value="">尚未選擇</option>${weekends.map((w,i)=>`<option value="${w.value}" ${value===w.value?'selected':''}>${['本週末','下週末','再下週末'][i]}｜${w.label}</option>`).join('')}${retained}`;
}

const map = typeof L!=='undefined' ? L.map('map', {zoomControl:false, scrollWheelZoom:true}).setView([36.55, 137.05], 8) : null;
const canRequestMapTiles=['http:','https:'].includes(window.location.protocol);
function showMapServiceNotice(message){
  const notice=document.getElementById('mapServiceNotice');
  notice.textContent=message;
  notice.hidden=false;
}
if(!canRequestMapTiles){
  showMapServiceNotice('目前以本機檔案開啟，已停止載入底圖。請透過本機預覽網站或正式網站開啟；景點清單仍可使用。');
}
if(map){
  L.control.zoom({position:'topright'}).addTo(map);
  if(canRequestMapTiles){
    // Use the published endpoint and normal browser identification/cache behavior.
    // Never rotate hosts, spoof headers, or retry around a provider block.
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom:18,
      attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
    }).on('tileerror',()=>{
      showMapServiceNotice('底圖載入失敗，可能是連線或服務存取限制。請確認網站來源設定；仍可從景點清單查看地點與 Google Maps。');
    }).addTo(map);
  }
} else {
  document.getElementById('map').innerHTML='<p class="map-error">地圖暫時無法載入，請用「景點清單」查看地點與 Google Maps。</p>';
}

function markerIcon(spot){
  const kind=foliageKind(spot);
  return L.divIcon({className:'maple-marker', html:`<div class="marker-pin foliage-${kind}${saved[spot.id]?' is-saved':''}"><span>${foliageSymbol(kind)}</span></div>`, iconSize:[30,30], iconAnchor:[15,28]});
}
spots.forEach(spot => {
  if(!map||!hasMapLocation(spot)) return;
  const marker = L.marker([spot.lat, spot.lng], {icon:markerIcon(spot),title:spot.ja,alt:spot.ja,bubblingMouseEvents:false}).addTo(map);
  marker.on('click', event => { L.DomEvent.stopPropagation(event); focusSpot(spot.id); });
  marker.bindTooltip(spot.ja, {direction:'top', offset:[0,-22]});
  markers.set(spot.id, marker);
});

function fitVisible(){
  if(!map) return;
  const visible = filteredSpots().filter(hasMapLocation);
  if(!visible.length) return;
  const bounds = L.latLngBounds(visible.map(s=>[s.lat,s.lng]));
  const mobile=window.matchMedia('(max-width: 760px)').matches;
  const controls=document.querySelector('.explore-controls').getBoundingClientRect();
  const topPadding=mobile?controls.bottom+20:65;
  const bottomPadding=mobile&&selectedSpotId?sheetSizes()[sheetState]+20:60;
  if(mobile && map.getSize().y-topPadding-bottomPadding<60) return;
  map.fitBounds(bounds, {paddingTopLeft:mobile?[42,topPadding]:[controls.right+20,65],paddingBottomRight:[55,bottomPadding],maxZoom:12,animate:!prefersReducedMotion()});
}
function focusSpot(id){
  openSpot(id);
}
function filteredSpots(){
  return spots.filter(s => {
    if(!matchesArea(s,activeArea)) return false;
    if(!matchesPeak(s,activePeak)) return false;
    if(activeWeekend==='all') return true;
    if(activeWeekend==='unsaved') return !saved[s.id];
    return saved[s.id]===activeWeekend;
  });
}
function matchesArea(spot,area){
  if(area==='all') return true;
  if(area==='tokyo-all') return spot.area.startsWith('tokyo-');
  if(area==='hokuriku') return !spot.area.startsWith('tokyo-');
  if(area==='ishikawa-all') return ['kanazawa','ishikawa'].includes(spot.area);
  if(area==='toyama-all') return ['toyama','gokayama'].includes(spot.area);
  if(area==='tokyo-prefecture') return ['tokyo-city','tokyo-west'].includes(spot.area);
  if(area==='kanagawa') return spot.address.startsWith('神奈川県');
  if(area==='saitama'||area==='nagatoro') return spot.address.startsWith('埼玉県');
  if(area==='tochigi'||area==='nikko') return spot.address.startsWith('栃木県');
  if(area==='chiba') return spot.address.startsWith('千葉県');
  if(area==='ibaraki') return spot.address.startsWith('茨城県');
  if(area==='kamakura') return spot.address.startsWith('神奈川県鎌倉市');
  if(area==='hakone') return spot.address.startsWith('神奈川県足柄下郡箱根町');
  return spot.area===area;
}
function setArea(area){
  if(!Object.hasOwn(areaLabels,area)) return;
  activeArea=area;
  renderSpots(); fitVisible();
}
function setFilter(value){ activeWeekend=value; renderFilters(); renderSpots(); fitVisible(); }

function renderFilters(){
  const items = [
    ...weekends.map(w=>({value:w.value,label:w.short})),
    ...oldWeekends().map(date=>({value:date,label:`已保存 ${date}`})),
    {value:'unsaved',label:'尚未選擇'}
  ];
  document.getElementById('weekendFilters').innerHTML = items.map(i=>`<button class="filter-pill ${activeWeekend===i.value?'active':''}" aria-pressed="${activeWeekend===i.value}" data-filter="${i.value}" type="button">${i.label}</button>`).join('');
  document.querySelectorAll('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>setFilter(activeWeekend===btn.dataset.filter?'all':btn.dataset.filter)));
}

function renderSpots(){
  const visible = filteredSpots();
  document.getElementById('visibleCount').textContent = visible.length;
  const selectedWeekend = weekends.find(w=>w.value===activeWeekend);
  document.getElementById('listTitle').textContent = selectedWeekend ? selectedWeekend.short : activeWeekend==='unsaved' ? '尚未安排' : activeWeekend==='all' ? areaLabels[activeArea] : `已保存 ${activeWeekend}`;
  document.getElementById('spotList').innerHTML = visible.map(spot=>`
    <article class="spot-card ${spot.area}" data-spot-id="${spot.id}">
      <button class="spot-summary" type="button" data-open-spot="${spot.id}" aria-label="查看 ${spot.ja} 詳情"><span class="spot-summary-text"><span class="area-tag">${spot.region}</span><h3 lang="ja">${spot.ja}</h3></span><span class="list-arrow" aria-hidden="true">›</span></button>
      <div class="spot-card-meta">${!hasMapLocation(spot)?'<p class="location-pending">觀賞位置待核對 · 可開啟 Google Maps</p>':''}${saved[spot.id] ? `<p class="saved-badge">我的週末 · ${saved[spot.id]}</p>` : ''}</div>
      <div class="spot-card-footer"><div class="list-weekend-field"><label for="list-weekend-${spot.id}">我的賞楓週末</label><select id="list-weekend-${spot.id}" class="weekend-select list-weekend-select" data-id="${spot.id}" data-weekend-origin="list" aria-label="${spot.ja} 的賞楓週末">${optionMarkup(saved[spot.id]||'')}</select></div><div class="spot-quick-actions" role="group" aria-label="${spot.ja} 的外部連結"><a class="spot-quick-link x" href="${xUrl(spot.searchName||spot.ja)}" target="_blank" rel="noopener noreferrer" aria-label="查看 ${spot.ja} 的 X 最新圖片（另開分頁）" title="X 最新圖片 · ${spot.ja}"><span aria-hidden="true">𝕏</span></a><a class="spot-quick-link maps" href="${mapsUrl(spot)}" target="_blank" rel="noopener noreferrer" aria-label="在 Google Maps 開啟 ${spot.ja}（另開分頁）" title="Google Maps · ${spot.ja}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg></a></div></div>
    </article>`).join('');
  document.querySelectorAll('[data-open-spot]').forEach(button=>button.addEventListener('click',()=>focusSpot(button.dataset.openSpot)));
  document.getElementById('emptyState').hidden = visible.length > 0;
  document.getElementById('spotList').hidden = visible.length === 0;
  document.getElementById('mapEmpty').hidden = visible.length > 0;
  updateFilterLabels();
  const unmapped=visible.filter(spot=>!hasMapLocation(spot)).length;
  const notice=document.getElementById('mapCoverage');
  notice.hidden=!unmapped;
  notice.textContent=`${visible.length-unmapped} 個地圖標記 · ${unmapped} 個位置待核對，可從景點清單查看`;
  const noPins=visible.length>0&&unmapped===visible.length;
  document.getElementById('mapEmpty').hidden=visible.length>0&&!noPins;
  document.getElementById('mapEmptyTitle').textContent=noPins?'符合的景點已列於清單':'沒有符合這組條件的景點';
  document.getElementById('mapEmptyDescription').textContent=noPins?'觀賞位置待核對，暫不放置地圖標記。':'換個時段，或清除篩選重新探索。';
  document.getElementById('openUnmappedList').hidden=!noPins;
  spots.forEach(s => {
    const marker = markers.get(s.id); if(!map || !marker) return;
    if(visible.some(v=>v.id===s.id)){ marker.setIcon(markerIcon(s)); if(!map.hasLayer(marker)) marker.addTo(map); }
    else if(map.hasLayer(marker)) map.removeLayer(marker);
  });
  syncSelection(visible);
  if(typeof cloudSyncControls==='function')cloudSyncControls();
}

function onSaveWeekend(event){
  if(typeof handleCloudWeekend==='function'&&handleCloudWeekend(event))return;
  const id = event.target.dataset.id;
  const value = event.target.value;
  if(value) saved[id]=value; else delete saved[id];
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); storageAvailable=true; }
  catch { storageAvailable=false; }
  const spot = spots.find(s=>s.id===id);
  const weekend = weekends.find(w=>w.value===value);
  showToast(!storageAvailable ? '瀏覽器無法保存；此安排僅在本次頁面有效' : value ? `已將 ${spot.zh} 加入 ${weekend?.short||value}` : `已清除 ${spot.zh} 的週末安排`);
  renderFilters();
  renderSpots();
  if(selectedSpotId===id) renderDetail(spot);
  if(event.target.dataset.weekendOrigin==='list'){
    const remainsVisible=filteredSpots().some(item=>item.id===id);
    // Rendering replaces the select; restore keyboard focus without resetting drawer scroll.
    document.getElementById(remainsVisible?`list-weekend-${id}`:document.getElementById('listPanel').hidden?'listButton':'closeList').focus({preventScroll:true});
  }
}
let toastTimer;
function showToast(text){
  const el=document.getElementById('toast'); el.textContent=text; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),2200);
}

document.getElementById('fitMap').addEventListener('click', fitVisible);
document.getElementById('showAll').addEventListener('click',resetAllFilters);
document.getElementById('openUnmappedList').addEventListener('click',()=>toggleList(true));
document.getElementById('spotList').addEventListener('change',event=>{
  if(event.target.dataset.weekendOrigin==='list') onSaveWeekend(event);
});

renderFilters(); setArea(activeArea);
initSheetUI();
initFilterUI();
initSpotTools();
if(typeof initCollaboration==='function')initCollaboration();
setTimeout(()=>map?.invalidateSize(),200);
document.addEventListener('visibilitychange',()=>{
  if(document.hidden) return;
  const updated=getUpcomingWeekends();
  if(updated[0].value!==weekends[0].value){ weekends=updated; renderFilters(); renderSpots(); if(selectedSpotId) renderDetail(spots.find(s=>s.id===selectedSpotId)); }
});
