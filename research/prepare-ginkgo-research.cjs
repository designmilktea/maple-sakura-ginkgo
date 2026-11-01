// Read-only compilation: --patch emits apply_patch input; --check checks delivered artifacts.
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const seed=JSON.parse(fs.readFileSync(path.join(__dirname,'ginkgo-inventory.source.json'),'utf8'));
const coordinateAudit=JSON.parse(fs.readFileSync(path.join(__dirname,'ginkgo-coordinate-audit.source.json'),'utf8'));
const approvedCoordinates=new Map(coordinateAudit.records.filter(r=>r.eligibleForAreaMarkerUpdate).map(r=>[r.id,r]));
const tokyo=fs.readFileSync(path.join(root,'dist/tokyo-spots.js'),'utf8');
const hokuriku=fs.readFileSync(path.join(root,'dist/app.js'),'utf8').split('\nspots.push(...tokyoSpots);')[0];
const existing=vm.runInNewContext(`${tokyo}\n${hokuriku}\n[...spots,...tokyoSpots]`);
const byId=new Map(existing.map(s=>[s.id,s]));
const groups={toyama:'富山與近郊',kanazawa:'金澤與石川延伸行程',tokyo:'東京與近郊'};
const addressLabels={venue:'景點地址',registered_venue:'寺院登記地址',district:'町／區級，完整地址待核',municipality:'市級，完整地址待核',service_center:'管理所／聯絡地址',shared_service_center:'共用管理所，觀賞點待核',linear_area:'道路／走廊範圍，入口待核',existing_project_address:'沿用現有專案地址'};
const checkLabels={verify_individual_ginkgo_presence:'分別確認園區內銀杏',confirm_ginkgo_with_primary_source:'以官方或管理單位確認銀杏',resolve_season_conflict:'解決見頃來源衝突',verify_species_specific_ginkgo_season:'核對銀杏獨立見頃',verify_viewing_area_coordinates:'確認觀賞區座標',verify_address_or_entrance:'補核完整地址／入口',verify_current_public_access:'確認目前對外開放與通行'};
function verifyRange(range,record){
  if(!range) return;
  assert.ok(record.sources.includes(range.source),`${record.id}: missing range source`);
  assert.ok(seed.sources[range.source]);
  for(const date of [range.start,range.end]){
    assert.match(date,/^\d{2}-\d{2}$/);
    const [m,d]=date.split('-').map(Number);
    assert.ok(m>=1&&m<=12&&d>=1&&d<=new Date(2000,m,0).getDate());
  }
  assert.ok(range.start<=range.end);
  assert.ok(range.text&&range.precision&&range.kind);
}
const seen=new Set();
const spots=seed.spots.map(record=>{
  assert.ok(!seen.has(record.id),record.id);seen.add(record.id);
  assert.ok(groups[record.group]);
  record.sources.forEach(id=>assert.ok(seed.sources[id],`${record.id}: ${id}`));
  if(record.mapReference){
    assert.ok(record.sources.includes(record.mapReference.source));
    assert.equal(record.mapReference.usableAsViewingAreaPin,false);
    assert.ok(Number.isFinite(record.mapReference.lat)&&record.mapReference.lat>=-90&&record.mapReference.lat<=90);
    assert.ok(Number.isFinite(record.mapReference.lng)&&record.mapReference.lng>=-180&&record.mapReference.lng<=180);
  }
  for(const notice of record.accessNotices||[]) assert.ok(record.sources.includes(notice.source));
  verifyRange(record.ginkgo.peak,record);verifyRange(record.ginkgo.suggestedPeak,record);verifyRange(record.maple?.peak,record);
  const old=byId.get(record.id);
  if(record.coordinates||record.coordinateReview){
    const approved=approvedCoordinates.get(record.id);
    assert.ok(!old&&approved,record.id+': cannot overwrite an existing pin or import a withheld candidate');
    assert.deepEqual(record.coordinates,approved.proposedCoordinates,record.id+': unreviewed coordinates');
    assert.equal(record.coordinateReview.sourceUrl,approved.coordinateEvidence.sourceUrl);
    assert.equal(record.coordinateReview.kind,approved.coordinateEvidence.kind);
    assert.equal(record.coordinateReview.viewingAreaConfirmed,approved.viewingAreaConfirmed);
    assert.equal(record.coordinateReview.entranceVerified,false);
    assert.ok(record.coordinateReview.displayDisclaimer);
  }
  assert.ok(old||!existing.some(s=>s.ja===record.ja),`${record.id}: duplicates existing name`);
  const ja=old?.ja||record.ja,zh=old?.zh||record.zh,address=record.address||old?.address;
  assert.ok(ja&&zh&&address);
  const ginkgoPresent=record.ginkgo.presenceStatus==='group_level_only'?null:true;
  const presenceSources=record.ginkgo.presenceSources||record.sources;
  presenceSources.forEach(id=>assert.ok(record.sources.includes(id)));
  const sourceTypes=presenceSources.map(id=>seed.sources[id].type);
  const primaryPresence=sourceTypes.some(type=>!type.startsWith('secondary_'));
  const presenceTier=ginkgoPresent===null?'group_only':primaryPresence?'primary_source':'secondary_source';
  const searchName=old?.searchName||ja;
  const mapsUrl=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${ja} ${address}`)}`;
  const xUrl=`https://x.com/search?q=${encodeURIComponent(`"${searchName}" filter:images`)}&src=typed_query&f=live`;
  const missing=[];
  if(ginkgoPresent===null) missing.push('verify_individual_ginkgo_presence');
  if(presenceTier==='secondary_source') missing.push('confirm_ginkgo_with_primary_source');
  if(!record.ginkgo.peak) missing.push(record.ginkgo.status==='conflicting_sources'?'resolve_season_conflict':'verify_species_specific_ginkgo_season');
  if(!old&&!record.coordinateReview?.viewingAreaConfirmed) missing.push('verify_viewing_area_coordinates');
  if(['district','municipality','shared_service_center'].includes(record.addressPrecision)) missing.push('verify_address_or_entrance');
  if(record.accessReviewRequired) missing.push('verify_current_public_access');
  const maple=record.maple||{present:null,peak:null};
  return {
    id:record.id,existingSpotId:old?.id||null,regionGroup:record.group,prefecture:record.prefecture,municipality:record.municipality,
    ja,zh,zhTranslationStatus:'editorial_traditional_chinese',address,addressPrecision:record.addressPrecision||(old?'existing_project_address':'unverified'),
    coordinates:old?{lat:old.lat,lng:old.lng}:record.coordinates||null,
    coordinateStatus:old?'existing_project_area_pin_not_regeocoded':record.coordinates?(record.coordinateReview.viewingAreaConfirmed?'reviewed_viewing_area_representative':'reviewed_venue_area_schematic'):'not_geocoded_do_not_plot',
    coordinateReview:record.coordinateReview||null,
    mapReference:record.mapReference||null,accessNotices:record.accessNotices||[],
    maple:{present:maple.present,peak:maple.peak||null,evidenceSourceIds:maple.present?record.sources:[]},
    ginkgo:{present:ginkgoPresent,presenceEvidenceTier:presenceTier,peak:record.ginkgo.peak||null,suggestedPeak:record.ginkgo.suggestedPeak||null,status:record.ginkgo.status||(record.ginkgo.peak?'documented_reference_range':record.ginkgo.suggestedPeak?'needs_primary_or_species_specific_review':'season_unknown'),seasonContext:record.ginkgo.seasonContext||null,evidenceSourceIds:presenceSources},
    legacyPeak:old?{text:old.peak,status:'existing_site_value_not_automatically_species_specific'}:null,
    googleMapsUrl:mapsUrl,xSearchName:searchName,xTweetUrl:xUrl,
    projectPath:`?spot=${record.id}`,projectPathStatus:old?'existing_spot_route':ginkgoPresent===true?'local_app_list_and_detail_route':'research_only_not_imported',
    currentFoliageStatus:null,currentFoliageObservedAt:null,
    researchedAt:seed.researchDate,sources:record.sources,notes:record.notes,
    integration:{canMergeIntoExisting:!!old,eligibleForGinkgoTimeFilter:ginkgoPresent===true&&!!record.ginkgo.peak,researchCompleteForAutomaticMapImport:missing.length===0,missingChecks:missing}
  };
});
const stats={total:spots.length,groups:{},existing:spots.filter(s=>s.existingSpotId).length,documentedGinkgoRanges:spots.filter(s=>s.ginkgo.peak).length,suggestedRanges:spots.filter(s=>s.ginkgo.suggestedPeak).length,conflictingRanges:spots.filter(s=>s.ginkgo.status==='conflicting_sources').length,groupOnlyPresence:spots.filter(s=>s.ginkgo.present===null).length};
for(const group of Object.keys(groups)) stats.groups[group]=spots.filter(s=>s.regionGroup===group).length;
stats.otherSeasonUnknown=spots.filter(s=>!s.ginkgo.peak&&!s.ginkgo.suggestedPeak&&s.ginkgo.status!=='conflicting_sources').length;
stats.officialMapReferencesNotViewingPins=spots.filter(s=>s.mapReference).length;
stats.newReviewedMapPins=spots.filter(s=>!s.existingSpotId&&s.coordinates).length;
stats.newListOnly=spots.filter(s=>!s.existingSpotId&&s.ginkgo.present===true&&!s.coordinates).length;
assert.equal(stats.newReviewedMapPins,25);
assert.equal(stats.newListOnly,11);
const output={schemaVersion:'1.2',researchDate:seed.researchDate,scope:seed.scope,integrationStatus:'local_app_integrated_25_reviewed_new_area_pins_11_withheld',statistics:stats,
  integrationContract:{oneSpotOneIdOneShareUrl:true,noNewSpeciesFilter:true,areaAndSeasonFiltersUnchanged:true,seasonMatch:'within area AND (documented maple range overlaps OR documented ginkgo range overlaps)',markerRules:{bothMatch:'envelope',mapleOnlyMatches:'楓',ginkgoOnlyMatches:'杏',neitherMatches:'hidden_when_time_filtered'},unknownIsNotFalse:true,unknownRangeDoesNotMatchTimeFilter:true,suggestedRangeNotAutomaticallyUsed:true,legacyPeakNotAutomaticallyCopiedToSpecies:true,monthOrTenDayRangesAreApproximateNotDailyPredictions:true,noSpeciesSpecificWeekendSelector:true,preserveWeekendStorageKey:'hokuriku-maple-weekends-v1',coordinateNullMustNotBePlotted:true,newConfirmedPresenceRoutesLiveLocally:true},
  reviewNotes:seed.reviewNotes||[],sources:seed.sources,spots,backlog:seed.backlog};
for(const spot of spots){
  const x=new URL(spot.xTweetUrl),maps=new URL(spot.googleMapsUrl);
  assert.equal(x.searchParams.get('q'),`"${spot.xSearchName}" filter:images`);
  assert.equal(x.searchParams.get('f'),'live');
  assert.equal(maps.searchParams.get('query'),`${spot.ja} ${spot.address}`);
  if(!spot.ginkgo.peak) assert.equal(spot.integration.eligibleForGinkgoTimeFilter,false);
  if(!spot.existingSpotId&&spot.coordinates) assert.deepEqual(spot.coordinates,approvedCoordinates.get(spot.id)?.proposedCoordinates);
  if(!spot.existingSpotId&&!approvedCoordinates.has(spot.id)) assert.equal(spot.coordinates,null);
}
assert.equal(spots.find(s=>s.id==='tokyo-showa').ginkgo.peak.end,'11-30');
assert.equal(spots.find(s=>s.id==='tokyo-showa').maple.peak.end,'12-10');
assert.equal(spots.find(s=>s.id==='kenrokuen').ginkgo.peak,null);
assert.equal(spots.find(s=>s.id==='tokyo-hikarigaoka').ginkgo.peak.start,'11-11');
assert.equal(spots.find(s=>s.id==='tokyo-hikarigaoka').ginkgo.peak.end,'11-30');
assert.equal(spots.find(s=>s.id==='tokyo-hikarigaoka').maple.peak.end,'12-10');
assert.equal(spots.find(s=>s.id==='tokyo-egara').ginkgo.peak,null);
function primaryLabel(s){
  if(s.ginkgo.present===null) return '合列觀察，個別存在待核';
  if(s.ginkgo.peak) return `${s.ginkgo.peak.text}〔${s.ginkgo.peak.precision==='month'?'月份級賞期':'歷年參考'}〕`;
  if(s.ginkgo.suggestedPeak) return `${s.ginkgo.suggestedPeak.text}〔候選，不自動用於篩選〕`;
  return s.ginkgo.status==='conflicting_sources'?'來源衝突，待確認':'銀杏見頃待確認';
}
const text=[];
text.push('# 銀杏景點研究與專案資料清單',`\n研究日期：${seed.researchDate}（Asia/Taipei）。已整合至本機網站：45筆個別銀杏存在已確認資料（9筆合併既有、36筆新增清單／詳情），2筆合列觀察仍僅保留研究。25筆新增景點已採用審核後區域示意座標，11筆維持清單可見、不上圖；既有60個景點ID、座標與週末儲存保留。`,
  '\n已確認雙種類標記使用真正的「✉ 信封」，不是混合葉片圖示。',
  '\n## 範圍與研究結果',`\n${seed.scope}`,
  `\n研究主表 ${stats.total} 筆：富山 ${stats.groups.toyama}、金澤與石川 ${stats.groups.kanazawa}、東京與近郊 ${stats.groups.tokyo}。其中 ${stats.existing} 筆對應既有景點，沿用同一 ID，不新增重複標記。`,
  `\n銀杏時段：${stats.documentedGinkgoRanges} 筆有可追溯、銀杏專屬的官方／管理單位歷年參考範圍；${stats.suggestedRanges} 筆僅有次級來源、在地推薦或混合紅葉候選範圍；${stats.conflictingRanges} 筆來源衝突；其餘 ${stats.otherSeasonUnknown} 筆尚無可採用的獨立銀杏日期。其中 ${stats.groupOnlyPresence} 筆只有合列觀察，尚未獨立證實銀杏位置。另列 ${seed.backlog.length} 個後續研究項目。`,
  '\n這是可持續維護的主要景點研究清單，不宣稱涵蓋三區每一株銀杏或所有小型寺社。文化財名錄、舊照片、景點樹木調查不自動等於2026可自由參觀、目前已黃葉或可安全導航。',
  '\n## 資料採用規則',
  '\n- 一個景點可同時保存 maple、ginkgo，各自有 present 與 peak。true 為有證據；null 為未確認，不是沒有。此次不因「銀杏名所」而將楓樹填成 false。',
  '- peak 的 MM-DD 是例年區間正規化，不是2026預報或每日最佳狀態。上旬=1–10日、中旬=11–20日、下旬=21日至月底；初旬暫按上旬映射，月底描述保留近似標記。',
  '- 官方只寫11至12月時，保留月份精度，不假裝知道某個週末最佳。舊年度官方「例年」資料標示歷史來源；單張歷史照片不能推導例年時段。',
  '- suggestedPeak 不參與自動時段篩選；不把一般公園紅葉、燈光活動日期、市區銀杏概況或JMA標本木黃葉日直接套到特定景點。',
  '- existingSpotId 保留既有景點／分享網址。legacyPeak 單獨保存原值，沒有把舊的通用 peak 複製到兩種樹。',
  '- 新景點僅接受核對表通過的25筆 coordinates 與 coordinateReview；2筆為觀賞區代表點、23筆為景點／道路示意，均非已核實入口。11筆暫緩位置保持 null。Google Maps仍以日本地名及地址搜尋，不把示意座標當入口。',
  '- X 連結僅使用日文地點／原有搜尋別名 + filter:images + f=live，不另加紅葉或銀杏關鍵字；官方地名本身含銀杏／イチョウ則保留。',
  '- 不增加種類篩選，不拆分個人週末安排，不更換或清除 hokuriku-maple-weekends-v1。',
  '\n## 專案整合規則',
  '\n只用可採用的楓樹／銀杏獨立區間計算：地區符合，而且任一種類與所選時段重疊，該景點只顯示一次。兩種都符合→✉；只有楓樹符合→楓；只有銀杏符合→杏；都不符合→不顯示。未知種類／未知時段不當成已符合。未選時段時依已確認種類顯示，但不能暗示即時變色。',
  '\n例如昭和紀念公園官方分列銀杏10月下旬–11月下旬、楓樹10月下旬–12月上旬。11月下旬符合兩種；12月上旬只符合楓樹。這是季節參考，不保證每一天同時最佳。',
  '\n## 景點總表',
  '\n「既有」沿用原分享路徑；銀杏存在個別確認的新增景點已可在本機清單與詳情開啟。2筆合列觀察尚未匯入。所有繁中名稱皆為編輯譯名，非聲稱官方繁中譯名。');
if(seed.reviewNotes?.length){
  text.push('\n## 本輪補核成果');
  for(const note of seed.reviewNotes) text.push(`\n- ${note}`);
}
for(const [group,title] of Object.entries(groups)){
  text.push(`\n### ${title}`,'\n| 景點（日文／繁中） | 所在地／地址 | 銀杏時段與採用狀態 | 對應 | 連結 |','| --- | --- | --- | --- | --- |');
  for(const s of spots.filter(s=>s.regionGroup===group)){
    const links=`[Google Maps](${s.googleMapsUrl}) · [X 最新圖片](${s.xTweetUrl}) · ${s.sources.map((id,i)=>`[來源${i+1}](${seed.sources[id].url})`).join(' · ')}`;
    text.push(`| ${s.ja}<br>${s.zh} | ${s.address}<br>${addressLabels[s.addressPrecision]||s.addressPrecision} | ${primaryLabel(s)} | ${s.existingSpotId?'既有':'新增候選'}：${s.id} | ${links} |`);
  }
}
text.push('\n## 逐點證據與缺口');
for(const s of spots){
  text.push(`\n### ${s.id}｜${s.zh}`,`\n${s.notes}`,`\n- 楓樹：${s.maple.present===true?'存在已確認；':'存在待確認；'}${s.maple.peak?`獨立時段 ${s.maple.peak.text}`:'獨立時段待確認'}。`,
    `- 銀杏：${primaryLabel(s)}。${s.ginkgo.seasonContext||''}`,
    `- 定位：${s.coordinates?`${s.existingSpotId?'既有區域標記（未重新測繪）':s.coordinateReview.label} ${s.coordinates.lat}, ${s.coordinates.lng}。${s.coordinateReview?.displayDisclaimer||''}`:'未核實座標，不直接上圖。'}`,
    ...(s.mapReference?[`- 官方位置參考：${s.mapReference.lat}, ${s.mapReference.lng}（${s.mapReference.kind==='official_linked_venue_poi'?'全園POI':'嵌入地圖／視圖中心'}）。僅供核對，不是銀杏觀賞點，不填入 coordinates。[依據](${s.mapReference.url})。`]:[]),
    ...s.accessNotices.map(n=>`- 通行提醒：${n.text} 公告預定期間 ${n.start} 至 ${n.expectedEnd}，結束日期非保證，出發前重查。[來源](${seed.sources[n.source].url})。`),
    `- 整合缺口：${s.integration.missingChecks.map(key=>checkLabels[key]||key).join('、')||'既有景點可合併銀杏資料；仍須在下一階段實作並驗證。'}`,
    `- 可追溯來源：${s.sources.map(id=>`[${seed.sources[id].publisher}／${seed.sources[id].title}](${seed.sources[id].url})`).join('；')}。`);
}
text.push('\n## 後續候選與不應誤匯入的項目');
for(const item of seed.backlog) text.push(`\n- **${item.ja}（${item.region}）**：${item.reason}${item.url?` [來源](${item.url})`:item.source?` [來源](${seed.sources[item.source].url})`:''}`);
text.push('\n## 來源登錄與版本限制');
for(const [id,s] of Object.entries(seed.sources)) text.push(`\n- **${id}**｜[${s.publisher}・${s.title}](${s.url})｜${s.type}：${s.note}`);
text.push('\n## 使用方式與驗證',
  '\n結構化清單：research/ginkgo-spots.json；人工整理來源：research/ginkgo-inventory.source.json。產生器同步輸出dist/foliage-data.js，已由網站載入。介面逐種類顯示例年日期；只有可採用的已知時段參與篩選。未研究的原有紅葉景點維持原時段，不推定銀杏或複製舊時段到兩種類。',
  '\n執行 node research/prepare-ginkgo-research.cjs --check，可檢查輸出與研究來源一致、ID唯一、既有景點不重建、日期合法、來源可追溯、X圖片／最新規則、未知日期排除、25筆座標與審核一致、11筆暫緩不標記，以及昭和紀念公園分樹種日期。',
  '\n後續優先補齊11筆暫緩點，以及區域示意點的觀賞區／入口與公開參觀條件，處理荏柄天神社日期差異，更新僅有歷史指南的季節依據。光丘已採用管理單位分樹種植物地圖與觀賞代表位置；其他區域示意點不可視為精確銀杏或入口。不能把完整欄位結構誤解成所有現場資料均已完成確認。\n');
const files=new Map([
  [path.join(root,'dist/foliage-data.js'),'// Generated from verified research; edit the source inventory, not this file.\nconst foliageResearch = '+JSON.stringify({researchDate:seed.researchDate,sources:seed.sources,spots},null,2)+';\n'],
  [path.join(__dirname,'ginkgo-spots.json'),JSON.stringify(output,null,2)+'\n'],
  [path.join(root,'GINKGO-RESEARCH.md'),text.join('\n')]
]);
if(process.argv.includes('--patch')){
  let patch='*** Begin Patch\n';
  for(const [file,content] of files){
    const next=content.trimEnd().split('\n');
    if(!fs.existsSync(file)){patch+=`*** Add File: ${file}\n`+next.map(line=>'+'+line).join('\n')+'\n';continue;}
    const previous=fs.readFileSync(file,'utf8').trimEnd().split('\n');
    if(previous.join('\n')===next.join('\n')) continue;
    patch+=`*** Update File: ${file}\n`;
    let a=0,b=0;
    while(a<previous.length||b<next.length){
      if(a<previous.length&&b<next.length&&previous[a]===next[b]){a++;b++;continue;}
      let da=previous.length-a,db=next.length-b,best=Infinity;
      for(let i=0;i<Math.min(160,previous.length-a);i++) for(let j=0;j<Math.min(160,next.length-b);j++){
        if(i+j>=best) continue;
        if(previous[a+i]===next[b+j]&&previous[a+i+1]===next[b+j+1]&&previous[a+i+2]===next[b+j+2]){da=i;db=j;best=i+j;}
      }
      patch+='@@\n';
      if(a>0) patch+=' '+previous[a-1]+'\n';
      for(const line of previous.slice(a,a+da)) patch+='-'+line+'\n';
      for(const line of next.slice(b,b+db)) patch+='+'+line+'\n';
      if(a+da<previous.length) patch+=' '+previous[a+da]+'\n';
      a+=da;b+=db;
    }
  }
  process.stdout.write(patch+'*** End Patch');
}else{
  if(process.argv.includes('--check')) for(const [file,content] of files) assert.equal(fs.readFileSync(file,'utf8').trimEnd(),content.trimEnd(),`Outdated: ${file}`);
  console.log(JSON.stringify(stats,null,2));
  console.log('PASS: unique IDs, existing-site deduplication, valid independent ranges, source references, clean Japanese image-only/latest X links, unknown-season exclusion, 25 audited new coordinates, 11 withheld and delivered artifact consistency.');
}
