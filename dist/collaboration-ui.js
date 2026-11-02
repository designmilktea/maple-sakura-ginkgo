// Shared-plan state is separate from the legacy browser-only save key.
const cloudState={mode:'local',choosing:false,plan:null,user:null,authReady:false,authBusy:false,opening:false,loadingTimer:null,choicesLoading:false,choicesRequest:0,ready:false,api:null,epoch:0,pending:new Set(),revisions:{},stops:[],localSaved:null};
const cloudElement=id=>document.getElementById(id);
const validPlanId=id=>typeof id==='string'&&/^[A-Za-z0-9]{20}$/.test(id);
function cloudMessage(text){cloudElement('cloudStatus').textContent=text;}
function cloudRefresh(){
  renderFilters();renderSpots();
  if(selectedSpotId)renderDetail(spots.find(s=>s.id===selectedSpotId));
  cloudSyncControls();
}
function cloudSyncControls(){
  const signedIn=cloudState.authReady&&Boolean(cloudState.user);
  const shared=signedIn&&cloudState.mode==='shared';
  const invite=Boolean(new URLSearchParams(window.location.hash.slice(1)).get('join'))&&validPlanId(new URL(window.location.href).searchParams.get('plan'));
  for(const [id,visible] of [['cloudAuthenticated',signedIn],['cloudBrowse',signedIn&&(!shared||cloudState.choosing)],['cloudCurrent',shared&&!cloudState.choosing],['cloudInvitation',signedIn&&invite&&!shared]]){
    cloudElement(id).hidden=!visible;cloudElement(id).inert=!visible;
  }
  cloudElement('cloudCurrentTitle').textContent=shared?(cloudState.plan?.title||'正在開啟行程…'):'';
  document.querySelectorAll('.weekend-select').forEach(control=>{
    const id=control.dataset.id||selectedSpotId;
    control.disabled=shared&&(!cloudState.ready||cloudState.pending.has(id));
  });
  cloudElement('weekendTitle').textContent=(shared?(cloudState.plan?.title||'共編行程'):'瀏覽器暫存')+'的賞楓週末';
  cloudElement('cloudLogin').hidden=!cloudState.authReady||signedIn;
  cloudElement('cloudLogin').disabled=!cloudState.api||cloudState.authBusy;
  cloudElement('cloudLogout').hidden=!cloudState.user;
  cloudElement('cloudUser').hidden=!signedIn;
  cloudElement('cloudUser').textContent=signedIn?'已登入 Google':'';
  const owner=shared&&cloudState.plan?.ownerUid===cloudState.user?.uid;
  const deleting=Boolean(cloudState.plan?.deletingAt),busy=cloudState.pending.size>0;
  cloudElement('cloudDeleteArea').hidden=!owner;cloudElement('cloudDelete').hidden=!owner;
  cloudElement('cloudDelete').textContent=deleting?'繼續刪除行程':'刪除行程';
  cloudElement('cloudDelete').disabled=busy||!cloudState.api;
  cloudElement('cloudReturn').hidden=!shared;
  cloudElement('cloudInviteField').hidden=!owner||!cloudElement('cloudInviteLink').value;
  cloudElement('cloudOpen').textContent=cloudElement('cloudPlanChoice').value?'開啟行程':'使用瀏覽器暫存';
  for(const id of ['cloudInvite','cloudRevoke','cloudMembers','cloudImport'])cloudElement(id).disabled=busy||deleting;
  for(const id of ['cloudLogout','cloudLocal','cloudReturn','cloudPlanChoice','cloudPlanTitle'])cloudElement(id).disabled=busy||(id==='cloudPlanChoice'&&cloudState.choicesLoading);
  cloudElement('cloudInvite').hidden=!owner;
  cloudElement('cloudRevoke').hidden=!owner;
  cloudElement('cloudMembers').hidden=!owner;
  cloudElement('cloudImport').hidden=!shared||!cloudState.ready||deleting;
  cloudElement('cloudJoin').hidden=!(signedIn&&invite&&!shared);
  for(const id of ['cloudCreate','cloudOpen','cloudJoin'])cloudElement(id).disabled=!cloudState.api||!cloudState.user||cloudState.pending.size>0;
  cloudElement('cloudOpen').disabled=cloudElement('cloudOpen').disabled||cloudState.choicesLoading;
  cloudElement('cloudCopyInvite').hidden=!owner||!cloudElement('cloudInviteLink').value;
}
function cloudSetLoading(open){
  const dialog=cloudElement('cloudLoadingDialog');
  cloudState.opening=open;
  if(!open){
    clearTimeout(cloudState.loadingTimer);cloudState.loadingTimer=null;
    if(dialog.open)dialog.close();
    return;
  }
  if(!dialog.open)dialog.showModal();
  if(cloudState.loadingTimer===null){
    const epoch=cloudState.epoch;
    cloudState.loadingTimer=setTimeout(()=>{
      if(!cloudState.opening||epoch!==cloudState.epoch)return;
      cloudLocal();cloudMessage('開啟行程逾時，已切回瀏覽器暫存。請檢查網路後重試。');
    },20000);
  }
}
function cloudStop(){
  cloudSetLoading(false);
  cloudState.stops.forEach(stop=>stop());cloudState.stops=[];cloudState.epoch++;
  cloudState.ready=false;cloudState.revisions={};cloudState.choicesLoading=false;cloudState.choicesRequest++;
}
function cloudRoute(id){
  const url=new URL(window.location.href);
  if(id)url.searchParams.set('plan',id);else url.searchParams.delete('plan');
  url.hash='';
  window.history.replaceState(null,'',url.href);
}
function cloudLocal(){
  if(cloudState.pending.size){showToast('請等待儲存完成');return;}
  cloudStop();cloudState.mode='local';cloudState.choosing=false;cloudState.plan=null;
  cloudElement('cloudInviteLink').value='';cloudElement('cloudInviteLink').hidden=true;cloudElement('cloudMemberList').replaceChildren();
  if(cloudState.localSaved)saved={...cloudState.localSaved};
  cloudState.localSaved=null;cloudElement('cloudPlanChoice').value='';
  cloudRoute(null);cloudMessage('瀏覽器暫存僅保留於本機；不會自動上傳。');cloudRefresh();
}
function cloudFail(error){
  const authErrors={'auth/popup-closed-by-user':'已取消登入，可隨時重試。','auth/cancelled-popup-request':'登入已取消，請重新嘗試。','auth/popup-blocked':'瀏覽器阻擋登入視窗，請允許彈出視窗後再試。','auth/unauthorized-domain':'此網站尚未獲得登入授權，請聯絡網站管理者。','auth/network-request-failed':'登入連線失敗，請檢查網路後再試。'};
  cloudMessage(authErrors[error?.code]|| (error?.code==='permission-denied'?'沒有此行程的存取權，請向建立者索取有效邀請。':error?.message||'雲端連線失敗，請稍後重試。'));
}
async function cloudOpen(id){
  if(!cloudState.user)throw Error('請先登入 Google，再開啟共編行程');
  if(!cloudState.api)throw Error('Firebase 尚未載入');
  if(!validPlanId(id))throw Error('行程連結格式不正確');
  if(cloudState.pending.size)throw Error('請等待儲存完成');
  if(cloudState.mode==='local')cloudState.localSaved={...saved};
  cloudStop();const epoch=cloudState.epoch;cloudSetLoading(true);
  cloudState.mode='shared';cloudState.choosing=false;cloudState.plan={id};saved={};cloudRefresh();
  cloudElement('cloudInviteLink').value='';cloudElement('cloudInviteLink').hidden=true;cloudElement('cloudMemberList').replaceChildren();
  try{
    const plan=await cloudState.api.getPlan(id);
    if(epoch!==cloudState.epoch)return;
    cloudState.plan=plan;cloudRoute(id);cloudMessage('正在同步共編行程…');cloudSyncControls();
    cloudState.stops.push(cloudState.api.watchAccess(id,cloudState.user,()=>{
      if(epoch!==cloudState.epoch)return;
      cloudState.pending.clear();cloudLocal();cloudMessage('行程已刪除或權限已變更，已切回瀏覽器暫存。');
    },updated=>{
      if(epoch!==cloudState.epoch||!updated.deletingAt)return;
      cloudStop();cloudState.pending.clear();cloudState.plan=updated;saved={};
      cloudMessage('此行程正在刪除，已停止共編。建立者可繼續完成刪除。');cloudRefresh();
    }));
    if(plan.deletingAt){cloudSetLoading(false);cloudMessage('此行程尚未刪除完成，請按「繼續刪除行程」。');return;}
    cloudState.stops.push(cloudState.api.watchPlan(id,(records,meta)=>{
      if(epoch!==cloudState.epoch)return;
      const next={},revisions={};
      for(const r of records){
        if(!spots.some(s=>s.id===r.id))continue;
        revisions[r.id]=r.revision;
        if(r.weekend?.toDate)next[r.id]=r.weekend.toDate().toISOString().slice(0,10);
      }
      saved=next;cloudState.revisions=revisions;cloudState.ready=!meta.fromCache&&!meta.pending;
      if(cloudState.ready)cloudSetLoading(false);
      cloudMessage(meta.fromCache?'離線／等待伺服器確認，暫停編輯。':meta.pending?'正在儲存…':'已同步・此行程的成員可共同編輯');
      cloudRefresh();
    },error=>{
      if(epoch!==cloudState.epoch)return;
      cloudState.pending.clear();cloudLocal();cloudFail(error);
    }));
  }catch(error){
    if(epoch===cloudState.epoch){cloudLocal();cloudFail(error);}
  }
}
function handleCloudWeekend(event){
  if(cloudState.mode!=='shared')return false;
  const id=event.target.dataset.id,value=event.target.value;
  if(!cloudState.ready||!cloudState.user){showToast('請先登入並等待行程完成同步');cloudRefresh();return true;}
  if(cloudState.pending.has(id))return true;
  if(!spots.some(s=>s.id===id)||!validCloudDate(value)){showToast('週末日期不正確');cloudRefresh();return true;}
  const epoch=cloudState.epoch,planId=cloudState.plan.id,revision=cloudState.revisions[id]||0;
  cloudState.pending.add(id);cloudSyncControls();cloudMessage('正在儲存…');
  cloudState.api.writeWeekend(planId,id,value,revision).then(()=>{
    if(epoch===cloudState.epoch)showToast(value?'已儲存至共編行程':'已清除此景點的共編安排');
  }).catch(error=>{if(epoch===cloudState.epoch){cloudFail(error);showToast(error.message||'儲存失敗，原安排未變更');}})
    .finally(()=>{if(epoch===cloudState.epoch){cloudState.pending.delete(id);cloudRefresh();}});
  return true;
}
function validCloudDate(value){
  if(value==='')return true;
  if(!/^20[0-9]{2}-[0-9]{2}-[0-9]{2}$/.test(value))return false;
  const date=new Date(value+'T00:00:00Z');
  return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===value&&date.getUTCDay()===6;
}
async function cloudAction(action){
  try{await action();}catch(error){cloudFail(error);showToast(error.message||'操作失敗');}
  cloudSyncControls();
}
async function cloudLoadChoices(){
  const select=cloudElement('cloudPlanChoice');
  if(!cloudState.user){select.replaceChildren();return;}
  const uid=cloudState.user.uid,epoch=cloudState.epoch,request=++cloudState.choicesRequest;
  cloudState.choicesLoading=true;cloudSyncControls();
  try{
    const plans=await cloudState.api.listPlans();
    if(cloudState.user?.uid!==uid||cloudState.epoch!==epoch||request!==cloudState.choicesRequest)return;
    select.replaceChildren();
    const localOption=document.createElement('option');localOption.value='';localOption.textContent='瀏覽器暫存';select.append(localOption);
    for(const plan of plans){
      const option=document.createElement('option');option.value=plan.id;option.textContent=plan.title+(plan.deletingAt?'（刪除未完成）':'');select.append(option);
    }
    select.value=cloudState.mode==='shared'?cloudState.plan.id:'';
  }finally{
    if(request===cloudState.choicesRequest){cloudState.choicesLoading=false;cloudSyncControls();}
  }
}
async function cloudJoin(){
  const id=new URL(window.location.href).searchParams.get('plan');
  const token=new URLSearchParams(window.location.hash.slice(1)).get('join');
  if(!validPlanId(id)||!/^[a-f0-9]{48}$/.test(token||''))throw Error('邀請連結無效');
  const epoch=cloudState.epoch;
  await cloudState.api.joinPlan(id,token);
  if(epoch!==cloudState.epoch)return;
  cloudRoute(id);await cloudOpen(id);await cloudLoadChoices();
}
async function cloudImport(){
  if(!cloudState.ready)throw Error('請等待同步完成');
  const epoch=cloudState.epoch,planId=cloudState.plan.id;
  const local=cloudState.localSaved||{};
  const entries=Object.entries(local).filter(([id,date])=>spots.some(s=>s.id===id)&&validCloudDate(date));
  if(!window.confirm('將瀏覽器暫存中的 '+entries.length+' 筆安排加入目前共編行程？已有安排或曾清除的景點不會覆蓋。'))return;
  // Individual transactions never replace the entire shared plan.
  for(const [id,value]of entries){
    if(Object.hasOwn(cloudState.revisions,id))continue;
    if(epoch!==cloudState.epoch||!cloudState.ready)throw Error('同步中斷，請重新確認後匯入');
    cloudState.pending.add(id);
    try{await cloudState.api.writeWeekend(planId,id,value,0);}
    finally{if(epoch===cloudState.epoch)cloudState.pending.delete(id);}
  }
  showToast('匯入完成，原本的瀏覽器暫存仍保留');
}
async function cloudLogin(){
  if(!cloudState.api)throw Error('Firebase 尚未載入，請稍後再試');
  if(cloudState.authBusy)return;
  cloudState.authBusy=true;cloudMessage('正在等待 Google 登入…');cloudSyncControls();
  try{await cloudState.api.login();}finally{cloudState.authBusy=false;cloudSyncControls();}
}
async function cloudAuthChanged(user){
  cloudDeleteTarget=null;cloudElement('cloudDeleteDialog').close();cloudElement('cloudDeleteDescription').textContent='';
  const wasShared=cloudState.mode==='shared';
  cloudStop();cloudState.pending.clear();cloudState.user=user;cloudState.authReady=true;
  cloudState.mode='local';cloudState.choosing=false;cloudState.plan=null;
  if(wasShared&&cloudState.localSaved)saved={...cloudState.localSaved};
  cloudState.localSaved=null;
  cloudElement('cloudInviteLink').value='';cloudElement('cloudInviteLink').hidden=true;
  cloudElement('cloudMemberList').replaceChildren();cloudElement('cloudPlanChoice').replaceChildren();
  cloudElement('cloudPlanTitle').value='';
  cloudElement('cloudTitleError').hidden=true;cloudElement('cloudPlanTitle').setAttribute('aria-invalid','false');
  if(!user&&wasShared)cloudRoute(null);
  cloudRefresh();
  if(!user){cloudMessage('登入後可建立或加入共編行程；瀏覽器暫存仍可直接使用。');return;}
  const uid=user.uid;
  const url=new URL(window.location.href),id=url.searchParams.get('plan');
  const invitation=new URLSearchParams(url.hash.slice(1)).has('join');
  cloudMessage(invitation?'你收到共編邀請。請按「接受邀請並加入共編」；登入不會自動加入。':'已登入；目前仍使用瀏覽器暫存。可建立或開啟共編行程。');
  // Restore an existing shared route only after auth resolves; an invitation always needs a click.
  if(id&&!invitation)await cloudOpen(id).catch(cloudFail);
  if(cloudState.user?.uid!==uid)return;
  await cloudAction(cloudLoadChoices);
}
async function cloudChooseOther(){
  if(cloudState.pending.size)throw Error('請等待操作完成');
  cloudState.choosing=true;cloudSyncControls();
  await cloudLoadChoices();cloudElement('cloudPlanChoice').focus();
}
let cloudDeleteTarget=null;
function cloudRequestDelete(){
  if(!cloudState.plan||!cloudState.user||cloudState.plan.ownerUid!==cloudState.user.uid||cloudState.pending.size)return;
  cloudDeleteTarget={id:cloudState.plan.id,epoch:cloudState.epoch};
  cloudElement('cloudDeleteDescription').textContent='「'+cloudState.plan.title+'」的共編安排、邀請與成員將永久刪除，所有成員都將無法存取。瀏覽器暫存不受影響。此操作無法復原。';
  cloudElement('cloudDeleteDialog').showModal();
}
async function cloudDelete(target){
  if(!target||target.epoch!==cloudState.epoch||target.id!==cloudState.plan?.id)throw Error('行程已變更，請重新確認');
  if(cloudState.plan.ownerUid!==cloudState.user?.uid)throw Error('僅建立者可刪除行程');
  if(cloudState.pending.size)throw Error('請等待儲存完成');
  cloudStop();const epoch=cloudState.epoch;
  cloudState.plan={...cloudState.plan,deletingAt:cloudState.plan.deletingAt||true};
  cloudState.pending.add('__delete__');saved={};
  cloudElement('cloudInviteLink').value='';cloudElement('cloudInviteLink').hidden=true;cloudElement('cloudMemberList').replaceChildren();
  cloudMessage('正在刪除行程…');cloudRefresh();
  try{
    await cloudState.api.deletePlan(target.id);
    if(epoch!==cloudState.epoch)return;
    cloudState.pending.clear();cloudLocal();await cloudLoadChoices();cloudMessage('行程已刪除，已切回瀏覽器暫存。');
  }catch(error){
    if(epoch===cloudState.epoch)cloudMessage('刪除尚未完成。請確認網路後按「繼續刪除行程」。'+(error.message||''));
  }finally{
    if(epoch===cloudState.epoch){cloudState.pending.clear();cloudSyncControls();}
  }
}
function initCollaboration(){
  cloudElement('cloudPanelButton').addEventListener('click',()=>{cloudElement('cloudDialog').showModal();});
  cloudElement('cloudCancelOpen').addEventListener('click',cloudLocal);
  cloudElement('cloudLoadingDialog').addEventListener('cancel',event=>{event.preventDefault();cloudLocal();});
  cloudElement('cloudClose').addEventListener('click',()=>cloudElement('cloudDialog').close());
  cloudElement('cloudLocal').addEventListener('click',()=>cloudAction(cloudChooseOther));
  cloudElement('cloudReturn').addEventListener('click',()=>{cloudState.choosing=false;cloudSyncControls();});
  cloudElement('cloudPlanChoice').addEventListener('change',cloudSyncControls);
  cloudElement('cloudDelete').addEventListener('click',cloudRequestDelete);
  cloudElement('cloudDeleteCancel').addEventListener('click',()=>cloudElement('cloudDeleteDialog').close());
  cloudElement('cloudDeleteConfirm').addEventListener('click',()=>{cloudElement('cloudDeleteDialog').close();cloudAction(()=>cloudDelete(cloudDeleteTarget));});
  cloudElement('cloudPlanTitle').addEventListener('input',()=>{cloudElement('cloudTitleError').hidden=true;cloudElement('cloudPlanTitle').setAttribute('aria-invalid','false');});
  cloudElement('cloudLogin').addEventListener('click',()=>cloudAction(cloudLogin));
  cloudElement('cloudLogout').addEventListener('click',()=>cloudAction(async()=>{
    if(cloudState.pending.size)throw Error('請等待儲存完成');
    await cloudState.api.logout();
  }));
  cloudElement('cloudCreate').addEventListener('click',()=>cloudAction(async()=>{
    const title=cloudElement('cloudPlanTitle').value.trim();
    if(!title||title.length>80){cloudElement('cloudTitleError').textContent='請輸入1至80字的行程名稱';cloudElement('cloudTitleError').hidden=false;cloudElement('cloudPlanTitle').setAttribute('aria-invalid','true');cloudElement('cloudPlanTitle').focus();return;}
    const uid=cloudState.user?.uid,epoch=cloudState.epoch;
    const id=await cloudState.api.createPlan(title);
    if(cloudState.user?.uid!==uid||cloudState.epoch!==epoch)return;
    await cloudOpen(id);await cloudLoadChoices();
  }));
  cloudElement('cloudOpen').addEventListener('click',()=>cloudAction(()=>cloudElement('cloudPlanChoice').value?cloudOpen(cloudElement('cloudPlanChoice').value):cloudLocal()));
  cloudElement('cloudJoin').addEventListener('click',()=>cloudAction(cloudJoin));
  cloudElement('cloudImport').addEventListener('click',()=>cloudAction(cloudImport));
  cloudElement('cloudInvite').addEventListener('click',()=>cloudAction(async()=>{
    const epoch=cloudState.epoch;
    const token=await cloudState.api.createInvite(cloudState.plan.id),url=new URL(window.location.href);
    if(epoch!==cloudState.epoch)return;
    url.search='';url.searchParams.set('plan',cloudState.plan.id);url.hash='join='+token;
    const field=cloudElement('cloudInviteLink');field.value=url.href;field.hidden=false;field.focus();field.select();
    cloudMessage('邀請7天內有效；持有連結的人登入後可加入共編。請只分享給信任的人。'+(isLocalShareUrl(url.href)?'目前網址僅供本機預覽，朋友需使用正式網站網址。':''));
  }));
  cloudElement('cloudCopyInvite').addEventListener('click',()=>cloudAction(async()=>{
    const value=cloudElement('cloudInviteLink').value;if(!value)throw Error('請先產生邀請連結');
    if(await writeClipboard(value))showToast('已複製邀請連結');else {cloudElement('cloudInviteLink').focus();cloudElement('cloudInviteLink').select();cloudMessage('請手動複製連結');}
  }));
  cloudElement('cloudRevoke').addEventListener('click',()=>cloudAction(async()=>{
    const epoch=cloudState.epoch;
    await cloudState.api.revokeInvites(cloudState.plan.id);
    if(epoch!==cloudState.epoch)return;
    cloudElement('cloudInviteLink').value='';cloudElement('cloudInviteLink').hidden=true;
    cloudMessage('已撤銷現有邀請；已加入的成員不受影響。');
  }));
  cloudElement('cloudMembers').addEventListener('click',()=>cloudAction(async()=>{
    const holder=cloudElement('cloudMemberList'),epoch=cloudState.epoch,planId=cloudState.plan.id;holder.replaceChildren();
    const members=await cloudState.api.listMembers(planId);
    if(epoch!==cloudState.epoch)return;
    for(const uid of members){
      const row=document.createElement('div'),label=document.createElement('span'),button=document.createElement('button');
      label.textContent='成員 '+uid.slice(0,8);button.textContent='移除成員';button.type='button';
      button.addEventListener('click',()=>cloudAction(async()=>{
        if(epoch!==cloudState.epoch)return;
        await cloudState.api.removeMember(planId,uid);
        if(epoch!==cloudState.epoch)return;
        row.remove();cloudMessage('已移除此成員；若他仍持有效邀請可再次加入。');
      }));row.append(label,button);holder.append(row);
    }
  }));
  if(!['http:','https:'].includes(window.location.protocol)){
    cloudState.authReady=true;cloudMessage('登入與共編需透過 HTTP／HTTPS 網站使用。');cloudSyncControls();return;
  }
  import('./firebase-client.mjs?v=20261102-panels3').then(api=>{
    cloudState.api=api;
    api.observeAuth(user=>{cloudAuthChanged(user);},error=>{
      cloudAuthChanged(null);cloudFail(error);
    });
  }).catch(()=>{
    cloudState.authReady=true;cloudMessage('Firebase 無法載入；瀏覽器暫存仍可使用，請檢查網路後重新整理。');cloudSyncControls();
  });
  window.addEventListener('offline',()=>{if(cloudState.opening){cloudLocal();cloudMessage('目前離線，已切回瀏覽器暫存。');return;}if(cloudState.mode==='shared'){cloudState.ready=false;cloudMessage('目前離線，共編暫停編輯。');cloudSyncControls();}});
  cloudSyncControls();
}
