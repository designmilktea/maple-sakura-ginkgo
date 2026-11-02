let selectedSpotId = null;
let sheetState = 'half';
let listSheetState = 'half';
const sheet = document.getElementById('detailSheet');
const sheetBody = document.getElementById('sheetBody');
const sheetHandle = document.getElementById('sheetHandle');

function prefersReducedMotion(){ return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
function sheetSizes(){
  const h=window.innerHeight;
  const mobile=window.matchMedia('(max-width: 760px)').matches;
  return mobile ? {peek:194,half:Math.max(300,Math.min(490,h*.52)),full:Math.max(310,h-65)} : {peek:200,half:Math.min(490,h*.64),full:h-95};
}
function setSheetState(state, reposition=true){
  if(!['peek','half','full'].includes(state)) return;
  sheetState=state;
  sheet.dataset.state=state;
  sheet.style.height=`${sheetSizes()[state]}px`;
  sheetBody.hidden=state==='peek';
  sheetHandle.setAttribute('aria-expanded',String(state==='full'));
  sheetHandle.setAttribute('aria-label',state==='full'?'收合景點詳情':'展開景點詳情');
  if(reposition && selectedSpotId) panToSelection();
}
function renderDetail(spot){
  document.getElementById('detailRegion').textContent=spot.region;
  document.getElementById('detailTitle').textContent=spot.ja;
  document.getElementById('detailChinese').textContent=spot.zh;
  document.getElementById('detailPeak').innerHTML=renderSeasonRows(spot);
  document.getElementById('detailAddress').textContent=spot.address;
  const foliage=document.getElementById('detailFoliage');
  foliage.textContent=spot.species?'':spot.foliage||''; foliage.hidden=Boolean(spot.species)||!spot.foliage;
  const note=document.getElementById('detailNote');
  note.textContent=spot.note||''; note.hidden=!spot.note;
  const location=document.getElementById('detailLocationStatus');
  location.hidden=hasMapLocation(spot);
  const addressHint={service_center:'地址為管理所聯絡地址。',registered_venue:'地址為寺院登記所在地，非觀賞入口定位。',district:'地址目前僅核對至町／區級。',municipality:'地址目前僅核對至市級。',linear_area:'景點為道路／走廊範圍，入口待核對。'}[spot.research?.addressPrecision]||'';
  location.textContent=`${addressHint}銀杏觀賞位置待核對，暫未放置地圖標記。Google Maps 連結會搜尋景點名稱與地址，請確認入口。`;
  const access=document.getElementById('detailAccess');
  const notices=spot.research?.accessNotices||[];
  access.hidden=!notices.length&&!spot.research?.integration.missingChecks.includes('verify_current_public_access');
  access.textContent=notices.length?notices.map(n=>`${n.text} 預定至 ${n.expectedEnd}，出發前請確認官方最新資訊。`).join(' '):'此景點的對外開放與通行條件仍待確認，出發前請查官方資訊。';
  document.getElementById('detailX').href=xUrl(spot.searchName||spot.ja);
  document.getElementById('detailMaps').href=mapsUrl(spot);
  const select=document.getElementById('detailWeekend');
  select.dataset.id=spot.id;
  select.innerHTML=optionMarkup(saved[spot.id]||'');
  const links=new Map([[spot.source,'景點資料 ↗']]);
  if(spot.seasonSource) links.set(spot.seasonSource,'原有季節參考 ↗');
  for(const key of ['maple','ginkgo']){
    const peak=spot.species?.[key].peak;
    if(peak){
      const url=foliageResearch.sources[peak.source].url;
      links.set(url,links.get(url)?.includes('楓樹')?'楓樹與銀杏季節依據 ↗':`${key==='maple'?'楓樹':'銀杏'}季節依據 ↗`);
    }
  }
  for(const id of spot.research?.sources||[]){const source=foliageResearch.sources[id];if(!links.has(source.url))links.set(source.url,`${source.publisher}・${source.title} ↗`);}
  document.getElementById('detailSources').innerHTML=[...links].map(([url,label])=>`<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`).join('');
  document.getElementById('detailUpdated').textContent=`資料核對 ${(spot.researchedAt||'2026-11-01').replaceAll('-','/')}`;
  document.getElementById('detailMapPrecision').textContent=hasMapLocation(spot)?(spot.research?.coordinateReview?.displayDisclaimer||'地圖標記為景點區域示意'):'觀賞位置待核對・尚未標記';
  if(typeof cloudSyncControls==='function')cloudSyncControls();
}
function openSpot(id, syncUrl=true){
  const spot=filteredSpots().find(s=>s.id===id);
  if(!spot) return;
  const alreadyOpen=Boolean(selectedSpotId);
  const switching=selectedSpotId!==id;
  selectedSpotId=id;
  if(syncUrl) updateSpotUrl(id);
  toggleList(false);
  toggleAbout(false);
  renderDetail(spot);
  if(switching) sheetBody.scrollTop=0;
  sheet.inert=false;
  sheet.setAttribute('aria-hidden','false');
  sheet.classList.add('is-open');
  document.body.classList.add('has-selection');
  setSheetState(alreadyOpen?sheetState:'half',false);
  updateSelectedMarker();
  panToSelection();
  document.getElementById('selectionStatus').textContent=`已選擇 ${spot.ja}，景點詳情已開啟`;
  // A focus target makes keyboard activation continue naturally into the card.
  document.getElementById('closeDetail').focus({preventScroll:true});
}
function closeDetail(restoreFocus=true, syncUrl=true){
  const oldId=selectedSpotId;
  selectedSpotId=null;
  if(syncUrl) updateSpotUrl(null,true);
  sheet.classList.remove('is-open','is-dragging');
  sheet.inert=true;
  sheet.setAttribute('aria-hidden','true');
  document.body.classList.remove('has-selection');
  updateSelectedMarker();
  if(restoreFocus){
    const marker=markers.get(oldId)?.getElement();
    (marker||document.getElementById('listButton')).focus({preventScroll:true});
  }
}
function updateSelectedMarker(){
  markers.forEach((marker,id)=>{
    const spot=spots.find(spot=>spot.id===id);
    marker.getElement()?.setAttribute('aria-label',`${spot.ja}・${foliageLabel(foliageKind(spot))}・${saved[id]==='skip'?'這次不去':saved[id]?'已存週末':'未存週末'}`);
    marker.getElement()?.classList.toggle('is-selected',id===selectedSpotId);
    marker.setZIndexOffset(id===selectedSpotId?1000:0);
  });
}
function syncSelection(visible){
  if(selectedSpotId && !visible.some(s=>s.id===selectedSpotId)){
    closeDetail(false);
    showToast('已更新篩選，原景點不在目前結果中');
  }
  updateSelectedMarker();
}
function panToSelection(){
  if(!map || !selectedSpotId) return;
  const spot=spots.find(s=>s.id===selectedSpotId);
  if(!hasMapLocation(spot)) return;
  const size=map.getSize();
  const mobile=window.matchMedia('(max-width: 760px)').matches;
  const controls=document.querySelector('.explore-controls').getBoundingClientRect();
  const top=mobile?controls.bottom+12:40;
  const bottom=mobile?size.y-sheetSizes()[sheetState]:size.y-40;
  // An almost full-height sheet intentionally covers the map; don't pan it away.
  if(bottom-top<70) return;
  const cardBounds=sheet.getBoundingClientRect();
  const target=mobile?L.point(size.x/2,(top+bottom)/2):cardBounds.left>size.x/2?L.point(cardBounds.left/2,(controls.bottom+size.y)/2):L.point((Math.min(460,size.x*.5)+size.x)/2,size.y*.48);
  const zoom=Math.max(map.getZoom(),10);
  const center=map.unproject(map.project([spot.lat,spot.lng],zoom).subtract(target.subtract(size.divideBy(2))),zoom);
  map.setView(center,zoom,{animate:!prefersReducedMotion()});
}
function listSheetSizes(){return {...sheetSizes(),peek:84};}
function setListSheetState(state){
  if(!['peek','half','full'].includes(state))return;
  listSheetState=state;
  const panel=document.getElementById('listPanel'),body=document.getElementById('listBody'),handle=document.getElementById('listHandle');
  panel.dataset.state=state;panel.style.height=`${listSheetSizes()[state]}px`;
  if(state==='peek'&&body.contains?.(document.activeElement))handle.focus({preventScroll:true});
  body.hidden=state==='peek';
  handle.setAttribute('aria-expanded',String(state==='full'));
  handle.setAttribute('aria-label',state==='full'?'收合景點清單':'展開景點清單');
}
function toggleList(open){
  document.getElementById('listPanel').hidden=!open;
  document.body.classList.toggle('has-list',open);
  document.getElementById('listButton').setAttribute('aria-expanded',String(open));
  sheet.inert=open||!selectedSpotId;sheet.setAttribute('aria-hidden',String(open||!selectedSpotId));
  if(open){toggleAbout(false);setListSheetState('half');document.getElementById('closeList').focus({preventScroll:true});}
}
function toggleAbout(open){
  document.getElementById('aboutPanel').hidden=!open;
  document.getElementById('aboutButton').setAttribute('aria-expanded',String(open));
  if(open){ toggleList(false); document.getElementById('closeAbout').focus({preventScroll:true}); }
}
function collapseMapPanels(){
  if(!document.getElementById('listPanel').hidden)setListSheetState('peek');
  else if(selectedSpotId)setSheetState('peek',false);
}
function initSheetUI(){
  document.getElementById('closeDetail').addEventListener('click',()=>closeDetail());
  document.getElementById('detailWeekend').addEventListener('change',onSaveWeekend);
  bindSnapPanel({panel:sheet,body:sheetBody,handle:sheetHandle,zone:document.getElementById('sheetDragZone'),isOpen:()=>Boolean(selectedSpotId),getState:()=>sheetState,setState:setSheetState,sizes:sheetSizes});
  bindSnapPanel({panel:document.getElementById('listPanel'),body:document.getElementById('listBody'),handle:document.getElementById('listHandle'),zone:document.getElementById('listDragZone'),isOpen:()=>!document.getElementById('listPanel').hidden,getState:()=>listSheetState,setState:setListSheetState,sizes:listSheetSizes});
  document.getElementById('listButton').addEventListener('click',()=>toggleList(document.getElementById('listPanel').hidden));
  document.getElementById('closeList').addEventListener('click',()=>{toggleList(false);document.getElementById('listButton').focus();});
  document.getElementById('aboutButton').addEventListener('click',()=>toggleAbout(document.getElementById('aboutPanel').hidden));
  document.getElementById('closeAbout').addEventListener('click',()=>{toggleAbout(false);document.getElementById('aboutButton').focus();});
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape') return;
    if(document.getElementById('filterDialog').open) return;
    if(document.getElementById('spotToolsDialog').open) return;
    if(document.getElementById('cloudDialog').open) return;
    if(!document.getElementById('aboutPanel').hidden){toggleAbout(false);document.getElementById('aboutButton').focus();}
    else if(!document.getElementById('listPanel').hidden){toggleList(false);document.getElementById('listButton').focus();}
    else if(selectedSpotId) closeDetail();
  });
  map?.on('click',collapseMapPanels);
  window.addEventListener('resize',()=>{
    map?.invalidateSize(); if(selectedSpotId) setSheetState(sheetState);
    if(!document.getElementById('listPanel').hidden)setListSheetState(listSheetState);
  });
}
// Both panels share snapping, drag threshold, keyboard controls and click suppression.
function bindSnapPanel({panel,body,handle,zone,isOpen,getState,setState,sizes}){
  let drag=null,suppressClick=false;
  handle.addEventListener('click',()=>{
    if(suppressClick){suppressClick=false;return;}
    const state=getState();setState(state==='peek'?'half':state==='half'?'full':'peek');
  });
  handle.addEventListener('keydown',event=>{
    const levels=['peek','half','full'];
    if(event.key==='ArrowUp'||event.key==='ArrowDown'){
      event.preventDefault();setState(levels[Math.max(0,Math.min(2,levels.indexOf(getState())+(event.key==='ArrowUp'?1:-1)))]);
    }
  });
  zone.addEventListener('pointerdown',event=>{
    if(event.button!==0||!isOpen())return;
    const button=event.target.closest('button');
    if(button&&button!==handle)return;
    drag={id:event.pointerId,y:event.clientY,height:sizes()[getState()],moved:false};
    (button||zone).setPointerCapture(event.pointerId);
  });
  zone.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.id)return;
    const delta=drag.y-event.clientY;
    if(!drag.moved&&Math.abs(delta)<6)return;
    drag.moved=true;panel.classList.add('is-dragging');body.hidden=false;
    const bounds=sizes();panel.style.height=`${Math.max(bounds.peek,Math.min(bounds.full,drag.height+delta))}px`;
  });
  zone.addEventListener('pointerup',event=>{
    if(!drag||event.pointerId!==drag.id)return;
    const {moved,height:initialHeight}=drag,height=parseFloat(panel.style.height)||initialHeight;
    drag=null;panel.classList.remove('is-dragging');
    if(moved){
      suppressClick=true;setTimeout(()=>{suppressClick=false;},0);
      const bounds=sizes(),nearest=Object.keys(bounds).reduce((a,b)=>Math.abs(bounds[a]-height)<Math.abs(bounds[b]-height)?a:b);
      setState(nearest);
    }
  });
  zone.addEventListener('pointercancel',event=>{
    if(drag?.id===event.pointerId){drag=null;panel.classList.remove('is-dragging');setState(getState());}
  });
}
