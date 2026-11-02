const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const client=fs.readFileSync(__dirname+'/dist/firebase-client.mjs','utf8').replace(/^import .*;\n/gm,'').replace(/export /g,'');
const records=new Map(),auth={currentUser:{uid:'alice'}},sdkWrites=[];
const point=(...parts)=>parts.slice(1).join('/');
const context=vm.createContext({
  firebaseConfig:{projectId:'maple-sakura-ginkgo'},initializeApp:c=>c,getAuth:()=>auth,getFirestore:()=>({}),
  GoogleAuthProvider:class{},signInWithPopup:async()=>{},onAuthStateChanged:()=>()=>{},signOut:async()=>{},
  doc:point,collection:point,getDoc:async ref=>({exists:()=>records.has(ref),data:()=>records.get(ref)}),
  runTransaction:async(db,fn)=>fn({get:async ref=>({exists:()=>records.has(ref),data:()=>records.get(ref)}),set(ref,data){records.set(ref,data);sdkWrites.push({ref,data});}}),
  serverTimestamp:()=>({serverTimestamp:true}),Timestamp:{fromDate:date=>({toDate:()=>date}),fromMillis:ms=>({toMillis:()=>ms})},
  getDocs:async()=>({docs:[]}),setDoc:async()=>{},updateDoc:async()=>{},deleteDoc:async()=>{},onSnapshot:()=>()=>{},
  writeBatch:()=>({set(){},commit:async()=>{}}),crypto:require('node:crypto').webcrypto,Date
});
vm.runInContext(client,context);
const evaluate=code=>vm.runInContext(code,context);
const uiSource=fs.readFileSync(__dirname+'/dist/collaboration-ui.js','utf8');
function bootUI(){
  const elements=new Map(),location=new URL('https://map.example/');
  const get=id=>{if(!elements.has(id))elements.set(id,{textContent:'',hidden:false,value:'',dataset:{},focus(){},select(){},setAttribute(name,value){this[name]=value;},showModal(){this.open=true;},close(){this.open=false;},children:[],replaceChildren(){this.children=[];},append(...nodes){this.children.push(...nodes);},addEventListener(){}});return elements.get(id);};
  const cx=vm.createContext({URL,URLSearchParams,Date,Promise,Set,console,
    document:{getElementById:get,querySelectorAll:()=>[],createElement:()=>({})},
    window:{location,history:{replaceState(a,b,url){location.href=url;}},confirm:()=>false},
    renderFilters(){},renderSpots(){},renderDetail(){},showToast(){},selectedSpotId:null,
    saved:{kenrokuen:'2026-11-07'},spots:[{id:'kenrokuen'},{id:'toyama-baba'}]
  });
  vm.runInContext(uiSource,cx);
  return {run:code=>vm.runInContext(code,cx),elements,get,cx,location};
}
(async()=>{
  const id='ABCDEFGHIJKLMNOPQRST';
  await evaluate(`writeWeekend('${id}','kenrokuen','2026-11-07',0)`);
  const ref='weekendPlans/'+id+'/spots/kenrokuen';
  assert.equal(records.get(ref).revision,1);
  assert.equal(records.get(ref).updatedBy,'alice');
  assert.equal(records.get(ref).weekend.toDate().toISOString(),'2026-11-07T00:00:00.000Z');
  auth.currentUser={uid:'bob'};
  await assert.rejects(()=>evaluate(`writeWeekend('${id}','kenrokuen','2026-11-14',0)`),/其他人更新/);
  assert.equal(records.get(ref).revision,1);
  await evaluate(`writeWeekend('${id}','kenrokuen','',1)`);
  assert.equal(records.get(ref).weekend,null);assert.equal(records.get(ref).revision,2);
  assert.equal(records.get(ref).updatedBy,'bob');
  auth.currentUser=null;
  await assert.rejects(()=>evaluate(`writeWeekend('${id}','kenrokuen','2026-11-14',2)`),/登入/);
  assert.equal(sdkWrites.length,2);
  const ui=bootUI();
  assert.equal(ui.run("validCloudDate('2026-11-07')"),true);
  for(const value of ['2026-11-08','2026-02-31','2026-13-01','bad'])assert.equal(ui.run('validCloudDate('+JSON.stringify(value)+')'),false);
  assert.equal(ui.run("handleCloudWeekend({target:{dataset:{id:'kenrokuen'},value:''}})"),false);
  ui.run(`cloudState.authReady=true;cloudState.user={uid:'alice'};var writeCalls=[];var listener;var denied;
    cloudState.api={getPlan:async id=>({id,title:'測試共編',ownerUid:'alice'}),
      watchAccess:(id,u,error)=>{denied=error;return ()=>{};},
      watchPlan:(id,change,error)=>{listener=change;return ()=>{};},
      writeWeekend:async(...args)=>{writeCalls.push(args);}};`);
  await ui.run(`cloudOpen('${id}')`);
  assert.equal(ui.run('cloudState.localSaved.kenrokuen'),'2026-11-07');
  assert.equal(ui.run('Object.keys(saved).length'),0);
  assert.equal(ui.run('cloudState.ready'),false);
  ui.run("listener([{id:'kenrokuen',revision:4,weekend:{toDate:()=>new Date('2026-11-14T00:00:00Z')}}],{fromCache:false,pending:false})");
  assert.equal(ui.run('saved.kenrokuen'),'2026-11-14');
  assert.equal(ui.run('cloudState.ready'),true);
  ui.run("handleCloudWeekend({target:{dataset:{id:'kenrokuen'},value:'2026-11-21'}})");
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(ui.run('writeCalls[0][3]'),4);
  assert.equal(ui.run('saved.kenrokuen'),'2026-11-14'); // no optimistic success or full-map overwrite
  assert.equal(ui.run('cloudState.localSaved.kenrokuen'),'2026-11-07');
  ui.run("listener([],{fromCache:true,pending:false})");
  assert.equal(ui.run('cloudState.ready'),false);
  ui.run("denied({code:'permission-denied'})");
  assert.equal(ui.run('saved.kenrokuen'),'2026-11-07');
  ui.run('cloudLocal()');
  assert.equal(ui.run('saved.kenrokuen'),'2026-11-07');
  assert.equal(ui.location.searchParams.has('plan'),false);
  ui.location.search='?plan='+id;ui.location.hash='join='+'a'.repeat(48);
  ui.run('cloudState.user=null');
  await assert.rejects(()=>ui.run(`cloudOpen('${id}')`),/登入/);
  assert.equal(ui.run('cloudState.ready'),false);
  assert.equal(ui.run('saved.kenrokuen'),'2026-11-07');
  assert.ok(ui.location.hash.includes('join='));
  // Verify default HTML containment: hidden + inert ancestors remove all shared
  // fields, headings and actions from rendering, accessibility and keyboard use.
  const html=fs.readFileSync(__dirname+'/dist/index.html','utf8');
  assert.match(html,/collaboration-ui\.js\?v=20261102-plans2/);
  assert.match(uiSource,/firebase-client\.mjs\?v=20261102-plans2/);
  const dialog=html.match(/<dialog id="cloudDialog"[\s\S]*?<\/dialog>/)[0];
  const stack=[],ancestors=new Map();
  for(const match of dialog.matchAll(/<(\/?)([a-z][a-z0-9]*)([^>]*)>/gi)){
    const [,closing,tag,attrs]=match;
    if(closing){assert.equal(stack.pop()?.tag,tag);continue;}
    const id=attrs.match(/id="([^"]+)"/)?.[1];
    if(id)ancestors.set(id,[...stack]);
    if(!['input','br','hr','img','meta','link'].includes(tag))stack.push({tag,id,attrs});
  }
  for(const field of ['cloudDelete','cloudReturn','cloudPlanTitle','cloudCreate','cloudPlanChoice','cloudOpen','cloudJoin','cloudLocal','cloudImport','cloudInvite','cloudRevoke','cloudMembers','cloudInviteLink','cloudCopyInvite','cloudMemberList']){
    assert.ok(ancestors.get(field).some(a=>a.id==='cloudAuthenticated'&&/\bhidden\b/.test(a.attrs)&&/\binert\b/.test(a.attrs)),field+' must start hidden/inert');
  }
  assert.match(fs.readFileSync(__dirname+'/dist/styles.css','utf8'),/\[hidden\]\s*\{\s*display:\s*none\s*!important/);
  const gates=['cloudAuthenticated','cloudBrowse','cloudCurrent','cloudInvitation'];
  const gate=(t,id,hidden)=>{assert.equal(t.get(id).hidden,hidden,id);assert.equal(t.get(id).inert,hidden,id+' keyboard gate');};
  const t=bootUI();t.run('cloudSyncControls()');
  for(const id of gates)gate(t,id,true);
  assert.equal(t.get('cloudLogin').hidden,true);
  t.run(`var calls={join:0,write:0,stop:0};var snapshot;var accessError;
    cloudState.api={listPlans:async()=>[{id:'${id}',title:'東京秋季週末'}],
      getPlan:async id=>({id,title:'東京秋季週末',ownerUid:'alice'}),
      watchAccess:(id,user,error)=>{accessError=error;return ()=>calls.stop++;},
      watchPlan:(id,callback)=>{snapshot=callback;return ()=>calls.stop++;},
      joinPlan:async()=>calls.join++,writeWeekend:async()=>calls.write++};`);
  await t.run('cloudAuthChanged(null)');
  for(const id of gates)gate(t,id,true);
  assert.equal(t.get('cloudLogin').hidden,false);
  t.location.search='?plan='+id;t.location.hash='join='+'a'.repeat(48);
  await t.run("cloudAuthChanged({uid:'alice'})");
  gate(t,'cloudAuthenticated',false);gate(t,'cloudBrowse',false);gate(t,'cloudCurrent',true);gate(t,'cloudInvitation',false);
  assert.equal(t.run('calls.join'),0);assert.equal(t.run('calls.write'),0);
  assert.equal(t.run('saved.kenrokuen'),'2026-11-07');assert.ok(t.location.hash.includes('join='));
  assert.equal(t.get('cloudJoin').hidden,false);
  await t.run('cloudJoin()');
  assert.equal(t.run('calls.join'),1);assert.equal(t.location.hash,'');
  gate(t,'cloudBrowse',true);gate(t,'cloudCurrent',false);
  assert.equal(t.get('cloudInvite').hidden,false);
  t.run("snapshot([{id:'kenrokuen',revision:1,weekend:{toDate:()=>new Date('2026-11-14T00:00:00Z')}}],{fromCache:false,pending:false})");
  assert.equal(t.run('saved.kenrokuen'),'2026-11-14');
  await t.run('cloudImport()'); // confirm() is false
  assert.equal(t.run('calls.write'),0);
  t.get('cloudInviteLink').value='private invite';t.get('cloudPlanTitle').value='private title';
  await t.run('cloudAuthChanged(null)');
  for(const id of gates)gate(t,id,true);
  assert.equal(t.run('calls.stop'),2);assert.equal(t.run('saved.kenrokuen'),'2026-11-07');
  assert.equal(t.run('cloudState.plan'),null);assert.equal(t.get('cloudInviteLink').value,'');
  assert.equal(t.get('cloudPlanTitle').value,'');assert.equal(t.get('cloudPlanChoice').children.length,0);
  t.run("snapshot([{id:'kenrokuen',revision:2}],{fromCache:false,pending:false})");
  assert.equal(t.run('saved.kenrokuen'),'2026-11-07'); // stale snapshot cannot return
  // Persisted authentication restoration opens an existing route only after auth.
  const restored=bootUI();restored.location.search='?plan='+id;
  restored.run(`cloudState.api={listPlans:async()=>[],getPlan:async id=>({id,title:'restored',ownerUid:'alice'}),watchAccess:()=>()=>{},watchPlan:()=>()=>{}};cloudSyncControls()`);
  assert.equal(restored.run('saved.kenrokuen'),'2026-11-07');gate(restored,'cloudAuthenticated',true);
  await restored.run("cloudAuthChanged({uid:'bob'})");
  gate(restored,'cloudCurrent',false);
  for(const id of ['cloudInvite','cloudRevoke','cloudMembers','cloudCopyInvite'])assert.equal(restored.get(id).hidden,true,id+' owner only');
  await restored.run('cloudAuthChanged(null)');assert.equal(restored.run('saved.kenrokuen'),'2026-11-07');
  // Popup failure/cancellation cannot reveal shared controls or lose invitations.
  for(const code of ['auth/popup-closed-by-user','auth/cancelled-popup-request','auth/popup-blocked','auth/network-request-failed','auth/unauthorized-domain']){
    t.location.search='?plan='+id;t.location.hash='join='+'a'.repeat(48);
    t.run(`cloudState.api.login=async()=>{throw {code:${JSON.stringify(code)}}}`);
    await t.run('cloudAction(cloudLogin)');
    assert.ok(t.get('cloudStatus').textContent);assert.equal(t.get('cloudLogin').disabled,false);
    for(const id of gates)gate(t,id,true);
    assert.ok(t.location.hash.includes('join='));assert.equal(t.run('saved.kenrokuen'),'2026-11-07');
  }
  t.run("cloudState.api.login=async()=>cloudAuthChanged({uid:'alice'})");
  await t.run('cloudAction(cloudLogin)');gate(t,'cloudAuthenticated',false);
  assert.equal(t.get('cloudLogin').hidden,true);assert.equal(t.run('calls.join'),1);
  await t.run('cloudAuthChanged(null)');
  // A failed shared-plan open returns to the browser's saved weekends and choices.
  t.location.search='';t.location.hash='';
  await t.run("cloudAuthChanged({uid:'alice'})");
  t.run("cloudState.api.getPlan=async()=>{throw {code:'permission-denied'}}");
  await t.run(`cloudOpen('${id}')`);
  gate(t,'cloudBrowse',false);gate(t,'cloudCurrent',true);
  assert.equal(t.run('saved.kenrokuen'),'2026-11-07');assert.match(t.get('cloudStatus').textContent,/存取權/);
  await t.run('cloudAuthChanged(null)');
  // A delayed list response from the old account must not repopulate the UI.
  t.run('var resolvePlans;cloudState.api.listPlans=()=>new Promise(resolve=>resolvePlans=resolve)');
  const changing=t.run("cloudAuthChanged({uid:'alice'})");
  await t.run('cloudAuthChanged(null)');t.run(`resolvePlans([{id:'${id}',title:'private'}])`);await changing;
  assert.equal(t.get('cloudPlanChoice').children.length,0);gate(t,'cloudAuthenticated',true);
  // Information hierarchy, browser fallback, switch navigation and deletion UX.
  assert.ok(html.indexOf('id="cloudChooseTitle"')<html.indexOf('id="cloudCreateTitle"'));
  assert.match(html,/id="cloudCreate"[^>]*>新增行程/);
  assert.match(html,/id="cloudLocal"[^>]*>選擇其他行程/);
  assert.match(html,/id="cloudManageHeading">管理行程/);
  assert.match(html,/id="cloudDeleteCancel"[^>]*autofocus/);
  assert.doesNotMatch(html,/此瀏覽器|建立空白行程|已加入的行程/);
  const d=bootUI();
  d.run(`var deletes=0;var stateChange;cloudState.api={
    listPlans:async()=>[{id:'${id}',title:'測試行程'}],
    getPlan:async id=>({id,title:'測試行程',ownerUid:'alice'}),
    watchAccess:(id,user,error,change)=>{stateChange=change;return ()=>{}},watchPlan:()=>()=>{},
    deletePlan:async()=>deletes++};`);
  await d.run("cloudAuthChanged({uid:'alice'})");
  assert.equal(d.get('cloudPlanChoice').children[0].textContent,'瀏覽器暫存');
  assert.equal(d.get('cloudPlanChoice').value,'');
  await d.run(`cloudOpen('${id}')`);await d.run('cloudChooseOther()');
  gate(d,'cloudBrowse',false);gate(d,'cloudCurrent',true);
  assert.equal(d.run('cloudState.mode'),'shared');assert.equal(d.run('cloudState.plan.id'),id);
  assert.equal(d.get('cloudPlanChoice').value,id);
  d.run('cloudState.choosing=false;cloudSyncControls();cloudRequestDelete()');
  assert.equal(d.get('cloudDeleteDialog').open,true);assert.equal(d.run('deletes'),0);
  assert.match(d.get('cloudDeleteDescription').textContent,/無法復原/);
  d.run('cloudElement("cloudDeleteDialog").close()');assert.equal(d.run('deletes'),0); // Cancel
  d.run("cloudState.user={uid:'bob'};cloudSyncControls();cloudRequestDelete()");
  assert.equal(d.get('cloudDelete').hidden,true);assert.equal(d.get('cloudDeleteDialog').open,false);
  await assert.rejects(()=>d.run('cloudDelete(cloudDeleteTarget)'),/建立者/);
  d.run("cloudState.user={uid:'alice'};cloudState.api.deletePlan=async()=>{deletes++;throw Error('離線')};cloudRequestDelete()");
  await d.run('cloudDelete(cloudDeleteTarget)');
  assert.equal(d.run('deletes'),1);assert.equal(d.run('cloudState.pending.size'),0);
  assert.equal(d.get('cloudDelete').textContent,'繼續刪除行程');
  assert.equal(d.get('cloudInvite').disabled,true);assert.equal(d.get('cloudImport').hidden,true);
  assert.equal(d.run('cloudState.localSaved.kenrokuen'),'2026-11-07');
  d.run('cloudState.api.deletePlan=async()=>deletes++;cloudRequestDelete()');
  await d.run('cloudDelete(cloudDeleteTarget)');
  assert.equal(d.run('deletes'),2);assert.equal(d.run('cloudState.mode'),'local');
  assert.equal(d.run('saved.kenrokuen'),'2026-11-07');assert.equal(d.get('cloudPlanChoice').value,'');
  // Auth changes dismiss destructive confirmation and invalidate in-flight completions.
  await d.run(`cloudOpen('${id}')`);d.run('cloudRequestDelete()');
  await d.run('cloudAuthChanged(null)');
  assert.equal(d.get('cloudDeleteDialog').open,false);assert.equal(d.get('cloudDeleteDescription').textContent,'');
  await assert.rejects(()=>d.run('cloudDelete(cloudDeleteTarget)'),/行程已變更/);
  console.log('PASS: reordered plan selection, browser default, scoped switch navigation, owner-only delete confirmation/cancel, failure/resume, local restoration and auth-invalidation.');
  console.log('PASS: initial HTML hidden/inert containment, loading/signed-out gates, auth restoration, owner/member UI, explicit invite acceptance, cancelled/failed login, sign-out subscription/data cleanup, stale snapshot/list rejection and local/import preservation.');
  console.log('PASS: transaction revision conflicts, tombstone clearing, authenticated SDK writes, Saturday validation, explicit cloud scope, no local upload/overwrite, offline edit lock, access revocation clearing, local restoration and signed-out invite preservation.');
  console.log('LIMIT: SDK/UI tests use mocks. Firestore Rules compilation is checked separately by Firebase; Emulator authorization is covered separately by check-firestore-rules.cjs; real two-account end-to-end checks remain manual.');
})().catch(e=>{console.error(e);process.exitCode=1;});
