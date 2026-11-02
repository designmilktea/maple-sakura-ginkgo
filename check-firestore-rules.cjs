// Run with the Firestore emulator and temporary dependencies on NODE_PATH.
// Example: firebase emulators:exec --only firestore --project demo-maple 'node check-firestore-rules.cjs'
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const firestoreSDK=require('firebase/firestore');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,collection,query,limit,getDoc,getDocs,setDoc,updateDoc,deleteDoc,writeBatch,serverTimestamp,Timestamp,deleteField,setLogLevel}=require('firebase/firestore');
setLogLevel('silent');
const ID='PlanForRulesTest0001',TOKEN='a'.repeat(48);
const path=`weekendPlans/${ID}`,index=uid=>`weekendPlanUsers/${uid}/plans/${ID}`;
let checks=0;
async function allow(p){await assertSucceeds(p);checks++;}
async function deny(p){await assertFails(p);checks++;}
(async()=>{
  if(!process.env.FIRESTORE_EMULATOR_HOST)throw Error('FIRESTORE_EMULATOR_HOST must target a local emulator');
  const host=process.env.FIRESTORE_EMULATOR_HOST;
  if(!/^(localhost|127\.0\.0\.1|\[::1\]):\d+$/.test(host))throw Error('Refusing non-local emulator host');
  const env=await initializeTestEnvironment({projectId:'demo-maple-rules',firestore:{rules:fs.readFileSync(__dirname+'/firestore.rules','utf8')}});
  try{
    const owner=env.authenticatedContext('owner').firestore(),member=env.authenticatedContext('member').firestore(),other=env.authenticatedContext('other').firestore(),anon=env.unauthenticatedContext().firestore();
    const assignment=(uid,revision=1)=>({weekend:null,revision,updatedBy:uid,updatedAt:serverTimestamp()});
    const invite=()=>({createdAt:serverTimestamp(),expiresAt:Timestamp.fromMillis(Date.now()+86400000),revoked:false});
    const membership=(uid)=>({uid,role:'editor',inviteToken:TOKEN,joinedAt:serverTimestamp()});
    const idx=()=>({title:'測試行程',joinedAt:serverTimestamp()});
    const plan=()=>({title:'測試行程',ownerUid:'owner',createdAt:serverTimestamp()});
    await env.clearFirestore();
    for(const db of [anon,member,other])await deny(setDoc(doc(db,path),plan()));
    await deny(setDoc(doc(owner,path),{...plan(),deletingAt:serverTimestamp()}));
    await deny(setDoc(doc(owner,path),{...plan(),extra:true}));
    const create=writeBatch(owner);create.set(doc(owner,path),plan());create.set(doc(owner,index('owner')),idx());await allow(create.commit());
    await deny(getDocs(collection(owner,'weekendPlans'))); // no global listing
    for(const db of [anon,other])await deny(getDoc(doc(db,path)));
    await allow(setDoc(doc(owner,`${path}/invites/${TOKEN}`),invite()));
    await allow(setDoc(doc(member,`${path}/members/member`),membership('member')));
    await allow(setDoc(doc(member,index('member')),idx()));
    await allow(getDoc(doc(member,path)));
    await allow(setDoc(doc(member,`${path}/spots/kenrokuen`),assignment('member')));
    await deny(setDoc(doc(other,`${path}/spots/natadera`),assignment('other')));
    await deny(setDoc(doc(member,`${path}/spots/kenrokuen`),{...assignment('member',2),extra:true}));
    await deny(setDoc(doc(member,`${path}/spots/natadera`),{...assignment('member'),weekend:'invalid'}));
    await deny(deleteDoc(doc(member,index('owner'))));
    await deny(deleteDoc(doc(owner,index('member')))); // cleanup allowed only after mark
    await deny(deleteDoc(doc(owner,path))); // cannot bypass lifecycle
    for(const db of [anon,member,other]){
      await deny(updateDoc(doc(db,path),{deletingAt:serverTimestamp()}));
      await deny(deleteDoc(doc(db,path)));
    }
    for(const change of [{ownerUid:'member'},{createdAt:Timestamp.fromMillis(1)},{title:'x'.repeat(81)},{title:deleteField()},{extra:true}])await deny(updateDoc(doc(owner,path),change));
    await deny(updateDoc(doc(owner,path),{deletingAt:Timestamp.fromMillis(1)}));
    await deny(updateDoc(doc(owner,path),{deletingAt:serverTimestamp(),title:'偷改名稱'}));
    // getAfter prevents same-batch races with transition to deleting.
    const race=writeBatch(owner);race.update(doc(owner,path),{deletingAt:serverTimestamp()});race.set(doc(owner,`${path}/spots/natadera`),assignment('owner'));await deny(race.commit());
    const inviteRace=writeBatch(owner);inviteRace.update(doc(owner,path),{deletingAt:serverTimestamp()});inviteRace.set(doc(owner,`${path}/invites/${'b'.repeat(48)}`),invite());await deny(inviteRace.commit());
    const joinRace=writeBatch(owner);joinRace.update(doc(owner,path),{deletingAt:serverTimestamp()});joinRace.set(doc(owner,`${path}/members/owner`),membership('owner'));await deny(joinRace.commit());
    const indexRace=writeBatch(owner);indexRace.update(doc(owner,path),{deletingAt:serverTimestamp()});indexRace.set(doc(owner,index('owner')),idx());await deny(indexRace.commit());
    await allow(updateDoc(doc(owner,path),{deletingAt:serverTimestamp()}));
    await allow(getDoc(doc(owner,path))); // resumable owner can recover state
    await allow(getDocs(query(collection(owner,`${path}/spots`),limit(200))));
    await allow(getDocs(query(collection(owner,`${path}/members`),limit(8))));
    await allow(getDocs(query(collection(owner,`${path}/invites`),limit(200))));
    for(const db of [anon,member,other]){
      await deny(getDoc(doc(db,path)));
      await deny(getDoc(doc(db,`${path}/spots/kenrokuen`)));
      await deny(getDocs(collection(db,`${path}/spots`)));
      await deny(getDoc(doc(db,`${path}/invites/${TOKEN}`)));
      await deny(deleteDoc(doc(db,`${path}/spots/kenrokuen`)));
      await deny(deleteDoc(doc(db,`${path}/members/member`)));
      await deny(deleteDoc(doc(db,`${path}/invites/${TOKEN}`)));
    }
    await deny(getDoc(doc(member,`${path}/members/member`)));
    for(const change of [{deletingAt:deleteField()},{deletingAt:serverTimestamp()},{title:'其他名稱'},{ownerUid:'member'}])await deny(updateDoc(doc(owner,path),change));
    await deny(setDoc(doc(owner,`${path}/spots/kenrokuen`),assignment('owner',2)));
    await deny(setDoc(doc(member,`${path}/spots/natadera`),assignment('member')));
    await deny(setDoc(doc(other,`${path}/members/other`),membership('other')));
    await deny(setDoc(doc(owner,`${path}/invites/${'b'.repeat(48)}`),invite()));
    await deny(updateDoc(doc(owner,`${path}/invites/${TOKEN}`),{revoked:true}));
    await deny(setDoc(doc(other,index('other')),idx()));
    // An owner cannot use a deleting plan to remove unrelated users' indexes.
    await env.withSecurityRulesDisabled(async c=>{await setDoc(doc(c.firestore(),index('other')),idx());});
    await deny(deleteDoc(doc(owner,index('other'))));
    await allow(deleteDoc(doc(owner,`${path}/spots/kenrokuen`)));
    // Retry cleanup after interruption: empty pages remain readable.
    await allow(getDocs(query(collection(owner,`${path}/spots`),limit(200))));
    const cleanup=writeBatch(owner);cleanup.delete(doc(owner,index('member')));cleanup.delete(doc(owner,`${path}/members/member`));await allow(cleanup.commit());
    await allow(deleteDoc(doc(owner,`${path}/invites/${TOKEN}`)));
    await deny(deleteDoc(doc(owner,path))); // permanent marker required even after cleanup
    await deny(setDoc(doc(owner,`weekendPlanDeletions/${ID}`),{deletedAt:serverTimestamp()})); // marker must be atomic with parent deletion
    await deny(setDoc(doc(other,`weekendPlanDeletions/${ID}`),{deletedAt:serverTimestamp()}));
    await deny(setDoc(doc(owner,`weekendPlanDeletions/${ID}`),{deletedAt:Timestamp.fromMillis(1)}));
    await deny(setDoc(doc(owner,`weekendPlanDeletions/${ID}`),{deletedAt:serverTimestamp(),extra:true}));
    // Simulate a missed child: tombstone must prevent a new owner resurrecting its ID.
    await env.withSecurityRulesDisabled(async c=>{await setDoc(doc(c.firestore(),`${path}/spots/natadera`),{weekend:null,revision:1,updatedBy:'owner',updatedAt:Timestamp.now()});});
    const finish=writeBatch(owner);finish.set(doc(owner,`weekendPlanDeletions/${ID}`),{deletedAt:serverTimestamp()});finish.delete(doc(owner,index('owner')));finish.delete(doc(owner,path));await allow(finish.commit());
    // Leftover guessed paths / stale invitations cannot resurrect a deleted plan.
    await deny(setDoc(doc(owner,path),plan()));
    await deny(setDoc(doc(other,path),{...plan(),ownerUid:'other'}));
    for(const db of [owner,other])await deny(getDoc(doc(db,`${path}/spots/natadera`)));
    await deny(getDoc(doc(owner,`weekendPlanDeletions/${ID}`)));
    await deny(getDocs(collection(owner,'weekendPlanDeletions')));
    await deny(updateDoc(doc(owner,`weekendPlanDeletions/${ID}`),{deletedAt:serverTimestamp()}));
    await deny(deleteDoc(doc(owner,`weekendPlanDeletions/${ID}`)));
    await deny(setDoc(doc(other,'weekendPlanDeletions/unknown'),{deletedAt:serverTimestamp()}));
    await deny(setDoc(doc(other,`${path}/members/other`),membership('other')));
    await deny(setDoc(doc(owner,`${path}/spots/natadera`),assignment('owner')));
    await deny(setDoc(doc(owner,index('owner')),idx()));
    await deny(getDoc(doc(member,`${path}/spots/kenrokuen`)));
    await allow(deleteDoc(doc(other,index('other')))); // self can remove a stale index
    // Legacy self-only scope remains unchanged.
    await allow(setDoc(doc(owner,'users/owner'),{legacy:'preserved'}));
    await allow(setDoc(doc(owner,'users/owner/saves/a'),{legacy:true}));
    await allow(getDoc(doc(owner,'users/owner')));
    await deny(getDoc(doc(member,'users/owner')));
    await deny(getDoc(doc(anon,'users/owner/saves/a')));
    await deny(setDoc(doc(member,'users/owner/saves/a'),{legacy:false}));
    // Evaluate the shipped client code with the real SDK and authenticated emulator DB.
    // Only initialization/auth are replaced; deletion transactions/queries/batches run intact.
    function client(db,uid,overrides={}){
      const source=fs.readFileSync(__dirname+'/dist/firebase-client.mjs','utf8')
        .replace(/^import .*;\n/gm,'').replace(/\bexport /g,'');
      const dependencies={...firestoreSDK,initializeApp:()=>({}),firebaseConfig:{},
        getAuth:()=>({currentUser:uid?{uid}:null}),getFirestore:()=>db,...overrides};
      // Same VM realm keeps SDK plain-object checks intact.
      return vm.runInThisContext('(function({'+Object.keys(dependencies).join(',')+'}){'+source+'\n;return {deletePlan,writeWeekend};})')(dependencies);
    }
    const unrelated='UnrelatedPlan0000001';
    const integrationIds=['ClientDeletePlan0001','ResumeDeletePlan0001'];
    async function seedClientPlan(id){
      await env.withSecurityRulesDisabled(async c=>{
        const db=c.firestore(),batch=writeBatch(db),base=`weekendPlans/${id}`;
        batch.set(doc(db,base),{title:'分頁刪除測試',ownerUid:'owner',createdAt:Timestamp.now()});
        batch.set(doc(db,`weekendPlanUsers/owner/plans/${id}`),{title:'分頁刪除測試',joinedAt:Timestamp.now()});
        for(let i=0;i<121;i++){
          batch.set(doc(db,`${base}/spots/spot${i}`),{weekend:null,revision:1,updatedBy:'owner',updatedAt:Timestamp.now()});
          batch.set(doc(db,`${base}/invites/${i.toString(16).padStart(48,'0')}`),{createdAt:Timestamp.now(),expiresAt:Timestamp.fromMillis(Date.now()+86400000),revoked:false});
        }
        for(let i=0;i<19;i++){
          const uid=i===0?'member':`member${i}`;
          batch.set(doc(db,`${base}/members/${uid}`),{uid,role:'editor',inviteToken:TOKEN,joinedAt:Timestamp.now()});
          batch.set(doc(db,`weekendPlanUsers/${uid}/plans/${id}`),{title:'分頁刪除測試',joinedAt:Timestamp.now()});
        }
        batch.set(doc(db,`weekendPlans/${unrelated}`),{title:'不可變更',ownerUid:'owner',createdAt:Timestamp.now()});
        batch.set(doc(db,`weekendPlans/${unrelated}/spots/kenrokuen`),{weekend:null,revision:7,updatedBy:'owner',updatedAt:Timestamp.now()});
        await batch.commit();
      });
    }
    async function verifyDeleted(id){
      await env.withSecurityRulesDisabled(async c=>{
        const db=c.firestore(),base=`weekendPlans/${id}`;
        assert.equal((await getDoc(doc(db,base))).exists(),false);checks++;
        assert.ok((await getDoc(doc(db,`weekendPlanDeletions/${id}`))).data().deletedAt);checks++;
        for(const kind of ['spots','members','invites']){assert.equal((await getDocs(collection(db,`${base}/${kind}`))).size,0);checks++;}
        for(const uid of ['owner','member',...Array.from({length:18},(_,i)=>`member${i+1}`)]){
          assert.equal((await getDoc(doc(db,`weekendPlanUsers/${uid}/plans/${id}`))).exists(),false);checks++;
        }
        assert.equal((await getDoc(doc(db,`weekendPlans/${unrelated}`))).data().title,'不可變更');checks++;
        assert.equal((await getDoc(doc(db,`weekendPlans/${unrelated}/spots/kenrokuen`))).data().revision,7);checks++;
      });
    }
    for(const id of integrationIds)await seedClientPlan(id);
    await assert.rejects(client(member,'member').deletePlan(integrationIds[0]),/僅建立者可刪除行程/);checks++;
    await assert.rejects(client(anon,null).deletePlan(integrationIds[0]),/請先登入/);checks++;
    await client(owner,'owner').deletePlan(integrationIds[0]);checks++;
    await verifyDeleted(integrationIds[0]);
    const resumeId=integrationIds[1];
    await assert.rejects(client(owner,'owner',{
      getDocsFromServer:async()=>{throw Error('simulated server read interruption');}
    }).deletePlan(resumeId),/simulated server read interruption/);checks++;
    assert.ok((await getDoc(doc(owner,`weekendPlans/${resumeId}`))).data().deletingAt);checks++;
    await deny(setDoc(doc(member,`weekendPlans/${resumeId}/spots/kenrokuen`),assignment('member')));
    let cleanupCommits=0;
    await assert.rejects(client(owner,'owner',{
      writeBatch:db=>{
        const batch=writeBatch(db),commit=batch.commit.bind(batch);
        batch.commit=async()=>{if(++cleanupCommits===2)throw Error('simulated batch interruption');return commit();};return batch;
      }
    }).deletePlan(resumeId),/simulated batch interruption/);checks++;
    assert.ok((await getDoc(doc(owner,`weekendPlans/${resumeId}`))).data().deletingAt);checks++;
    await env.withSecurityRulesDisabled(async c=>{assert.equal((await getDocs(collection(c.firestore(),`weekendPlans/${resumeId}/spots`))).size,21);checks++;});
    await client(owner,'owner').deletePlan(resumeId);checks++;
    await verifyDeleted(resumeId);
    console.log(`PASS ${checks} Firestore authorization and shipped-client integration checks (local emulator only)`);
  }finally{await env.cleanup();}
})().catch(e=>{console.error(e);process.exitCode=1;});
