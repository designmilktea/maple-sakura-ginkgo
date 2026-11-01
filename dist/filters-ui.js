// Values represent recurring calendar windows; they are independent of saved weekends.
const seasonSlots = [9,10,11,12].flatMap(month=>[
  {part:'early',word:'上旬',first:1,last:10},
  {part:'middle',word:'中旬',first:11,last:20},
  {part:'late',word:'下旬',first:21,last:new Date(2001,month,0).getDate()}
].map(p=>({value:`${month}-${p.part}`,label:`${month}月${p.word}`,month,start:month*100+p.first,end:month*100+p.last,dates:`${month}/${p.first}–${month}/${p.last}`})));
let activePeak = [];
let currentFilterKind = null;
let filterReturnTarget = null;
const prefectureGroups = [
  {region:'北陸',name:'石川縣',all:'ishikawa-all',children:['kanazawa','ishikawa']},
  {region:'北陸',name:'富山縣',all:'toyama-all',children:['toyama','gokayama']},
  {region:'東京與近郊',name:'東京都',all:'tokyo-prefecture',children:['tokyo-city','tokyo-west']},
  {region:'東京與近郊',name:'神奈川縣',all:'kanagawa',children:['kamakura','hakone']},
  {region:'東京與近郊',name:'埼玉縣',all:'saitama',children:['nagatoro']},
  {region:'東京與近郊',name:'栃木縣',all:'tochigi',children:['nikko']},
  {region:'東京與近郊',name:'千葉縣',all:'chiba',children:[]},
  {region:'東京與近郊',name:'茨城縣',all:'ibaraki',children:[]}
];

function parsePeakWindow(text){
  const match=text.match(/^(\d{1,2})月(上旬|中旬|下旬)(?:[〜～~–-](?:(\d{1,2})月)?(上旬|中旬|下旬))?$/);
  if(!match) return null;
  const month=Number(match[1]),endMonth=Number(match[3]||match[1]);
  if(month<1||month>12||endMonth<1||endMonth>12) return null;
  const starts={上旬:1,中旬:11,下旬:21};
  const ends={上旬:10,中旬:20,下旬:new Date(2001,endMonth,0).getDate()};
  return {start:month*100+starts[match[2]],end:endMonth*100+ends[match[4]||match[2]]};
}
function matchesPeak(spot,value){
  if(Array.isArray(value)) return value.length===0||value.some(period=>matchesPeak(spot,period));
  if(value==='all') return true;
  if(spot.species) return speciesMatches(spot,'maple',value)||speciesMatches(spot,'ginkgo',value);
  const slot=seasonSlots.find(s=>s.value===value);
  const range=spot.peakWindow;
  if(!slot||!range) return false;
  return range.start<=range.end ? range.start<=slot.end && range.end>=slot.start : range.start<=slot.end || range.end>=slot.start;
}
function setPeak(value){
  const values=Array.isArray(value)?value:value==='all'?[]:[value];
  if(values.some(period=>!seasonSlots.some(s=>s.value===period))) return;
  activePeak=seasonSlots.filter(slot=>values.includes(slot.value)).map(slot=>slot.value);
  renderSpots();fitVisible();
}
function selectedPeakValues(){return Array.isArray(activePeak)?activePeak:activePeak==='all'?[]:[activePeak];}
function togglePeak(value){
  const selected=selectedPeakValues();
  setPeak(value==='all'?[]:selected.includes(value)?selected.filter(period=>period!==value):[...selected,value]);
}
function updatePeakChoices(){
  const selected=selectedPeakValues();
  document.querySelectorAll('[data-choice]').forEach(button=>{
    const checked=button.dataset.choice==='all'?selected.length===0:selected.includes(button.dataset.choice);
    button.setAttribute('aria-checked',String(checked));
    button.querySelector('.choice-check').textContent=checked?'✓':'';
  });
  document.getElementById('filterSelectionSummary').textContent=selected.length?`已選 ${selected.length} 個時段・符合任一時段即可`:'不限見頃';
}
function resetAllFilters(){
  activeArea='all';activePeak=[];activeWeekend='all';
  renderFilters();renderSpots();fitVisible();
}
function updateFilterLabels(){
  const peaks=seasonSlots.filter(s=>selectedPeakValues().includes(s.value));
  const peakText=peaks.map(peak=>peak.label).join('、');
  document.getElementById('areaValue').textContent=areaLabels[activeArea];
  document.getElementById('areaFilter').setAttribute('aria-label',`地區：${areaLabels[activeArea]}`);
  document.getElementById('peakValue').textContent=peaks.length>2?`已選 ${peaks.length} 個時段`:peakText||'不限見頃';
  document.getElementById('peakFilter').setAttribute('aria-label',`例年見頃：${peakText||'不限見頃'}，可複選`);
  document.getElementById('peakFilter').setAttribute('title',peakText||'不限見頃');
  document.getElementById('areaFilter').classList.toggle('has-value',activeArea!=='all');
  document.getElementById('peakFilter').classList.toggle('has-value',peaks.length>0);
  document.getElementById('resetFilters').hidden=activeArea==='all'&&peaks.length===0&&activeWeekend==='all';
  document.getElementById('clearPeak').hidden=peaks.length===0;
  const weekend=weekends.find(w=>w.value===activeWeekend);
  const summary=[peaks.length?`例年 ${peakText}`:'不限見頃',activeWeekend==='all'?'所有週末':activeWeekend==='unsaved'?'尚未安排':`我的週末 ${weekend?.short||activeWeekend}`];
  document.getElementById('resultSummary').textContent=summary.join(' · ');
}
function choiceRow(value,label,selected,subtitle='',className='',multi=false){
  const checked=multi?(value==='all'?selected.length===0:selected.includes(value)):selected===value;
  return `<button type="button" class="choice-row ${className}" data-choice="${value}" ${multi?`role="checkbox" aria-checked="${checked}"`:`aria-pressed="${checked}"`}><span><span class="choice-title">${label}</span>${subtitle?`<span class="choice-subtitle">${subtitle}</span>`:''}</span><span class="choice-check" aria-hidden="true">${checked?'✓':''}</span></button>`;
}
function renderChoicePanel(kind){
  const isArea=kind==='area';
  document.getElementById('filterDialogFooter').hidden=isArea;
  document.getElementById('filterDialogTitle').textContent=isArea?'選擇地區':'例年見頃';
  document.getElementById('filterDialogEyebrow').textContent=isArea?'CHOOSE AN AREA':'TYPICAL AUTUMN SEASON';
  const quick=document.getElementById('filterQuickChoices');
  quick.setAttribute('aria-label',isArea?'常用範圍':'不限見頃');
  if(isArea){
    quick.innerHTML=`<p class="choice-section-label">常用範圍</p>${choiceRow('all','全部地區',activeArea)}${choiceRow('hokuriku','北陸全部',activeArea,'石川縣・富山縣')}${choiceRow('tokyo-all','東京與近郊全部',activeArea,'東京都・神奈川縣・埼玉縣・栃木縣・千葉縣・茨城縣')}`;
    document.getElementById('filterChoices').innerHTML=prefectureGroups.map(group=>`<section class="choice-group"><p class="choice-section-label">${group.region}</p>${choiceRow(group.all,`${group.name}全部`,activeArea,'','prefecture-choice')}${group.children.map(value=>choiceRow(value,areaLabels[value],activeArea,'','child-choice')).join('')}</section>`).join('');
  }else{
    quick.innerHTML=choiceRow('all','不限見頃',selectedPeakValues(),'可複選・歷年季節參考，非即時見頃','',true);
    document.getElementById('filterChoices').innerHTML=[9,10,11,12].map(month=>`<section class="choice-group"><h3 class="choice-section-label">${month}月</h3>${seasonSlots.filter(s=>s.month===month).map(s=>choiceRow(s.value,s.label,selectedPeakValues(),s.dates,'',true)).join('')}</section>`).join('');
    updatePeakChoices();
  }
  document.getElementById('filterChoices').scrollTop=0;
  document.querySelectorAll('[data-choice]').forEach(button=>button.addEventListener('click',()=>{
    const value=button.dataset.choice;
    if(isArea){closeFilterPanel();setArea(value);}
    else{togglePeak(value);updatePeakChoices();}
  }));
}
function openFilterPanel(kind){
  currentFilterKind=kind;
  filterReturnTarget=document.getElementById(kind==='area'?'areaFilter':'peakFilter');
  toggleList(false);toggleAbout(false);
  renderChoicePanel(kind);
  filterReturnTarget.setAttribute('aria-expanded','true');
  document.getElementById('filterDialog').showModal();
}
function finishFilterPanel(){
  if(document.getElementById('filterDialog').open) return;
  const target=filterReturnTarget;
  filterReturnTarget=null;currentFilterKind=null;
  target?.setAttribute('aria-expanded','false');
  target?.focus({preventScroll:true});
}
function closeFilterPanel(){document.getElementById('filterDialog').close();finishFilterPanel();}
function initFilterUI(){
  const dialog=document.getElementById('filterDialog');
  document.getElementById('areaFilter').addEventListener('click',()=>openFilterPanel('area'));
  document.getElementById('peakFilter').addEventListener('click',()=>openFilterPanel('peak'));
  document.getElementById('closeFilterDialog').addEventListener('click',closeFilterPanel);
  document.getElementById('donePeakFilter').addEventListener('click',closeFilterPanel);
  dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom) closeFilterPanel();}});
  dialog.addEventListener('close',finishFilterPanel);
  document.getElementById('resetFilters').addEventListener('click',resetAllFilters);
  document.getElementById('clearPeak').addEventListener('click',()=>setPeak('all'));
  if(typeof ResizeObserver!=='undefined'){
    new ResizeObserver(entries=>{
      const bottom=entries[0].target.getBoundingClientRect().bottom;
      document.documentElement.style.setProperty('--controls-bottom',`${bottom}px`);
    }).observe(document.querySelector('.explore-controls'));
  }
}
