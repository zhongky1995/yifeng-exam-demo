/* Local prototype personnel directory. Identity keys survive renaming and reassignment. */
(()=>{
  'use strict';
  function prepare(d) {
    d.reviewers ??= Array.from({length:6}, (_,i)=>({id:i, code:'T'+(i+1), name:'评卷老师'+(i+1), active:true}));
    for (const p of Object.values(d.staff)) p.code ??= p.id.toUpperCase();
    d.personnelRev ??= 0;
    RolePolicy.register(d.staff,d.reviewers);
  }
  function list(d,kind){return kind==='staff'?Object.values(d.staff):d.reviewers;}
  function validate(d,kind,rows) {
    if (!['staff','reviewer'].includes(kind)||!Array.isArray(rows)||!rows.length||rows.length>1000) throw Error('请选择人员类别并填写1至1000行。');
    const existing=list(d,kind), seen=new Set();
    return rows.map((row,i)=>{
      const code=String(row.code||'').trim().toUpperCase(), name=String(row.name||'').trim();
      if(!/^[A-Z0-9_-]{1,40}$/.test(code)||!name||name.length>60||/[<>&"']/u.test(name)) throw Error('第'+(i+1)+'条的编号或姓名无效。编号可用字母、数字、下划线或短横线。');
      if(seen.has(code))throw Error('第'+(i+1)+'条编号 '+code+' 重复，请修正后重试。');
      seen.add(code);
      const old=existing.find(p=>p.code===code);
      return {code,name,operation:old?(name===old.name?'已有':'更新'):'新增'};
    });
  }
  function save(d,kind,rows,rev) {
    if(rev!==d.personnelRev) throw Error('人员名单已有变化，请重新预览。');
    for (const item of validate(d,kind,rows)) {
      const old=list(d,kind).find(p=>p.code===item.code);
      if(old){old.name=item.name;continue;}
      const {code,name}=item;
      if(kind==='staff'){
        const id='staff'+(Math.max(0,...Object.keys(d.staff).map(k=>Number(k.slice(5))||0))+1);
        d.staff[id]={id,code,name,active:true};
      }else d.reviewers.push({id:d.reviewers.length,code,name,active:true});
    }
    d.personnelRev++;
  }
  function toggle(d,kind,code){
    const p=list(d,kind).find(x=>x.code===code);
    if(!p)throw Error('人员记录已变化。');
    const inUse=Object.values(d.exams).some(e=>e.status!=='archived'&&(kind==='staff'?RoomStaffV14.rooms(e).some(r=>Object.values(e.roomStaff[r.key]||{}).includes(p.id))||e.transfers.some(t=>t.status==='pending'&&[t.from,t.to].includes(p.id)):e.assignments.some(a=>a.includes(p.id))));
    if(p.active&&inUse)throw Error('此人还有考试分工或待接收岗位，请先处理对应任务。');
    p.active=!p.active;d.personnelRev++;
  }
  let h,preview=null;
  const title=kind=>kind==='staff'?'工作人员':'评卷老师';
  function add(kind){return '<button type="button" data-person-add="'+kind+'">新增'+title(kind)+'</button>';}
  function directory(ctx){
    h=ctx;
    return h.heading('维护人员名单','人员编号用于识别同一人。分配到本场后，可从对应岗位进入任务。',h.link('U03','返回本场分工'))+
      ['staff','reviewer'].map(kind=>'<section class="panel"><h2>'+title(kind)+'</h2><div class="actions">'+add(kind)+'<button data-person-template="'+kind+'">下载名单模板</button><label class="button roster-file-button">导入 Excel<input type="file" data-person-file="'+kind+'" accept=".xlsx,.xls"></label></div>'+
        list(h.context(),kind).map(p=>'<article class="listrow"><div><b>'+h.esc(p.name)+'</b><p>'+h.esc(p.code)+' · '+(p.active?'可用':'停用')+'</p></div><div class="actions"><button data-person-edit="'+kind+'" data-code="'+h.esc(p.code)+'">修改</button><button data-person-toggle="'+kind+'" data-code="'+h.esc(p.code)+'">'+(p.active?'停用':'启用')+'</button></div></article>').join('')+'</section>').join('');
  }
  function editor(kind,code=''){
    const p=list(h.context(),kind).find(x=>x.code===code);
    h.modal((p?'修改':'新增')+title(kind),'<form data-person-form="'+kind+'"><label>人员编号<input required name="code" '+(p?'readonly':'')+' value="'+h.esc(code)+'"></label><label>姓名<input name="name" required value="'+h.esc(p?.name||'')+'"></label><button class="primary">保存人员</button></form>');
  }
  function commit(kind,rows,rev){
    const draft=[...document.querySelectorAll('[name^="assignment-"]:checked')].map(el=>[el.name,el.value]);
    const result=YF.run(h.actorId,'save-personnel',{examId:h.examId,kind,rows,rev});
    if(!result.ok){h.note(result.message,'warning');return;}
    document.querySelector('dialog[open]')?.close();h.note(result.message);
    if(h.screen==='W13')for(const el of document.querySelectorAll('[name^="assignment-"]'))el.checked=draft.some(([name,value])=>el.name===name&&el.value===value);
  }
  document.addEventListener('click',async ev=>{
    if(!h||h.actor.group!=='admin')return;
    const el=ev.target.closest('button');if(!el)return;
    const k=el.dataset;
    if(k.personAdd||k.personEdit)editor(k.personAdd||k.personEdit,k.code);
    if(k.personTemplate)try{await RosterUIV13.writeWorkbook([{name:'人员名单',rows:[['人员编号','姓名'],[k.personTemplate==='staff'?'S101':'T101','虚构人员']]}],title(k.personTemplate)+'名单模板.xlsx');}catch(err){h.note(err.message,'warning');}
    if(k.personToggle)h.execute('toggle-personnel',{kind:k.personToggle,code:k.code});
    if(el.hasAttribute('data-person-confirm')&&preview)commit(preview.kind,preview.rows,preview.rev);
  });
  document.addEventListener('submit',ev=>{
    const f=ev.target.closest('[data-person-form]');if(!f)return;
    ev.preventDefault();const row=Object.fromEntries(new FormData(f)),kind=f.dataset.personForm;
    if(!f.elements.code.readOnly&&list(h.context(),kind).some(p=>p.code===row.code.trim().toUpperCase()))return h.note('该编号已存在，请使用修改入口。','warning');
    commit(kind,[row],h.context().personnelRev);
  });
  document.addEventListener('change',async ev=>{
    const el=ev.target;if(!el.matches('[data-person-file]')||!el.files[0])return;
    const file=el.files[0],kind=el.dataset.personFile;el.value='';preview=null;
    try{
      if(file.size>5*1024*1024)throw Error('请使用5MB以内的人员名单。');
      const x=await RosterUIV13.excel(),w=x.read(await file.arrayBuffer(),{type:'array',sheetRows:1002});
      const grid=x.utils.sheet_to_json(w.Sheets[w.SheetNames[0]],{header:1,raw:false,defval:''}),head=grid.shift()||[],ci=head.indexOf('人员编号'),ni=head.indexOf('姓名');
      if(ci<0||ni<0)throw Error('第一张工作表须包含人员编号和姓名，请参考模板。');
      const rows=validate(h.context(),kind,grid.filter(row=>row.some(v=>String(v).trim())).map(row=>({code:row[ci],name:row[ni]})));
      preview={kind,rows,rev:h.context().personnelRev};
      h.modal('核对'+title(kind)+'名单',h.table(['编号','姓名','操作'],rows.map(row=>'<tr>'+[row.code,row.name,row.operation].map(v=>'<td>'+h.esc(v)+'</td>').join('')+'</tr>'))+'<button class="primary" data-person-confirm>确认导入人员</button>');
    }catch(err){h.note(err.message,'warning');}
  });
  window.Personnel={prepare,validate,save,toggle,add,directory,bind:ctx=>{h=ctx;}};
})();
