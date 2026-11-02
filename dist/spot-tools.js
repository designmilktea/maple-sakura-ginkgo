// Links contain only a stable destination ID, never personal weekend plans.
function spotShareUrl(id){
  const url=new URL(window.location.href);
  url.search='';url.hash='';url.searchParams.set('spot',id);
  return url.href;
}
function updateSpotUrl(id,replace=false){
  const url=new URL(window.location.href);
  if(url.searchParams.get('spot')===(id||null)) return;
  if(id) url.searchParams.set('spot',id); else url.searchParams.delete('spot');
  window.history[replace?'replaceState':'pushState'](null,'',url.href);
}
function restoreSpotFromUrl(){
  const id=new URLSearchParams(window.location.search).get('spot');
  if(!id){if(selectedSpotId) closeDetail(false,false);return;}
  const spot=spots.find(s=>s.id===id);
  if(!spot){
    if(selectedSpotId) closeDetail(false,false);
    updateSpotUrl(null,true);showToast('找不到這個景點，請從地圖重新選擇');return;
  }
  // A linked destination must not be hidden by unrelated local filters.
  if(!filteredSpots().some(s=>s.id===id)){
    activeArea='all';activePeak=[];activeWeekend='all';
    searchQuery='';document.getElementById('spotSearch').value='';document.getElementById('clearSearch').hidden=true;
    renderFilters();renderSpots();
  }
  openSpot(id,false);
}
const copyIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3"/></svg>';
let toolsReturnFocus=null;
let toolsCopyLabel='景點連結';
function isLocalShareUrl(url){
  return ['localhost','127.0.0.1','[::1]'].includes(new URL(url).hostname);
}
function openSpotTools(text,label,manual=false){
  const dialog=document.getElementById('spotToolsDialog');
  toolsReturnFocus=document.activeElement;
  toolsCopyLabel=label;
  document.getElementById('spotToolsTitle').textContent=label==='景點連結'?'分享景點':`複製${label}`;
  document.getElementById('spotToolsDescription').textContent=label==='景點連結'?'朋友開啟連結，即可直接查看這個景點。':'選取下方文字即可手動複製。';
  document.getElementById('spotToolsLabel').textContent=label;
  document.getElementById('spotToolsText').value=text;
  document.getElementById('copySpotTools').textContent=`複製${label}`;
  document.getElementById('manualCopyHint').hidden=!manual;
  document.getElementById('localShareNotice').hidden=label!=='景點連結'||!isLocalShareUrl(text);
  dialog.showModal();
  if(manual){const field=document.getElementById('spotToolsText');field.focus();field.select();}
}
async function writeClipboard(text){
  try{
    if(!navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(text);return true;
  }catch{return false;}
}
async function copySpotField(field,label){
  const spot=spots.find(s=>s.id===selectedSpotId);
  if(!spot) return;
  const text=spot[field];
  if(await writeClipboard(text)) showToast(`已複製${label}`);
  else openSpotTools(text,label,true);
}
async function shareSpot(){
  const spot=spots.find(s=>s.id===selectedSpotId);
  if(!spot) return;
  const url=spotShareUrl(spot.id);
  if(typeof navigator.share==='function'){
    try{await navigator.share({title:`${spot.zh}｜週末賞楓地圖`,url});return;}
    catch(error){if(error.name==='AbortError') return;}
  }
  openSpotTools(url,'景點連結');
}
function initSpotTools(){
  for(const [id,field,label] of [['copyJapanese','ja','日文名稱'],['copyChinese','zh','繁中名稱'],['copyAddress','address','地址']]){
    const button=document.getElementById(id);button.innerHTML=copyIcon;
    button.addEventListener('click',()=>copySpotField(field,label));
  }
  document.getElementById('shareSpot').addEventListener('click',shareSpot);
  const dialog=document.getElementById('spotToolsDialog');
  document.getElementById('closeSpotTools').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{toolsReturnFocus?.focus({preventScroll:true});toolsReturnFocus=null;});
  dialog.addEventListener('click',event=>{
    if(event.target!==dialog) return;
    const r=dialog.getBoundingClientRect();
    if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) dialog.close();
  });
  document.getElementById('copySpotTools').addEventListener('click',async()=>{
    if(await writeClipboard(document.getElementById('spotToolsText').value)){
      dialog.close();showToast(`已複製${toolsCopyLabel}`);
    }else{
      document.getElementById('manualCopyHint').hidden=false;
      const field=document.getElementById('spotToolsText');field.focus();field.select();
    }
  });
  window.addEventListener('popstate',()=>{
    if(dialog.open) dialog.close();
    restoreSpotFromUrl();
  });
  restoreSpotFromUrl();
}
