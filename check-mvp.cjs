const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const markup=fs.readFileSync(`${__dirname}/dist/index.html`,'utf8');
const controls=markup.match(/<header class="explore-controls">([\s\S]*?)<\/header>/)[1];
assert.doesNotMatch(markup,/id="mapHint"|楓葉紅了嗎？銀杏黃了嗎？/);
assert.doesNotMatch(controls,/brand-row|brand-mark|trigger-caption|週末賞楓地圖|金澤・富山・東京|id="aboutButton"/);
assert.match(controls,/id="areaValue">全部地區/);
assert.match(controls,/id="peakValue">不限見頃/);
assert.match(controls,/id="areaFilter"[^>]*aria-label="地區：全部地區"/);
assert.match(controls,/id="peakFilter"[^>]*aria-label="例年見頃：不限見頃，可複選"/);
assert.match(markup,/<div class="foliage-legend"[^>]*>[\s\S]*?id="aboutButton"[\s\S]*?<\/button><\/div>/);
assert.equal((markup.match(/id="aboutButton"/g)||[]).length,1);
const toolbar=markup.match(/<div class="heading-tools">([\s\S]*?)<\/div>/)[1];
assert.ok(toolbar.indexOf('id="copyJapanese"')<toolbar.indexOf('id="shareSpot"'));
assert.ok(toolbar.indexOf('id="shareSpot"')<toolbar.indexOf('id="closeDetail"'));
assert.equal((markup.match(/id="shareSpot"/g)||[]).length,1);
assert.match(toolbar, /id="shareSpot"[^>]*aria-label="分享景點"/);
assert.doesNotMatch(toolbar.match(/<button id="shareSpot"[\s\S]*?<\/button>/)[0], /<span>/);
const source = ['tokyo-spots.js','foliage-data.js','foliage.js','sheet-ui.js','filters-ui.js','spot-tools.js','app.js'].map(file=>fs.readFileSync(`${__dirname}/dist/${file}`, 'utf8')).join('\n');
function boot(initial='{}', denyStorage=false, href='http://localhost:4173/'){ 
  const elements=new Map();
  const memory={value:initial};
  const document={
    hidden:false,body:{classList:{add(){},remove(){}}},
    getElementById(id){
      if(!elements.has(id)) elements.set(id,{innerHTML:'',textContent:'',hidden:false,value:'all',dataset:{},style:{},scrollTop:0,open:false,addEventListener(type,handler){(this.listeners||={})[type]=handler;},setAttribute(){},focus(){this.focused=true;},select(){this.selected=true;},showModal(){this.open=true;},close(){this.open=false;},classList:{add(){},remove(){},toggle(){}}});
      return elements.get(id);
    },
    querySelectorAll(){return [];}, querySelector(){return null;}, addEventListener(){}
  };
  const location=new URL(href);
  const context=vm.createContext({document, navigator:{}, URL, URLSearchParams, window:{location,history:{pushState(state,title,url){location.href=url;},replaceState(state,title,url){location.href=url;}},innerHeight:850,matchMedia(){return {matches:true};},addEventListener(){}}, Date, setTimeout(){},clearTimeout(){}, localStorage:{
    getItem(){if(denyStorage) throw Error('disabled'); return memory.value;},
    setItem(key,value){if(denyStorage) throw Error('disabled'); memory.value=value;}
  }});
  vm.runInContext(source,context);
  return {run(code){return vm.runInContext(code,context);},memory,elements};
}
const app=boot();
assert.match(markup,/<meta name="referrer" content="strict-origin-when-cross-origin">/);
const mapSetup=fs.readFileSync(`${__dirname}/dist/app.js`,'utf8').split("const map = ")[1].split('\nfunction markerIcon')[0];
function checkTileSetup(protocol){
  const calls=[],notice={hidden:true,textContent:''},handlers={};
  const context=vm.createContext({
    window:{location:{protocol}},
    document:{getElementById(){return notice;}},
    L:{map(){return {setView(){return this;}};},control:{zoom(){return {addTo(){}};}},
      tileLayer(url,options){calls.push({url,options});return {on(name,fn){handlers[name]=fn;return this;},addTo(){return this;}};}}
  });
  vm.runInContext('const map = '+mapSetup,context);
  return {calls,notice,handlers};
}
const fileTiles=checkTileSetup('file:');
assert.equal(fileTiles.calls.length,0);
assert.equal(fileTiles.notice.hidden,false);
assert.match(fileTiles.notice.textContent,/本機檔案/);
for(const protocol of ['http:','https:']){
  const result=checkTileSetup(protocol);
  assert.equal(result.calls.length,1);
  assert.equal(result.calls[0].url,'https://tile.openstreetmap.org/{z}/{x}/{y}.png');
  assert.match(result.calls[0].options.attribution,/https:\/\/www.openstreetmap.org\/copyright/);
  assert.equal(result.notice.hidden,true);
  result.handlers.tileerror();
  assert.equal(result.notice.hidden,false);
  assert.match(result.notice.textContent,/景點清單/);
  assert.equal(result.calls.length,1); // no fallback host or retry loop
}
const fileApp=boot('{}',false,'file:///preview/index.html');
assert.equal(fileApp.run('spots.length'),96);
assert.equal(fileApp.elements.get('mapServiceNotice').hidden,false);
function checkListShortcuts(instance){
  const html=instance.elements.get('spotList').innerHTML;
  assert.doesNotMatch(html,/例年見頃|class="list-peak"|class="season-values"|species-season/);
  const visible=instance.run('filteredSpots().map(s=>({id:s.id,x:xUrl(s.searchName||s.ja),maps:mapsUrl(s)}))');
  const cards=[...html.matchAll(/<article[^>]*data-spot-id="([^"]+)"[^>]*>([\s\S]*?)<\/article>/g)];
  assert.equal(cards.length,visible.length);
  for(const [,id,card] of cards){
    const expected=visible.find(s=>s.id===id);
    const links=[...card.matchAll(/<a class="spot-quick-link (x|maps)" href="([^"]+)"([^>]*)>([\s\S]*?)<\/a>/g)];
    assert.equal(links.length,2,id);
    assert.equal(links[0][2],expected.x,id);
    assert.equal(links[1][2],expected.maps,id);
    for(const link of links){
      assert.match(link[3],/target="_blank"/);
      assert.match(link[3],/rel="noopener noreferrer"/);
      assert.match(link[3],/aria-label="[^\"]+"/);
      assert.match(link[3],/title="[^\"]+"/);
      assert.doesNotMatch(link[3],/data-open-spot/);
      assert.doesNotMatch(link[4],/>Google Maps<|>最新圖片</);
    }
    assert.doesNotMatch(card.match(/<button class="spot-summary"[\s\S]*?<\/button>/)[0],/<a /);
    const selector=card.match(/<select id="list-weekend-([^"]+)"([^>]*)>([\s\S]*?)<\/select>/);
    assert.ok(selector,id);
    assert.equal(selector[1],id);
    const footer=card.slice(card.indexOf('<div class="spot-card-footer">'));
    assert.ok(footer.indexOf('<div class="list-weekend-field">')<footer.indexOf('<div class="spot-quick-actions"'),id);
    assert.match(footer,/<select[\s\S]*<div class="spot-quick-actions"/);
    assert.match(card,new RegExp(`<label for="list-weekend-${id}">我的賞楓週末</label>`));
    assert.match(selector[2],/data-weekend-origin="list"/);
    assert.match(selector[2],new RegExp(`data-id="${id}"`));
    assert.equal(selector[3],instance.run(`optionMarkup(saved[${JSON.stringify(id)}]||'')`));
    assert.doesNotMatch(card.match(/<button class="spot-summary"[\s\S]*?<\/button>/)[0],/<select /);
  }
}
checkListShortcuts(app);
const multiPeak=boot('{"tokyo-showa":"2026-11-14"}');
assert.equal(multiPeak.run('selectedPeakValues().length'),0);
multiPeak.run('renderChoicePanel("peak");document.getElementById("filterDialog").showModal();togglePeak("12-early");togglePeak("11-late");updatePeakChoices()');
assert.equal(multiPeak.run('JSON.stringify(selectedPeakValues())'),'["11-late","12-early"]');
assert.equal(multiPeak.elements.get('filterDialog').open,true);
assert.equal(multiPeak.elements.get('filterDialogFooter').hidden,false);
assert.equal(multiPeak.elements.get('filterSelectionSummary').textContent,'已選 2 個時段・符合任一時段即可');
assert.equal(multiPeak.elements.get('peakValue').textContent,'11月下旬、12月上旬');
assert.match(multiPeak.elements.get('filterQuickChoices').innerHTML,/role="checkbox" aria-checked="true"/);
multiPeak.run('renderChoicePanel("peak")');
assert.match(multiPeak.elements.get('filterChoices').innerHTML,/data-choice="11-late" role="checkbox" aria-checked="true"/);
assert.match(multiPeak.elements.get('filterChoices').innerHTML,/data-choice="12-early" role="checkbox" aria-checked="true"/);
assert.match(multiPeak.elements.get('filterQuickChoices').innerHTML,/aria-checked="false"/);
assert.equal(multiPeak.run(`spots.every(s=>matchesPeak(s,['11-late','12-early'])===(matchesPeak(s,'11-late')||matchesPeak(s,'12-early')))`),true);
assert.equal(multiPeak.run(`foliageKind(spots.find(s=>s.id==='tokyo-showa'),['11-late','12-early'])`),'both');
assert.equal(multiPeak.run(`foliageKind(spots.find(s=>s.id==='tokyo-chiba-park'),['11-early','11-late'])`),'both');
assert.equal(multiPeak.run(`matchesPeak(spots.find(s=>s.id==='tokyo-egara'),['11-late','12-early'])`),false);
multiPeak.run('setPeak(["9-early","12-late"])');
assert.equal(multiPeak.run(`matchesPeak({peakWindow:parsePeakWindow('11月中旬')},activePeak)`),false);
multiPeak.run('setPeak(["11-late","12-early"]);setArea("tokyo-all");setFilter("2026-11-14")');
assert.equal(multiPeak.run('filteredSpots().length'),1);
assert.equal(multiPeak.run('filteredSpots()[0].id'),'tokyo-showa');
multiPeak.run('togglePeak("12-early")');
assert.equal(multiPeak.run('JSON.stringify(selectedPeakValues())'),'["11-late"]');
multiPeak.run('togglePeak("11-late")');
assert.equal(multiPeak.run('selectedPeakValues().length'),0);
assert.equal(multiPeak.elements.get('peakValue').textContent,'不限見頃');
multiPeak.run('setPeak(["11-late","12-early","12-middle"])');
assert.equal(multiPeak.elements.get('peakValue').textContent,'已選 3 個時段');
multiPeak.run('togglePeak("all");updatePeakChoices()');
assert.equal(multiPeak.elements.get('filterSelectionSummary').textContent,'不限見頃');
assert.equal(multiPeak.run('selectedPeakValues().length'),0);
assert.equal(multiPeak.run('saved["tokyo-showa"]'),'2026-11-14');
multiPeak.run('setPeak(["11-late","11-late"]);setPeak(["invalid"]);renderChoicePanel("area")');
assert.equal(multiPeak.run('JSON.stringify(selectedPeakValues())'),'["11-late"]');
assert.equal(multiPeak.elements.get('filterDialogFooter').hidden,true);
multiPeak.run('resetAllFilters()');
assert.equal(multiPeak.run('selectedPeakValues().length'),0);
assert.equal(multiPeak.run('filteredSpots().length'),96);
assert.equal(multiPeak.run('saved["tokyo-showa"]'),'2026-11-14');
console.log('PASS: list season information removed; multi-period union, chronological summaries, checkbox states, open picker, clear/last-toggle reset, disjoint windows, species markers, combined filters and saved-plan preservation.');
const listWeekends=boot();
function changeListWeekend(instance,id,value){
  instance.run(`document.getElementById('spotList').listeners.change({target:{dataset:{id:${JSON.stringify(id)},weekendOrigin:'list'},value:${JSON.stringify(value)}}})`);
}
listWeekends.run('openSpot("kenrokuen");toggleList(true)');
const nextWeekend=listWeekends.run('weekends[1].value');
changeListWeekend(listWeekends,'kenrokuen',nextWeekend);
assert.equal(JSON.parse(listWeekends.memory.value).kenrokuen,nextWeekend);
assert.equal(listWeekends.run('selectedSpotId'),'kenrokuen');
assert.equal(listWeekends.elements.get('listPanel').hidden,false);
assert.equal(listWeekends.elements.get('list-weekend-kenrokuen').focused,true);
assert.match(listWeekends.elements.get('detailWeekend').innerHTML,new RegExp(`value="${nextWeekend}" selected`));
checkListShortcuts(listWeekends);
const listReloaded=boot(listWeekends.memory.value);
checkListShortcuts(listReloaded);
changeListWeekend(listWeekends,'toyama-baba',nextWeekend);
assert.equal(listWeekends.run('selectedSpotId'),'kenrokuen');
assert.equal(listWeekends.elements.get('detailWeekend').dataset.id,'kenrokuen');
changeListWeekend(listWeekends,'kenrokuen','');
assert.equal(listWeekends.run('saved.kenrokuen'),undefined);
assert.ok(listWeekends.elements.get('detailWeekend').innerHTML.startsWith('<option value="">尚未選擇</option>'));
listWeekends.run('setFilter("unsaved");toggleList(true)');
changeListWeekend(listWeekends,'kenrokuen',nextWeekend);
assert.equal(listWeekends.run('filteredSpots().some(s=>s.id==="kenrokuen")'),false);
assert.equal(listWeekends.elements.get('closeList').focused,true);
assert.equal(listWeekends.run('selectedSpotId'),null);
checkListShortcuts(listWeekends);
listWeekends.run(`setFilter(${JSON.stringify(nextWeekend)})`);
changeListWeekend(listWeekends,'toyama-baba','');
assert.equal(listWeekends.run('filteredSpots().some(s=>s.id==="toyama-baba")'),false);
assert.equal(listWeekends.run('saved.kenrokuen'),nextWeekend);
const listDenied=boot('{}',true);
changeListWeekend(listDenied,'toyama-baba',nextWeekend);
assert.equal(listDenied.run('saved["toyama-baba"]'),nextWeekend);
assert.match(listDenied.elements.get('toast').textContent,/僅在本次頁面/);
console.log('PASS: per-card weekend options, delegated save/clear, list/detail sync, unrelated selection, reload persistence, filtered-out focus recovery, and blocked-storage fallback.');
assert.equal(app.run('spots.length'),96);
assert.equal(app.run('new Set(spots.map(s=>s.id)).size'),96);
assert.equal(app.run('tokyoSpots.length'),24);
assert.equal(app.run('tokyoSpots.every(s=>s.address && s.source && Number.isFinite(s.lat) && Number.isFinite(s.lng))'),true);
assert.equal(app.run('optionMarkup().startsWith(`<option value="">尚未選擇</option>`)'),true);
for(const [day,expected] of [['2026-10-26T12:00:00','2026-10-31'],['2026-10-31T12:00:00','2026-10-31'],['2026-11-01T12:00:00','2026-10-31'],['2026-11-02T12:00:00','2026-11-07'],['2026-12-31T12:00:00','2027-01-02']]){
  assert.equal(app.run(`getUpcomingWeekends(new Date('${day}'))[0].value`),expected);
}
for(const name of app.run('spots.map(s=>s.searchName||s.ja)')){
  const url=new URL(app.run(`xUrl(${JSON.stringify(name)})`));
  assert.equal(url.searchParams.get('q'),`"${name}" filter:images`);
  assert.equal(url.searchParams.get('f'),'live');
  assert.ok(!url.searchParams.get('q').includes('紅葉'));
}
app.run(`onSaveWeekend({target:{dataset:{id:'kenrokuen'},value:weekends[1].value}})`);
assert.ok(JSON.parse(app.memory.value).kenrokuen);
app.run(`activeWeekend=weekends[1].value`);
assert.equal(app.run('filteredSpots().length'),1);
app.run(`activeArea='toyama'`);
assert.equal(app.run('filteredSpots().length'),0);
const reloaded=boot(app.memory.value);
assert.ok(reloaded.run('saved.kenrokuen'));
reloaded.run(`onSaveWeekend({target:{dataset:{id:'kenrokuen'},value:''}})`);
assert.equal(reloaded.memory.value,'{}');
const past=boot('{"kenrokuen":"2025-11-01"}');
assert.ok(past.run('optionMarkup(saved.kenrokuen).includes("2025-11-01")'));
past.run(`activeWeekend='2025-11-01'`);
assert.equal(past.run('filteredSpots().length'),1);
assert.equal(boot('broken JSON').run('filteredSpots().length'),96);
assert.equal(boot('{}',true).run('filteredSpots().length'),96);
const expanded=boot('{"kenrokuen":"2026-11-07"}');
assert.equal(expanded.run('saved.kenrokuen'),'2026-11-07');
expanded.run(`activeArea='tokyo-all'`);
assert.equal(expanded.run('filteredSpots().length'),46);
expanded.run(`activeArea='tokyo-city'`);
assert.equal(expanded.run('filteredSpots().length'),20);
expanded.run(`activeArea='tokyo-west'`);
assert.equal(expanded.run('filteredSpots().length'),10);
expanded.run(`activeArea='tokyo-daytrip'`);
assert.equal(expanded.run('filteredSpots().length'),16);
expanded.run(`activeArea='hokuriku'`);
assert.equal(expanded.run('filteredSpots().length'),50);
expanded.run(`onSaveWeekend({target:{dataset:{id:'tokyo-rikugien'},value:weekends[1].value}}); activeArea='tokyo-all'; activeWeekend=weekends[1].value`);
assert.equal(expanded.run('filteredSpots()[0].id'),'tokyo-rikugien');
assert.equal(expanded.run('filteredSpots().length'),1);
assert.equal(boot(expanded.memory.value).run('Object.keys(saved).length'),2);
const sheetApp=boot();
sheetApp.run(`openSpot('tokyo-rikugien')`);
assert.equal(sheetApp.run('selectedSpotId'),'tokyo-rikugien');
assert.equal(sheetApp.run('sheetState'),'half');
assert.equal(sheetApp.elements.get('detailTitle').textContent,'六義園');
sheetApp.run(`setSheetState('full');openSpot('tokyo-koishikawa')`);
assert.equal(sheetApp.run('sheetState'),'full');
assert.equal(sheetApp.elements.get('detailTitle').textContent,'小石川後楽園');
sheetApp.run(`setSheetState('peek')`);
assert.equal(sheetApp.elements.get('sheetBody').hidden,true);
sheetApp.run(`setArea('hokuriku')`);
assert.equal(sheetApp.run('selectedSpotId'),null);
assert.equal(sheetApp.elements.get('detailSheet').inert,true);
sheetApp.run(`setArea('tokyo-all');openSpot('tokyo-rikugien');onSaveWeekend({target:{dataset:{id:'tokyo-rikugien'},value:weekends[1].value}});setFilter(weekends[1].value)`);
assert.equal(sheetApp.run('selectedSpotId'),'tokyo-rikugien');
sheetApp.run(`onSaveWeekend({target:{dataset:{id:'tokyo-rikugien'},value:''}})`);
assert.equal(sheetApp.run('selectedSpotId'),null);
const seasonal=boot();
assert.equal(seasonal.run('spots.filter(hasMapLocation).length'),85);
assert.equal(seasonal.run('spots.filter(s=>!hasMapLocation(s)).length'),11);
const coordinateUpdates=JSON.parse(fs.readFileSync(`${__dirname}/research/ginkgo-coordinate-updates.json`,'utf8'));
for(const update of coordinateUpdates.updates){
  const actual=seasonal.run(`spots.find(s=>s.id===${JSON.stringify(update.id)})`);
  assert.equal(actual.lat,update.lat);
  assert.equal(actual.lng,update.lng);
  assert.deepEqual(JSON.parse(JSON.stringify(actual.research.coordinateReview)),update.coordinateReview);
  assert.ok(actual.research.coordinateReview.displayDisclaimer);
  assert.equal(actual.research.coordinateReview.entranceVerified,false);
  const direct=boot('{}',false,'http://localhost:4173/?spot='+update.id);
  assert.equal(direct.run('selectedSpotId'),update.id);
  assert.equal(direct.elements.get('detailMapPrecision').textContent,update.coordinateReview.displayDisclaimer);
}
for(const id of coordinateUpdates.withheldIds){
  assert.equal(seasonal.run(`hasMapLocation(spots.find(s=>s.id===${JSON.stringify(id)}))`),false);
}
// Original pins must remain exactly unchanged.
const originalPins=vm.runInNewContext(fs.readFileSync(`${__dirname}/dist/tokyo-spots.js`,'utf8')+'\nfunction parsePeakWindow(){return null;}\n'+fs.readFileSync(`${__dirname}/dist/app.js`,'utf8').split('initFoliageData(spots);')[0]+'\nspots');
for(const pin of originalPins){
  assert.equal(seasonal.run(`spots.find(s=>s.id===${JSON.stringify(pin.id)}).lat`),pin.lat);
  assert.equal(seasonal.run(`spots.find(s=>s.id===${JSON.stringify(pin.id)}).lng`),pin.lng);
}
assert.equal(seasonal.run(`matchesPeak({peakWindow:parsePeakWindow('10月中旬〜11月上旬')},'11-early')`),true);
assert.equal(seasonal.run(`matchesPeak({peakWindow:parsePeakWindow('10月中旬〜11月上旬')},'11-middle')`),false);
assert.equal(seasonal.run(`matchesPeak({peakWindow:parsePeakWindow('11月中旬〜12月上旬')},'11-late')`),true);
assert.equal(seasonal.run(`matchesPeak({peakWindow:parsePeakWindow('11月中旬')},'11-early')`),false);
assert.equal(seasonal.run(`matchesPeak({peakWindow:null},'11-early')`),false);
assert.equal(seasonal.run(`matchesPeak({peakWindow:null},'all')`),true);
for(const [area,count] of [['ishikawa-all',24],['toyama-all',26],['tokyo-prefecture',30],['kanagawa',8],['kamakura',3],['hakone',2],['saitama',3],['tochigi',2],['chiba',2],['ibaraki',1]]){
  seasonal.run(`setArea('${area}')`);
  assert.equal(seasonal.run('filteredSpots().length'),count,area);
}
seasonal.run(`setArea('tokyo-city');setPeak('11-late')`);
assert.equal(seasonal.run('filteredSpots().length'),9);
seasonal.run(`setArea('tokyo-all')`);
assert.equal(seasonal.run('filteredSpots().length'),26);
checkListShortcuts(seasonal);
seasonal.run(`setArea('tokyo-city')`);
seasonal.run(`openSpot('tokyo-rikugien');setPeak('9-early')`);
assert.equal(seasonal.run('filteredSpots().length'),0);
checkListShortcuts(seasonal);
assert.equal(seasonal.run('selectedSpotId'),null);
seasonal.run(`setPeak('11-late');onSaveWeekend({target:{dataset:{id:'tokyo-rikugien'},value:weekends[1].value}});setFilter(weekends[1].value)`);
assert.equal(seasonal.run('filteredSpots().length'),1);
assert.equal(seasonal.run('filteredSpots()[0].id'),'tokyo-rikugien');
seasonal.run('resetAllFilters()');
assert.equal(seasonal.run('filteredSpots().length'),96);
assert.ok(seasonal.run('saved["tokyo-rikugien"]'));
checkListShortcuts(seasonal);
const ginkgo=boot('{"kenrokuen":"2026-11-07","toyama-baba":"2026-11-14"}');
assert.equal(ginkgo.run('saved.kenrokuen'),'2026-11-07');
assert.equal(ginkgo.run('saved["toyama-baba"]'),'2026-11-14');
assert.equal(ginkgo.run('spots.filter(s=>s.research).length'),45);
assert.equal(ginkgo.run('spots.some(s=>s.id==="tokyo-zenpukuji-river"||s.id==="tokyo-wadabori")'),false);
assert.equal(ginkgo.run('spots.filter(s=>s.research&&!s.research.existingSpotId&&hasMapLocation(s)).length'),25);
assert.equal(ginkgo.run('spots.filter(s=>s.research&&!s.research.existingSpotId&&!hasMapLocation(s)).length'),11);
assert.equal(ginkgo.run('spots.find(s=>s.id==="kenrokuen").species.ginkgo.peak'),null);
assert.equal(ginkgo.run('spots.find(s=>s.id==="kenrokuen").species.maple.peak'),null);
assert.equal(ginkgo.run('spots.find(s=>s.id==="tokyo-gaien").species.maple.present'),null);
assert.equal(ginkgo.run('spots.find(s=>s.id==="tokyo-gaien").legacyPeak'),'11月中旬〜12月上旬');
for(const [id,slot,kind,match] of [
  ['tokyo-showa','11-late','both',true],['tokyo-showa','12-early','maple',true],['tokyo-showa','12-middle','unknown',false],
  ['tokyo-gaien','11-late','ginkgo',true],['tokyo-gaien','12-early','unknown',false],
  ['tokyo-hikarigaoka','11-late','both',true],['tokyo-hikarigaoka','12-early','maple',true],
  ['tokyo-chiba-park','11-early','maple',true],['tokyo-chiba-park','11-late','ginkgo',true],
  ['tokyo-sankeien','12-late','both',true],['toyama-baba','12-early','ginkgo',true],
  ['tokyo-egara','12-early','unknown',false],['tokyo-yoyogi','11-late','unknown',false],['kenrokuen','11-middle','unknown',false]
]){
  assert.equal(ginkgo.run(`foliageKind(spots.find(s=>s.id==='${id}'),'${slot}')`),kind,`${id}/${slot}`);
  assert.equal(ginkgo.run(`matchesPeak(spots.find(s=>s.id==='${id}'),'${slot}')`),match,`${id}/${slot}`);
}
ginkgo.run('var L={divIcon:options=>options};activePeak="11-late"');
for(const id of ['kenrokuen','toyama-baba','tokyo-showa']){
  ginkgo.run(`delete saved['${id}']`);
  assert.doesNotMatch(ginkgo.run(`markerIcon(spots.find(s=>s.id==='${id}')).html`),/is-saved/);
  ginkgo.run(`onSaveWeekend({target:{dataset:{id:'${id}'},value:'2026-11-14'}})`);
  assert.match(ginkgo.run(`markerIcon(spots.find(s=>s.id==='${id}')).html`),/is-saved/);
  ginkgo.run(`onSaveWeekend({target:{dataset:{id:'${id}'},value:''}})`);
  assert.doesNotMatch(ginkgo.run(`markerIcon(spots.find(s=>s.id==='${id}')).html`),/is-saved/);
}
// Restore the existing fixture used by the following saved-weekend filter test.
ginkgo.run('saved["toyama-baba"]="2026-11-14"');
const pinCss=fs.readFileSync(`${__dirname}/dist/map-ui.css`,'utf8');
assert.match(pinCss,/\.marker-pin\.is-saved\{background:var\(--red\);color:#fff\}/);
assert.match(pinCss,/background:var\(--card\);color:#6b4938/);
assert.doesNotMatch(pinCss.match(/\.maple-marker\.is-selected \.marker-pin\{([^}]+)\}/)[1],/background:|color:/);
assert.doesNotMatch(fs.readFileSync(`${__dirname}/dist/design-system.css`,'utf8'),/\.marker-pin\.foliage-(ginkgo|both)\{background:/);
assert.match(ginkgo.run('markerIcon(spots.find(s=>s.id==="tokyo-showa")).html'),/envelope-icon/);
ginkgo.run('activePeak="12-early"');
assert.doesNotMatch(ginkgo.run('markerIcon(spots.find(s=>s.id==="tokyo-showa")).html'),/envelope-icon/);
assert.match(ginkgo.run('markerIcon(spots.find(s=>s.id==="tokyo-showa")).html'),/>楓</);
ginkgo.run('activePeak="11-late"');
assert.match(ginkgo.run('markerIcon(spots.find(s=>s.id==="tokyo-gaien")).html'),/>杏</);
ginkgo.run('resetAllFilters();saved["toyama-gofuku"]="2026-11-21";setFilter("2026-11-21")');
assert.equal(ginkgo.elements.get('mapEmptyTitle').textContent,'符合的景點已列於清單');
assert.equal(ginkgo.elements.get('openUnmappedList').hidden,false);
assert.equal(ginkgo.elements.get('mapEmpty').hidden,false);
checkListShortcuts(ginkgo);
ginkgo.run('resetAllFilters();openSpot("toyama-gofuku")');
assert.equal(ginkgo.elements.get('detailLocationStatus').hidden,false);
ginkgo.run('resetAllFilters();openSpot("toyama-baba")');
assert.equal(ginkgo.run('selectedSpotId'),'toyama-baba');
assert.equal(ginkgo.elements.get('detailLocationStatus').hidden,true);
assert.match(ginkgo.elements.get('detailPeak').innerHTML,/銀杏/);
assert.match(ginkgo.elements.get('detailPeak').innerHTML,/11月中旬/);
ginkgo.run('setFilter("2026-11-14")');
assert.equal(ginkgo.run('filteredSpots().length'),1);
assert.equal(ginkgo.run('filteredSpots()[0].id'),'toyama-baba');
const newLink=boot('{}',false,'https://maple.example/?spot=tokyo-hikarigaoka');
assert.equal(newLink.run('selectedSpotId'),'tokyo-hikarigaoka');
assert.equal(newLink.run('spotShareUrl("tokyo-hikarigaoka")'),'https://maple.example/?spot=tokyo-hikarigaoka');
console.log('PASS: 45 merged ginkgo records, 85 mapped destinations (25 audited new pins), 11 list-only, original 60 pins unchanged, per-pin precision metadata and deep links, independent species seasons, marker variants and preserved saved weekends.');
console.log('PASS: every rendered destination has independent, accessible, icon-only X/Maps links with exact per-spot URLs, including alternate X search names, filtered results and empty results.');
console.log('PASS: 96 destinations, date/storage/X rules, sheet behavior, independent species seasons, inclusive season overlap, prefecture groups, three-way intersection, empty states, and reset without deleting saved plans.');
async function checkSpotTools(){
  const linked=boot('{"kenrokuen":"2026-11-07"}',false,'https://maple.example/?area=hokuriku&spot=tokyo-rikugien');
  assert.equal(linked.run('selectedSpotId'),'tokyo-rikugien');
  assert.equal(linked.run('activeArea'),'all');
  assert.equal(linked.run('saved.kenrokuen'),'2026-11-07');
  assert.equal(linked.run(`spotShareUrl('tokyo-rikugien')`),'https://maple.example/?spot=tokyo-rikugien');
  linked.run(`openSpot('tokyo-koishikawa')`);
  assert.equal(linked.run(`new URL(window.location.href).searchParams.get('spot')`),'tokyo-koishikawa');
  linked.run(`window.location.search='?spot=kenrokuen';restoreSpotFromUrl()`);
  assert.equal(linked.run('selectedSpotId'),'kenrokuen');
  linked.run(`window.location.search='';restoreSpotFromUrl()`);
  assert.equal(linked.run('selectedSpotId'),null);
  linked.run(`openSpot('kenrokuen');closeDetail(false)`);
  assert.equal(linked.run(`new URL(window.location.href).searchParams.has('spot')`),false);
  const invalid=boot('{}',false,'https://maple.example/?spot=does-not-exist');
  assert.equal(invalid.run('selectedSpotId'),null);
  assert.equal(invalid.run(`window.location.search`),'');
  assert.match(invalid.elements.get('toast').textContent,/找不到/);
  const copy=boot();
  copy.run(`openSpot('tokyo-koishikawa');navigator.clipboard={async writeText(text){navigator.copied=text;}}`);
  for(const [field,label,expected] of [['ja','日文名稱','小石川後楽園'],['zh','繁中名稱','小石川後樂園'],['address','地址','東京都文京区後楽1-6-6']]){
    await copy.run(`copySpotField('${field}','${label}')`);
    assert.equal(copy.run('navigator.copied'),expected);
    assert.equal(copy.elements.get('toast').textContent,`已複製${label}`);
  }
  copy.run(`navigator.clipboard={async writeText(){throw Error('denied');}}`);
  await copy.run(`copySpotField('ja','日文名稱')`);
  assert.equal(copy.elements.get('spotToolsDialog').open,true);
  assert.equal(copy.elements.get('spotToolsText').value,'小石川後楽園');
  assert.equal(copy.elements.get('spotToolsText').selected,true);
  assert.equal(copy.elements.get('manualCopyHint').hidden,false);
  copy.run(`document.getElementById('spotToolsDialog').close();navigator.share=async data=>{navigator.shared=data;}`);
  await copy.run('shareSpot()');
  assert.equal(copy.run('navigator.shared.url'),'http://localhost:4173/?spot=tokyo-koishikawa');
  assert.equal(copy.elements.get('spotToolsDialog').open,false);
  copy.run(`navigator.share=async()=>{throw Object.assign(Error('cancel'),{name:'AbortError'});}`);
  await copy.run('shareSpot()');
  assert.equal(copy.elements.get('spotToolsDialog').open,false);
  copy.run(`navigator.share=async()=>{throw Error('unsupported');}`);
  await copy.run('shareSpot()');
  assert.equal(copy.elements.get('spotToolsDialog').open,true);
  assert.equal(copy.elements.get('localShareNotice').hidden,false);
  copy.run(`document.getElementById('spotToolsDialog').close();delete navigator.share;window.location.href='https://maple.example/?area=tokyo-all#old'`);
  await copy.run('shareSpot()');
  assert.equal(copy.elements.get('spotToolsText').value,'https://maple.example/?spot=tokyo-koishikawa');
  assert.equal(copy.elements.get('localShareNotice').hidden,true);
  console.log('PASS: spot deep links, filter conflicts, invalid IDs, clean share URLs, history restoration, all three exact copy values, clipboard denial, native share payload/cancellation/failure and desktop fallback.');
}
checkSpotTools().catch(error=>{console.error(error);process.exitCode=1;});
