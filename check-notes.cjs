const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/dist/index.html','utf8');
const files=['tokyo-spots.js','foliage-data.js','fuji-karuizawa-data.js','foliage.js','notes-ui.js','sheet-ui.js','filters-ui.js','spot-tools.js','collaboration-ui.js','app.js'];
const source=files.map(file=>fs.readFileSync(__dirname+'/dist/'+file,'utf8')).join('\n')
  .replace("if(typeof initCollaboration==='function')initCollaboration();",'');
function boot(initial={}){
  const memory=new Map(Object.entries(initial)),elements=new Map(),location=new URL('https://example.test/');
  let denied=false;
  const get=id=>{
    if(!elements.has(id))elements.set(id,{value:'',textContent:'',innerHTML:'',hidden:false,dataset:{},style:{},children:[],scrollTop:0,
      classList:{add(){},remove(){},toggle(){}},addEventListener(type,fn){(this.listeners||={})[type]=fn;},
      setAttribute(name,value){this[name]=value;},focus(){this.focused=true;},showModal(){this.open=true;},close(){this.open=false;},
      replaceChildren(){this.children=[];},append(...nodes){this.children.push(...nodes);}});
    return elements.get(id);
  };
  const context=vm.createContext({console,URL,URLSearchParams,Date,Intl,Set,Map,Promise,setTimeout(){},clearTimeout(){},navigator:{},
    window:{location,innerHeight:844,matchMedia:()=>({matches:true}),confirm:()=>false,addEventListener(){},history:{replaceState(a,b,url){location.href=url;},pushState(a,b,url){location.href=url;}}},
    localStorage:{getItem:key=>memory.get(key)||null,setItem(key,value){if(denied)throw Error('儲存空間不可用');memory.set(key,value);}},
    document:{body:{classList:{add(){},remove(){},toggle(){}}},getElementById:get,querySelectorAll:()=>[],querySelector:()=>null,addEventListener(){},createElement:()=>({})}
  });
  vm.runInContext(source,context);
  const run=code=>vm.runInContext(code,context);
  return {run,get,memory,deny(){denied=true;},input(text){get('spotNotesInput').value=text;get('spotNotesInput').listeners.input();}};
}
const noteKey='hokuriku-maple-notes-v1',weekendKey='hokuriku-maple-weekends-v1',plan='ABCDEFGHIJKLMNOPQRST';
async function openShared(app){
  app.run(`cloudState.authReady=true;cloudState.user={uid:'alice'};var changes,notesChanges,notesError;var stops=0;var noteCalls=[];
    cloudState.api={getPlan:async id=>({id,title:'秋季共編',ownerUid:'alice'}),
      listPlans:async()=>[],watchAccess:()=>()=>stops++,watchPlan:(id,callback)=>{changes=callback;return ()=>stops++;},
      watchNotes:(id,callback,error)=>{notesChanges=callback;notesError=error;return ()=>stops++;},
      writeNote:async(id,spot,text,revision)=>{noteCalls.push({id,spot,text,revision});return {text,revision:revision+1,updatedBy:'alice'};},
      writeWeekend:async()=>{throw Error('筆記不應改寫週末');}};`);
  await app.run(`cloudOpen('${plan}')`);
  app.run("changes([],{fromCache:false,pending:false});notesChanges([],{fromCache:false,pending:false});openSpot('kenrokuen')");
}
(async()=>{
  const regional=boot({[weekendKey]:JSON.stringify({kenrokuen:'2026-11-07'})});
  const regionalIds=regional.run('regionalFoliageResearch.spots.map(s=>s.id)');
  for(const id of regionalIds){
    regional.run(`openSpot('${id}');notesStartEditing()`);regional.input(`${id}\n交通備忘 🍁`);
    await regional.run('notesSave()');
    assert.equal(regional.get('spotNotesText').textContent,`${id}\n交通備忘 🍁`);
  }
  const regionalReload=boot(Object.fromEntries(regional.memory));
  for(const id of regionalIds){
    regionalReload.run(`openSpot('${id}')`);
    assert.equal(regionalReload.get('spotNotesText').textContent,`${id}\n交通備忘 🍁`);
  }
  const regionalLocalNotes=regionalReload.memory.get(noteKey);
  await openShared(regionalReload);
  for(const id of regionalIds){
    regionalReload.run(`openSpot('${id}');notesStartEditing()`);regionalReload.input(`共編 ${id}`);
    await regionalReload.run('notesSave()');
    assert.equal(regionalReload.run('noteCalls.at(-1).spot'),id);
    assert.equal(regionalReload.get('spotNotesText').textContent,`共編 ${id}`);
  }
  assert.equal(regionalReload.memory.get(noteKey),regionalLocalNotes);
  assert.equal(regionalReload.memory.get(weekendKey),JSON.stringify({kenrokuen:'2026-11-07'}));
  await regionalReload.run('cloudAuthChanged(null)');
  assert.equal(regionalReload.get('spotNotesText').textContent,`${regionalIds.at(-1)}\n交通備忘 🍁`);
  console.log('PASS: all 13 selected regional destinations retain separate local notes across reload, scope cloud notes by destination and restore browser data on sign-out.');
  assert.ok(html.indexOf('id="detailWeekend"')<html.indexOf('id="spotNotesHeading"'));
  assert.ok(html.indexOf('id="spotNotesHeading"')<html.indexOf('class="season-row'));
  assert.match(html,/id="spotNotesEditor" hidden inert/);
  assert.match(html,/id="spotNotesStatus"[^>]*role="status"/);
  const local=boot({[weekendKey]:JSON.stringify({kenrokuen:'2026-11-07'})});
  local.run("openSpot('kenrokuen')");
  assert.equal(local.get('spotNotesEdit').textContent,'新增筆記');assert.equal(local.get('spotNotesEditor').inert,true);
  local.run('notesStartEditing()');local.input('交通：公車\n集合：09:00 🍁');await local.run('notesSave()');
  assert.equal(local.get('spotNotesText').textContent,'交通：公車\n集合：09:00 🍁');
  assert.equal(JSON.parse(local.memory.get(weekendKey)).kenrokuen,'2026-11-07');
  assert.equal(local.get('spotNotesEditor').hidden,true);assert.equal(local.get('spotNotesInput').value,'');
  const reload=boot(Object.fromEntries(local.memory));reload.run("openSpot('kenrokuen')");
  assert.equal(reload.get('spotNotesText').textContent,'交通：公車\n集合：09:00 🍁');
  reload.run('notesStartEditing()');reload.input('未儲存草稿');
  reload.run("openSpot('natadera');openSpot('kenrokuen')");assert.equal(reload.get('spotNotesInput').value,'未儲存草稿');
  reload.get('spotNotesCancel').listeners.click();assert.match(reload.get('spotNotesText').textContent,/交通/);
  reload.run('notesStartEditing()');reload.input('🍁'.repeat(1000));assert.equal(reload.get('spotNotesSave').disabled,false);
  reload.input('🍁'.repeat(1001));assert.equal(reload.get('spotNotesSave').disabled,true);
  await reload.run('notesSave()');assert.match(reload.get('spotNotesStatus').textContent,/縮短/);
  reload.input('<img src=x onerror=alert(1)>');await reload.run('notesSave()');
  assert.equal(reload.get('spotNotesText').textContent,'<img src=x onerror=alert(1)>');assert.equal(reload.get('spotNotesText').innerHTML,'');
  reload.run('notesStartEditing()');reload.input('');await reload.run('notesSave()');assert.equal(JSON.parse(reload.memory.get(noteKey)).kenrokuen,undefined);
  const blocked=boot();blocked.run("openSpot('kenrokuen');notesStartEditing()");blocked.input('失敗草稿');blocked.deny();
  await blocked.run('notesSave()');assert.equal(blocked.get('spotNotesInput').value,'失敗草稿');assert.match(blocked.get('spotNotesStatus').textContent,/草稿仍保留/);
  const corrupt=boot({[noteKey]:'{broken'});corrupt.run("openSpot('kenrokuen')");assert.equal(corrupt.get('spotNotesEdit').textContent,'新增筆記');
  const invalid=boot({[noteKey]:JSON.stringify({unknown:{text:'私密',updatedAt:1},kenrokuen:{text:'x'.repeat(1001),updatedAt:1}})});
  assert.equal(invalid.run('Object.keys(noteState.local).length'),0);
  console.log('PASS: note placement, hidden/inert editor, local multiline/Unicode persistence, cancel/draft navigation, safe text, limit/clear, corrupt/blocked storage and untouched weekends.');

  const shared=boot(Object.fromEntries(local.memory));await openShared(shared);
  assert.equal(shared.get('spotNotesText').textContent,'');assert.equal(shared.run('noteCalls.length'),0); // never auto-upload
  shared.run("notesChanges([{id:'kenrokuen',text:'他人的筆記',revision:1,updatedBy:'bob',updatedAt:Date.now()}],{fromCache:false,pending:false})");
  assert.equal(shared.get('spotNotesText').textContent,'他人的筆記');assert.match(shared.get('spotNotesMeta').textContent,/行程成員/);
  shared.run('notesStartEditing()');shared.input('我的草稿');
  shared.run("notesChanges([{id:'kenrokuen',text:'新版內容',revision:2,updatedBy:'bob'}],{fromCache:false,pending:false})");
  assert.equal(shared.get('spotNotesInput').value,'我的草稿');assert.equal(shared.get('spotNotesConflict').hidden,false);
  assert.equal(shared.get('spotNotesLatest').textContent,'新版內容');assert.equal(shared.get('spotNotesSave').disabled,true);
  await shared.run('notesSave()');assert.equal(shared.run('noteCalls.length'),0);
  shared.run('notesResolveConflict(false)');await shared.run('notesSave()');
  assert.equal(shared.run('noteCalls[0].revision'),2);assert.equal(shared.get('spotNotesText').textContent,'我的草稿'); // ack before snapshot
  assert.match(shared.get('spotNotesMeta').textContent,/你/);
  shared.run("notesChanges([{id:'kenrokuen',text:'舊通知',revision:2}],{fromCache:false,pending:false})");assert.equal(shared.get('spotNotesText').textContent,'我的草稿');
  shared.run("notesChanges([{id:'kenrokuen',text:'待確認通知',revision:4}],{fromCache:false,pending:true})");assert.equal(shared.get('spotNotesText').textContent,'我的草稿');
  assert.equal(shared.get('spotNotesEdit').disabled,true);
  shared.run("notesChanges([{id:'kenrokuen',text:'我的草稿',revision:3}],{fromCache:false,pending:false});notesStartEditing()");shared.input('保留的失敗草稿');
  shared.run("cloudState.api.writeNote=async()=>{throw Object.assign(Error('衝突'),{code:'notes/conflict',latest:{text:'交易讀取的最新版',revision:4,updatedBy:'bob'}})}");
  await shared.run('notesSave()');assert.equal(shared.get('spotNotesInput').value,'保留的失敗草稿');
  assert.equal(shared.get('spotNotesLatest').textContent,'交易讀取的最新版');
  shared.run('notesResolveConflict(true)');assert.equal(shared.get('spotNotesInput').value,'交易讀取的最新版');
  shared.run("cloudState.api.writeNote=async()=>{throw Error('離線')}");await shared.run('notesSave()');
  assert.match(shared.get('spotNotesStatus').textContent,/草稿仍保留/);assert.equal(shared.run('cloudState.pending.size'),0);
  assert.equal(shared.memory.get(noteKey),local.memory.get(noteKey));
  await shared.run('cloudAuthChanged(null)');
  assert.equal(shared.run('stops'),3);assert.equal(shared.run('Object.keys(noteState.shared).length'),0);
  assert.match(shared.get('spotNotesText').textContent,/交通/);assert.equal(shared.get('spotNotesInput').value,'');assert.equal(shared.get('spotNotesLatest').textContent,'');
  shared.run("notesChanges([{id:'kenrokuen',text:'不可回填',revision:8}],{fromCache:false,pending:false})");assert.match(shared.get('spotNotesText').textContent,/交通/);
  console.log('PASS: member note sync, commit acknowledgement, delayed/pending snapshots, Unicode validation, comparison/resolution, failure drafts, sign-out unsubscribe/clear and local restoration.');

  const inFlight=boot();await openShared(inFlight);
  inFlight.run('var finishNote;cloudState.api.writeNote=()=>new Promise(resolve=>finishNote=resolve);notesStartEditing()');inFlight.input('儲存中');
  const saving=inFlight.run('notesSave()');assert.equal(inFlight.get('spotNotesSave').disabled,true);
  await inFlight.run('cloudAuthChanged(null)');inFlight.run("finishNote({text:'不可回填',revision:1,updatedBy:'alice'})");await saving;
  assert.equal(inFlight.run('Object.keys(noteState.shared).length'),0);assert.equal(inFlight.get('spotNotesText').textContent,'');
  const imported=boot(Object.fromEntries(local.memory));await openShared(imported);
  imported.run('cloudState.revisions.kenrokuen=1;window.confirm=()=>false');await imported.run('cloudImport()');assert.equal(imported.run('noteCalls.length'),0);
  imported.run('window.confirm=()=>true');await imported.run('cloudImport()');assert.equal(imported.run('noteCalls.length'),1);
  assert.match(imported.get('spotNotesText').textContent,/交通/);assert.equal(imported.memory.get(noteKey),local.memory.get(noteKey));
  await imported.run('cloudImport()');assert.equal(imported.run('noteCalls.length'),1); // no overwrite
  imported.run("notesChanges([{id:'kenrokuen',text:'',revision:2,updatedBy:'bob'}],{fromCache:false,pending:false})");
  await imported.run('cloudImport()');assert.equal(imported.run('noteCalls.length'),1); // cleared notes remain tombstones
  imported.run("notesError({code:'permission-denied'})");assert.equal(imported.run('cloudState.mode'),'local');assert.match(imported.get('spotNotesText').textContent,/交通/);
  console.log('PASS: stale in-flight save isolation, explicit import confirmation, no overwrite of existing/cleared notes, local preservation and access-revocation cleanup.');
})().catch(error=>{console.error(error);process.exitCode=1;});
