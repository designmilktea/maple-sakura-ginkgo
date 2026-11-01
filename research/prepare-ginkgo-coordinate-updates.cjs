// Generates research deliverables only. Never writes dist or applies map updates.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const audit=JSON.parse(fs.readFileSync(path.join(__dirname,'ginkgo-coordinate-audit.source.json'),'utf8'));
const inventory=JSON.parse(fs.readFileSync(path.join(__dirname,'ginkgo-spots.json'),'utf8'));
const targets=inventory.spots.filter(s=>!s.existingSpotId&&s.ginkgo.present===true);
const expected=new Set(targets.map(s=>s.id));
assert.equal(expected.size,36);
const seen=new Set();
const validPoint=p=>p&&Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&p.lat>=24&&p.lat<=46&&p.lng>=122&&p.lng<=146;
for(const r of audit.records){
  assert.ok(expected.has(r.id)&&!seen.has(r.id),r.id); seen.add(r.id);
  assert.deepEqual(r.currentCoordinates,{lat:null,lng:null});
  assert.equal(r.entranceVerified,false);
  const f=r.coordinateEvidence;
  assert.match(f.sourceUrl,/^https:\/\//);
  assert.ok(f.evidence&&f.notes&&r.identityAndGinkgoSources.length);
  assert.ok(!/AIza[0-9A-Za-z_-]{20,}/.test(JSON.stringify(r)));
  if(r.eligibleForAreaMarkerUpdate){
    assert.ok(r.reviewStatus.startsWith('ready_'));
    assert.ok(validPoint(r.proposedCoordinates),r.id);
    assert.deepEqual(r.proposedCoordinates,{lat:f.lat,lng:f.lng});
    assert.equal(r.candidateCoordinates,null);
    assert.ok(!['unverified_map_view_center','unresolved','campus_reference','named_approach'].includes(f.kind));
    assert.notEqual(f.sourceType,'operator_map_center_crosschecked');
  }else{
    assert.ok(!r.reviewStatus.startsWith('ready_'));
    assert.equal(r.proposedCoordinates,null);
    if(r.candidateCoordinates)assert.ok(validPoint(r.candidateCoordinates));
  }
  for(const p of f.alternates||[])assert.ok(validPoint(p));
}
assert.equal(seen.size,36);
const ready=audit.records.filter(r=>r.eligibleForAreaMarkerUpdate);
const held=audit.records.filter(r=>!r.eligibleForAreaMarkerUpdate);
assert.equal(ready.length,25);assert.equal(held.length,11);
assert.equal(ready.filter(r=>r.viewingAreaConfirmed).length,2);
const updates={
  schemaVersion:'1.0',reviewedAt:audit.reviewedAt,status:'applied_locally_25_area_pins_11_withheld',
  coordinateSystem:'WGS84',targetSource:'research/ginkgo-inventory.source.json',
  mergeKey:'id',allowedChanges:['lat','lng','coordinateReview'],
  precondition:'Existing lat and lng must both be null; fail rather than overwrite. Only use if venue-area schematic markers are accepted.',
  updates:ready.map(r=>({id:r.id,expected:r.currentCoordinates,lat:r.proposedCoordinates.lat,lng:r.proposedCoordinates.lng,
    coordinateReview:{reviewedAt:audit.reviewedAt,kind:r.coordinateEvidence.kind,label:r.coordinateEvidence.label,
      viewingAreaConfirmed:r.viewingAreaConfirmed,entranceVerified:false,sourceUrl:r.coordinateEvidence.sourceUrl,
      sourceType:r.coordinateEvidence.sourceType,dataUrl:r.coordinateEvidence.dataUrl||null,
      note:r.coordinateEvidence.notes,displayDisclaimer:'景點區域示意，非已核實入口或單株位置'}})),
  withheldIds:held.map(r=>r.id)
};
const seed=JSON.parse(fs.readFileSync(path.join(__dirname,'ginkgo-inventory.source.json'),'utf8'));
for(const u of updates.updates){
  const source=seed.spots.find(s=>s.id===u.id);
  const generated=inventory.spots.find(s=>s.id===u.id);
  assert.deepEqual(source.coordinates,{lat:u.lat,lng:u.lng});
  assert.deepEqual(source.coordinateReview,u.coordinateReview);
  assert.deepEqual(generated.coordinates,source.coordinates);
  assert.deepEqual(generated.coordinateReview,source.coordinateReview);
}
for(const id of updates.withheldIds){
  assert.ok(!seed.spots.find(s=>s.id===id).coordinates);
  assert.equal(inventory.spots.find(s=>s.id===id).coordinates,null);
}
const labels={ready_viewing_area:'可用・觀賞區代表點',ready_area_marker:'可用・景點區域示意',hold_view_center_only:'暫緩・僅視角中心',hold_access_or_tree_location:'暫緩・樹位／通行待核',unresolved:'暫緩・無可靠座標'};
const escape=s=>String(s).replace(/\|/g,'／').replace(/\n/g,' ');
const coord=r=>{const p=r.proposedCoordinates||r.candidateCoordinates;return p?p.lat+', '+p.lng:'未取得';};
let report='# 36 筆銀杏景點座標核對\n\n核對日期：'+audit.reviewedAt+'。已套用至本機網站：**新增25個審核後標記，共85個標記，11筆仍為清單限定**。尚未部署。\n\n'
+'## 結論與精度\n\n'
+'36 筆均有核對紀錄；25 筆可作區域示意更新，11 筆暫緩。25 筆中只有 2 筆是銀杏觀賞區代表點，其餘 23 筆是景點／道路區域示意，不是精確樹位。若要求全部必須是銀杏精確位置，這 23 筆仍應暫緩。\n\n'
+'座標系統為 WGS84；小數位數沿用來源，不代表測量精度。所有點均未認證為可導航入口、停車場或無障礙入口；不保證目前開放或當下葉況。\n\n'
+'## 逐筆清單\n\n| 景點／ID | 座標（緯度、經度） | 核對結果 | 座標來源 |\n|---|---|---|---|\n'
+audit.records.map(r=>'| '+escape(r.zh)+'<br>'+r.id+' | '+coord(r)+(r.eligibleForAreaMarkerUpdate?'':'（僅候選，不匯入）')+' | '+labels[r.reviewStatus]+' | [來源]('+r.coordinateEvidence.sourceUrl+') |').join('\n')
+'\n\n## 判斷與證據\n\n'
+audit.records.map(r=>'### '+r.zh+' · '+r.id+'\n\n'
+'- 結論：'+r.reviewDecision+'\n'
+'- 位置語意：'+r.coordinateEvidence.label+'（'+r.coordinateEvidence.kind+'）。\n'
+'- 座標證據：'+r.coordinateEvidence.evidence+'\n'
+'- 注意：'+r.coordinateEvidence.notes+'\n'
+'- 座標來源：['+r.coordinateEvidence.sourceType+']('+r.coordinateEvidence.sourceUrl+')。\n'
+(r.coordinateEvidence.dataUrl?'- 可追溯地標資料：[原始地圖資料]('+r.coordinateEvidence.dataUrl+')。\n':'')
+(r.coordinateEvidence.crosscheckUrl?'- 交叉核對：[補充來源]('+r.coordinateEvidence.crosscheckUrl+')。\n':'')
+'- 景點身分／銀杏資料來源：'+r.identityAndGinkgoSources.map(s=>'['+escape(s.title)+']('+s.url+')').join('、')+'。\n'
+(r.coordinateEvidence.alternates?'- 同園另有 '+r.coordinateEvidence.alternates.length+' 個官方觀賞代表位置，保存在完整核對檔；不另建分享網址或標記。\n':'')
).join('\n')
+'\n## 更新檔與匯入約定\n\n'
+'- 完整核對與未採用候選：research/ginkgo-coordinate-audit.source.json（36 筆）。\n'
+'- 已套用更新紀錄：research/ginkgo-coordinate-updates.json（僅 25 筆通過項目）；11 筆暫緩項目只列 ID，不帶入座標。\n'
+'- 以既有 id 合併，不新增重複景點、不改分享網址、名稱、地址、楓／杏時段或週末儲存鍵。\n'
+'- 套用前核對原 lat/lng 均為 null；有既有座標時必須停止，不能直接覆寫。來源資料應先合併至 ginkgo-inventory.source.json，再依既有產製流程更新，不能只手改生成檔。產製器已加入座標核對表白名單，驗證座標、精度、來源與暫緩項目；本更新檔是可追溯的套用紀錄，不是可直接執行的遷移程式。\n'
+'- 沿用日本地名＋地址的 Google Maps 搜尋網址，不把示意點改成導航目的地。新增 coordinateReview 是後續匯入者需保留的精度中介資料；網站若使用這些點，必須保留區域示意說明。\n'
+'- 不以這次定位推定銀杏見頃；未知、候選與衝突時段保持原狀。\n'
+'- 重新產出：node research/prepare-ginkgo-coordinate-updates.cjs --patch（輸出 apply_patch 內容，不寫檔）；檢查：node research/prepare-ginkgo-coordinate-updates.cjs --check。\n';
const outputs=new Map([['research/ginkgo-coordinate-updates.json',JSON.stringify(updates,null,2)+'\n'],['GINKGO-COORDINATES.md',report]]);
if(process.argv.includes('--check')){
 for(const [file,body]of outputs)assert.equal(fs.readFileSync(path.join(root,file),'utf8'),body,file+' is stale');
 console.log('Coordinate audit verified: 36 reviewed, 25 locally applied area-marker updates, 11 withheld.');
}else if(process.argv.includes('--patch')){
 console.log('*** Begin Patch');
 for(const [file,body]of outputs){
 const full=path.join(root,file);console.log((fs.existsSync(full)?'*** Update File: ':'*** Add File: ')+full);
 if(fs.existsSync(full)){console.log('@@');for(const line of fs.readFileSync(full,'utf8').trimEnd().split('\n'))console.log('-'+line);}
 for(const line of body.trimEnd().split('\n'))console.log('+'+line);
 }console.log('*** End Patch');
}else console.log('Use --check or --patch; no app files are modified.');
