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
  const get=id=>{if(!elements.has(id))elements.set(id,{textContent:'',hidden:false,value:'',dataset:{},focus(){},select(){},replaceChildren(){},addEventListener(){}});return elements.get(id);};
  const cx=vm.createContext({URL,URLSearchParams,Date,Promise,Set,console,
    document:{getElementById:get,querySelectorAll:()=>[]},
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
  ui.run(`cloudState.user={uid:'alice'};var writeCalls=[];var listener;var denied;
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
  assert.equal(ui.run('Object.keys(saved).length'),0);
  ui.run('cloudLocal()');
  assert.equal(ui.run('saved.kenrokuen'),'2026-11-07');
  assert.equal(ui.location.searchParams.has('plan'),false);
  ui.location.search='?plan='+id;ui.location.hash='join='+'a'.repeat(48);
  ui.run('cloudState.user=null');
  await ui.run(`cloudOpen('${id}')`);
  assert.equal(ui.run('cloudState.ready'),false);
  assert.equal(ui.run('saved.kenrokuen'),undefined);
  assert.ok(ui.location.hash.includes('join='));
  console.log('PASS: transaction revision conflicts, tombstone clearing, authenticated SDK writes, Saturday validation, explicit cloud scope, no local upload/overwrite, offline edit lock, access revocation clearing, local restoration and signed-out invite preservation.');
  console.log('LIMIT: SDK/UI tests use mocks. Firestore Rules compilation is checked separately by Firebase; Emulator authorization and real two-account Google Sign-in still require end-to-end verification.');
})().catch(e=>{console.error(e);process.exitCode=1;});
