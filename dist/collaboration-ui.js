// Shared-plan state is separate from the legacy browser-only save key.
const cloudState={mode:'local',plan:null,user:null,ready:false,api:null,epoch:0,pending:new Set(),revisions:{},stops:[],localSaved:null};
const cloudElement=id=>document.getElementById(id);
const validPlanId=id=>typeof id==='string'&&/^[A-Za-z0-9]{20}$/.test(id);
function cloudMessage(text){cloudElement('cloudStatus').textContent=text;}
function cloudRefresh(){
  renderFilters();renderSpots();
  if(selectedSpotId)renderDetail(spots.find(s=>s.id===selectedSpotId));
  cloudSyncControls();
}
function cloudSyncControls(){
  const shared=cloudState.mode==='shared';
  document.querySelectorAll('.weekend-select').forEach(control=>{
    const id=control.dataset.id||selectedSpotId;
    control.disabled=shared&&(!cloudState.ready||cloudState.pending.has(id));
  });
  cloudElement('cloudScope').textContent=shared?(cloudState.plan?.title||'共編行程'):'此瀏覽器的安排';
  cloudElement('cloudLogin').hidden=Boolean(cloudState.user);
  cloudElement('cloudLogout').hidden=!cloudState.user;
  cloudElement('cloudUser').textContent=cloudState.user?'已登入 Google':'未登入';
  const owner=shared&&cloudState.plan?.ownerUid===cloudState.user?.uid;
  cloudElement('cloudInvite').hidden=!owner;
  cloudElement('cloudRevoke').hidden=!owner;
  cloudElement('cloudMembers').hidden=!owner;
  cloudElement('cloudImport').hidden=!shared||!cloudState.ready;
  cloudElement('cloudJoin').hidden=!(shared&&cloudState.user&&new URLSearchParams(window.location.hash.slice(1)).has('join'));
  for(const id of ['cloudCreate','cloudOpen','cloudJoin'])cloudElement(id).disabled=!cloudState.api||!cloudState.user||cloudState.pending.size>0;
  cloudElement('cloudCopyInvite').hidden=!cloudElement('cloudInviteLink').value;
}
function cloudStop(){
  cloudState.stops.forEach(stop=>stop());cloudState.stops=[];cloudState.epoch++;
  cloudState.ready=false;cloudState.revisions={};
}
function cloudRoute(id){
  const url=new URL(window.location.href);
  if(id)url.searchParams.set('plan',id);else url.searchParams.delete('plan');
  url.hash='';
  window.history.replaceState(null,'',url.href);
}
function cloudLocal(){
  if(cloudState.pending.size){showToast('請等待儲存完成');return;}
  cloudStop();cloudState.mode='local';cloudState.plan=null;
  cloudElement('cloudInviteLink').value='';cloudElement('cloudInviteLink').hidden=true;cloudElement('cloudMemberList').replaceChildren();
  if(cloudState.localSaved)saved={...cloudState.localSaved};
  cloudRoute(null);cloudMessage('安排僅儲存在此瀏覽器；不會自動上傳。');cloudRefresh();
}
function cloudFail(error){
  cloudMessage(error?.code==='permission-denied'?'沒有此行程的存取權，請向建立者索取有效邀請。':error?.message||'雲端連線失敗，請稍後重試。');
}
async function cloudOpen(id){
  if(!validPlanId(id))throw Error('行程連結格式不正確');
  if(cloudState.pending.size)throw Error('請等待儲存完成');
  if(cloudState.mode==='local')cloudState.localSaved={...saved};
  cloudStop();const epoch=cloudState.epoch;
  cloudState.mode='shared';cloudState.plan={id};saved={};cloudRefresh();
  cloudElement('cloudInviteLink').value='';cloudElement('cloudInviteLink').hidden=true;cloudElement('cloudMemberList').replaceChildren();
  if(!cloudState.user){cloudMessage('請先登入 Google，再加入或開啟此行程。');return;}
  if(!cloudState.api)throw Error('Firebase 尚未載入');
  try{
    const plan=await cloudState.api.getPlan(id);
    if(epoch!==cloudState.epoch)return;
    cloudState.plan=plan;cloudRoute(id);cloudMessage('正在同步共編行程…');
    cloudState.stops.push(cloudState.api.watchAccess(id,cloudState.user,()=>{
      if(epoch!==cloudState.epoch)return;
      cloudStop();saved={};cloudMessage('行程權限已變更，請重新開啟。');cloudRefresh();
    }));
    cloudState.stops.push(cloudState.api.watchPlan(id,(records,meta)=>{
      if(epoch!==cloudState.epoch)return;
      const next={},revisions={};
      for(const r of records){
        if(!spots.some(s=>s.id===r.id))continue;
        revisions[r.id]=r.revision;
        if(r.weekend?.toDate)next[r.id]=r.weekend.toDate().toISOString().slice(0,10);
      }
      saved=next;cloudState.revisions=revisions;cloudState.ready=!meta.fromCache&&!meta.pending;
      cloudMessage(meta.fromCache?'離線／等待伺服器確認，暫停編輯。':meta.pending?'正在儲存…':'已同步・此行程的成員可共同編輯');
      cloudRefresh();
    },error=>{
      if(epoch!==cloudState.epoch)return;
      cloudStop();saved={};cloudFail(error);cloudRefresh();
    }));
  }catch(error){
    if(epoch===cloudState.epoch){cloudState.ready=false;cloudFail(error);cloudSyncControls();}
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
    .finally(()=>{cloudState.pending.delete(id);if(epoch===cloudState.epoch)cloudRefresh();});
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
  const select=cloudElement('cloudPlanChoice');select.replaceChildren();
  if(!cloudState.user)return;
  const uid=cloudState.user.uid,epoch=cloudState.epoch;
  const plans=await cloudState.api.listPlans();
  if(cloudState.user?.uid!==uid||cloudState.epoch!==epoch)return;
  for(const plan of plans){
    const option=document.createElement('option');option.value=plan.id;option.textContent=plan.title;select.append(option);
  }
}
async function cloudJoin(){
  const id=new URL(window.location.href).searchParams.get('plan');
  const token=new URLSearchParams(window.location.hash.slice(1)).get('join');
  if(!validPlanId(id)||!/^[a-f0-9]{48}$/.test(token||''))throw Error('邀請連結無效');
  await cloudState.api.joinPlan(id,token);
  cloudRoute(id);await cloudOpen(id);await cloudLoadChoices();
}
async function cloudImport(){
  if(!cloudState.ready)throw Error('請等待同步完成');
  const local=cloudState.localSaved||{};
  const entries=Object.entries(local).filter(([id,date])=>spots.some(s=>s.id===id)&&validCloudDate(date));
  if(!window.confirm('將此瀏覽器的 '+entries.length+' 筆安排加入目前共編行程？已有安排或曾清除的景點不會覆蓋。'))return;
  // Individual transactions never replace the entire shared plan.
  for(const [id,value]of entries){
    if(Object.hasOwn(cloudState.revisions,id))continue;
    if(!cloudState.ready)throw Error('同步中斷，請重新確認後匯入');
    cloudState.pending.add(id);
    try{await cloudState.api.writeWeekend(cloudState.plan.id,id,value,0);}
    finally{cloudState.pending.delete(id);}
  }
  showToast('匯入完成，原本的瀏覽器安排仍保留');
}
function initCollaboration(){
  cloudElement('cloudPanelButton').addEventListener('click',()=>{cloudElement('cloudDialog').showModal();});
  cloudElement('cloudClose').addEventListener('click',()=>cloudElement('cloudDialog').close());
  cloudElement('cloudLocal').addEventListener('click',cloudLocal);
  cloudElement('cloudLogin').addEventListener('click',()=>cloudAction(()=>cloudState.api?cloudState.api.login():Promise.reject(Error('Firebase 尚未載入，請稍後再試'))));
  cloudElement('cloudLogout').addEventListener('click',()=>cloudAction(async()=>{
    if(cloudState.pending.size)throw Error('請等待儲存完成');
    await cloudState.api.logout();cloudLocal();
  }));
  cloudElement('cloudCreate').addEventListener('click',()=>cloudAction(async()=>{
    const title=cloudElement('cloudPlanTitle').value.trim();
    if(!title||title.length>80)throw Error('請輸入1至80字的行程名稱');
    const uid=cloudState.user?.uid,epoch=cloudState.epoch;
    const id=await cloudState.api.createPlan(title);
    if(cloudState.user?.uid!==uid||cloudState.epoch!==epoch)return;
    await cloudOpen(id);await cloudLoadChoices();
  }));
  cloudElement('cloudOpen').addEventListener('click',()=>cloudAction(()=>cloudOpen(cloudElement('cloudPlanChoice').value)));
  cloudElement('cloudJoin').addEventListener('click',()=>cloudAction(cloudJoin));
  cloudElement('cloudImport').addEventListener('click',()=>cloudAction(cloudImport));
  cloudElement('cloudInvite').addEventListener('click',()=>cloudAction(async()=>{
    const token=await cloudState.api.createInvite(cloudState.plan.id),url=new URL(window.location.href);
    url.search='';url.searchParams.set('plan',cloudState.plan.id);url.hash='join='+token;
    const field=cloudElement('cloudInviteLink');field.value=url.href;field.hidden=false;field.focus();field.select();
    cloudMessage('邀請7天內有效；持有連結的人登入後可加入共編。請只分享給信任的人。'+(isLocalShareUrl(url.href)?'目前網址僅供本機預覽，朋友需使用正式網站網址。':''));
  }));
  cloudElement('cloudCopyInvite').addEventListener('click',()=>cloudAction(async()=>{
    const value=cloudElement('cloudInviteLink').value;if(!value)throw Error('請先產生邀請連結');
    if(await writeClipboard(value))showToast('已複製邀請連結');else {cloudElement('cloudInviteLink').focus();cloudElement('cloudInviteLink').select();cloudMessage('請手動複製連結');}
  }));
  cloudElement('cloudRevoke').addEventListener('click',()=>cloudAction(async()=>{
    await cloudState.api.revokeInvites(cloudState.plan.id);
    cloudElement('cloudInviteLink').value='';cloudElement('cloudInviteLink').hidden=true;
    cloudMessage('已撤銷現有邀請；已加入的成員不受影響。');
  }));
  cloudElement('cloudMembers').addEventListener('click',()=>cloudAction(async()=>{
    const holder=cloudElement('cloudMemberList');holder.replaceChildren();
    for(const uid of await cloudState.api.listMembers(cloudState.plan.id)){
      const row=document.createElement('div'),label=document.createElement('span'),button=document.createElement('button');
      label.textContent='成員 '+uid.slice(0,8);button.textContent='移除成員';button.type='button';
      button.addEventListener('click',()=>cloudAction(async()=>{
        await cloudState.api.removeMember(cloudState.plan.id,uid);row.remove();cloudMessage('已移除此成員；若他仍持有效邀請可再次加入。');
      }));row.append(label,button);holder.append(row);
    }
  }));
  const initialId=new URL(window.location.href).searchParams.get('plan');
  if(initialId){
    cloudState.localSaved={...saved};cloudState.mode='shared';cloudState.plan={id:initialId};saved={};cloudRefresh();
    cloudMessage('請先登入 Google，再開啟共編行程。');
  }
  if(!['http:','https:'].includes(window.location.protocol)){cloudMessage('登入與共編需透過 HTTP／HTTPS 網站使用。');return;}
  import('./firebase-client.mjs').then(api=>{
    cloudState.api=api;
    api.observeAuth(user=>{
      cloudStop();cloudState.user=user;
      if(cloudState.mode==='shared')saved={};
      cloudElement('cloudInviteLink').value='';cloudElement('cloudInviteLink').hidden=true;
      cloudElement('cloudMemberList').replaceChildren();
      cloudRefresh();
      cloudAction(async()=>{
        await cloudLoadChoices();
        if(cloudState.mode==='shared'){
          if(user&&new URLSearchParams(window.location.hash.slice(1)).has('join'))cloudMessage('你收到共編邀請。請按「接受邀請並加入共編」；登入不會自動加入。');
          else if(user)await cloudOpen(cloudState.plan.id);
          else cloudMessage('請先登入 Google，再加入或開啟此行程。');
        }else cloudMessage(user?'已登入；目前仍使用瀏覽器安排。可建立或開啟共編行程。':'安排僅儲存在此瀏覽器；登入後可建立或加入共編行程。');
      });
    });
  }).catch(()=>{cloudMessage('Firebase 無法載入；本機安排仍可使用，請檢查網路後重新整理。');});
  window.addEventListener('offline',()=>{if(cloudState.mode==='shared'){cloudState.ready=false;cloudMessage('目前離線，共編暫停編輯。');cloudSyncControls();}});
  cloudSyncControls();
}
