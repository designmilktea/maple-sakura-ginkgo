// One plain-text note per destination, scoped independently from weekend choices.
const NOTE_STORAGE_KEY='hokuriku-maple-notes-v1';
const noteState={local:{},shared:{},ready:false,drafts:new Map()};
const noteElement=id=>document.getElementById(id);
const noteLength=text=>Array.from(text).length;
function sharedNotes(){return typeof cloudState!=='undefined'&&cloudState.mode==='shared';}
function noteScope(){return sharedNotes()?`${cloudState.user?.uid}:${cloudState.plan?.id}:${cloudState.epoch}`:'local';}
function noteRecord(id){return (sharedNotes()?noteState.shared:noteState.local)[id]||{text:'',revision:0};}
function noteDraft(id){return noteState.drafts.get(noteScope()+':'+id);}
function noteCanEdit(){return !sharedNotes()||Boolean(noteState.ready&&cloudState.ready&&cloudState.user&&!cloudState.plan?.deletingAt);}
function notesResetCloud(){
  noteState.shared={};noteState.ready=false;
  for(const id of ['spotNotesText','spotNotesLatest','spotNotesMeta','spotNotesStatus'])noteElement(id).textContent='';
  noteElement('spotNotesInput').value='';
  for(const key of noteState.drafts.keys())if(!key.startsWith('local:'))noteState.drafts.delete(key);
}
function notesApply(id,record){
  if(record.revision>=(noteState.shared[id]?.revision||0))noteState.shared[id]=record;
}
function notesReceive(records,meta){
  if(!meta.pending)for(const record of records){
    if(spots.some(s=>s.id===record.id)&&typeof record.text==='string'&&noteLength(record.text)<=1000&&Number.isInteger(record.revision))notesApply(record.id,record);
  }
  noteState.ready=!meta.fromCache&&!meta.pending;
  if(selectedSpotId)renderSpotNotes(selectedSpotId);
}
function renderSpotNotes(id){
  if(!id)return;
  const record=noteRecord(id),draft=noteDraft(id),editing=Boolean(draft),busy=Boolean(draft?.busy);
  const conflict=editing&&(record.revision||0)>draft.revision;
  noteElement('spotNotesText').textContent=record.text;
  noteElement('spotNotesText').hidden=!record.text||editing;
  noteElement('spotNotesEdit').hidden=editing;
  noteElement('spotNotesEdit').disabled=!noteCanEdit();
  noteElement('spotNotesEdit').textContent=record.text?'編輯筆記':'新增筆記';
  noteElement('spotNotesEditor').hidden=!editing;
  noteElement('spotNotesEditor').inert=!editing;
  if(editing){
    const input=noteElement('spotNotesInput');
    if(input.value!==draft.text)input.value=draft.text;
    input.disabled=busy;
    input.setAttribute('aria-invalid',String(noteLength(draft.text)>1000));
    noteElement('spotNotesCount').textContent=`${noteLength(draft.text)} / 1,000 字`;
    noteElement('spotNotesSave').disabled=busy||conflict||!noteCanEdit()||noteLength(draft.text)>1000;
    noteElement('spotNotesSave').textContent=busy?'正在儲存…':'儲存';
    noteElement('spotNotesCancel').disabled=busy;
    noteElement('spotNotesConflict').hidden=!conflict;
    noteElement('spotNotesLatest').textContent=record.text||'（目前沒有筆記）';
    noteElement('spotNotesUseLatest').disabled=busy;
    noteElement('spotNotesKeepDraft').disabled=busy;
  }else{
    noteElement('spotNotesInput').value='';noteElement('spotNotesLatest').textContent='';noteElement('spotNotesConflict').hidden=true;
  }
  const rawTime=record.updatedAt?.toDate?record.updatedAt.toDate():record.updatedAt?new Date(record.updatedAt):null;
  const time=rawTime&&!Number.isNaN(rawTime.getTime())?new Intl.DateTimeFormat('zh-TW',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(rawTime):'';
  noteElement('spotNotesMeta').textContent=record.text&&time?`${sharedNotes()?(record.updatedBy===cloudState.user?.uid?'你':'行程成員'):'瀏覽器暫存'} · ${time} 更新`:'';
  noteElement('spotNotesMeta').hidden=!record.text||!time;
  noteElement('spotNotesStatus').textContent=draft?.error||(sharedNotes()&&!noteCanEdit()?'筆記同步中／離線，暫停編輯。':'');
}
function notesStartEditing(){
  if(!selectedSpotId||!noteCanEdit())return;
  const record=noteRecord(selectedSpotId);
  noteState.drafts.set(noteScope()+':'+selectedSpotId,{text:record.text,revision:record.revision||0});
  renderSpotNotes(selectedSpotId);noteElement('spotNotesInput').focus({preventScroll:true});
}
function notesResolveConflict(useLatest){
  const draft=noteDraft(selectedSpotId);if(!draft||draft.busy)return;
  const record=noteRecord(selectedSpotId);
  if(useLatest)draft.text=record.text;
  draft.revision=record.revision;draft.error='';
  renderSpotNotes(selectedSpotId);noteElement('spotNotesInput').focus({preventScroll:true});
}
async function notesSave(){
  const id=selectedSpotId,scope=noteScope(),key=scope+':'+id,draft=noteState.drafts.get(key);
  if(!id||!draft||draft.busy||!noteCanEdit())return;
  if(noteLength(draft.text)>1000){draft.error='請將筆記縮短至 1,000 字以內。';renderSpotNotes(id);return;}
  if((noteRecord(id).revision||0)>draft.revision){renderSpotNotes(id);return;}
  const text=draft.text.trim(),shared=sharedNotes(),pendingKey='note:'+id;
  draft.busy=true;draft.error='';
  if(shared){cloudState.pending.add(pendingKey);cloudSyncControls();}
  renderSpotNotes(id);
  try{
    if(shared){
      const receipt=await cloudState.api.writeNote(cloudState.plan.id,id,text,draft.revision);
      if(scope!==noteScope())return;
      notesApply(id,{...receipt,updatedAt:Date.now()});
    }else{
      const next={...noteState.local};
      if(text)next[id]={text,updatedAt:Date.now()};else delete next[id];
      localStorage.setItem(NOTE_STORAGE_KEY,JSON.stringify(next));
      noteState.local=next;
    }
    noteState.drafts.delete(key);
    if(scope===noteScope())showToast(text?'筆記已儲存':'筆記已清除');
  }catch(error){
    if(scope!==noteScope())return;
    if(error.code==='notes/conflict'&&error.latest){notesApply(id,error.latest);draft.error='筆記已由其他成員更新。請比較最新版，再決定如何保留草稿。';}
    else draft.error='無法儲存，草稿仍保留。'+(error.message||'請確認連線後重試。');
  }finally{
    if(scope===noteScope()){
      draft.busy=false;
      if(shared){cloudState.pending.delete(pendingKey);cloudSyncControls();}
      if(selectedSpotId)renderSpotNotes(selectedSpotId);
      if(!noteState.drafts.has(key)&&selectedSpotId===id)noteElement('spotNotesEdit').focus({preventScroll:true});
    }
  }
}
function initSpotNotes(){
  try{
    const data=JSON.parse(localStorage.getItem(NOTE_STORAGE_KEY)||'{}');
    if(data&&typeof data==='object'&&!Array.isArray(data))for(const [id,record]of Object.entries(data)){
      if(spots.some(s=>s.id===id)&&record&&typeof record.text==='string'&&noteLength(record.text)<=1000&&Number.isFinite(record.updatedAt))noteState.local[id]={text:record.text,updatedAt:record.updatedAt};
    }
  }catch{/* Unavailable/corrupt storage never changes weekend plans. */}
  noteElement('spotNotesEdit').addEventListener('click',notesStartEditing);
  noteElement('spotNotesInput').addEventListener('input',()=>{
    const draft=noteDraft(selectedSpotId);if(!draft||draft.busy)return;
    draft.text=noteElement('spotNotesInput').value;draft.error='';renderSpotNotes(selectedSpotId);
  });
  noteElement('spotNotesCancel').addEventListener('click',()=>{
    const draft=noteDraft(selectedSpotId);if(!draft||draft.busy)return;
    noteState.drafts.delete(noteScope()+':'+selectedSpotId);renderSpotNotes(selectedSpotId);noteElement('spotNotesEdit').focus({preventScroll:true});
  });
  noteElement('spotNotesSave').addEventListener('click',notesSave);
  noteElement('spotNotesUseLatest').addEventListener('click',()=>notesResolveConflict(true));
  noteElement('spotNotesKeepDraft').addEventListener('click',()=>notesResolveConflict(false));
}
