// Independent species seasons. Unknown is never converted to absence or a date.
function initFoliageData(destinations){
  destinations.forEach(spot=>{
    spot.legacyPeak=spot.peak;
    spot.legacyPeakWindow=parsePeakWindow(spot.peak);
    spot.species=null;
  });
  Object.assign(foliageResearch.sources,regionalFoliageResearch.sources);
  for(const record of [...foliageResearch.spots,...regionalFoliageResearch.spots]){
    if(record.maple.present!==true&&record.ginkgo.present!==true&&record.mixedAutumn?.present!==true) continue;
    let spot=destinations.find(item=>item.id===record.id);
    if(!spot){
      const area=record.area||(record.regionGroup==='toyama'?'toyama':record.regionGroup==='kanazawa'?(record.municipality==='金沢市'?'kanazawa':'ishikawa'):record.prefecture==='東京都'?(record.municipality==='八王子市'||record.municipality==='小金井市'?'tokyo-west':'tokyo-city'):'tokyo-daytrip');
      spot={id:record.id,ja:record.ja,zh:record.zh,address:record.address,area,
        region:`${record.prefecture}・${record.municipality}`,lat:record.coordinates?.lat??null,lng:record.coordinates?.lng??null,
        searchName:record.xSearchName,source:foliageResearch.sources[record.sources[0]].url,note:record.note||'',
        peak:'',peakWindow:null,legacyPeak:null,legacyPeakWindow:null};
      destinations.push(spot);
    }
    spot.species={maple:record.maple,ginkgo:record.ginkgo};
    spot.research=record;
    spot.researchedAt=record.researchedAt;
    spot.peak=speciesSummary(spot);
  }
}
function hasMapLocation(spot){return Number.isFinite(spot.lat)&&Number.isFinite(spot.lng);}
function dateWindow(peak){
  return peak?{start:Number(peak.start.replace('-','')),end:Number(peak.end.replace('-',''))}:null;
}
function overlapsSeason(range,slot){
  if(!range||!slot) return false;
  return range.start<=range.end?range.start<=slot.end&&range.end>=slot.start:range.start<=slot.end||range.end>=slot.start;
}
function speciesMatches(spot,type,value){
  const item=spot.species?.[type];
  if(item?.present!==true) return false;
  if(Array.isArray(value)) return value.length===0||value.some(period=>speciesMatches(spot,type,period));
  if(value==='all') return true;
  return overlapsSeason(dateWindow(item.peak),seasonSlots.find(slot=>slot.value===value));
}
function mixedAutumn(spot){
  return spot.research?.mixedAutumn|| (spot.research?.autumnReference?{
    present:true,peak:spot.research.autumnReference,plants:[]
  }:null);
}
function seasonEvidence(spot,value=activePeak){
  const values=Array.isArray(value)?value:value==='all'?[]:[value];
  if(!values.length) return 'all';
  if(values.some(period=>speciesMatches(spot,'maple',period)||speciesMatches(spot,'ginkgo',period))) return 'species';
  const mixed=mixedAutumn(spot),range=dateWindow(mixed?.present===true?mixed.peak:null);
  const overlaps=window=>values.some(period=>overlapsSeason(window,seasonSlots.find(slot=>slot.value===period)));
  if(range&&overlaps(range))return 'mixed';
  // Legacy dates remain general foliage references; never copy them into species peaks.
  if(!spot.species&&spot.peakWindow&&overlaps(spot.peakWindow))return 'legacy';
  const reference=spot.research?.seasonReference;
  const referenceRange=dateWindow(reference?.start&&reference?.end?reference:null);
  if(referenceRange&&overlaps(referenceRange))return 'seasonal';
  const hasSpeciesDate=['maple','ginkgo'].some(key=>spot.species?.[key]?.present===true&&dateWindow(spot.species[key].peak));
  return range||referenceRange||hasSpeciesDate||(!spot.species&&spot.peakWindow)?'outside':'unknown';
}
function seasonEvidenceLabel(spot,value=activePeak){
  return {mixed:'整體紅葉期符合・分種見頃請看詳情',legacy:'整體紅葉期參考',seasonal:'季節參考・見頃待確認',unknown:'時期待確認・未確認符合所選期間'}[seasonEvidence(spot,value)]||'';
}
function seasonEvidenceRank(spot){
  return {all:0,species:0,mixed:0,legacy:0,seasonal:1,unknown:2,outside:3}[seasonEvidence(spot)];
}
function foliageKind(spot,value=activePeak){
  if(!spot.species) return 'maple'; // Preserve legacy red-foliage pins, not a new botanical claim.
  const maple=speciesMatches(spot,'maple',value),ginkgo=speciesMatches(spot,'ginkgo',value);
  if(maple&&ginkgo)return 'both';
  if(ginkgo)return 'ginkgo';
  if(maple)return 'maple';
  return seasonEvidence(spot,value)==='mixed'||mixedAutumn(spot)?.present===true&&(value==='all'||Array.isArray(value)&&!value.length)?'mixed':'unknown';
}
function foliageLabel(kind){return {both:'楓樹與銀杏',ginkgo:'銀杏',maple:'楓樹／紅葉',mixed:'混合紅葉',unknown:'見頃待確認'}[kind];}
function foliageSymbol(kind){
  return kind==='both'?'<svg class="envelope-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>':kind==='ginkgo'?'杏':kind==='unknown'?'?':kind==='mixed'?'葉':'楓';
}
function speciesRows(spot){
  if(!spot.species) return [{name:'紅葉',text:spot.legacyPeak||spot.peak,kind:'legacy'}];
  const rows=[['maple','楓樹'],['ginkgo','銀杏']].filter(([key])=>spot.species[key].present===true).map(([key,name])=>({name,kind:key,text:spot.species[key].peak?.text||'見頃待確認'}));
  const mixed=mixedAutumn(spot);
  if(mixed?.present===true) rows.unshift({name:'混合紅葉',kind:'mixed',text:mixed.peak?.text||'見頃待確認'});
  return rows;
}
function speciesSummary(spot){return speciesRows(spot).map(row=>`${row.name} · ${row.text}`).join(' ／ ');}
function foliageText(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function renderSeasonRows(spot){
  const rows=speciesRows(spot).map(row=>`<span class="species-season ${row.kind}"><span class="species-name">${row.name}</span><strong>${foliageText(row.text)}</strong></span>`).join('');
  const plants=mixedAutumn(spot)?.plants||[];
  return rows+(plants.length?`<span class="foliage-plants">已確認植物：${plants.map(p=>foliageText(p.name)).join('、')}</span>`:'');
}
