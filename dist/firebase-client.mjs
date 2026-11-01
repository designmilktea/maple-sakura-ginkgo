import {initializeApp} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,onAuthStateChanged,signOut} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import {getFirestore,doc,collection,getDoc,getDocs,setDoc,updateDoc,deleteDoc,onSnapshot,runTransaction,writeBatch,serverTimestamp,Timestamp} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';
import {firebaseConfig} from './firebase-config.mjs';

const app=initializeApp(firebaseConfig);
const auth=getAuth(app);
// Memory-only Firestore cache: never retain another account's shared plan on disk.
const db=getFirestore(app);
export const observeAuth=callback=>onAuthStateChanged(auth,callback);
export const login=()=>signInWithPopup(auth,new GoogleAuthProvider());
export const logout=()=>signOut(auth);
const planRef=id=>doc(db,'weekendPlans',id);
const indexRef=(uid,id)=>doc(db,'weekendPlanUsers',uid,'plans',id);
const requireUser=()=>{if(!auth.currentUser)throw Error('請先登入');return auth.currentUser;};
export async function listPlans(){
  const user=requireUser();
  const snapshot=await getDocs(collection(db,'weekendPlanUsers',user.uid,'plans'));
  return snapshot.docs.map(d=>({id:d.id,...d.data()}));
}
export async function createPlan(title){
  const user=requireUser(),ref=doc(collection(db,'weekendPlans')),batch=writeBatch(db);
  batch.set(ref,{title,ownerUid:user.uid,createdAt:serverTimestamp()});
  batch.set(indexRef(user.uid,ref.id),{title,joinedAt:serverTimestamp()});
  await batch.commit();
  return ref.id;
}
export async function getPlan(id){
  const result=await getDoc(planRef(id));
  if(!result.exists())throw Error('找不到行程');
  return {id,...result.data()};
}
export function watchPlan(id,onChange,onError){
  return onSnapshot(collection(db,'weekendPlans',id,'spots'),{includeMetadataChanges:true},snapshot=>{
    onChange(snapshot.docs.map(d=>({id:d.id,...d.data()})),{fromCache:snapshot.metadata.fromCache,pending:snapshot.metadata.hasPendingWrites});
  },onError);
}
export function watchAccess(id,user,onRemoved){
  return onSnapshot(planRef(id),()=>{},onRemoved);
}
export async function writeWeekend(id,spotId,weekend,expectedRevision){
  const user=requireUser(),ref=doc(db,'weekendPlans',id,'spots',spotId);
  await runTransaction(db,async tx=>{
    const previous=await tx.get(ref),revision=previous.exists()?previous.data().revision:0;
    if(revision!==expectedRevision)throw Error('這個景點已被其他人更新，請確認最新安排後再選一次');
    tx.set(ref,{weekend:weekend?Timestamp.fromDate(new Date(weekend+'T00:00:00Z')):null,revision:revision+1,updatedBy:user.uid,updatedAt:serverTimestamp()});
  });
}
export async function createInvite(id){
  requireUser();
  const bytes=crypto.getRandomValues(new Uint8Array(24));
  const token=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  await setDoc(doc(db,'weekendPlans',id,'invites',token),{createdAt:serverTimestamp(),expiresAt:Timestamp.fromMillis(Date.now()+7*86400000),revoked:false});
  return token;
}
export async function joinPlan(id,token){
  const user=requireUser(),ref=doc(db,'weekendPlans',id,'members',user.uid);
  // Rules verify the token's existence, expiry and revocation, not client input.
  const existing=await getDoc(ref);
  if(!existing.exists())await setDoc(ref,{uid:user.uid,role:'editor',inviteToken:token,joinedAt:serverTimestamp()});
  const plan=await getPlan(id);
  if(!(await getDoc(indexRef(user.uid,id))).exists())
    await setDoc(indexRef(user.uid,id),{title:plan.title,joinedAt:serverTimestamp()});
  return plan;
}
export async function revokeInvites(id){
  const snapshot=await getDocs(collection(db,'weekendPlans',id,'invites'));
  // Sequential, bounded writes; no broad deletes or changes to existing members.
  for(const invitation of snapshot.docs)if(!invitation.data().revoked)await updateDoc(invitation.ref,{revoked:true});
}
export async function listMembers(id){
  const snapshot=await getDocs(collection(db,'weekendPlans',id,'members'));
  return snapshot.docs.map(d=>d.id);
}
export async function removeMember(id,uid){
  await deleteDoc(doc(db,'weekendPlans',id,'members',uid));
}
